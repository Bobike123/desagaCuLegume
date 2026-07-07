import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { getNewsletterEnv } from '$lib/server/newsletter/env';
import { MAX_SEND_ATTEMPTS, sendEmail } from '$lib/server/newsletter/brevo';
import { renderCampaignEmail } from '$lib/server/newsletter/render';
import { isCampaignReadyToSend, utcDayStartIso } from '$lib/server/newsletter/schedule';

// The cron runs frequently so admins can choose a minute-level send time. The
// route still enforces NEWSLETTER_DAILY_LIMIT across the UTC day.
export const config = { maxDuration: 300 };

const SEND_CONCURRENCY = 5;

type QueueRow = {
  queue_id: number;
  campaign_id: number;
  attempts: number;
  newsletter_subscribers: {
    email: string;
    unsubscribe_token: string;
    unsubscribed_at: string | null;
  } | null;
};

type CampaignRow = {
  campaign_id: number;
  subject: string;
  body_html: string;
  scheduled_at: string | null;
};

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

// Sender behind Vercel Cron. Drains eligible campaign queues after their
// scheduled time, while keeping the daily Brevo free-tier cap intact.
export async function GET({ request }: RequestEvent) {
  let env: ReturnType<typeof getNewsletterEnv>;
  try {
    env = getNewsletterEnv();
  } catch (error) {
    const requestId = logRouteError('Newsletter cron misconfigured', error);
    return json({ error: 'Configurare incompletă.', requestId }, { status: 500 });
  }

  if (request.headers.get('authorization') !== `Bearer ${env.cronSecret}`) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const todayStartIso = utcDayStartIso(now);

    const { count: sentToday, error: sentTodayError } = await admin
      .from('newsletter_queue')
      .select('queue_id', { count: 'exact', head: true })
      .eq('status', 'SENT')
      .gte('sent_at', todayStartIso);
    if (sentTodayError) throw sentTodayError;

    const remainingToday = Math.max(0, env.dailyLimit - (sentToday ?? 0));
    if (remainingToday <= 0) {
      return json(
        { processed: 0, sent: 0, failed: 0, skipped: 0, dailyLimitReached: true },
        { status: 200 }
      );
    }

    const { data: sendingCampaigns, error: campaignsError } = await admin
      .from('newsletter_campaigns')
      .select('campaign_id, subject, body_html, scheduled_at')
      .eq('status', 'SENDING')
      .order('campaign_id', { ascending: true });
    if (campaignsError) throw campaignsError;

    const eligibleCampaigns = ((sendingCampaigns ?? []) as unknown as CampaignRow[]).filter((campaign) =>
      isCampaignReadyToSend(campaign.scheduled_at, now)
    );
    const eligibleCampaignIds = eligibleCampaigns.map((campaign) => Number(campaign.campaign_id));

    if (eligibleCampaignIds.length === 0) {
      return json(
        { processed: 0, sent: 0, failed: 0, skipped: 0, dailyLimitReached: false },
        { status: 200 }
      );
    }

    const { data: pendingRows, error: pendingError } = await admin
      .from('newsletter_queue')
      .select('queue_id, campaign_id, attempts, newsletter_subscribers(email, unsubscribe_token, unsubscribed_at)')
      .in('campaign_id', eligibleCampaignIds)
      .eq('status', 'PENDING')
      .order('campaign_id', { ascending: true })
      .order('queue_id', { ascending: true })
      .limit(remainingToday);
    if (pendingError) throw pendingError;

    const rows = (pendingRows ?? []) as unknown as QueueRow[];
    const campaignIds = [...new Set(rows.map((row) => row.campaign_id))];

    const campaigns = new Map<number, { subject: string; body_html: string }>();
    for (const campaign of eligibleCampaigns) {
      campaigns.set(Number(campaign.campaign_id), {
        subject: campaign.subject,
        body_html: campaign.body_html,
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const sentByCampaign = new Map<number, number>();
    const failedByCampaign = new Map<number, number>();
    const skippedByCampaign = new Map<number, number>();

    async function processRow(row: QueueRow) {
      const campaign = campaigns.get(row.campaign_id);
      const subscriber = row.newsletter_subscribers;

      // Late unsubscribes (or deleted subscribers, or campaigns cancelled
      // mid-read) drop out of the queue without counting as sent or failed.
      if (!campaign || !subscriber || subscriber.unsubscribed_at) {
        const removed = await admin.from('newsletter_queue').delete().eq('queue_id', row.queue_id);
        if (removed.error) throw removed.error;
        skipped += 1;
        skippedByCampaign.set(row.campaign_id, (skippedByCampaign.get(row.campaign_id) ?? 0) + 1);
        return;
      }

      const rendered = renderCampaignEmail(campaign.body_html, subscriber.unsubscribe_token);
      const result = await sendEmail({
        to: subscriber.email,
        subject: campaign.subject,
        htmlContent: rendered.htmlContent,
        headers: rendered.headers,
      });

      if (result.ok) {
        const updated = await admin
          .from('newsletter_queue')
          .update({ status: 'SENT', sent_at: new Date().toISOString(), attempts: row.attempts + 1 })
          .eq('queue_id', row.queue_id);
        if (updated.error) throw updated.error;
        sent += 1;
        sentByCampaign.set(row.campaign_id, (sentByCampaign.get(row.campaign_id) ?? 0) + 1);
        return;
      }

      const attempts = row.attempts + 1;
      const isFinal = result.permanent || attempts >= MAX_SEND_ATTEMPTS;
      const updated = await admin
        .from('newsletter_queue')
        .update({
          status: isFinal ? 'FAILED' : 'PENDING',
          attempts,
          last_error: result.error.slice(0, 1000),
        })
        .eq('queue_id', row.queue_id);
      if (updated.error) throw updated.error;

      if (isFinal) {
        failed += 1;
        failedByCampaign.set(row.campaign_id, (failedByCampaign.get(row.campaign_id) ?? 0) + 1);
      }
    }

    for (const batch of chunk(rows, SEND_CONCURRENCY)) {
      const results = await Promise.allSettled(batch.map(processRow));
      for (const result of results) {
        if (result.status === 'rejected') {
          logRouteError('Newsletter cron row failed', result.reason);
        }
      }
    }

    // Update campaign counters, then close campaigns with an empty queue.
    for (const campaignId of campaignIds) {
      const sentDelta = sentByCampaign.get(campaignId) ?? 0;
      const failedDelta = failedByCampaign.get(campaignId) ?? 0;
      const skippedDelta = skippedByCampaign.get(campaignId) ?? 0;

      if (sentDelta || failedDelta || skippedDelta) {
        const { data: current, error } = await admin
          .from('newsletter_campaigns')
          .select('sent_count, failed_count, total_recipients')
          .eq('campaign_id', campaignId)
          .single();
        if (error) throw error;

        const counters = await admin
          .from('newsletter_campaigns')
          .update({
            sent_count: current.sent_count + sentDelta,
            failed_count: current.failed_count + failedDelta,
            total_recipients: Math.max(0, current.total_recipients - skippedDelta),
          })
          .eq('campaign_id', campaignId);
        if (counters.error) throw counters.error;
      }

      const { count, error: remainingError } = await admin
        .from('newsletter_queue')
        .select('queue_id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'PENDING');
      if (remainingError) throw remainingError;

      if ((count ?? 0) === 0) {
        const closed = await admin
          .from('newsletter_campaigns')
          .update({ status: 'SENT', sent_at: new Date().toISOString() })
          .eq('campaign_id', campaignId)
          .eq('status', 'SENDING');
        if (closed.error) throw closed.error;
      }
    }

    return json({ processed: rows.length, sent, failed, skipped, dailyLimitReached: false }, { status: 200 });
  } catch (error) {
    const requestId = logRouteError('Newsletter cron failed', error);
    return json({ error: 'Trimiterea newsletterului a eșuat.', requestId }, { status: 500 });
  }
}

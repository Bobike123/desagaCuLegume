import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders } from '$lib/server/pagination';
import { sendEmail } from '$lib/server/newsletter/brevo';
import { renderCampaignEmail } from '$lib/server/newsletter/render';
import {
  LIMITS,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

const CAMPAIGN_SELECT =
  'campaign_id, subject, body_html, status, total_recipients, sent_count, failed_count, queued_at, sent_at, created_at, updated_at';

const BODY_HTML_MAX = 100_000;

function mapCampaign(row: any) {
  return {
    id: String(row.campaign_id),
    subject: row.subject,
    bodyHtml: row.body_html,
    status: row.status,
    totalRecipients: row.total_recipients,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    queuedAt: row.queued_at ?? null,
    sentAt: row.sent_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadCampaign(admin: ReturnType<typeof createAdminClient>, campaignId: string) {
  const { data, error } = await admin
    .from('newsletter_campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('campaign_id', campaignId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET({ locals, url, setHeaders }: RequestEvent) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    setHeaders(noStoreHeaders);

    const id = url.searchParams.get('id');
    if (id) {
      const campaign = await loadCampaign(admin, requireNumericId(id, 'ID campanie'));
      if (!campaign) return json({ error: 'Campania nu există.' }, { status: 404 });
      return json({ item: mapCampaign(campaign) }, { status: 200 });
    }

    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });
    const { data, error, count } = await admin
      .from('newsletter_campaigns')
      .select(CAMPAIGN_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);
    if (error) throw error;

    return json(
      { items: (data ?? []).map(mapCampaign), page: getPaginationMeta(pagination, count ?? 0) },
      { status: 200 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin newsletter campaigns load failed', error);
    return json({ error: 'Nu am putut încărca campaniile.', requestId }, { status: 400 });
  }
}

export async function POST({ locals, request }: RequestEvent) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.largeJson });
    const subject = stringField(body, 'subject', { required: true, max: 200, fieldLabel: 'Subiectul' });
    const bodyHtml = stringField(body, 'bodyHtml', {
      required: true,
      max: BODY_HTML_MAX,
      fieldLabel: 'Conținutul',
    });

    const { data, error } = await createAdminClient()
      .from('newsletter_campaigns')
      .insert({ subject, body_html: bodyHtml })
      .select(CAMPAIGN_SELECT)
      .single();
    if (error) throw error;

    return json({ item: mapCampaign(data) }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin newsletter campaign create failed', error);
    return json({ error: 'Nu am putut crea campania.', requestId }, { status: 400 });
  }
}

export async function PATCH({ locals, request }: RequestEvent) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const body = await readJsonBody(request, { maxBytes: LIMITS.largeJson });
    const campaignId = requireNumericId(body.id, 'ID campanie');
    const action = stringField(body, 'action', { max: 20, fieldLabel: 'Acțiunea' });

    const campaign = await loadCampaign(admin, campaignId);
    if (!campaign) return json({ error: 'Campania nu există.' }, { status: 404 });

    if (action === 'queue') {
      const { data: total, error } = await admin.rpc('queue_newsletter_campaign', {
        p_campaign_id: Number(campaignId),
      });
      if (error) {
        return json({ error: error.message || 'Nu am putut pune campania în coadă.' }, { status: 400 });
      }

      const updated = await loadCampaign(admin, campaignId);
      return json({ item: mapCampaign(updated), totalRecipients: total }, { status: 200 });
    }

    if (action === 'test') {
      const testEmail = locals.user?.email;
      if (!testEmail) return json({ error: 'Emailul adminului lipsește.' }, { status: 400 });

      // Placeholder token: the test email's unsubscribe link is non-functional
      // on purpose — the admin is not a queue recipient.
      const rendered = renderCampaignEmail(campaign.body_html, 'test-preview');
      const result = await sendEmail({
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        htmlContent: rendered.htmlContent,
        headers: rendered.headers,
      });

      if (!result.ok) {
        return json({ error: `Trimiterea testului a eșuat: ${result.error}` }, { status: 502 });
      }

      return json({ success: true, sentTo: testEmail }, { status: 200 });
    }

    if (action === 'cancel') {
      if (campaign.status !== 'SENDING') {
        return json({ error: 'Doar campaniile în curs de trimitere pot fi anulate.' }, { status: 400 });
      }

      const removePending = await admin
        .from('newsletter_queue')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('status', 'PENDING');
      if (removePending.error) throw removePending.error;

      const cancelled = await admin
        .from('newsletter_campaigns')
        .update({ status: 'CANCELLED' })
        .eq('campaign_id', campaignId)
        .select(CAMPAIGN_SELECT)
        .single();
      if (cancelled.error) throw cancelled.error;

      return json({ item: mapCampaign(cancelled.data) }, { status: 200 });
    }

    // No action: edit the draft fields.
    if (campaign.status !== 'DRAFT') {
      return json({ error: 'Doar campaniile ciornă pot fi modificate.' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if ('subject' in body) {
      patch.subject = stringField(body, 'subject', { required: true, max: 200, fieldLabel: 'Subiectul' });
    }
    if ('bodyHtml' in body) {
      patch.body_html = stringField(body, 'bodyHtml', {
        required: true,
        max: BODY_HTML_MAX,
        fieldLabel: 'Conținutul',
      });
    }

    if (Object.keys(patch).length === 0) {
      return json({ error: 'Nimic de actualizat.' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('newsletter_campaigns')
      .update(patch)
      .eq('campaign_id', campaignId)
      .eq('status', 'DRAFT')
      .select(CAMPAIGN_SELECT)
      .single();
    if (error) throw error;

    return json({ item: mapCampaign(data) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin newsletter campaign update failed', error);
    return json({ error: 'Nu am putut actualiza campania.', requestId }, { status: 400 });
  }
}

export async function DELETE({ locals, url }: RequestEvent) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const campaignId = requireNumericId(url.searchParams.get('id'), 'ID campanie');
    const { data, error } = await createAdminClient()
      .from('newsletter_campaigns')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('status', 'DRAFT')
      .select('campaign_id');
    if (error) throw error;

    if ((data ?? []).length === 0) {
      return json({ error: 'Doar campaniile ciornă pot fi șterse.' }, { status: 400 });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin newsletter campaign delete failed', error);
    return json({ error: 'Nu am putut șterge campania.', requestId }, { status: 400 });
  }
}

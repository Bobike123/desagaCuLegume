import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders } from '$lib/server/pagination';
import { requireNumericId, stringField, validationErrorResponse } from '$lib/server/validation';

const SUBSCRIBER_SELECT =
  'subscriber_id, email, user_id, source, consented_at, unsubscribed_at, created_at, updated_at';

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`).replace(/,/g, '\\,');
}

function mapSubscriber(row: any) {
  return {
    id: String(row.subscriber_id),
    email: row.email,
    userId: row.user_id != null ? String(row.user_id) : null,
    source: row.source,
    consentedAt: row.consented_at,
    unsubscribedAt: row.unsubscribed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET({ locals, url, setHeaders }: RequestEvent) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    setHeaders(noStoreHeaders);

    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });
    const search = stringField({ q: url.searchParams.get('q') }, 'q', {
      max: 120,
      fieldLabel: 'Căutarea',
    });

    let query = admin
      .from('newsletter_subscribers')
      .select(SUBSCRIBER_SELECT, { count: 'exact' });

    if (search) {
      query = query.ilike('email', `%${escapeIlike(search)}%`);
    }

    const [listResult, activeResult, unsubscribedResult] = await Promise.all([
      query.order('created_at', { ascending: false }).range(pagination.offset, pagination.to),
      admin
        .from('newsletter_subscribers')
        .select('subscriber_id', { count: 'exact', head: true })
        .is('unsubscribed_at', null),
      admin
        .from('newsletter_subscribers')
        .select('subscriber_id', { count: 'exact', head: true })
        .not('unsubscribed_at', 'is', null),
    ]);

    if (listResult.error) throw listResult.error;
    if (activeResult.error) throw activeResult.error;
    if (unsubscribedResult.error) throw unsubscribedResult.error;

    return json(
      {
        items: (listResult.data ?? []).map(mapSubscriber),
        counts: {
          active: activeResult.count ?? 0,
          unsubscribed: unsubscribedResult.count ?? 0,
        },
        page: getPaginationMeta(pagination, listResult.count ?? 0),
      },
      { status: 200 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin newsletter subscribers load failed', error);
    return json({ error: 'Nu am putut încărca abonații.', requestId }, { status: 400 });
  }
}

// Hard delete for GDPR erasure requests; regular opt-outs go through the
// unsubscribe flow and keep the row as proof of past consent.
export async function DELETE({ locals, url }: RequestEvent) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const subscriberId = requireNumericId(url.searchParams.get('id'), 'ID abonat');
    const { error } = await createAdminClient()
      .from('newsletter_subscribers')
      .delete()
      .eq('subscriber_id', subscriberId);
    if (error) throw error;

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin newsletter subscriber delete failed', error);
    return json({ error: 'Nu am putut șterge abonatul.', requestId }, { status: 400 });
  }
}

import { json } from '@sveltejs/kit';
import {
  getSecurityDashboardData,
  markSecurityEventsRead,
} from '$lib/server/security-events';
import { getPagination, noStoreHeaders } from '$lib/server/pagination';

export async function GET({ locals, url, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  const pagination = getPagination(url, { defaultLimit: 80, maxLimit: 100 });
  const data = await getSecurityDashboardData(pagination.limit, pagination.offset);

  setHeaders(noStoreHeaders);
  return json(data, { status: 200 });
}

export async function PATCH({ locals, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  const marked = await markSecurityEventsRead();

  setHeaders(noStoreHeaders);
  return json({ success: true, marked }, { status: 200 });
}

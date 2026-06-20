import { json } from '@sveltejs/kit';

export function GET({ locals }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  return json({ ok: true });
}

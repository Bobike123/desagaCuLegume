import { json } from '@sveltejs/kit';
import {
  createSession,
  findUserByIdentity,
  getRequestMeta,
  getRolesForUser,
  setSessionCookie,
  verifyPassword,
} from '$lib/server/auth';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const identity = String(body.identity ?? body.email ?? body.username ?? '').trim();
  const password = String(body.password ?? '');
  const requireAdmin = Boolean(body.requireAdmin);

  if (!identity || !password) {
    return json({ error: 'Email sau username și parola sunt obligatorii.' }, { status: 400 });
  }

  try {
    const user = await findUserByIdentity(identity);

    if (!user || user.status !== 'ACTIVE') {
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    const roles = await getRolesForUser(user.user_id);

    if (requireAdmin && !roles.includes('ADMIN')) {
      return json({ error: 'Contul nu are privilegii de administrator.' }, { status: 403 });
    }

    const meta = getRequestMeta(request);
    const { token } = await createSession(user.user_id, meta);
    setSessionCookie(cookies, token);

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Login failed', error);
    return json({ error: 'Autentificarea a eșuat.' }, { status: 500 });
  }
}
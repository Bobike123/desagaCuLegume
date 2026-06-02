import { json } from '@sveltejs/kit';
import {
  createSession,
  findUserByIdentity,
  getRequestMeta,
  getRolesForUser,
  setSessionCookie,
  verifyPassword,
} from '$lib/server/auth';
import { booleanField, LIMITS, readJsonBody, stringField, validationErrorResponse } from '$lib/server/validation';

export async function POST({ request, cookies }) {
  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const identity =
      stringField(body, 'identity', { max: 120 }) ||
      stringField(body, 'email', { max: 120 }) ||
      stringField(body, 'username', { max: 80 });
    const password = stringField(body, 'password', { required: true, min: 1, max: 200, fieldLabel: 'Parola' });
    const requireAdmin = booleanField(body, 'requireAdmin', false);

    if (!identity) {
      return json({ error: 'Email sau username și parola sunt obligatorii.' }, { status: 400 });
    }

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
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Login failed', error);
    return json({ error: 'Autentificarea a eșuat.' }, { status: 500 });
  }
}

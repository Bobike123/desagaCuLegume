import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import type { RequestEvent } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  assertStrongPassword,
  createSession,
  getRequestMeta,
  getSessionTimeoutMinutes,
  hashPassword,
  normalizeEmail,
  normalizeUsername,
  safeUsernameFromEmail,
  setSessionCookie,
  safeClientAddress,
} from '$lib/server/auth';
import {
  LIMITS,
  nullableStringField,
  readJsonBody,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;

export async function POST(event: RequestEvent) {
  const { request, cookies } = event;

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const email = normalizeEmail(
      stringField(body, 'email', {
        required: true,
        max: 120,
        pattern: EMAIL_PATTERN,
        fieldLabel: 'Emailul',
      })
    );
    const password = stringField(body, 'password', { required: true, min: 8, max: 200, fieldLabel: 'Parola' });
    const fullName = nullableStringField(body, 'fullName', { max: 120, fieldLabel: 'Numele complet' });
    const phone = nullableStringField(body, 'phone', { max: 30, fieldLabel: 'Telefonul' });
    const username = normalizeUsername(
      stringField(body, 'username', { max: 80, pattern: USERNAME_PATTERN, fieldLabel: 'Username-ul' }) ||
        safeUsernameFromEmail(email)
    );

    if (!email || !password) {
      return json({ error: 'Email și parola sunt obligatorii.' }, { status: 400 });
    }

    if (!assertStrongPassword(password)) {
      return json({ error: 'Parola trebuie să aibă minim 8 caractere, o literă mare și o cifră.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const existingByEmail = await admin.from('users').select('user_id').eq('email', email).maybeSingle();
    if (existingByEmail.error) throw existingByEmail.error;
    if (existingByEmail.data) {
      return json({ error: 'Există deja un cont cu acest email.' }, { status: 409 });
    }

    const existingByUsername = await admin.from('users').select('user_id').eq('username', username).maybeSingle();
    if (existingByUsername.error) throw existingByUsername.error;
    if (existingByUsername.data) {
      return json({ error: 'Username-ul este deja folosit.' }, { status: 409 });
    }

    const { data: inserted, error: insertError } = await admin
      .from('users')
      .insert({
        username,
        email,
        password_hash: await hashPassword(password),
        full_name: fullName,
        phone,
        status: 'ACTIVE',
      })
      .select('user_id')
      .single();

    if (insertError) throw insertError;

    const { data: roleRow, error: roleError } = await admin
      .from('roles')
      .select('role_id')
      .eq('role_name', 'USER')
      .single();

    if (roleError) throw roleError;

    const { error: userRoleError } = await admin.from('user_roles').insert({
      user_id: inserted.user_id,
      role_id: roleRow.role_id,
    });

    if (userRoleError) throw userRoleError;

    const meta = getRequestMeta(request, safeClientAddress(() => event.getClientAddress()));
    const timeoutMinutes = getSessionTimeoutMinutes(false);
    const { token } = await createSession(inserted.user_id, meta, timeoutMinutes);
    setSessionCookie(cookies, token, timeoutMinutes);

    return json({ success: true }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Register failed', error);
    return json({ error: 'Înregistrarea a eșuat.', requestId }, { status: 500 });
  }
}

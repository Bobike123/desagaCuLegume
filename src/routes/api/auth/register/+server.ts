import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  assertStrongPassword,
  createSession,
  getRequestMeta,
  hashPassword,
  normalizeEmail,
  normalizeUsername,
  safeUsernameFromEmail,
  setSessionCookie,
} from '$lib/server/auth';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');
  const fullName = String(body.fullName ?? '').trim() || null;
  const phone = String(body.phone ?? '').trim() || null;
  const username = normalizeUsername(String(body.username ?? '') || safeUsernameFromEmail(email));

  if (!email || !password) {
    return json({ error: 'Email și parola sunt obligatorii.' }, { status: 400 });
  }

  if (!assertStrongPassword(password)) {
    return json({ error: 'Parola trebuie să aibă minim 8 caractere, o literă mare și o cifră.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
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
        password_hash: hashPassword(password),
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

    const meta = getRequestMeta(request);
    const { token } = await createSession(inserted.user_id, meta);
    setSessionCookie(cookies, token);

    return json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Register failed', error);
    return json({ error: 'Înregistrarea a eșuat.' }, { status: 500 });
  }
}


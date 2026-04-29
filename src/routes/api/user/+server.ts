import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { normalizeEmail, normalizeUsername } from '$lib/server/auth';

function mapUser(row: any) {
  return {
    id: Number(row.user_id),
    email: row.email,
    username: row.username,
    fullName: row.full_name ?? null,
    phone: row.phone ?? null,
    status: row.status,
  };
}

function cleanNullable(value: unknown) {
  const cleaned = String(value ?? '').trim();
  return cleaned || null;
}

export async function GET({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  return json({ item: locals.user }, { status: 200 });
}

export async function PATCH({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  const email = normalizeEmail(String(body.email ?? locals.user.email ?? ''));
  const username = normalizeUsername(String(body.username ?? locals.user.username ?? ''));
  const fullName = cleanNullable(body.fullName);
  const phone = cleanNullable(body.phone);

  if (!email) {
    return json({ error: 'Emailul este obligatoriu.' }, { status: 400 });
  }

  if (!username) {
    return json({ error: 'Username-ul este obligatoriu.' }, { status: 400 });
  }

  try {
    const emailCheck = await admin
      .from('users')
      .select('user_id')
      .eq('email', email)
      .neq('user_id', locals.user.id)
      .maybeSingle();

    if (emailCheck.error) throw emailCheck.error;
    if (emailCheck.data) {
      return json({ error: 'Emailul este deja folosit de alt cont.' }, { status: 409 });
    }

    const usernameCheck = await admin
      .from('users')
      .select('user_id')
      .eq('username', username)
      .neq('user_id', locals.user.id)
      .maybeSingle();

    if (usernameCheck.error) throw usernameCheck.error;
    if (usernameCheck.data) {
      return json({ error: 'Username-ul este deja folosit de alt cont.' }, { status: 409 });
    }

    const { data, error } = await admin
      .from('users')
      .update({
        email,
        username,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', locals.user.id)
      .select('user_id, email, username, full_name, phone, status')
      .single();

    if (error) throw error;

    return json({ item: mapUser(data) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nu am putut actualiza profilul.';
    return json({ error: message }, { status: 400 });
  }
}
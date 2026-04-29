import { json } from '@sveltejs/kit';
import { assertStrongPassword, hashPassword, verifyPassword } from '$lib/server/auth';
import { createAdminClient } from '$lib/server/supabase';

export async function POST({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (!currentPassword || !newPassword) {
    return json({ error: 'Parola curentă și parola nouă sunt obligatorii.' }, { status: 400 });
  }

  if (!assertStrongPassword(newPassword)) {
    return json({ error: 'Parola nouă trebuie să aibă minim 8 caractere, o literă mare și o cifră.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: userRow, error: userError } = await admin
      .from('users')
      .select('user_id, password_hash')
      .eq('user_id', locals.user.id)
      .maybeSingle();

    if (userError) throw userError;
    if (!userRow) {
      return json({ error: 'Utilizatorul nu există.' }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, userRow.password_hash)) {
      return json({ error: 'Parola curentă este greșită.' }, { status: 401 });
    }

    const { error: updateError } = await admin
      .from('users')
      .update({
        password_hash: hashPassword(newPassword),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', locals.user.id);

    if (updateError) throw updateError;

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nu am putut schimba parola.';
    return json({ error: message }, { status: 400 });
  }
}
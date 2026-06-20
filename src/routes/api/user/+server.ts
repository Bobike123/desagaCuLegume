import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  clearSessionCookie,
  createSessionToken,
  getRequestMeta,
  hashPassword,
  insertAuthLog,
  normalizeEmail,
  normalizeUsername,
  verifyPassword,
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
const DELETE_CONFIRMATION = 'STERGE CONTUL';

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

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const admin = createAdminClient();

    const email = normalizeEmail(
      stringField(body, 'email', {
        max: 120,
        defaultValue: locals.user.email,
        pattern: EMAIL_PATTERN,
        fieldLabel: 'Emailul',
      })
    );
    const username = normalizeUsername(
      stringField(body, 'username', {
        max: 80,
        defaultValue: locals.user.username,
        pattern: USERNAME_PATTERN,
        fieldLabel: 'Username-ul',
      })
    );
    const fullName = nullableStringField(body, 'fullName', { max: 120, fieldLabel: 'Numele complet' });
    const phone = nullableStringField(body, 'phone', { max: 30, fieldLabel: 'Telefonul' });

    if (!email) {
      return json({ error: 'Emailul este obligatoriu.' }, { status: 400 });
    }

    if (!username) {
      return json({ error: 'Username-ul este obligatoriu.' }, { status: 400 });
    }

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
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Profile update failed', error);
    return json({ error: 'Nu am putut actualiza profilul.' }, { status: 400 });
  }
}

export async function DELETE({ locals, request, cookies, getClientAddress }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Conturile de administrator nu pot fi șterse din pagina clientului.' }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const currentPassword = stringField(body, 'currentPassword', {
      required: true,
      max: 200,
      fieldLabel: 'Parola curentă',
    });
    const confirmation = stringField(body, 'confirmation', {
      required: true,
      max: 40,
      fieldLabel: 'Confirmarea',
    }).toUpperCase();

    if (confirmation !== DELETE_CONFIRMATION) {
      return json({ error: `Pentru ștergere trebuie să confirmați cu textul ${DELETE_CONFIRMATION}.` }, { status: 400 });
    }

    const admin = createAdminClient();
    const userId = locals.user.id;
    const deletedAt = new Date().toISOString();
    const suffix = `${userId}-${Date.now()}`;

    const { data: userRow, error: userError } = await admin
      .from('users')
      .select('user_id, password_hash, status')
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!userRow || userRow.status === 'DELETED') {
      clearSessionCookie(cookies);
      return json({ success: true }, { status: 200 });
    }

    if (!userRow.password_hash || !(await verifyPassword(currentPassword, String(userRow.password_hash)))) {
      return json({ error: 'Parola curentă este incorectă.' }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('users')
      .update({
        email: `cont-sters-${suffix}@deleted.local`,
        username: `cont_sters_${suffix}`,
        full_name: null,
        phone: null,
        password_hash: await hashPassword(createSessionToken()),
        status: 'DELETED',
        deleted_at: deletedAt,
        updated_at: deletedAt,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    try {
      const carts = await admin
        .from('carts')
        .select('cart_id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      if (carts.error) throw carts.error;

      const activeCartIds = (carts.data ?? []).map((cart: any) => cart.cart_id).filter(Boolean);
      if (activeCartIds.length > 0) {
        const { error: cartItemsError } = await admin.from('cart_items').delete().in('cart_id', activeCartIds);
        if (cartItemsError) throw cartItemsError;
      }
    } catch (cartError) {
      console.error('Account deletion cart cleanup failed', cartError);
    }

    try {
      const { error: sessionError } = await admin
        .from('sessions')
        .update({
          status: 'LOGGED_OUT',
          ended_at: deletedAt,
          last_activity_at: deletedAt,
        })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      if (sessionError) throw sessionError;
    } catch (sessionError) {
      console.error('Account deletion session cleanup failed', sessionError);
    }

    try {
      await insertAuthLog({
        userId,
        sessionId: locals.session?.sessionId ?? null,
        eventType: 'USER_DELETED',
        meta: getRequestMeta(request, getClientAddress()),
        details: { deletedAt },
      });
    } catch (logError) {
      console.error('Account deletion audit log failed', logError);
    }

    clearSessionCookie(cookies);
    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Account deletion failed', error);
    return json({ error: 'Nu am putut șterge contul.' }, { status: 400 });
  }
}

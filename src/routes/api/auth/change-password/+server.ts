import { json, type RequestEvent } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { assertStrongPassword, getRequestMeta, hashPassword, insertAuthLog, verifyPassword } from '$lib/server/auth';
import { createAdminClient } from '$lib/server/supabase';
import { LIMITS, readJsonBody, stringField, validationErrorResponse } from '$lib/server/validation';

export async function POST(event: RequestEvent) {
  const { locals, request } = event;

  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const currentPassword = stringField(body, 'currentPassword', {
      required: true,
      min: 1,
      max: 200,
      fieldLabel: 'Parola curentă',
    });
    const newPassword = stringField(body, 'newPassword', {
      required: true,
      min: 8,
      max: 200,
      fieldLabel: 'Parola nouă',
    });

    if (!assertStrongPassword(newPassword)) {
      return json({ error: 'Parola nouă trebuie să aibă minim 8 caractere, o literă mare și o cifră.' }, { status: 400 });
    }

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

    if (!(await verifyPassword(currentPassword, userRow.password_hash))) {
      return json({ error: 'Parola curentă este greșită.' }, { status: 401 });
    }

    const updatedAt = new Date().toISOString();

    const { error: updateError } = await admin
      .from('users')
      .update({
        password_hash: await hashPassword(newPassword),
        updated_at: updatedAt,
      })
      .eq('user_id', locals.user.id);

    if (updateError) throw updateError;

    let revokeSessions = admin
      .from('sessions')
      .update({
        status: 'REVOKED',
        ended_at: updatedAt,
        last_activity_at: updatedAt,
      })
      .eq('user_id', locals.user.id)
      .eq('status', 'ACTIVE');

    if (locals.session?.sessionId) {
      revokeSessions = revokeSessions.neq('session_id', locals.session.sessionId);
    }

    const { error: revokeError } = await revokeSessions;
    if (revokeError) throw revokeError;

    await insertAuthLog({
      userId: locals.user.id,
      sessionId: locals.session?.sessionId ?? null,
      eventType: 'PASSWORD_CHANGED',
      meta: getRequestMeta(request, event.getClientAddress?.()),
    }).catch(() => undefined);

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Password change failed', error);
    return json({ error: 'Nu am putut schimba parola.', requestId }, { status: 400 });
  }
}

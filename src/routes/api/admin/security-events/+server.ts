import { json } from '@sveltejs/kit';
import {
  getSecurityDashboardData,
  markSecurityEventsRead,
  reviewSecurityEvent,
  revokeSecuritySession,
  revokeUserSecuritySessions,
  type SecurityReviewStatus,
} from '$lib/server/security-events';
import { getPagination, noStoreHeaders } from '$lib/server/pagination';
import {
  LIMITS,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';
import { logRouteError } from '$lib/server/log';

const REVIEW_STATUSES = ['UNREVIEWED', 'REVIEWED', 'FALSE_POSITIVE', 'NEEDS_ACTION'] as const;
const ACTIONS = ['MARK_READ', 'REVIEW_EVENT', 'REVOKE_SESSION', 'REVOKE_USER_SESSIONS'] as const;

type SecurityAction = (typeof ACTIONS)[number];

function actionField(body: Record<string, unknown>): SecurityAction {
  const action = stringField(body, 'action', { max: 40, defaultValue: 'MARK_READ' }).toUpperCase();
  if (!ACTIONS.includes(action as SecurityAction)) throw new Error('Acțiune invalidă.');
  return action as SecurityAction;
}

function reviewStatusField(body: Record<string, unknown>): SecurityReviewStatus {
  const value = stringField(body, 'reviewStatus', { required: true, max: 40, fieldLabel: 'Status review' }).toUpperCase();
  if (!REVIEW_STATUSES.includes(value as SecurityReviewStatus)) throw new Error('Status review invalid.');
  return value as SecurityReviewStatus;
}

export async function GET({ locals, url, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  const pagination = getPagination(url, { defaultLimit: 80, maxLimit: 100 });
  const data = await getSecurityDashboardData(pagination.limit, pagination.offset);

  setHeaders(noStoreHeaders);
  return json(data, { status: 200 });
}

export async function PATCH(event) {
  const { locals, request, setHeaders } = event;

  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
    const body = contentType.includes('application/json')
      ? await readJsonBody(request, { maxBytes: LIMITS.tinyJson, allowEmpty: true })
      : {};
    const action = actionField(body);

    if (action === 'MARK_READ') {
      const marked = await markSecurityEventsRead(locals.user?.id ?? null, event);
      setHeaders(noStoreHeaders);
      return json({ success: true, marked }, { status: 200 });
    }

    if (action === 'REVIEW_EVENT') {
      const eventId = stringField(body, 'eventId', {
        required: true,
        max: 80,
        pattern: /^[0-9a-fA-F-]{32,36}$/,
        fieldLabel: 'Eveniment',
      });
      const reviewStatus = reviewStatusField(body);
      const adminNote = stringField(body, 'adminNote', { max: 240, fieldLabel: 'Nota admin' }) || null;
      await reviewSecurityEvent({ event, eventId, reviewStatus, adminNote });
      setHeaders(noStoreHeaders);
      return json({ success: true }, { status: 200 });
    }

    if (action === 'REVOKE_SESSION') {
      const sessionId = stringField(body, 'sessionId', {
        required: true,
        max: 80,
        pattern: /^[0-9a-fA-F-]{32,36}$/,
        fieldLabel: 'Sesiune',
      });
      const result = await revokeSecuritySession({ event, sessionId });
      setHeaders(noStoreHeaders);
      return json({ success: true, ...result }, { status: 200 });
    }

    const userId = Number(requireNumericId(body.userId, 'Utilizator'));
    const result = await revokeUserSecuritySessions({ event, userId });
    setHeaders(noStoreHeaders);
    return json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Admin security action failed', error);
    return json({ error: error instanceof Error ? error.message : 'Acțiunea de securitate a eșuat.', requestId }, { status: 400 });
  }
}

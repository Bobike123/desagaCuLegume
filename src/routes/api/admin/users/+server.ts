import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders } from '$lib/server/pagination';
import { ORDER_SELECT, mapOrder } from '$lib/server/support';
import {
  optionalEnumField,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

const USER_STATUSES = ['ACTIVE', 'LOCKED', 'DELETED'] as const;

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`).replace(/,/g, '\\,');
}

function mapUser(row: any, extras: { orderCount?: number; roles?: string[]; lastLoginAt?: string | null } = {}) {
  return {
    id: String(row.user_id),
    username: row.username,
    email: row.email,
    fullName: row.full_name ?? null,
    phone: row.phone ?? null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    orderCount: extras.orderCount ?? 0,
    roles: extras.roles ?? [],
    lastLoginAt: extras.lastLoginAt ?? null,
  };
}

function roleName(row: any) {
  const value = row?.roles;
  if (Array.isArray(value)) return value[0]?.role_name ?? null;
  return value?.role_name ?? null;
}

async function loadUserExtras(admin: ReturnType<typeof createAdminClient>, userIds: number[]) {
  const orderCounts = new Map<number, number>();
  const rolesByUser = new Map<number, string[]>();
  const lastLoginByUser = new Map<number, string | null>();

  if (userIds.length === 0) return { orderCounts, rolesByUser, lastLoginByUser };

  const [ordersResult, rolesResult, loginsResult] = await Promise.all([
    admin.from('orders').select('user_id, order_id').in('user_id', userIds),
    admin.from('user_roles').select('user_id, roles(role_name)').in('user_id', userIds),
    admin
      .from('auth_logs')
      .select('user_id, event_time')
      .eq('event_type', 'LOGIN')
      .in('user_id', userIds)
      .order('event_time', { ascending: false })
      .limit(500),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (rolesResult.error) throw rolesResult.error;
  if (loginsResult.error) throw loginsResult.error;

  for (const row of ordersResult.data ?? []) {
    const userId = Number(row.user_id);
    orderCounts.set(userId, (orderCounts.get(userId) ?? 0) + 1);
  }

  for (const row of rolesResult.data ?? []) {
    const userId = Number(row.user_id);
    const name = roleName(row);
    if (!name) continue;
    rolesByUser.set(userId, [...(rolesByUser.get(userId) ?? []), String(name)]);
  }

  for (const row of loginsResult.data ?? []) {
    const userId = Number(row.user_id);
    if (!lastLoginByUser.has(userId)) lastLoginByUser.set(userId, row.event_time ?? null);
  }

  return { orderCounts, rolesByUser, lastLoginByUser };
}

async function loadUserDetail(admin: ReturnType<typeof createAdminClient>, id: string) {
  const userId = requireNumericId(id, 'ID utilizator');
  const { data: user, error: userError } = await admin
    .from('users')
    .select('user_id, username, email, full_name, phone, status, created_at, updated_at, deleted_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (userError) throw userError;
  if (!user) return null;

  const [extras, addressesResult, ordersResult, conversationsResult, authLogsResult] = await Promise.all([
    loadUserExtras(admin, [Number(userId)]),
    admin
      .from('user_addresses')
      .select('address_id, label, full_name, phone, line1, line2, city, state_region, postal_code, country_code, is_default, created_at, updated_at')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    admin
      .from('orders')
      .select(ORDER_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('support_conversations')
      .select('conversation_id, subject, status, topic, order_id, created_at, updated_at, closed_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50),
    admin
      .from('auth_logs')
      .select('log_id, event_type, event_time, ip_address, user_agent')
      .eq('user_id', userId)
      .order('event_time', { ascending: false })
      .limit(20),
  ]);

  if (addressesResult.error) throw addressesResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (conversationsResult.error) throw conversationsResult.error;
  if (authLogsResult.error) throw authLogsResult.error;

  const numericUserId = Number(userId);
  return {
    ...mapUser(user, {
      orderCount: extras.orderCounts.get(numericUserId) ?? 0,
      roles: extras.rolesByUser.get(numericUserId) ?? [],
      lastLoginAt: extras.lastLoginByUser.get(numericUserId) ?? null,
    }),
    addresses: (addressesResult.data ?? []).map((row: any) => ({
      id: String(row.address_id),
      label: row.label ?? null,
      fullName: row.full_name,
      phone: row.phone ?? null,
      line1: row.line1,
      line2: row.line2 ?? null,
      city: row.city,
      stateRegion: row.state_region ?? null,
      postalCode: row.postal_code,
      countryCode: row.country_code,
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    orders: (ordersResult.data ?? []).map(mapOrder),
    conversations: (conversationsResult.data ?? []).map((row: any) => ({
      id: String(row.conversation_id),
      subject: row.subject,
      status: row.status,
      topic: row.topic,
      orderId: row.order_id != null ? String(row.order_id) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at ?? null,
    })),
    authLogs: (authLogsResult.data ?? []).map((row: any) => ({
      id: String(row.log_id),
      eventType: row.event_type,
      eventTime: row.event_time,
      ipAddress: row.ip_address ?? null,
      userAgent: row.user_agent ?? null,
    })),
  };
}

export async function GET({ locals, url, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const id = stringField({ id: url.searchParams.get('id') }, 'id', {
      max: 40,
      fieldLabel: 'ID utilizator',
    });

    setHeaders(noStoreHeaders);

    if (id) {
      const item = await loadUserDetail(admin, id);
      if (!item) return json({ error: 'Utilizatorul nu există.' }, { status: 404 });
      return json({ item }, { status: 200 });
    }

    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });
    const search = stringField({ q: url.searchParams.get('q') }, 'q', {
      max: 120,
      fieldLabel: 'Căutarea',
    });
    const status = optionalEnumField({ status: url.searchParams.get('status') }, 'status', USER_STATUSES);

    let query = admin
      .from('users')
      .select('user_id, username, email, full_name, phone, status, created_at, updated_at, deleted_at', {
        count: 'exact',
      });

    if (status) query = query.eq('status', status);
    if (search) {
      const escaped = escapeIlike(search);
      query = query.or(
        `email.ilike.%${escaped}%,username.ilike.%${escaped}%,full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);
    if (error) throw error;

    const userIds = (data ?? []).map((row: any) => Number(row.user_id));
    const extras = await loadUserExtras(admin, userIds);

    const items = (data ?? []).map((row: any) => {
      const userId = Number(row.user_id);
      return mapUser(row, {
        orderCount: extras.orderCounts.get(userId) ?? 0,
        roles: extras.rolesByUser.get(userId) ?? [],
        lastLoginAt: extras.lastLoginByUser.get(userId) ?? null,
      });
    });

    return json(
      { total: count ?? 0, items, page: getPaginationMeta(pagination, count ?? 0) },
      { status: 200 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Admin users load failed', error);
    return json({ error: 'Nu am putut încărca utilizatorii.' }, { status: 400 });
  }
}

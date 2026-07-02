import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders } from '$lib/server/pagination';
import {
  cleanString,
  enumField,
  LIMITS,
  nullableStringField,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

const allowedStatuses = ['NEW', 'CONTACTED', 'OFFER_SENT', 'CLOSED'] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type HorecaStatus = (typeof allowedStatuses)[number];

function normalizeStatus(value: unknown): HorecaStatus {
  const status = cleanString(value).toUpperCase();
  return allowedStatuses.includes(status as HorecaStatus) ? (status as HorecaStatus) : 'NEW';
}

function mapRequest(row: any) {
  return {
    id: String(row.request_id),
    businessName: row.business_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    businessType: row.business_type,
    city: row.city,
    address: row.address,
    productsNeeded: row.products_needed,
    estimatedQuantity: row.estimated_quantity,
    frequency: row.frequency,
    preferredContact: row.preferred_contact,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET({ locals, url, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const status = url.searchParams.get('status');
    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });
    let query = createAdminClient()
      .from('horeca_requests')
      .select(
        'request_id, business_name, contact_name, phone, email, business_type, city, address, products_needed, estimated_quantity, frequency, preferred_contact, message, status, admin_note, created_at, updated_at',
        { count: 'exact' }
      );

    if (status && status !== 'ALL') {
      query = query.eq('status', normalizeStatus(status));
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);
    if (error) throw error;

    setHeaders(noStoreHeaders);
    return json({ items: (data ?? []).map(mapRequest), page: getPaginationMeta(pagination, count ?? 0) }, { status: 200 });
  } catch (error) {
    const requestId = logRouteError('HORECA requests load failed', error);
    return json({ error: 'Nu am putut încărca cererile HORECA.', requestId }, { status: 400 });
  }
}

export async function POST({ request }) {
  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const businessNameField = 'businessName' in body ? 'businessName' : 'business_name';
    const contactNameField = 'contactName' in body ? 'contactName' : 'contact_name';
    const productsNeededField = 'productsNeeded' in body ? 'productsNeeded' : 'products_needed';

    const businessName = stringField(body, businessNameField, {
      required: true,
      max: 140,
      fieldLabel: 'Numele business-ului',
    });
    const contactName = stringField(body, contactNameField, {
      required: true,
      max: 120,
      fieldLabel: 'Persoana de contact',
    });
    const phone = stringField(body, 'phone', { required: true, max: 30, fieldLabel: 'Telefonul' });
    const productsNeeded = stringField(body, productsNeededField, {
      required: true,
      max: LIMITS.longText,
      fieldLabel: 'Lista de produse dorite',
    });

    const payload = {
      business_name: businessName,
      contact_name: contactName,
      phone,
      email: nullableStringField(body, 'email', { max: 120, pattern: EMAIL_PATTERN, fieldLabel: 'Emailul' }),
      business_type: nullableStringField(body, 'businessType', { max: 80, fieldLabel: 'Tipul business-ului' }) ?? nullableStringField(body, 'business_type', { max: 80, fieldLabel: 'Tipul business-ului' }),
      city: nullableStringField(body, 'city', { max: 90, fieldLabel: 'Orașul' }),
      address: nullableStringField(body, 'address', { max: 180, fieldLabel: 'Adresa' }),
      products_needed: productsNeeded,
      estimated_quantity: nullableStringField(body, 'estimatedQuantity', { max: 120, fieldLabel: 'Cantitatea estimată' }) ?? nullableStringField(body, 'estimated_quantity', { max: 120, fieldLabel: 'Cantitatea estimată' }),
      frequency: nullableStringField(body, 'frequency', { max: 80, fieldLabel: 'Frecvența' }),
      preferred_contact: stringField(body, 'preferredContact', { max: 40, fieldLabel: 'Contact preferat' }) || stringField(body, 'preferred_contact', { max: 40, fieldLabel: 'Contact preferat' }) || 'phone',
      message: nullableStringField(body, 'message', { max: LIMITS.message, fieldLabel: 'Mesajul' }),
      status: 'NEW',
    };

    const { data, error } = await createAdminClient()
      .from('horeca_requests')
      .insert(payload)
      .select(
        'request_id, business_name, contact_name, phone, email, business_type, city, address, products_needed, estimated_quantity, frequency, preferred_contact, message, status, admin_note, created_at, updated_at'
      )
      .single();

    if (error) throw error;

    return json({ item: mapRequest(data) }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('HORECA request create failed', error);
    return json({ error: 'Nu am putut trimite cererea HORECA.', requestId }, { status: 400 });
  }
}

export async function PATCH({ locals, request }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const requestId = requireNumericId(body.id ?? body.requestId ?? body.request_id, 'ID cerere');
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ('status' in body) patch.status = enumField(body, 'status', allowedStatuses, 'NEW');
    if ('adminNote' in body || 'admin_note' in body) {
      patch.admin_note =
        nullableStringField(body, 'adminNote', { max: LIMITS.message, fieldLabel: 'Nota admin' }) ??
        nullableStringField(body, 'admin_note', { max: LIMITS.message, fieldLabel: 'Nota admin' });
    }

    const { data, error } = await createAdminClient()
      .from('horeca_requests')
      .update(patch)
      .eq('request_id', requestId)
      .select(
        'request_id, business_name, contact_name, phone, email, business_type, city, address, products_needed, estimated_quantity, frequency, preferred_contact, message, status, admin_note, created_at, updated_at'
      )
      .single();

    if (error) throw error;

    return json({ item: mapRequest(data) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('HORECA request update failed', error);
    return json({ error: 'Nu am putut actualiza cererea HORECA.', requestId }, { status: 400 });
  }
}

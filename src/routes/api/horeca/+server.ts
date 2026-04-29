import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

const allowedStatuses = ['NEW', 'CONTACTED', 'OFFER_SENT', 'CLOSED'] as const;

type HorecaStatus = (typeof allowedStatuses)[number];

function cleanString(value: unknown) {
  return String(value ?? '').trim();
}

function cleanOptional(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

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

export async function GET({ locals, url }) {
  if (!locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = url.searchParams.get('status');
    let query = createAdminClient()
      .from('horeca_requests')
      .select(
        'request_id, business_name, contact_name, phone, email, business_type, city, address, products_needed, estimated_quantity, frequency, preferred_contact, message, status, admin_note, created_at, updated_at'
      )
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', normalizeStatus(status));
    }

    const { data, error } = await query;
    if (error) throw error;

    return json({ items: (data ?? []).map(mapRequest) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nu am putut încărca cererile HORECA.';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));

  const businessName = cleanString(body.businessName ?? body.business_name);
  const contactName = cleanString(body.contactName ?? body.contact_name);
  const phone = cleanString(body.phone);
  const productsNeeded = cleanString(body.productsNeeded ?? body.products_needed);

  if (!businessName) {
    return json({ error: 'Numele business-ului este obligatoriu.' }, { status: 400 });
  }

  if (!contactName) {
    return json({ error: 'Persoana de contact este obligatorie.' }, { status: 400 });
  }

  if (!phone) {
    return json({ error: 'Telefonul este obligatoriu.' }, { status: 400 });
  }

  if (!productsNeeded) {
    return json({ error: 'Lista de produse dorite este obligatorie.' }, { status: 400 });
  }

  try {
    const payload = {
      business_name: businessName,
      contact_name: contactName,
      phone,
      email: cleanOptional(body.email),
      business_type: cleanOptional(body.businessType ?? body.business_type),
      city: cleanOptional(body.city),
      address: cleanOptional(body.address),
      products_needed: productsNeeded,
      estimated_quantity: cleanOptional(body.estimatedQuantity ?? body.estimated_quantity),
      frequency: cleanOptional(body.frequency),
      preferred_contact: cleanString(body.preferredContact ?? body.preferred_contact) || 'phone',
      message: cleanOptional(body.message),
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
    const message = error instanceof Error ? error.message : 'Nu am putut trimite cererea HORECA.';
    return json({ error: message }, { status: 400 });
  }
}

export async function PATCH({ locals, request }) {
  if (!locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestId = cleanString(body.id ?? body.requestId ?? body.request_id);

  if (!requestId) {
    return json({ error: 'ID-ul cererii este obligatoriu.' }, { status: 400 });
  }

  try {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ('status' in body) patch.status = normalizeStatus(body.status);
    if ('adminNote' in body || 'admin_note' in body) patch.admin_note = cleanOptional(body.adminNote ?? body.admin_note);

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
    const message = error instanceof Error ? error.message : 'Nu am putut actualiza cererea HORECA.';
    return json({ error: message }, { status: 400 });
  }
}
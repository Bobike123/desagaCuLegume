import { json } from "@sveltejs/kit";
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from "$lib/server/supabase";
import { getPagination, getPaginationMeta, noStoreHeaders, publicCacheHeaders } from "$lib/server/pagination";
import { EVENT_TYPES } from "$lib/server/events";
import {
  arrayField,
  booleanField,
  enumField,
  LIMITS,
  parseIsoDate,
  readJsonBody,
  requireNumericId,
  safeUrl,
  stringField,
  validationErrorResponse,
} from "$lib/server/validation";

export async function GET({ locals, url, setHeaders }) {
  const admin = createAdminClient();
  const isAdminRequest =
    url.searchParams.get("admin") === "true" && locals.isAdmin;
  const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });

  let q = admin
    .from("events")
    .select("*", { count: "exact" });

  if (!isAdminRequest) q = q.eq("published", true);

  const { data, error, count } = await q
    .order("date", { ascending: true })
    .range(pagination.offset, pagination.to);
  if (error) {
    const requestId = logRouteError('Events load failed', error);
    return json({ error: 'Nu am putut încărca evenimentele.', requestId }, { status: 400 });
  }

  if (isAdminRequest) setHeaders(noStoreHeaders);
  else setHeaders(publicCacheHeaders());

  return json({ items: data ?? [], page: getPaginationMeta(pagination, count ?? 0) });
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin) return json({ error: "Acces neautorizat." }, { status: 401 });

  try {
    const payload = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const published = booleanField(payload, "published", false);

    const date = parseIsoDate(stringField(payload, "date", { required: true, max: 80, fieldLabel: "Data" }), "Data");

    const row = {
      title: stringField(payload, "title", { required: true, max: 180, fieldLabel: "Titlul" }),
      description: stringField(payload, "description", {
        required: true,
        max: LIMITS.longText,
        fieldLabel: "Descrierea",
      }),
      date,
      location: stringField(payload, "location", { required: true, max: 180, fieldLabel: "Locația" }),
      event_type: enumField(payload, "event_type", EVENT_TYPES, "FESTIVAL").toLowerCase(),
      image_url: safeUrl(payload.image_url),
      published,
      published_at: published ? new Date().toISOString() : null,
    };

    const { data, error } = await createAdminClient()
      .from("events")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      const requestId = logRouteError('Event create failed', error);
      return json({ error: 'Nu am putut crea evenimentul.', requestId }, { status: 400 });
    }
    return json({ item: data }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Event create failed', error);
    return json({ error: 'Eroare la crearea evenimentului.', requestId }, { status: 400 });
  }
}

export async function PATCH({ locals, request }) {
  if (!locals.isAdmin) return json({ error: "Acces neautorizat." }, { status: 401 });

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const ids = [...new Set(arrayField(body, "ids", 100).map((id) => requireNumericId(id, "ID eveniment")))];

    if (ids.length === 0) {
      return json({ error: "Selectează cel puțin un eveniment." }, { status: 400 });
    }

    const published = booleanField(body, "published", false);
    const now = new Date().toISOString();

    const { data, error } = await createAdminClient()
      .from("events")
      .update({
        published,
        published_at: published ? now : null,
        updated_at: now,
      })
      .in("id", ids)
      .select("*");

    if (error) {
      const requestId = logRouteError('Events bulk update failed', error);
      return json({ error: 'Eroare la actualizarea evenimentelor selectate.', requestId }, { status: 400 });
    }

    return json({ items: data ?? [], count: data?.length ?? 0, published }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Events bulk update failed', error);
    return json({ error: 'Eroare la actualizarea evenimentelor selectate.', requestId }, { status: 400 });
  }
}
import { json } from "@sveltejs/kit";
import { createAdminClient } from "$lib/server/supabase";
import {
  booleanField,
  enumField,
  LIMITS,
  parseIsoDate,
  readJsonBody,
  safeUrl,
  stringField,
  validationErrorResponse,
} from "$lib/server/validation";

const EVENT_TYPES = ["FESTIVAL", "PIATA", "ATELIER"] as const;

export async function GET({ locals, url }) {
  const admin = createAdminClient();
  const isAdminRequest =
    url.searchParams.get("admin") === "true" && locals.isAdmin;

  let q = admin
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (!isAdminRequest) q = q.eq("published", true);

  const { data, error } = await q;
  if (error) return json({ error: error.message }, { status: 400 });

  return json(data ?? []);
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

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

    if (error) return json({ error: error.message }, { status: 400 });
    return json({ item: data }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : "Eroare la crearea evenimentului.";
    return json({ error: message }, { status: 400 });
  }
}

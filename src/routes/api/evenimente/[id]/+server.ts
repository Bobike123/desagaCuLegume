import { json } from "@sveltejs/kit";
import { createAdminClient } from "$lib/server/supabase";
import { EVENT_TYPES } from "$lib/server/events";
import {
  booleanField,
  enumField,
  LIMITS,
  parseIsoDate,
  readJsonBody,
  requireRouteId,
  safeUrl,
  stringField,
  validationErrorResponse,
} from "$lib/server/validation";

export async function GET({ locals, params, url }) {
  try {
    const eventId = requireRouteId(params.id, "ID eveniment");
    const admin = createAdminClient();
    const isAdminRequest =
      url.searchParams.get("admin") === "true" && locals.isAdmin;

    let q = admin.from("events").select("*").eq("id", eventId);

    if (!isAdminRequest) q = q.eq("published", true);

    const { data, error } = await q.single();
    if (error) {
      console.error("Event load failed", error);
      return json({ error: "Eroare la încărcarea evenimentului." }, { status: 400 });
    }

    return json({ item: data }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error("Event load failed", error);
    return json({ error: "Eroare la încărcarea evenimentului." }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) return json({ error: "Acces neautorizat." }, { status: 401 });

  try {
    const eventId = requireRouteId(params.id, "ID eveniment");
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ("title" in body) patch.title = stringField(body, "title", { required: true, max: 180, fieldLabel: "Titlul" });
    if ("description" in body) {
      patch.description = stringField(body, "description", {
        required: true,
        max: LIMITS.longText,
        fieldLabel: "Descrierea",
      });
    }
    if ("date" in body) patch.date = parseIsoDate(body.date, "Data");
    if ("location" in body) patch.location = stringField(body, "location", { required: true, max: 180, fieldLabel: "Locația" });
    if ("event_type" in body) patch.event_type = enumField(body, "event_type", EVENT_TYPES, "FESTIVAL").toLowerCase();
    if ("image_url" in body) patch.image_url = safeUrl(body.image_url);

    if ("published" in body) {
      const published = booleanField(body, "published", false);
      patch.published = published;
      patch.published_at = published ? new Date().toISOString() : null;
    }

    const { data, error } = await createAdminClient()
      .from("events")
      .update(patch)
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) {
      console.error("Event update failed", error);
      return json({ error: "Eroare la actualizarea evenimentului." }, { status: 400 });
    }
    return json({ item: data }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error("Event update failed", error);
    return json({ error: "Eroare la actualizarea evenimentului." }, { status: 400 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) return json({ error: "Acces neautorizat." }, { status: 401 });

  try {
    const eventId = requireRouteId(params.id, "ID eveniment");
    const { error } = await createAdminClient()
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("Event delete failed", error);
      return json({ error: "Eroare la ștergerea evenimentului." }, { status: 400 });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error("Event delete failed", error);
    return json({ error: "Eroare la ștergerea evenimentului." }, { status: 400 });
  }
}

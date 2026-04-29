import { json } from "@sveltejs/kit";
import { createAdminClient } from "$lib/server/supabase";

export async function GET({ locals, params, url }) {
  const admin = createAdminClient();
  const isAdminRequest =
    url.searchParams.get("admin") === "true" && locals.isAdmin;

  let q = admin.from("events").select("*").eq("id", params.id);

  if (!isAdminRequest) q = q.eq("published", true);

  const { data, error } = await q.single();
  if (error) return json({ error: error.message }, { status: 400 });

  return json({ item: data }, { status: 200 });
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ("title" in body) patch.title = String(body.title ?? "").trim();
  if ("description" in body) patch.description = String(body.description ?? "").trim();
  if ("date" in body) patch.date = body.date ? new Date(body.date).toISOString() : null;
  if ("location" in body) patch.location = String(body.location ?? "").trim();
  if ("event_type" in body) patch.event_type = String(body.event_type ?? "festival").trim();
  if ("image_url" in body) patch.image_url = body.image_url || null;

  if ("published" in body) {
    patch.published = Boolean(body.published);
    patch.published_at = body.published ? new Date().toISOString() : null;
  }

  const { data, error } = await createAdminClient()
    .from("events")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ item: data }, { status: 200 });
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await createAdminClient()
    .from("events")
    .delete()
    .eq("id", params.id);

  if (error) return json({ error: error.message }, { status: 400 });

  return json({ success: true }, { status: 200 });
}

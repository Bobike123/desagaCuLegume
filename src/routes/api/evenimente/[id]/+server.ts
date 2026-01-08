import { json } from "@sveltejs/kit";

export async function GET({ locals, params, url }) {
  const isAdminRequest =
    url.searchParams.get("admin") === "true" && locals.isAdmin;

  const q = locals.supabase.from("events").select("*").eq("id", params.id).single();

  if (!isAdminRequest) q.eq("published", true);

  const { data, error } = await q;
  if (error) return json({ error: error.message }, { status: 400 });

  return json({ item: data }, { status: 200 });
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = body.title ?? "";
  if ("description" in body) patch.description = body.description ?? "";
  if ("date" in body) patch.date = body.date ?? null;
  if ("location" in body) patch.location = body.location ?? "";
  if ("event_type" in body) patch.event_type = body.event_type ?? "festival";
  if ("image_url" in body) patch.image_url = body.image_url ?? null;
  if ("published" in body) patch.published = Boolean(body.published);

  const { data, error } = await locals.supabase
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

  const { error } = await locals.supabase.from("events").delete().eq("id", params.id);
  if (error) return json({ error: error.message }, { status: 400 });

  return json({ success: true }, { status: 200 });
}

import { json } from "@sveltejs/kit";
import { createAdminClient } from "$lib/server/supabase";

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

  const payload = await request.json().catch(() => ({}));

  const published = Boolean(payload.published ?? false);

  const row = {
    title: String(payload.title ?? "").trim(),
    description: String(payload.description ?? "").trim(),
    date: payload.date ? new Date(payload.date).toISOString() : null,
    location: String(payload.location ?? "").trim(),
    event_type: String(payload.event_type ?? "festival").trim(),
    image_url: payload.image_url || null,
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
}

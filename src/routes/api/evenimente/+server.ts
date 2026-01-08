import { json } from "@sveltejs/kit";

export async function GET({ locals, url }) {
  const isAdminRequest =
    url.searchParams.get("admin") === "true" && locals.isAdmin;

  const q = locals.supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  // Public site: only published
  if (!isAdminRequest) q.eq("published", true);

  const { data, error } = await q;
  if (error) return json({ error: error.message }, { status: 400 });

  return json(data ?? []);
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));

  const row = {
    title: payload.title ?? "",
    description: payload.description ?? "",
    date: payload.date ?? null,
    location: payload.location ?? "",
    event_type: payload.event_type ?? "festival",
    image_url: payload.image_url ?? null,
    published: Boolean(payload.published ?? false),
  };

  const { data, error } = await locals.supabase
    .from("events")
    .insert([row])
    .select("*")
    .single();

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ item: data }, { status: 201 });
}

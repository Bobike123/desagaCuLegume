// src/routes/api/products/[id]/+server.ts
import { json } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

function supabaseAdmin() {
  return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET({ locals, params }) {
  try {
    const { data, error } = await locals.supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return json({ item: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, { status: 400 });
  }
}

export async function PUT({ locals, params, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("products")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ item: data }, { status: 200 });
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAdmin();
  const { error } = await sb.from("products").delete().eq("id", params.id);

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ success: true }, { status: 200 });
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();

  // Optional hardening: allow only certain fields
  const allowed = ["in_stock", "name", "category", "price"];
  const safePayload = Object.fromEntries(
    Object.entries(payload).filter(([k]) => allowed.includes(k)),
  );

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("products")
    .update(safePayload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ item: data }, { status: 200 });
}

// src/routes/api/noutati/[id]/+server.ts
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
    const id = params.id;

    if (locals.isAdmin) {
      const sb = supabaseAdmin();
      const { data, error } = await sb.from("noutati").select("*").eq("id", id).single();
      if (error) throw error;
      return json({ item: data }, { status: 200 });
    }

    const { data, error } = await locals.supabase
      .from("noutati")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error) throw error;
    return json({ item: data }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await request.json().catch(() => ({}));

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("noutati")
    .update(body)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ item: data }, { status: 200 });
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;

  const sb = supabaseAdmin();
  const { error } = await sb.from("noutati").delete().eq("id", id);

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ success: true }, { status: 200 });
}

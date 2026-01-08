// src/routes/api/noutati/+server.ts
import { json } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

function supabaseAdmin() {
  return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET({ locals }) {
  try {
    // Public: only published
    // Admin: all rows (bypass RLS via service role)
    if (locals.isAdmin) {
      const sb = supabaseAdmin();
      const { data, error } = await sb
        .from("noutati")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json(data ?? []);
    }

    const { data, error } = await locals.supabase
      .from("noutati")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json(data ?? []);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin) return json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("noutati").insert([payload]).select("*").single();

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ item: data }, { status: 201 });
}

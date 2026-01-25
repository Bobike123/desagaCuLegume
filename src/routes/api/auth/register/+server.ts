// FILE: src/routes/api/auth/register/+server.ts
// Auth removed (cookie-only login). Endpoint disabled.

import { json } from "@sveltejs/kit";

export async function POST() {
  return json(
    { error: "Registration disabled (cookie-only admin auth)." },
    { status: 410 }
  );
}

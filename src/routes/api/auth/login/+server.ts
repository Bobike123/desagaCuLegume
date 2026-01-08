// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export async function POST({ request, cookies }) {
  const { username, password } = await request.json();

  // simple single-admin auth
  if (
    username !== ADMIN_EMAIL ||
    password !== ADMIN_PASSWORD
  ) {
    return json({ error: "Credențiale invalide" }, { status: 401 });
  }

  // set admin cookie
  cookies.set("admin", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: false, // true in production
    maxAge: 60 * 60 * 24 // 1 day
  });

  return json({ success: true });
}

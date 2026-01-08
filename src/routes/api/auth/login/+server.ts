// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return json(
      { error: 'Admin env not configured', debug: { hasEmail: !!ADMIN_EMAIL, hasPassword: !!ADMIN_PASSWORD } },
      { status: 500 }
    );
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  cookies.set('admin', '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ success: true }, { status: 200 });
}

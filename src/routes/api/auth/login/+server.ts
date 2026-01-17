// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';
import { VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD } from '$env/static/private';

export async function POST({ request, cookies }) {
  const { username, password } = await request.json();

  if (username !== VITE_ADMIN_EMAIL || password !== VITE_ADMIN_PASSWORD) {
    return json({ error: 'Credențiale invalide' }, { status: 401 });
  }

  cookies.set('admin', '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24
  });

  return json({ success: true });
}

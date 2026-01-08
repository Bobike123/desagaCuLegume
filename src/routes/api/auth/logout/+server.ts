// src/routes/api/auth/logout/+server.ts
import { json } from '@sveltejs/kit';

export function POST({ cookies }) {
  cookies.delete('admin', { path: '/' });
  return json({ success: true }, { status: 200 });
}

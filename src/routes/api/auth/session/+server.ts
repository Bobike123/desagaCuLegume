// src/routes/api/auth/session/+server.ts
import { json } from '@sveltejs/kit';

export function GET({ cookies }) {
    return json({ isAdmin: cookies.get('admin') === '1' }, { status: 200 });
}

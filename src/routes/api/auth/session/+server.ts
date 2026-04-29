import { json } from '@sveltejs/kit';

export function GET({ locals }) {
  return json(
    {
      isAuthenticated: locals.isAuthenticated,
      isAdmin: locals.isAdmin,
      user: locals.user,
      roles: locals.session?.roles ?? [],
    },
    { status: 200 }
  );
}


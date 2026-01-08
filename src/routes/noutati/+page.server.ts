// src/routes/noutati/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/noutati');
  const data = await res.json();
  return { noutati: res.ok ? data : [] };
};

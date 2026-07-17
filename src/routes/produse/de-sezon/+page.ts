import { redirect } from '@sveltejs/kit';

// The old "de-sezon" category was split into Legume + Fructe. Keep old links and
// bookmarks working by sending them to the Legume page (existing products were
// migrated there). Without this, /produse/de-sezon would fall through to the
// /produse/[id] product route and render a "product not found" page.
export const load = () => {
  throw redirect(308, '/produse/legume');
};

// FILE: src/routes/admin/logout/+page.server.ts

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
  cookies.delete("admin", { path: "/" });
  throw redirect(302, "/");
};

export const actions: Actions = {
  default: async ({ cookies }) => {
    cookies.delete("admin", { path: "/" });
    throw redirect(302, "/");
  },
};

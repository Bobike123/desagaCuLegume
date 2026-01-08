import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
    const res = await fetch("/api/evenimente"); // public: published only
    const events = res.ok ? await res.json() : [];
    return { events };
};

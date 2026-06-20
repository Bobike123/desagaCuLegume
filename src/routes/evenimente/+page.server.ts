import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
        const res = await fetch("/api/evenimente?limit=100", { signal: controller.signal }); // public: published only
        const data = res.ok ? await res.json() : { items: [] };
        const events = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        return { events };
    } catch {
        return { events: [] };
    } finally {
        clearTimeout(timeout);
    }
};

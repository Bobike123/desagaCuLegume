import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	// No warning suppression: a11y/validity/unused-CSS warnings are surfaced so
	// real issues are fixed rather than hidden. Re-add a narrow onwarn filter
	// only for confirmed third-party noise, never for a11y codes.
	kit: {
		// dub1 = AWS eu-west-1, same region as the Supabase project (from
		// supabase/.temp/pooler-url) — keeps app↔DB latency single-digit ms.
		adapter: adapter({ regions: ["dub1"] }),
		// Page responses get a nonce-based CSP (no 'unsafe-inline' scripts);
		// SvelteKit adds the nonce to its own inline bootstrap script. API and
		// decoy responses get the strict fallback from setSecurityHeaders().
		csp: {
			mode: "auto",
			directives: {
				"default-src": ["self"],
				"base-uri": ["self"],
				"object-src": ["none"],
				"form-action": ["self"],
				"frame-ancestors": ["none"],
				"script-src": ["self"],
				"style-src": ["self", "unsafe-inline"],
				"img-src": ["self", "data:", "blob:", "https:"],
				"font-src": ["self", "data:"],
				"connect-src": process.env.PUBLIC_SUPABASE_URL
					? ["self", process.env.PUBLIC_SUPABASE_URL]
					: ["self"],
				"frame-src": ["self"],
			},
		},
		alias: {
			$lib: "src/lib",
			$components: "src/lib/components",
			$stores: "src/lib/stores",
		},
	},
};

export default config;

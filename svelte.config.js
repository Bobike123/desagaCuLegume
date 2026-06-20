import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	// No warning suppression: a11y/validity/unused-CSS warnings are surfaced so
	// real issues are fixed rather than hidden. Re-add a narrow onwarn filter
	// only for confirmed third-party noise, never for a11y codes.
	kit: {
		adapter: adapter(),
		alias: {
			$lib: "src/lib",
			$components: "src/lib/components",
			$stores: "src/lib/stores",
		},
	},
};

export default config;

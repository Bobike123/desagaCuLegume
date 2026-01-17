import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	onwarn: (warning, handler) => {
		const ignore = new Set([
			"a11y_label_has_associated_control",
			"element_invalid_self_closing_tag",
			"css_unused_selector",
		]);

		if (ignore.has(warning.code)) return;
		handler(warning);
	},
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

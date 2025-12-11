import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import('@sveltejs/kit').Config
/** @type {import('@sveltejs/kit').Config} */

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib',
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
		}
	}
};

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
	plugins: [
		sveltekit()
		// Disable cloudflare plugin to avoid build conflicts
	]
});

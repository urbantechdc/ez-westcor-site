import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
	plugins: [
		sveltekit(),
		cloudflare({
			// Enable local bindings for D1 database during development
			configPath: './wrangler.toml'
		})
	]
});

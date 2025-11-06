/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Platform {
			env: {
				// Database bindings
				DB?: D1Database;

				// Storage bindings
				BUCKET?: R2Bucket;
				KV?: KVNamespace;
				ASSETS: Fetcher;

				// Environment variables
				NODE_ENV?: string;

				// Add other environment variables as needed
				// API_SECRET?: string;
				// JWT_SECRET?: string;
				// WEBHOOK_SECRET?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}

		// Enhanced Locals interface for session data, etc.
		interface Locals {
			user?: { id: string; email: string; name: string };
			session?: { id: string; expires: Date };
		}

		// PageData interface for type-safe page data
		// interface PageData {}

		// Error interface for custom error handling
		// interface Error {}
	}
}

export {};
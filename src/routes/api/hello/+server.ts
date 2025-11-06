import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const name = url.searchParams.get('name') || 'World';

	// Access Cloudflare bindings
	const db = platform?.env?.DB;
	// const bucket = platform?.env?.BUCKET;
	// const kv = platform?.env?.KV;

	// Example D1 database query (requires users table to exist)
	let userCount = 0;
	let recentUsers = [];

	if (db) {
		try {
			// Get user count
			const countResult = await db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'").first();
			const tableExists = countResult?.count > 0;

			if (tableExists) {
				const userCountResult = await db.prepare("SELECT COUNT(*) as count FROM users").first();
				userCount = userCountResult?.count || 0;

				// Get recent users (last 5)
				const usersResult = await db.prepare("SELECT name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5").all();
				recentUsers = usersResult.results || [];
			}
		} catch (error) {
			console.error('Database query error:', error);
		}
	}

	return json({
		message: `Hello ${name} from Cloudflare Workers!`,
		timestamp: new Date().toISOString(),
		environment: platform?.env?.NODE_ENV || 'development',
		database: {
			connected: !!db,
			userCount,
			recentUsers
		}
	});
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const data = await request.json();
	const db = platform?.env?.DB;

	let insertResult = null;
	let error = null;

	// Example: Insert a user record
	if (db && data.name && data.email) {
		try {
			// Check if users table exists and create if needed (in production, use migrations instead)
			await db.prepare(`
				CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT NOT NULL,
					email TEXT NOT NULL UNIQUE,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`).run();

			// Insert new user
			const result = await db.prepare(
				"INSERT INTO users (name, email) VALUES (?, ?)"
			).bind(data.name, data.email).run();

			insertResult = {
				id: result.meta?.last_row_id,
				changes: result.meta?.changes
			};
		} catch (dbError) {
			console.error('Database insert error:', dbError);
			error = dbError instanceof Error ? dbError.message : 'Database error';
		}
	}

	return json({
		success: !error,
		received: data,
		database: {
			connected: !!db,
			insertResult,
			error
		},
		timestamp: new Date().toISOString()
	});
};
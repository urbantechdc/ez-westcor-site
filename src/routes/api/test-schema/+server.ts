import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { executeWithRetry } from '$lib/server/d1-utils';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	try {
		// Test queries to verify our example schema
		const tests = {
			userCount: 0,
			postCount: 0,
			sampleUsers: [],
			samplePosts: []
		};

		// Count users
		const userCountResult = await executeWithRetry(() =>
			db.prepare("SELECT COUNT(*) as count FROM users").first()
		);
		tests.userCount = (userCountResult as Record<string, unknown>)?.count as number || 0;

		// Count posts
		const postCountResult = await executeWithRetry(() =>
			db.prepare("SELECT COUNT(*) as count FROM posts").first()
		);
		tests.postCount = (postCountResult as Record<string, unknown>)?.count as number || 0;

		// Get sample users
		const usersResult = await executeWithRetry(() =>
			db.prepare("SELECT id, email, name, created_at FROM users ORDER BY created_at LIMIT 3").all()
		);
		tests.sampleUsers = usersResult.results || [];

		// Get sample posts with user info
		const postsResult = await executeWithRetry(() =>
			db.prepare(`
				SELECT p.id, p.title, p.published, p.created_at, u.name as author_name
				FROM posts p
				JOIN users u ON p.user_id = u.id
				ORDER BY p.created_at DESC
				LIMIT 3
			`).all()
		);
		tests.samplePosts = postsResult.results || [];

		return json({
			success: true,
			message: 'Example schema test completed successfully',
			tests,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Database schema test failed:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};
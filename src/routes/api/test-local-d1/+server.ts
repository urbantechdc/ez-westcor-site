import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Test endpoint to validate local D1 development setup
 * This endpoint tests:
 * - D1 database binding availability
 * - Basic query execution
 * - Local vs remote detection
 */
export const GET: RequestHandler = async ({ platform }) => {
	const results = {
		timestamp: new Date().toISOString(),
		environment: platform?.env?.NODE_ENV || 'development',
		tests: {
			bindingExists: false,
			canQuery: false,
			tablesExist: false,
			migrationTableExists: false
		},
		errors: [] as string[],
		info: [] as string[]
	};

	// Test 1: Check if D1 binding exists
	const db = platform?.env?.DB;
	results.tests.bindingExists = !!db;

	if (!db) {
		results.errors.push('D1 binding not available - check wrangler.toml configuration');
		return json(results, { status: 500 });
	}

	results.info.push('✅ D1 database binding found');

	// Test 2: Basic query test
	try {
		const basicQuery = await db.prepare('SELECT 1 as test').first();
		results.tests.canQuery = !!basicQuery;
		results.info.push('✅ Basic queries work');
	} catch (error) {
		results.errors.push(`Basic query failed: ${error}`);
	}

	// Test 3: Check if any tables exist
	try {
		const tablesQuery = await db.prepare(`
			SELECT COUNT(*) as count
			FROM sqlite_master
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
		`).first();

		const tableCount = (tablesQuery as Record<string, unknown>)?.count as number || 0;
		results.tests.tablesExist = tableCount > 0;

		if (tableCount > 0) {
			results.info.push(`✅ Found ${tableCount} user table(s)`);
		} else {
			results.info.push('ℹ️  No user tables found - run migrations to create tables');
		}
	} catch (error) {
		results.errors.push(`Table check failed: ${error}`);
	}

	// Test 4: Check if D1 migrations table exists
	try {
		const migrationQuery = await db.prepare(`
			SELECT COUNT(*) as count
			FROM sqlite_master
			WHERE type='table' AND name='d1_migrations'
		`).first();

		results.tests.migrationTableExists = (migrationQuery as Record<string, unknown>)?.count as number > 0;

		if (results.tests.migrationTableExists) {
			// Get migration count
			const migrationCount = await db.prepare('SELECT COUNT(*) as count FROM d1_migrations').first();
			const count = (migrationCount as Record<string, unknown>)?.count as number || 0;
			results.info.push(`✅ D1 migrations table exists with ${count} migration(s)`);
		} else {
			results.info.push('ℹ️  D1 migrations table not found - run your first migration');
		}
	} catch (error) {
		results.errors.push(`Migration table check failed: ${error}`);
	}

	// Summary
	const allTestsPassed = Object.values(results.tests).every(test => test);
	const status = results.errors.length > 0 ? 500 : (allTestsPassed ? 200 : 202);

	if (allTestsPassed && results.errors.length === 0) {
		results.info.push('🎉 All tests passed! Local D1 development is working correctly.');
	} else if (results.errors.length === 0) {
		results.info.push('⚠️  Basic setup works, but run migrations to complete setup.');
	}

	return json(results, { status });
};
/**
 * D1 Database Utilities
 *
 * Implements Cloudflare D1 best practices including:
 * - Query retry with exponential backoff
 * - Error categorization (retryable vs permanent)
 * - Batch operations
 * - Connection validation
 * - Performance monitoring
 */

import type { D1Database, D1Result } from '@cloudflare/workers-types';

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on Cloudflare D1 best practices
 */
function shouldRetry(err: unknown, nextAttempt: number): boolean {
	const errMsg = String(err);
	const isRetryableError =
		errMsg.includes("Network connection lost") ||
		errMsg.includes("storage caused object to be reset") ||
		errMsg.includes("reset because its code was updated") ||
		errMsg.includes("too many requests") ||
		errMsg.includes("timeout") ||
		errMsg.includes("temporarily unavailable");

	// Only retry up to 5 attempts for retryable errors
	return nextAttempt <= 5 && isRetryableError;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attempt: number): number {
	// Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
	const baseDelay = Math.min(100 * Math.pow(2, attempt), 1600);
	// Add jitter (±25%)
	const jitter = baseDelay * 0.25 * Math.random();
	return baseDelay + jitter;
}

/**
 * Execute a D1 query with automatic retry logic
 */
export async function executeWithRetry<T extends D1Result>(
	operation: () => Promise<T>,
	maxAttempts = 5
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (!shouldRetry(error, attempt) || attempt === maxAttempts) {
				throw error;
			}

			// Wait with exponential backoff before retry
			const delay = getRetryDelay(attempt - 1);
			console.warn(`Query failed (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms:`, error);
			await sleep(delay);
		}
	}

	throw lastError;
}

/**
 * Validate D1 database connection
 */
export async function validateConnection(db: D1Database): Promise<boolean> {
	try {
		await db.prepare("SELECT 1").first();
		return true;
	} catch (error) {
		console.error('D1 connection validation failed:', error);
		return false;
	}
}

/**
 * Execute a query with performance monitoring
 */
export async function executeWithProfiling<T extends D1Result>(
	db: D1Database,
	query: string,
	params: unknown[] = []
): Promise<{ result: T; duration: number; plan?: string }> {
	const startTime = performance.now();

	// Get query plan for SELECT queries (development only)
	let plan: string | undefined;
	if (query.trim().toLowerCase().startsWith('select')) {
		try {
			const planResult = await db.prepare(`EXPLAIN QUERY PLAN ${query}`)
				.bind(...params)
				.all();
			plan = planResult.results?.map((row: Record<string, unknown>) =>
				`${row.id}|${row.parent}|${row.notused}|${row.detail}`
			).join('\n');
		} catch {
			// Query plan analysis failed, continue without it
		}
	}

	// Execute the actual query
	const result = await executeWithRetry(() =>
		db.prepare(query).bind(...params).run() as Promise<T>
	);

	const duration = performance.now() - startTime;

	return { result, duration, plan };
}

/**
 * Batch insert utility following D1 best practices
 */
export async function batchInsert<T>(
	db: D1Database,
	tableName: string,
	columns: string[],
	rows: T[][],
	batchSize = 50
): Promise<{ inserted: number; errors: string[] }> {
	const placeholders = columns.map(() => '?').join(', ');
	const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

	let inserted = 0;
	const errors: string[] = [];

	// Process in batches to avoid overwhelming D1
	for (let i = 0; i < rows.length; i += batchSize) {
		const batch = rows.slice(i, i + batchSize);

		// Use D1 batch API for better performance
		const statements = batch.map(row =>
			db.prepare(query).bind(...row)
		);

		try {
			const results = await executeWithRetry(() =>
				db.batch(statements)
			);
			inserted += results.filter(r => r.success).length;
		} catch (error) {
			const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`;
			errors.push(errorMsg);
			console.error(errorMsg);
		}
	}

	return { inserted, errors };
}

/**
 * Safe transaction wrapper with retry
 */
export async function withTransaction<T>(
	db: D1Database,
	operations: (db: D1Database) => Promise<T>
): Promise<T> {
	return executeWithRetry(async () => {
		// D1 doesn't support explicit transactions yet, but this pattern
		// prepares for when they do and provides retry capability
		return await operations(db);
	});
}

/**
 * Optimize database performance (should be run after schema changes)
 */
export async function optimizeDatabase(db: D1Database): Promise<void> {
	try {
		await executeWithRetry(() =>
			db.prepare("PRAGMA optimize").run()
		);
		console.log('Database optimization completed');
	} catch (error) {
		console.error('Database optimization failed:', error);
		throw error;
	}
}

/**
 * Get database statistics for monitoring
 */
export async function getDatabaseStats(db: D1Database): Promise<{
	tables: number;
	totalRows: number;
	indexes: number;
	size: string;
}> {
	const tablesResult = await executeWithRetry(() =>
		db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").first()
	);

	const indexesResult = await executeWithRetry(() =>
		db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'").first()
	);

	// Get total row count across all tables
	const tableNamesResult = await executeWithRetry(() =>
		db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
	);

	let totalRows = 0;
	if (tableNamesResult.results) {
		for (const table of tableNamesResult.results as Array<Record<string, unknown>>) {
			const rowCount = await executeWithRetry(() =>
				db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).first()
			);
			totalRows += (rowCount as Record<string, unknown>)?.count as number || 0;
		}
	}

	return {
		tables: (tablesResult as Record<string, unknown>)?.count as number || 0,
		totalRows,
		indexes: (indexesResult as Record<string, unknown>)?.count as number || 0,
		size: 'N/A' // D1 doesn't expose size info yet
	};
}
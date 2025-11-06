import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		// Get employee summary data using our view
		const employeeSummary = await db.prepare(`
			SELECT
				employee_id,
				full_name,
				status,
				file_count,
				content_file_count,
				empty_file_count,
				last_file_update
			FROM v_employee_summary
			ORDER BY full_name ASC
		`).all();

		// Transform employee data for the frontend
		const employees = employeeSummary.results.map((emp, index) => ({
			id: emp.employee_id,
			name: emp.full_name,
			fileCount: emp.file_count || 0,
			contentFiles: emp.content_file_count || 0,
			emptyFiles: emp.empty_file_count || 0,
			status: 'TBD', // We don't know actual employee status yet
			lastUpdate: emp.last_file_update
		}));

		// Get file statistics by category
		const fileStats = await db.prepare(`
			SELECT
				fc.code,
				fc.name,
				fc.description,
				COUNT(ef.id) as file_count
			FROM file_categories fc
			LEFT JOIN employee_files ef ON fc.code = ef.category_code
			GROUP BY fc.code, fc.name, fc.description
			ORDER BY fc.code
		`).all();

		// Calculate summary metrics
		const totalEmployees = employees.length;
		// Since we don't know actual status, show total employees as "TBD Records"
		const activeEmployees = 'TBD';
		// All files are content files now (empty files purged)
		const totalFiles = employees.reduce((sum, e) => sum + e.fileCount, 0);
		const contentFiles = totalFiles;
		const employeesWithFiles = employees.filter(e => e.fileCount > 0).length;

		// Get top employees by file count
		const topEmployees = await db.prepare(`
			SELECT
				e.employee_id,
				e.full_name,
				COUNT(ef.id) as file_count,
				COUNT(CASE WHEN ef.is_empty = 0 THEN 1 END) as content_files
			FROM employees e
			LEFT JOIN employee_files ef ON e.employee_id = ef.employee_id
			GROUP BY e.employee_id, e.full_name
			HAVING file_count > 0
			ORDER BY file_count DESC
			LIMIT 10
		`).all();

		// Get recent file activity (simulated since we don't have timestamps)
		const recentActivity = await db.prepare(`
			SELECT
				ef.file_name,
				ef.employee_id,
				e.full_name,
				ef.category_code,
				fc.name as category_name,
				ef.file_type,
				ef.created_at
			FROM employee_files ef
			JOIN employees e ON ef.employee_id = e.employee_id
			LEFT JOIN file_categories fc ON ef.category_code = fc.code
			WHERE ef.is_empty = 0
			ORDER BY ef.created_at DESC
			LIMIT 20
		`).all();

		// Get system configuration
		const systemConfig = await db.prepare(`
			SELECT key, value, description
			FROM system_config
		`).all();

		const config = {};
		systemConfig.results.forEach(item => {
			config[item.key] = item.value;
		});

		return json({
			success: true,
			data: {
				employees,
				fileStats: fileStats.results,
				topEmployees: topEmployees.results,
				recentActivity: recentActivity.results,
				summary: {
					totalEmployees,
					activeEmployees,
					totalFiles,
					averageFilesPerEmployee: totalEmployees > 0 ? Math.round(totalFiles / totalEmployees) : 0,
					employeesWithFiles,
					largestFileCollection: employees.reduce((max, emp) => Math.max(max, emp.fileCount), 0)
				},
				systemConfig: config
			}
		});

	} catch (error) {
		console.error('Error fetching employee file data:', error);
		return json({
			success: false,
			error: error.message,
			details: error.stack
		}, { status: 500 });
	}
};

// Handle POST requests for search functionality
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		const { query, filters } = await request.json();

		let searchQuery = `
			SELECT DISTINCT
				e.employee_id,
				e.full_name,
				e.status,
				COUNT(ef.id) as file_count,
				COUNT(CASE WHEN ef.is_empty = 0 THEN 1 END) as content_files
			FROM employees e
			LEFT JOIN employee_files ef ON e.employee_id = ef.employee_id
		`;

		const params = [];
		const conditions = [];

		// Add search conditions if query is provided
		if (query && query.trim()) {
			conditions.push(`(
				e.full_name LIKE ? OR
				e.employee_id LIKE ? OR
				ef.file_name LIKE ?
			)`);
			const searchTerm = `%${query.trim()}%`;
			params.push(searchTerm, searchTerm, searchTerm);
		}

		// Add status filter if provided
		if (filters?.status && filters.status !== 'all') {
			conditions.push('e.status = ?');
			params.push(filters.status);
		}

		// Add file type filter if provided
		if (filters?.hasFiles !== undefined) {
			if (filters.hasFiles) {
				conditions.push('ef.is_empty = 0');
			} else {
				conditions.push('ef.is_empty = 1');
			}
		}

		if (conditions.length > 0) {
			searchQuery += ' WHERE ' + conditions.join(' AND ');
		}

		searchQuery += `
			GROUP BY e.employee_id, e.full_name, e.status
			ORDER BY e.full_name ASC
			LIMIT 100
		`;

		const searchResults = await db.prepare(searchQuery).bind(...params).all();

		// Log the search query for analytics
		if (query && query.trim()) {
			await db.prepare(`
				INSERT INTO search_queries (query_text, results_count, user_identifier, timestamp)
				VALUES (?, ?, ?, ?)
			`).bind(
				query.trim(),
				searchResults.results.length,
				'anonymous', // Could be replaced with actual user tracking
				new Date().toISOString()
			).run();
		}

		const employees = searchResults.results.map(emp => ({
			id: emp.employee_id,
			name: emp.full_name,
			fileCount: emp.file_count || 0,
			contentFiles: emp.content_files || 0,
			status: emp.status
		}));

		return json({
			success: true,
			data: {
				employees,
				totalResults: employees.length,
				query: query || '',
				filters: filters || {}
			}
		});

	} catch (error) {
		console.error('Error performing search:', error);
		return json({
			success: false,
			error: error.message
		}, { status: 500 });
	}
};
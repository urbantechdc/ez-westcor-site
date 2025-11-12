import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { applyPrivacyFilter, applyPrivacyFilterToArray } from '$lib/server/privacy.js';

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

export const GET: RequestHandler = async ({ request, platform, params }) => {
	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		const employeeId = params.id;
		if (!employeeId) {
			throw new Error('Employee ID is required');
		}

		// Get employee information
		const employee = await db.prepare(`
			SELECT employee_id, full_name, status
			FROM employees
			WHERE employee_id = ?
		`).bind(employeeId).first();

		if (!employee) {
			return json({
				success: false,
				error: 'Employee not found'
			}, { status: 404 });
		}

		// Get all files for the employee
		const files = await db.prepare(`
			SELECT
				ef.id,
				ef.file_name,
				ef.file_path,
				ef.file_type,
				ef.file_size,
				ef.is_empty,
				ef.category_code,
				fc.name as category_name,
				fc.description as category_description,
				ef.created_at,
				ef.updated_at
			FROM employee_files ef
			LEFT JOIN file_categories fc ON ef.category_code = fc.code
			WHERE ef.employee_id = ?
			ORDER BY ef.file_name ASC
		`).bind(employeeId).all();

		// Get user email for privacy filtering
		const userEmail = getUserEmail(request);

		// Apply privacy filtering to employee data
		const filteredEmployee = applyPrivacyFilter(
			{
				id: employee.employee_id,
				name: employee.full_name
			},
			userEmail,
			{
				names: ['name'],
				employeeIds: ['id']
			}
		);

		// Apply privacy filtering to files data
		const filteredFiles = applyPrivacyFilterToArray(files.results, userEmail, {
			filenames: ['file_name', 'file_path']
		});

		return json({
			success: true,
			data: {
				employee: filteredEmployee,
				files: filteredFiles,
				summary: {
					totalFiles: filteredFiles.length,
					categories: [...new Set(filteredFiles.map(f => f.category_name).filter(Boolean))]
				}
			}
		});

	} catch (error) {
		console.error('Error fetching employee files:', error);
		return json({
			success: false,
			error: error.message
		}, { status: 500 });
	}
};
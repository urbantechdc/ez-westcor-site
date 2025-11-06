import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform, params }) => {
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

		return json({
			success: true,
			data: {
				employee: {
					id: employee.employee_id,
					name: employee.full_name
				},
				files: files.results,
				summary: {
					totalFiles: files.results.length,
					categories: [...new Set(files.results.map(f => f.category_name).filter(Boolean))]
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
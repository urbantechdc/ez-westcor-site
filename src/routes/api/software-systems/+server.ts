import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		// Get all software systems with their expiration tracking data
		const systems = await db.prepare(`
			SELECT
				ss.id,
				ss.name,
				ss.vendor_info,
				ss.created_at,
				ss.updated_at
			FROM software_systems ss
			ORDER BY ss.name
		`).all();

		// Get expiration tracking data for each system
		const systemsWithTracking = await Promise.all(
			systems.results.map(async (system) => {
				const tracking = await db.prepare(`
					SELECT
						ec.name as category_name,
						ec.days_threshold,
						ec.sort_order,
						set.count
					FROM software_expiration_tracking set
					JOIN expiration_categories ec ON set.expiration_category_id = ec.id
					WHERE set.software_system_id = ?
					AND set.count > 0
					ORDER BY ec.sort_order
				`).bind(system.id).all();

				return {
					...system,
					expiration_tracking: tracking.results
				};
			})
		);

		// Calculate summary statistics
		const summary = {
			total_systems: systems.results.length,
			total_licenses: systemsWithTracking.reduce((sum, system) => {
				return sum + system.expiration_tracking.reduce((trackingSum, track) => {
					return trackingSum + (track.count || 0);
				}, 0);
			}, 0),
			by_category: {}
		};

		// Group by expiration category
		const categories = await db.prepare(`
			SELECT
				ec.name,
				ec.days_threshold,
				ec.sort_order,
				COALESCE(SUM(set.count), 0) as total_count
			FROM expiration_categories ec
			LEFT JOIN software_expiration_tracking set ON ec.id = set.expiration_category_id
			GROUP BY ec.id, ec.name, ec.days_threshold, ec.sort_order
			ORDER BY ec.sort_order
		`).all();

		summary.by_category = categories.results;

		return json({
			success: true,
			data: {
				systems: systemsWithTracking,
				summary: summary
			}
		});

	} catch (error) {
		console.error('Error fetching software systems:', error);
		return json({
			success: false,
			error: error.message
		}, { status: 500 });
	}
};
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

// Get user info for logging
function getUserInfo(request: Request) {
	const cfIPCountry = request.headers.get('cf-ipcountry');
	const cfIPCity = request.headers.get('cf-ipcity');
	const cfIPRegion = request.headers.get('cf-region');
	const cfConnectingIP = request.headers.get('cf-connecting-ip');
	const xForwardedFor = request.headers.get('x-forwarded-for');

	const ip = cfConnectingIP || xForwardedFor || 'unknown';
	const location = cfIPCountry && cfIPCity
		? `${cfIPCity}, ${cfIPRegion || cfIPCountry}`
		: cfIPCountry || 'Unknown';

	return {
		ip_address: ip,
		location,
		country: cfIPCountry,
		city: cfIPCity,
		region: cfIPRegion
	};
}

// Log admin action
async function logAdminAction(
	db: D1Database,
	adminEmail: string,
	action: string,
	userInfo: any,
	success: boolean,
	details?: string
) {
	const locationData = JSON.stringify({
		country: userInfo.country,
		city: userInfo.city,
		region: userInfo.region,
		location_string: userInfo.location
	});

	try {
		await db.prepare(`
			INSERT INTO admin_log (
				admin_email, action, ip_address, location_data,
				success, details, timestamp
			) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		`).bind(
			adminEmail, action, userInfo.ip_address, locationData,
			success, details
		).run();
	} catch (err) {
		console.error('Error logging admin action:', err);
	}
}

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	try {
		const db = platform?.env?.DB;

		if (!db) {
			throw error(500, 'Database not available');
		}

		const logId = parseInt(params.id);
		if (isNaN(logId)) {
			throw error(400, 'Invalid log ID');
		}

		const userEmail = getUserEmail(request);
		const userInfo = getUserInfo(request);

		// Check if user is admin
		if (userEmail !== 'matt@easyharvest.ai') {
			await logAdminAction(
				db, userEmail || 'unknown', 'unauthorized_log_deletion_attempt', userInfo,
				false, `Attempted to delete log entry ${logId}`
			);
			throw error(403, 'Access denied. Admin privileges required.');
		}

		// First, get info about the log entry being deleted for audit purposes
		const logEntry = await db.prepare(`
			SELECT id, user_email, timestamp, success, error_message
			FROM download_log
			WHERE id = ?
		`).bind(logId).first();

		if (!logEntry) {
			throw error(404, 'Log entry not found');
		}

		// Delete the log entry
		const result = await db.prepare(`
			DELETE FROM download_log
			WHERE id = ?
		`).bind(logId).run();

		if (result.changes === 0) {
			throw error(404, 'Log entry not found');
		}

		// Log the admin action
		await logAdminAction(
			db, userEmail, 'delete_log_entry', userInfo,
			true, `Deleted log entry ${logId} for user ${logEntry.user_email || 'unknown'} from ${logEntry.timestamp}`
		);

		return json({
			success: true,
			message: 'Log entry deleted successfully',
			deletedId: logId
		});

	} catch (err) {
		console.error('Delete log error:', err);

		// Try to log error if we can get user info
		try {
			const db = platform?.env?.DB;
			if (db && !isNaN(parseInt(params.id))) {
				const userEmail = getUserEmail(request);
				const userInfo = getUserInfo(request);
				await logAdminAction(
					db, userEmail || 'unknown', 'delete_log_error', userInfo,
					false, `Error deleting log ${params.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
				);
			}
		} catch (logError) {
			console.error('Error logging deletion failure:', logError);
		}

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Internal server error while deleting log entry'
		}, { status: 500 });
	}
};

// Handle CORS
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
};
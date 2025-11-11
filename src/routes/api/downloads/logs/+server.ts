import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface DownloadLogEntry {
	id: number;
	timestamp: string;
	user_email: string | null;
	success: boolean;
	error_message: string | null;
	location_data: string | null;
	ip_address: string | null;
	file_name: string | null;
	code: string | null;
	file_size: number | null;
}

// Parse location data from JSON
function parseLocation(locationData: string | null): string {
	if (!locationData) return 'Unknown';

	try {
		const data = JSON.parse(locationData);

		// Try to build the most specific location possible
		if (data.city && data.region && data.country) {
			// Best case: City, State, Country
			return `${data.city}, ${data.region}, ${data.country}`;
		} else if (data.city && data.region) {
			// City and State/Region
			return `${data.city}, ${data.region}`;
		} else if (data.city && data.country) {
			// City with country
			return `${data.city}, ${data.country}`;
		} else if (data.region && data.country) {
			// State/Region with country
			return `${data.region}, ${data.country}`;
		} else if (data.location) {
			// Use pre-built location string if available (from the new format)
			return data.location;
		} else if (data.location_string) {
			// Use old pre-built location string if available
			return data.location_string;
		} else if (data.city) {
			// Just city
			return data.city;
		} else if (data.region) {
			// Just region/state
			return data.region;
		} else if (data.country) {
			// Just country - convert country codes to readable names
			const countryNames = {
				'US': 'United States',
				'CA': 'Canada',
				'GB': 'United Kingdom',
				'AU': 'Australia',
				'DE': 'Germany',
				'FR': 'France',
				'IN': 'India',
				'JP': 'Japan',
				'CN': 'China',
				'BR': 'Brazil',
				'MX': 'Mexico'
			};
			return countryNames[data.country] || data.country;
		}

		return 'Unknown';
	} catch (err) {
		console.error('Error parsing location data:', err);
		return 'Unknown';
	}
}

export const GET: RequestHandler = async ({ platform, url }) => {
	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw error(500, 'Database not available');
		}

		// Get query parameters
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
		const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
		const successOnly = url.searchParams.get('success_only') === 'true';

		// Build query based on filters
		let query = `
			SELECT
				dl.id,
				dl.timestamp,
				dl.user_email,
				dl.success,
				dl.error_message,
				dl.location_data,
				dl.ip_address,
				dl.file_size,
				dc.file_name,
				dc.code
			FROM download_log dl
			LEFT JOIN download_codes dc ON dl.code_id = dc.id
		`;

		const params: any[] = [];

		if (successOnly) {
			query += ` WHERE dl.success = true`;
		}

		query += ` ORDER BY dl.timestamp DESC LIMIT ? OFFSET ?`;
		params.push(limit, offset);

		// Execute query
		const result = await db.prepare(query).bind(...params).all();
		const logs = result.results as DownloadLogEntry[];

		// Transform the logs for the frontend
		const transformedLogs = logs.map(log => ({
			id: log.id,
			timestamp: log.timestamp,
			user_email: log.user_email || 'Unknown User',
			success: log.success,
			error_message: log.error_message,
			location: parseLocation(log.location_data),
			ip_address: log.ip_address,
			file_name: log.file_name,
			code: log.code,
			file_size: log.file_size
		}));

		// Get total count for pagination
		let countQuery = `
			SELECT COUNT(*) as total
			FROM download_log dl
		`;

		if (successOnly) {
			countQuery += ` WHERE dl.success = true`;
		}

		const countResult = await db.prepare(countQuery).first();
		const total = (countResult as { total: number }).total;

		// Get summary statistics
		const statsQuery = `
			SELECT
				COUNT(*) as total_attempts,
				COUNT(CASE WHEN success = 1 THEN 1 END) as successful_downloads,
				COUNT(CASE WHEN success = 0 THEN 1 END) as failed_attempts,
				COUNT(DISTINCT user_email) as unique_users,
				MAX(timestamp) as last_activity
			FROM download_log
		`;

		const statsResult = await db.prepare(statsQuery).first();
		const stats = statsResult as {
			total_attempts: number;
			successful_downloads: number;
			failed_attempts: number;
			unique_users: number;
			last_activity: string;
		};

		return json({
			success: true,
			logs: transformedLogs,
			pagination: {
				limit,
				offset,
				total,
				has_more: offset + limit < total
			},
			statistics: {
				total_attempts: stats.total_attempts,
				successful_downloads: stats.successful_downloads,
				failed_attempts: stats.failed_attempts,
				unique_users: stats.unique_users,
				success_rate: stats.total_attempts > 0
					? Math.round((stats.successful_downloads / stats.total_attempts) * 100)
					: 0,
				last_activity: stats.last_activity
			}
		});

	} catch (err) {
		console.error('Download logs retrieval error:', err);

		return json({
			success: false,
			message: 'Internal server error while retrieving download logs',
			logs: [],
			pagination: { limit: 0, offset: 0, total: 0, has_more: false },
			statistics: {
				total_attempts: 0,
				successful_downloads: 0,
				failed_attempts: 0,
				unique_users: 0,
				success_rate: 0,
				last_activity: null
			}
		}, { status: 500 });
	}
};

// Handle CORS
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
};
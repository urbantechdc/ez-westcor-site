import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';

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

// Generate a random download code
function generateDownloadCode(): string {
	// Generate 8 character alphanumeric code
	return crypto.randomBytes(4).toString('hex').toUpperCase();
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

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = platform?.env?.DB;
		const bucket = platform?.env?.BUCKET;

		if (!db) {
			throw error(500, 'Database not available');
		}

		if (!bucket) {
			throw error(500, 'File storage not available');
		}

		const userEmail = getUserEmail(request);
		const userInfo = getUserInfo(request);

		// Check if user is admin
		if (userEmail !== 'matt@easyharvest.ai') {
			await logAdminAction(
				db, userEmail || 'unknown', 'unauthorized_code_generation_attempt', userInfo,
				false, 'Non-admin user attempted to generate code for existing file'
			);
			throw error(403, 'Access denied. Admin privileges required.');
		}

		// Parse request body
		const body = await request.json();
		const { fileKey, recipientEmail, description } = body;

		if (!fileKey || !recipientEmail) {
			throw error(400, 'File key and recipient email are required');
		}

		// Verify file exists in R2
		const fileInfo = await bucket.head(fileKey);
		if (!fileInfo) {
			throw error(404, 'File not found in storage');
		}

		// Extract filename from file key
		const fileName = fileKey.split('/').pop() || fileKey;

		// Generate unique download code
		const downloadCode = generateDownloadCode();

		// Store download code in database
		const notes = description ? description : null;
		const result = await db.prepare(`
			INSERT INTO download_codes (
				code, file_name, file_key, file_size, recipient_email, notes,
				created_by, expires_at, max_downloads,
				download_count, is_used, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1, 0, false, CURRENT_TIMESTAMP)
		`).bind(
			downloadCode, fileName, fileKey, fileInfo.size,
			recipientEmail.trim(), notes, userEmail
		).run();

		// Log successful admin action
		await logAdminAction(
			db, userEmail, 'generate_code_existing_file', userInfo,
			true, `Generated code ${downloadCode} for existing file ${fileName} (${recipientEmail})`
		);

		return json({
			success: true,
			code: downloadCode,
			file_name: fileName,
			file_size: fileInfo.size,
			recipient: recipientEmail,
			message: 'Download code generated successfully'
		});

	} catch (err) {
		console.error('Code generation error:', err);

		// Try to log error if we can get user info
		try {
			const db = platform?.env?.DB;
			if (db) {
				const userEmail = getUserEmail(request);
				const userInfo = getUserInfo(request);
				await logAdminAction(
					db, userEmail || 'unknown', 'generate_code_error', userInfo,
					false, err instanceof Error ? err.message : 'Unknown error'
				);
			}
		} catch (logError) {
			console.error('Error logging code generation failure:', logError);
		}

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Internal server error during code generation'
		}, { status: 500 });
	}
};

// Handle CORS
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
};
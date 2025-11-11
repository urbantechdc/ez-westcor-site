import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ValidationRequest {
	code: string;
}

interface DownloadCode {
	id: number;
	code: string;
	file_name: string;
	file_key: string;
	file_size: number;
	expires_at: string | null;
	is_used: boolean;
	used_at: string | null;
	max_downloads: number;
	download_count: number;
	recipient_email: string | null;
}

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	// Cloudflare Zero Trust passes user info in headers
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');

	return cfAccess || xAuth || null;
}

// Get user IP address and location info
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

// Log download attempt
async function logDownloadAttempt(
	db: D1Database,
	codeId: number | null,
	codeAttempted: string,
	userEmail: string | null,
	userAgent: string | null,
	userInfo: any,
	success: boolean,
	errorMessage?: string,
	fileSize?: number
) {
	const locationData = JSON.stringify({
		country: userInfo.country,
		city: userInfo.city,
		region: userInfo.region,
		location_string: userInfo.location
	});

	try {
		await db.prepare(`
			INSERT INTO download_log (
				code_id, code_attempted, user_email, user_agent, ip_address,
				location_data, success, error_message, file_size, timestamp
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		`).bind(
			codeId, codeAttempted, userEmail, userAgent, userInfo.ip_address,
			locationData, success, errorMessage, fileSize
		).run();
	} catch (err) {
		console.error('Error logging download attempt:', err);
		// Don't throw here as logging errors shouldn't break the main flow
	}
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw error(500, 'Database not available');
		}

		const body = await request.json() as ValidationRequest;
		const { code } = body;

		if (!code || typeof code !== 'string' || code.trim().length === 0) {
			return json({
				success: false,
				message: 'Download code is required'
			}, { status: 400 });
		}

		const trimmedCode = code.trim();
		const userEmail = getUserEmail(request);
		const userAgent = request.headers.get('user-agent');
		const userInfo = getUserInfo(request);

		// Look up the download code
		const codeResult = await db.prepare(`
			SELECT id, code, file_name, file_key, file_size, expires_at,
			       is_used, used_at, max_downloads, download_count, recipient_email
			FROM download_codes
			WHERE code = ?
			LIMIT 1
		`).bind(trimmedCode).first();

		const downloadCode = codeResult as DownloadCode | null;

		// If code doesn't exist
		if (!downloadCode) {
			await logDownloadAttempt(
				db, null, trimmedCode, userEmail, userAgent, userInfo,
				false, 'Invalid download code'
			);

			return json({
				success: false,
				message: 'Invalid download code'
			}, { status: 404 });
		}

		// Check if code is already used
		if (downloadCode.is_used) {
			await logDownloadAttempt(
				db, downloadCode.id, trimmedCode, userEmail, userAgent, userInfo,
				false, 'Code already used', downloadCode.file_size
			);

			return json({
				success: false,
				message: 'This download code has already been used'
			}, { status: 410 });
		}

		// Check if code is expired
		if (downloadCode.expires_at) {
			const expirationDate = new Date(downloadCode.expires_at);
			const now = new Date();
			if (now > expirationDate) {
				await logDownloadAttempt(
					db, downloadCode.id, trimmedCode, userEmail, userAgent, userInfo,
					false, 'Code expired', downloadCode.file_size
				);

				return json({
					success: false,
					message: 'This download code has expired'
				}, { status: 410 });
			}
		}

		// Check download count limit
		if (downloadCode.download_count >= downloadCode.max_downloads) {
			await logDownloadAttempt(
				db, downloadCode.id, trimmedCode, userEmail, userAgent, userInfo,
				false, 'Download limit exceeded', downloadCode.file_size
			);

			return json({
				success: false,
				message: 'Download limit exceeded for this code'
			}, { status: 429 });
		}

		// Check if user is authorized for this download
		if (downloadCode.recipient_email && userEmail !== downloadCode.recipient_email) {
			await logDownloadAttempt(
				db, downloadCode.id, trimmedCode, userEmail, userAgent, userInfo,
				false, `Unauthorized user attempted download (intended for ${downloadCode.recipient_email})`, downloadCode.file_size
			);

			return json({
				success: false,
				message: 'This download code is not authorized for your account'
			}, { status: 403 });
		}

		// Mark code as used and increment download count
		await db.prepare(`
			UPDATE download_codes
			SET is_used = true, used_at = CURRENT_TIMESTAMP, download_count = download_count + 1
			WHERE id = ?
		`).bind(downloadCode.id).run();

		// Log successful validation
		await logDownloadAttempt(
			db, downloadCode.id, trimmedCode, userEmail, userAgent, userInfo,
			true, null, downloadCode.file_size
		);

		// Return download information
		return json({
			success: true,
			message: 'Download code validated successfully',
			download: {
				file_name: downloadCode.file_name,
				file_size: downloadCode.file_size,
				download_url: `/api/downloads/file/${downloadCode.id}?t=${Date.now()}`
			}
		});

	} catch (err) {
		console.error('Download validation error:', err);

		return json({
			success: false,
			message: 'Internal server error during validation'
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
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface DownloadCode {
	id: number;
	code: string;
	file_name: string;
	file_key: string;
	file_size: number;
	is_used: boolean;
}

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

// Log download attempt
async function logFileDownload(
	db: D1Database,
	codeId: number,
	userEmail: string | null,
	userAgent: string | null,
	userInfo: any,
	success: boolean,
	errorMessage?: string,
	fileSize?: number,
	downloadDuration?: number
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
				code_id, user_email, user_agent, ip_address,
				location_data, success, error_message, file_size,
				download_duration_ms, timestamp
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		`).bind(
			codeId, userEmail, userAgent, userInfo.ip_address,
			locationData, success, errorMessage, fileSize, downloadDuration
		).run();
	} catch (err) {
		console.error('Error logging file download:', err);
		// Don't throw here as logging errors shouldn't break the main flow
	}
}

export const GET: RequestHandler = async ({ params, request, platform, url }) => {
	const startTime = Date.now();

	try {
		const db = platform?.env?.DB;
		const bucket = platform?.env?.BUCKET;

		if (!db) {
			throw error(500, 'Database not available');
		}

		if (!bucket) {
			throw error(500, 'File storage not available');
		}

		const codeId = parseInt(params.id);
		if (isNaN(codeId)) {
			throw error(400, 'Invalid download ID');
		}

		const userEmail = getUserEmail(request);
		const userAgent = request.headers.get('user-agent');
		const userInfo = getUserInfo(request);

		// Look up the download code
		const downloadCode = await db.prepare(`
			SELECT id, code, file_name, file_key, file_size, is_used
			FROM download_codes
			WHERE id = ? AND is_used = true
			LIMIT 1
		`).bind(codeId).first() as DownloadCode | null;

		if (!downloadCode) {
			await logFileDownload(
				db, codeId, userEmail, userAgent, userInfo,
				false, 'Download code not found or not used'
			);
			throw error(404, 'Download not found or not authorized');
		}

		// Get the file from R2
		const object = await bucket.get(downloadCode.file_key);

		if (!object) {
			const duration = Date.now() - startTime;
			await logFileDownload(
				db, codeId, userEmail, userAgent, userInfo,
				false, 'File not found in storage', downloadCode.file_size, duration
			);
			throw error(404, 'File not found in storage');
		}

		// Stream the file directly without loading into memory
		const contentLength = object.size;
		const duration = Date.now() - startTime;

		// Log successful download (started)
		await logFileDownload(
			db, codeId, userEmail, userAgent, userInfo,
			true, null, contentLength, duration
		);

		// Determine content type
		let contentType = 'application/octet-stream';
		const extension = downloadCode.file_name.toLowerCase().split('.').pop();

		switch (extension) {
			case 'zip':
				contentType = 'application/zip';
				break;
			case 'pdf':
				contentType = 'application/pdf';
				break;
			case 'txt':
				contentType = 'text/plain';
				break;
			case 'json':
				contentType = 'application/json';
				break;
			case 'csv':
				contentType = 'text/csv';
				break;
			case 'xlsx':
				contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
				break;
			case 'docx':
				contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
				break;
		}

		// Return the file stream with appropriate headers
		return new Response(object.body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Length': contentLength.toString(),
				'Content-Disposition': `attachment; filename="${downloadCode.file_name}"`,
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
				'X-Download-Code': downloadCode.code,
				'X-File-Size': downloadCode.file_size.toString(),
				// Security headers
				'X-Content-Type-Options': 'nosniff',
				'X-Frame-Options': 'DENY',
				'X-Download-Time': duration.toString()
			}
		});

	} catch (err) {
		const duration = Date.now() - startTime;

		// Try to log the error if we have the code ID
		if (!isNaN(parseInt(params.id))) {
			try {
				const db = platform?.env?.DB;
				if (db) {
					const userEmail = getUserEmail(request);
					const userAgent = request.headers.get('user-agent');
					const userInfo = getUserInfo(request);

					await logFileDownload(
						db, parseInt(params.id), userEmail, userAgent, userInfo,
						false, err instanceof Error ? err.message : 'Unknown error', 0, duration
					);
				}
			} catch (logError) {
				console.error('Error logging download failure:', logError);
			}
		}

		console.error('Download error:', err);

		if (err instanceof Response) {
			throw err;
		}

		throw error(500, 'Internal server error during download');
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
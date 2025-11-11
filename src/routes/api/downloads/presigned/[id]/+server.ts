import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

interface DownloadCode {
	id: number;
	code: string;
	file_name: string;
	file_key: string;
	file_size: number;
	is_used: boolean;
	recipient_email: string | null;
}

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

// Get user info for logging
function getUserInfo(request: Request, cf: any) {
	// Get IP from headers
	const cfConnectingIP = request.headers.get('cf-connecting-ip');
	const xForwardedFor = request.headers.get('x-forwarded-for');
	const ip = cfConnectingIP || xForwardedFor || 'unknown';

	// Get location data from Cloudflare cf object (more reliable than headers)
	const country = cf?.country || request.headers.get('cf-ipcountry');
	const city = cf?.city || request.headers.get('cf-ipcity');
	const region = cf?.region || request.headers.get('cf-region');
	const regionCode = cf?.regionCode || request.headers.get('cf-region-code');
	const postalCode = cf?.postalCode || request.headers.get('cf-postal-code');
	const latitude = cf?.latitude || request.headers.get('cf-latitude');
	const longitude = cf?.longitude || request.headers.get('cf-longitude');

	// Build more granular location string
	let location = 'Unknown';
	if (city && region && country) {
		// Best case: City, State, Country
		location = `${city}, ${region}, ${country}`;
	} else if (city && regionCode && country) {
		// City, State Code, Country
		location = `${city}, ${regionCode}, ${country}`;
	} else if (city && country) {
		// City and country
		location = `${city}, ${country}`;
	} else if (region && country) {
		// State/Region and country
		location = `${region}, ${country}`;
	} else if (country) {
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
		location = countryNames[country] || country;
	}

	return {
		ip_address: ip,
		location,
		country,
		city,
		region,
		regionCode,
		postal_code: postalCode,
		latitude,
		longitude
	};
}

// Log download attempt
async function logPresignedDownload(
	db: D1Database,
	codeId: number,
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
				code_id, user_email, user_agent, ip_address,
				location_data, success, error_message, file_size,
				download_duration_ms, timestamp
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		`).bind(
			codeId, userEmail, userAgent, userInfo.ip_address,
			locationData, success, errorMessage, fileSize, 0 // Duration will be measured on client
		).run();
	} catch (err) {
		console.error('Error logging presigned download:', err);
	}
}

export const GET: RequestHandler = async ({ params, request, platform, url }) => {
	try {
		const db = platform?.env?.DB;

		if (!db) {
			throw error(500, 'Database not available');
		}

		const codeId = parseInt(params.id);
		if (isNaN(codeId)) {
			throw error(400, 'Invalid download ID');
		}

		const userEmail = getUserEmail(request);
		const userAgent = request.headers.get('user-agent');
		const userInfo = getUserInfo(request, request.cf);

		// Look up the download code
		const downloadCode = await db.prepare(`
			SELECT id, code, file_name, file_key, file_size, is_used, recipient_email
			FROM download_codes
			WHERE id = ? AND is_used = true
			LIMIT 1
		`).bind(codeId).first() as DownloadCode | null;

		if (!downloadCode) {
			await logPresignedDownload(
				db, codeId, userEmail, userAgent, userInfo,
				false, 'Download code not found or not used'
			);
			throw error(404, 'Download not found or not authorized');
		}

		// Check if this download is for a specific recipient
		if (downloadCode.recipient_email && userEmail !== downloadCode.recipient_email) {
			await logPresignedDownload(
				db, codeId, userEmail, userAgent, userInfo,
				false, `Unauthorized user attempted download (intended for ${downloadCode.recipient_email})`, downloadCode.file_size
			);
			throw error(403, 'This download code is not authorized for your account');
		}

		// Get R2 credentials from environment variables
		const accessKeyId = platform?.env?.R2_ACCESS_KEY_ID;
		const secretAccessKey = platform?.env?.R2_SECRET_ACCESS_KEY;
		const accountId = platform?.env?.CLOUDFLARE_ACCOUNT_ID || '002eeeed45cd3092f9850997d62be37b';
		const bucketName = platform?.env?.R2_BUCKET_NAME || 'ez-westcor-downloads-dev';

		if (!accessKeyId || !secretAccessKey) {
			console.error('R2 credentials missing. Required: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
			await logPresignedDownload(
				db, codeId, userEmail, userAgent, userInfo,
				false, 'R2 credentials not configured', downloadCode.file_size
			);
			throw error(500, 'Download service not available');
		}

		console.log(`Generating presigned download URL for: ${downloadCode.file_key}`);

		// Create S3 client for R2
		const s3Client = new S3Client({
			region: 'auto',
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});

		// Create the GetObjectCommand
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: downloadCode.file_key,
			ResponseContentDisposition: `attachment; filename="${downloadCode.file_name}"`
		});

		// Generate presigned URL (valid for 1 hour)
		const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		return json({
			success: true,
			presignedUrl: presignedUrl,
			fileName: downloadCode.file_name,
			fileSize: downloadCode.file_size,
			expiresIn: 3600,
			message: 'Presigned download URL generated successfully',
			instructions: {
				method: 'GET',
				note: 'Download the file using a GET request to the presigned URL',
				expires: new Date(Date.now() + 3600 * 1000).toISOString()
			}
		});

	} catch (err) {
		console.error('Presigned download URL error:', err);

		if (err instanceof Response) {
			throw err;
		}

		throw error(500, 'Internal server error during presigned URL generation');
	}
};

// Handle CORS
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, x-authenticated-user-email',
		},
	});
};
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

export const PUT: RequestHandler = async ({ request, platform, url }) => {
	try {
		const userEmail = getUserEmail(request);

		// Check if user is admin
		if (userEmail !== 'matt@easyharvest.ai') {
			throw error(403, 'Access denied. Admin privileges required.');
		}

		// Get file metadata from query parameters
		const fileKey = url.searchParams.get('key');
		const fileName = url.searchParams.get('fileName');
		const contentType = request.headers.get('content-type') || 'application/octet-stream';
		const contentLength = request.headers.get('content-length');

		if (!fileKey || !fileName) {
			throw error(400, 'key and fileName query parameters are required');
		}

		console.log(`🚀 Worker proxy upload starting: ${fileName} (${contentLength} bytes)`);

		// Get R2 credentials from environment variables
		const accessKeyId = platform?.env?.R2_ACCESS_KEY_ID;
		const secretAccessKey = platform?.env?.R2_SECRET_ACCESS_KEY;
		const accountId = platform?.env?.CLOUDFLARE_ACCOUNT_ID || '002eeeed45cd3092f9850997d62be37b';

		// Get bucket name based on environment
		const nodeEnv = platform?.env?.NODE_ENV || 'dev';
		const bucketName = nodeEnv === 'prod' ? 'ez-westcor-downloads-prod' : 'ez-westcor-downloads-dev';

		if (!accessKeyId || !secretAccessKey) {
			console.error('R2 credentials missing. Required: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
			throw error(500, 'R2 credentials not configured');
		}

		// Create S3 client for R2
		const s3Client = new S3Client({
			region: 'auto',
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});

		// Use request.body directly for streaming (avoids loading into memory)
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: fileKey,
			Body: request.body,
			ContentType: contentType,
			...(contentLength && { ContentLength: parseInt(contentLength) })
		});

		console.log(`📤 Uploading to R2: ${bucketName}/${fileKey}`);
		const result = await s3Client.send(command);
		console.log(`✅ Upload successful, ETag: ${result.ETag}`);

		return json({
			success: true,
			message: 'File uploaded successfully to R2 via worker proxy',
			fileKey: fileKey,
			fileName: fileName,
			etag: result.ETag,
			uploadMethod: 'worker-proxy'
		});

	} catch (err) {
		console.error('❌ Proxy upload error:', err);

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Error uploading file through worker proxy',
			error: err instanceof Error ? err.message : 'Unknown error'
		}, { status: 500 });
	}
};

// Handle CORS for preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'PUT, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
};
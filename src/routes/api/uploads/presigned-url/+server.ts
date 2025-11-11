import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const userEmail = getUserEmail(request);

		// Check if user is admin
		if (userEmail !== 'matt@easyharvest.ai') {
			throw error(403, 'Access denied. Admin privileges required.');
		}

		// Parse request body
		const body = await request.json();
		const { fileName, contentType, fileSize } = body;

		if (!fileName) {
			throw error(400, 'fileName is required');
		}

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

		// Generate unique file key to prevent conflicts
		const timestamp = Date.now();
		const uuid = crypto.randomUUID();
		const fileKey = `${timestamp}-${uuid}-${fileName}`;

		console.log(`Generating presigned upload URL for: ${fileKey}`);

		// Create S3 client for R2
		const s3Client = new S3Client({
			region: 'auto',
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});

		// Create the PutObjectCommand
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: fileKey,
			ContentType: contentType || 'application/octet-stream',
			...(fileSize && { ContentLength: parseInt(fileSize) })
		});

		// Generate presigned URL (valid for 1 hour)
		const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		// Also provide a worker proxy fallback URL for CORS issues
		const workerProxyUrl = `/api/uploads/proxy-r2?key=${encodeURIComponent(fileKey)}&fileName=${encodeURIComponent(fileName)}`;

		return json({
			success: true,
			presignedUrl: presignedUrl,
			workerProxyUrl: workerProxyUrl,
			fileKey: fileKey,
			fileName: fileName,
			expiresIn: 3600,
			message: 'Upload URLs generated successfully',
			instructions: {
				primary: {
					method: 'PUT',
					url: presignedUrl,
					note: 'Direct R2 upload (faster, but requires CORS configuration)',
					headers: {
						'Content-Type': contentType || 'application/octet-stream',
						...(fileSize && { 'Content-Length': fileSize })
					}
				},
				fallback: {
					method: 'PUT',
					url: workerProxyUrl,
					note: 'Worker proxy upload (works without CORS, slightly slower)',
					headers: {
						'Content-Type': contentType || 'application/octet-stream'
					}
				},
				maxSize: '5TB (R2 limit per object)'
			}
		});

	} catch (err) {
		console.error('Presigned URL generation error:', err);

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Internal server error while generating presigned URL',
			error: err instanceof Error ? err.message : 'Unknown error'
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
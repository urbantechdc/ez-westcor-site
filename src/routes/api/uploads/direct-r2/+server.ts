import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
		const { fileName, contentType, fileSize, recipientEmail, description } = body;

		if (!fileName) {
			throw error(400, 'fileName is required');
		}

		// Get credentials from environment
		const apiToken = platform?.env?.R2_API_TOKEN;
		const accountId = platform?.env?.CLOUDFLARE_ACCOUNT_ID || '002eeeed45cd3092f9850997d62be37b';
		const bucketName = platform?.env?.R2_BUCKET_NAME || 'ez-westcor-downloads-dev';

		if (!apiToken) {
			console.error('R2 API token missing. Required: R2_API_TOKEN');
			throw error(500, 'R2 credentials not configured');
		}

		// Generate unique file key to prevent conflicts
		const timestamp = Date.now();
		const uuid = crypto.randomUUID();
		const fileKey = `${timestamp}-${uuid}-${fileName}`;

		console.log(`Creating direct R2 upload URL for: ${fileKey}`);

		// Return upload instructions using Cloudflare R2 REST API
		const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${fileKey}`;

		return json({
			success: true,
			uploadUrl: uploadUrl,
			fileKey: fileKey,
			fileName: fileName,
			contentType: contentType || 'application/octet-stream',
			message: 'Direct R2 upload URL generated successfully',
			instructions: {
				method: 'PUT',
				note: 'Upload the file using a PUT request to the upload URL with Authorization header',
				headers: {
					'Authorization': `Bearer ${apiToken}`,
					'Content-Type': contentType || 'application/octet-stream',
					...(fileSize && { 'Content-Length': fileSize })
				},
				maxSize: '5TB (R2 limit per object)'
			},
			// Return these for the admin interface to create a download code
			adminInfo: {
				recipientEmail,
				description,
				fileSize: parseInt(fileSize) || 0
			}
		});

	} catch (err) {
		console.error('Direct R2 upload URL generation error:', err);

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Internal server error while generating upload URL',
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
			'Access-Control-Allow-Headers': 'Content-Type, x-authenticated-user-email',
		},
	});
};
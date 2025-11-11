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
		const bucket = platform?.env?.BUCKET;

		if (!bucket) {
			throw error(500, 'File storage not available');
		}

		const userEmail = getUserEmail(request);

		// Check if user is admin
		if (userEmail !== 'matt@easyharvest.ai') {
			throw error(403, 'Access denied. Admin privileges required.');
		}

		// Parse form data
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const customName = formData.get('fileName') as string;

		if (!file) {
			throw error(400, 'No file provided');
		}

		console.log(`Uploading large file: ${file.name}, size: ${file.size} bytes`);

		// Use custom name if provided, otherwise use original name
		const fileName = customName || file.name;
		const fileKey = fileName; // Store at root level

		try {
			// Convert file to ArrayBuffer
			const fileBuffer = await file.arrayBuffer();

			// Upload directly to R2 using Workers API
			await bucket.put(fileKey, fileBuffer, {
				httpMetadata: {
					contentType: file.type || 'application/octet-stream'
				}
			});

			console.log(`Successfully uploaded: ${fileName}`);

			return json({
				success: true,
				message: `Successfully uploaded ${fileName}`,
				fileName: fileName,
				fileSize: file.size,
				fileKey: fileKey
			});

		} catch (uploadError) {
			console.error('R2 upload error:', uploadError);
			throw error(500, `Failed to upload file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
		}

	} catch (err) {
		console.error('Large file upload error:', err);

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Internal server error during upload'
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
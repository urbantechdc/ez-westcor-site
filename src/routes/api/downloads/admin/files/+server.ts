import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

// Format file size for display
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const GET: RequestHandler = async ({ request, platform }) => {
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

		// List objects in the R2 bucket
		const response = await bucket.list();

		const files = response.objects.map(obj => ({
			key: obj.key,
			name: obj.key.split('/').pop() || obj.key, // Extract filename from key
			size: formatFileSize(obj.size),
			sizeBytes: obj.size,
			uploaded: obj.uploaded?.toISOString(),
			lastModified: obj.uploaded
		})).sort((a, b) => {
			// Sort by last modified date (newest first)
			if (!a.lastModified && !b.lastModified) return 0;
			if (!a.lastModified) return 1;
			if (!b.lastModified) return -1;
			return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
		});

		return json({
			success: true,
			files,
			count: files.length
		});

	} catch (err) {
		console.error('Files list error:', err);

		if (err instanceof Response) {
			throw err;
		}

		return json({
			success: false,
			message: 'Internal server error while retrieving files',
			files: [],
			count: 0
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
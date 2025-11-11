import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Get user email from Cloudflare Zero Trust headers
function getUserEmail(request: Request): string | null {
	const cfAccess = request.headers.get('cf-access-authenticated-user-email');
	const xAuth = request.headers.get('x-authenticated-user-email');
	return cfAccess || xAuth || null;
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		const userEmail = getUserEmail(request);

		if (!userEmail) {
			return json({
				authenticated: false,
				email: null
			}, { status: 401 });
		}

		return json({
			authenticated: true,
			email: userEmail,
			isAdmin: userEmail === 'matt@easyharvest.ai'
		});

	} catch (error) {
		console.error('User authentication check error:', error);

		return json({
			authenticated: false,
			email: null,
			error: 'Authentication check failed'
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
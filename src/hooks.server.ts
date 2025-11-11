import type { Handle } from '@sveltejs/kit';
import { extractZeroTrustUser, isAdmin } from '$lib/server/zero-trust';

export const handle: Handle = async ({ event, resolve }) => {
	// Extract user information from Cloudflare Zero Trust headers
	const zeroTrustUser = extractZeroTrustUser(event.request);

	if (zeroTrustUser) {
		// Populate locals with user information for use throughout the app
		event.locals.user = {
			id: zeroTrustUser.userId || zeroTrustUser.email,
			email: zeroTrustUser.email,
			name: zeroTrustUser.name || zeroTrustUser.email.split('@')[0]
		};

		// Add admin flag for convenience
		event.locals.isAdmin = isAdmin(zeroTrustUser);

		// Store full Zero Trust user info if needed
		event.locals.zeroTrustUser = zeroTrustUser;
	}

	// Log requests with user context (in production, this would go to Cloudflare Logpush)
	const userInfo = zeroTrustUser ? ` [${zeroTrustUser.email}]` : ' [anonymous]';
	console.log(`${event.request.method} ${event.url.pathname}${userInfo}`);

	// Handle API routes with enhanced CORS and auth headers
	if (event.url.pathname.startsWith('/api/')) {
		// Check if this is a protected download endpoint
		const isDownloadEndpoint = event.url.pathname.startsWith('/api/downloads/');

		// For download endpoints, we might want to enforce authentication
		// (This is optional - you can remove if you want open access to downloads)
		if (isDownloadEndpoint && !zeroTrustUser) {
			// Uncomment these lines if you want to require authentication for downloads
			// return new Response(JSON.stringify({ error: 'Authentication required' }), {
			//     status: 401,
			//     headers: { 'Content-Type': 'application/json' }
			// });
		}

		const response = await resolve(event);

		// Add CORS headers
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-authenticated-user-email');

		// Add user context headers for debugging (remove in production if sensitive)
		if (zeroTrustUser) {
			response.headers.set('X-User-Email', zeroTrustUser.email);
			if (zeroTrustUser.name) {
				response.headers.set('X-User-Name', zeroTrustUser.name);
			}
		}

		return response;
	}

	// Continue with normal request handling
	const response = await resolve(event);

	// Add security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Add Content Security Policy for enhanced security
	response.headers.set('Content-Security-Policy',
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
		"style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
		"img-src 'self' data: https:; " +
		"font-src 'self' https://cdn.jsdelivr.net; " +
		"connect-src 'self' *.r2.cloudflarestorage.com;"
	);

	return response;
};
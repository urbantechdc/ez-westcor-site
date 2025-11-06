import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// You can access Cloudflare platform features here
	// For example, to add custom headers, logging, etc.
	
	// Log requests (in production, this would go to Cloudflare Logpush)
	console.log(`${event.request.method} ${event.url.pathname}`);
	
	// Example: Add CORS headers for API routes
	if (event.url.pathname.startsWith('/api/')) {
		const response = await resolve(event);
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
		return response;
	}
	
	// Continue with normal request handling
	const response = await resolve(event);
	
	// Add security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	
	return response;
};
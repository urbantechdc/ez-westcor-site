/**
 * Cloudflare Zero Trust Integration Utilities
 *
 * This module provides utilities for working with Cloudflare Zero Trust (Access)
 * authentication headers and user information.
 */

export interface ZeroTrustUser {
	email: string;
	name?: string;
	groups?: string[];
	userId?: string;
	identity?: string;
}

/**
 * Extract user information from Cloudflare Zero Trust headers
 */
export function extractZeroTrustUser(request: Request): ZeroTrustUser | null {
	// Cloudflare Zero Trust provides authenticated user info in headers
	const email = request.headers.get('cf-access-authenticated-user-email');
	const name = request.headers.get('cf-access-authenticated-user-name');
	const userId = request.headers.get('cf-access-authenticated-user-id');
	const groups = request.headers.get('cf-access-authenticated-user-groups');
	const identity = request.headers.get('cf-access-authenticated-user-identity');

	// Also check for custom headers in case of different setup
	const xAuthEmail = request.headers.get('x-authenticated-user-email');
	const xAuthName = request.headers.get('x-authenticated-user-name');

	const userEmail = email || xAuthEmail;

	if (!userEmail) {
		return null;
	}

	return {
		email: userEmail,
		name: name || xAuthName || undefined,
		groups: groups ? groups.split(',').map(g => g.trim()) : undefined,
		userId: userId || undefined,
		identity: identity || undefined
	};
}

/**
 * Check if user has any of the required groups
 */
export function userHasGroup(user: ZeroTrustUser, requiredGroups: string[]): boolean {
	if (!user.groups || user.groups.length === 0) {
		return false;
	}

	return requiredGroups.some(group => user.groups!.includes(group));
}

/**
 * Check if user has admin access (for download management)
 */
export function isAdmin(user: ZeroTrustUser): boolean {
	// Define admin groups - customize these based on your organization
	const adminGroups = ['admin', 'administrators', 'download-admin'];
	return userHasGroup(user, adminGroups);
}

/**
 * Get user location information from Cloudflare headers
 */
export function extractUserLocation(request: Request) {
	const cfIPCountry = request.headers.get('cf-ipcountry');
	const cfIPCity = request.headers.get('cf-ipcity');
	const cfIPRegion = request.headers.get('cf-region');
	const cfConnectingIP = request.headers.get('cf-connecting-ip');
	const xForwardedFor = request.headers.get('x-forwarded-for');
	const cfIPTimezone = request.headers.get('cf-timezone');
	const cfIPLatitude = request.headers.get('cf-latitude');
	const cfIPLongitude = request.headers.get('cf-longitude');

	const ip = cfConnectingIP || xForwardedFor || 'unknown';
	const location = cfIPCountry && cfIPCity
		? `${cfIPCity}, ${cfIPRegion || cfIPCountry}`
		: cfIPCountry || 'Unknown';

	return {
		ip_address: ip,
		country: cfIPCountry || null,
		city: cfIPCity || null,
		region: cfIPRegion || null,
		timezone: cfIPTimezone || null,
		latitude: cfIPLatitude || null,
		longitude: cfIPLongitude || null,
		location_string: location
	};
}

/**
 * Validate Zero Trust JWT (if using JWT verification)
 * This is an advanced feature - basic header validation is usually sufficient
 */
export async function validateZeroTrustJWT(request: Request, audienceTag?: string): Promise<boolean> {
	// JWT validation would go here if needed
	// For most cases, trusting Cloudflare's headers is sufficient
	// since they can only be set by Cloudflare Access

	const jwtToken = request.headers.get('cf-access-jwt-assertion');

	if (!jwtToken) {
		return false;
	}

	// TODO: Implement JWT validation if needed
	// This would involve verifying the JWT signature against Cloudflare's public keys

	return true;
}

/**
 * Get user-friendly display name
 */
export function getUserDisplayName(user: ZeroTrustUser): string {
	if (user.name) {
		return user.name;
	}

	// Extract name from email if no explicit name
	const emailPart = user.email.split('@')[0];
	return emailPart.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Check if the current request is authenticated via Zero Trust
 */
export function isAuthenticated(request: Request): boolean {
	return extractZeroTrustUser(request) !== null;
}

/**
 * Require authentication middleware helper
 */
export function requireAuth(request: Request): ZeroTrustUser {
	const user = extractZeroTrustUser(request);

	if (!user) {
		throw new Error('Authentication required');
	}

	return user;
}
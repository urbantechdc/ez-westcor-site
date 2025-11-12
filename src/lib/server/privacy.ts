/**
 * Privacy utilities for data obfuscation
 */

// Authorized user who can see real names
const AUTHORIZED_USER = 'JHafen@westcorconstruction.com';

/**
 * Check if the user is authorized to see unobfuscated data
 */
export function isAuthorizedUser(userEmail: string | null): boolean {
	return userEmail === AUTHORIZED_USER;
}

/**
 * Generate a consistent hash for a string (for consistent obfuscation)
 */
function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Obfuscate a name while maintaining some structure
 * Example: "Aaron Chavez Monroy" -> "A***** C****** M*****"
 */
export function obfuscateName(name: string): string {
	if (!name) return name;

	return name
		.split(' ')
		.map(part => {
			if (part.length <= 1) return part;
			if (part.length <= 3) return part.charAt(0) + '*'.repeat(part.length - 1);
			return part.charAt(0) + '*'.repeat(part.length - 1);
		})
		.join(' ');
}

/**
 * Obfuscate a filename while preserving the file extension
 * Example: "AXV Personal Documents Aaron De Anda-Cabezas 01.04.24.pdf"
 *       -> "AXV Personal Documents A**** ** A***-C******* 01.04.24.pdf"
 */
export function obfuscateFilename(filename: string): string {
	if (!filename) return filename;

	// Extract file extension
	const lastDot = filename.lastIndexOf('.');
	let nameWithoutExt = filename;
	let extension = '';

	if (lastDot !== -1 && lastDot > filename.lastIndexOf('/')) {
		nameWithoutExt = filename.substring(0, lastDot);
		extension = filename.substring(lastDot);
	}

	// Obfuscate the name part (look for patterns that might be names)
	const obfuscated = nameWithoutExt.replace(/\b[A-Z][a-z]{2,}\b/g, (match) => {
		return match.charAt(0) + '*'.repeat(match.length - 1);
	});

	return obfuscated + extension;
}

/**
 * Obfuscate employee ID while maintaining searchability
 * Keep the prefix but obfuscate numbers: "AXV163722" -> "AXV******"
 */
export function obfuscateEmployeeId(employeeId: string): string {
	if (!employeeId) return employeeId;

	// Keep letters at the start, obfuscate numbers
	return employeeId.replace(/\d/g, '*');
}

/**
 * Main function to obfuscate data based on user authorization
 */
export function applyPrivacyFilter<T extends Record<string, any>>(
	data: T,
	userEmail: string | null,
	fieldsToObfuscate: {
		names?: string[];
		filenames?: string[];
		employeeIds?: string[];
	} = {}
): T {
	// If user is authorized, return original data
	if (isAuthorizedUser(userEmail)) {
		return data;
	}

	// Create a copy of the data to modify
	const filtered = { ...data };

	// Obfuscate name fields
	if (fieldsToObfuscate.names) {
		for (const field of fieldsToObfuscate.names) {
			if (filtered[field]) {
				filtered[field] = obfuscateName(filtered[field]);
			}
		}
	}

	// Obfuscate filename fields
	if (fieldsToObfuscate.filenames) {
		for (const field of fieldsToObfuscate.filenames) {
			if (filtered[field]) {
				filtered[field] = obfuscateFilename(filtered[field]);
			}
		}
	}

	// Obfuscate employee ID fields
	if (fieldsToObfuscate.employeeIds) {
		for (const field of fieldsToObfuscate.employeeIds) {
			if (filtered[field]) {
				filtered[field] = obfuscateEmployeeId(filtered[field]);
			}
		}
	}

	return filtered;
}

/**
 * Apply privacy filter to an array of objects
 */
export function applyPrivacyFilterToArray<T extends Record<string, any>>(
	dataArray: T[],
	userEmail: string | null,
	fieldsToObfuscate: {
		names?: string[];
		filenames?: string[];
		employeeIds?: string[];
	} = {}
): T[] {
	return dataArray.map(item =>
		applyPrivacyFilter(item, userEmail, fieldsToObfuscate)
	);
}
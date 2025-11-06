import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/dashboard');

		if (!response.ok) {
			throw new Error(`Failed to fetch dashboard data: ${response.status}`);
		}

		const result = await response.json();

		if (!result.success) {
			throw new Error(result.error || 'Failed to load dashboard data');
		}

		return {
			dashboardData: result.data
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);

		// Return fallback mock data if database fails
		return {
			dashboardData: {
				employees: [
					{ id: 'AXV017147', name: 'Carlos F Abdala-Cobos', fileCount: 12, status: 'active' },
					{ id: 'BYW018258', name: 'Jane M Smith', fileCount: 8, status: 'active' },
					{ id: 'CZX019369', name: 'Robert L Johnson', fileCount: 15, status: 'archived' },
					{ id: 'DWY020470', name: 'Maria E Rodriguez', fileCount: 22, status: 'active' }
				],
				summary: {
					totalEmployees: 4,
					activeEmployees: 3,
					totalFiles: 57,
					contentFiles: 45,
					emptyFiles: 12,
					averageFilesPerEmployee: 14
				},
				fileStats: [],
				topEmployees: [],
				recentActivity: [],
				systemConfig: {}
			},
			error: error.message
		};
	}
};
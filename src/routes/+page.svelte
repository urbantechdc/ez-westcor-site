<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	// Props from page load function (Svelte 5 runes syntax)
	let { data } = $props();

	// No tabs needed anymore - just show employee directory

	// Get data from database (loaded via +page.ts)
	let dashboardData = data.dashboardData;
	let loadError = data.error;

	// Use database data or fallback to mock data for development
	let employees = dashboardData?.employees || [
		{ id: 'AXV017147', name: 'Carlos F Abdala-Cobos', fileCount: 12, status: 'active' },
		{ id: 'BYW018258', name: 'Jane M Smith', fileCount: 8, status: 'active' },
		{ id: 'CZX019369', name: 'Robert L Johnson', fileCount: 15, status: 'archived' },
		{ id: 'DWY020470', name: 'Maria E Rodriguez', fileCount: 22, status: 'active' }
	];

	let searchQuery = $state('');
	let selectedEmployee = $state(null);
	let selectedEmployeeFiles = $state(null);
	let filesLoading = $state(false);
	let filePreview = $state(null);

	// Calculate totals from API data or fallback to calculated values
	let totalEmployees = $derived(dashboardData?.summary?.totalEmployees || employees.length);
	let activeEmployees = $derived(dashboardData?.summary?.activeEmployees || employees.filter(e => e.status === 'active').length);
	let totalFiles = $derived(dashboardData?.summary?.totalFiles || employees.reduce((sum, e) => sum + e.fileCount, 0));
	let contentFiles = $derived(dashboardData?.summary?.contentFiles || 0);
	let emptyFiles = $derived(dashboardData?.summary?.emptyFiles || 0);

	// Search functionality
	let filteredEmployees = $derived(
		searchQuery ? employees.filter(emp =>
			emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			emp.id.toLowerCase().includes(searchQuery.toLowerCase())
		) : employees
	);

	async function selectEmployee(employee) {
		selectedEmployee = employee;
		selectedEmployeeFiles = null;
		filesLoading = true;

		try {
			const response = await fetch(`/api/employee/${employee.id}/files`);
			const result = await response.json();

			if (result.success) {
				selectedEmployeeFiles = result.data;
			} else {
				console.error('Failed to fetch employee files:', result.error);
			}
		} catch (error) {
			console.error('Error fetching employee files:', error);
		} finally {
			filesLoading = false;
		}
	}

	function backToDirectory() {
		selectedEmployee = null;
	}

	function previewFile(file) {
		filePreview = file;
	}

	onMount(async () => {
		// Initialize any needed components
		console.log('EZ-Westcor File Search loaded');
	});
</script>

<svelte:head>
	<title>EZ-Westcor File Search | Employee File Directory</title>
	<meta name="description" content="Searchable employee file directory and preview system for EZ-Westcor data" />
</svelte:head>

<!-- Show error if database failed to load -->
{#if loadError}
	<div class="container-fluid py-4">
		<div class="alert alert-warning">
			<h6 class="alert-heading">Database Connection Issue</h6>
			<p class="mb-0">Unable to load data from database: {loadError}. Showing demo data.</p>
		</div>
	</div>
{/if}

<div class="container-fluid py-4">
		{#if !selectedEmployee}

			<!-- Overview Cards -->
			<div class="row g-4 mb-4">
				<div class="col-lg-4 col-md-6">
					<div class="card">
						<div class="card-body">
							<div class="d-flex justify-content-between align-items-start mb-3">
								<h6 class="card-subtitle text-muted text-uppercase fw-semibold">Total Employees</h6>
								<div class="status-indicator status-healthy"></div>
							</div>
							<div class="h2 mb-0">{totalEmployees}</div>
						</div>
					</div>
				</div>
				<div class="col-lg-4 col-md-6">
					<div class="card">
						<div class="card-body">
							<div class="d-flex justify-content-between align-items-start mb-3">
								<h6 class="card-subtitle text-muted text-uppercase fw-semibold">Active Records</h6>
								<div class="status-indicator" style="background-color: #6c757d;"></div>
							</div>
							<div class="h2 mb-0">{activeEmployees}</div>
						</div>
					</div>
				</div>
				<div class="col-lg-4 col-md-6">
					<div class="card">
						<div class="card-body">
							<div class="d-flex justify-content-between align-items-start mb-3">
								<h6 class="card-subtitle text-muted text-uppercase fw-semibold">Total Files</h6>
								<div class="status-indicator status-healthy"></div>
							</div>
							<div class="h2 mb-0">{totalFiles}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Search Bar -->
			<div class="row mb-4">
				<div class="col-12">
					<div class="card">
						<div class="card-body">
							<div class="input-group input-group-lg">
								<span class="input-group-text">🔍</span>
								<input
									type="text"
									class="form-control"
									placeholder="Search employees by name or ID..."
									bind:value={searchQuery}
								/>
								{#if searchQuery}
									<button class="btn btn-outline-secondary" onclick={() => searchQuery = ''}>
										Clear
									</button>
								{/if}
							</div>
							{#if searchQuery}
								<small class="text-muted mt-2 d-block">
									Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} matching "{searchQuery}"
								</small>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Employee Directory -->
			<div class="row">
				<div class="col-12">
					<div class="card">
						<div class="card-header">
							<h5 class="mb-0">Employee Directory</h5>
						</div>
						<div class="card-body p-0">
							<div class="table-responsive">
								<table class="table table-hover mb-0">
									<thead class="table-light">
										<tr>
											<th>Employee ID</th>
											<th>Name</th>
											<th>File Count</th>
											<th>Status</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{#each filteredEmployees as employee}
											<tr class="cursor-pointer">
												<td class="fw-monospace">{employee.id}</td>
												<td class="fw-semibold">{employee.name}</td>
												<td>
													<span class="badge bg-primary">{employee.fileCount} files</span>
												</td>
												<td>
													<span class="badge {employee.status === 'active' ? 'bg-success' : 'bg-secondary'}">
														{employee.status}
													</span>
												</td>
												<td>
													<button
														class="btn btn-sm btn-outline-primary"
														onclick={() => selectEmployee(employee)}
													>
														View Files
													</button>
												</td>
											</tr>
										{/each}
										{#if filteredEmployees.length === 0}
											<tr>
												<td colspan="5" class="text-center text-muted py-4">
													{searchQuery ? 'No employees found matching your search.' : 'No employee data available.'}
												</td>
											</tr>
										{/if}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>

		{:else}
			<!-- Employee Detail View -->
			<div class="d-flex justify-content-between align-items-center mb-4">
				<div>
					<button class="btn btn-outline-secondary mb-2" onclick={backToDirectory}>
						← Back to Directory
					</button>
					<h2 class="h3 mb-1">Files for {selectedEmployee.name}</h2>
					<p class="text-muted mb-0">Employee ID: {selectedEmployee.id}</p>
				</div>
			</div>

			<!-- File List for Selected Employee -->
			<div class="row">
				<div class="col-12">
					<div class="card">
						<div class="card-header">
							<h5 class="mb-0">File Listing</h5>
						</div>
						<div class="card-body">
							{#if filesLoading}
								<div class="d-flex justify-content-center py-4">
									<div class="spinner-border" role="status">
										<span class="visually-hidden">Loading files...</span>
									</div>
								</div>
							{:else if selectedEmployeeFiles}
								<!-- File Summary -->
								<div class="row mb-4">
									<div class="col-md-6">
										<div class="text-center">
											<h4 class="text-primary">{selectedEmployeeFiles.summary.totalFiles}</h4>
											<small class="text-muted">Total Files</small>
										</div>
									</div>
									<div class="col-md-6">
										<div class="text-center">
											<h4 class="text-success">{selectedEmployeeFiles.summary.categories.length}</h4>
											<small class="text-muted">Categories</small>
										</div>
									</div>
								</div>

								<!-- File Listing -->
								{#if selectedEmployeeFiles.files.length > 0}
									<div class="list-group">
										{#each selectedEmployeeFiles.files as file}
											<div class="list-group-item">
												<div class="d-flex w-100 justify-content-between align-items-start">
													<div class="flex-grow-1">
														<h6 class="mb-1">{file.file_name}</h6>
														<p class="mb-1 text-muted">{file.file_path || 'Path not specified'}</p>
														<div class="d-flex gap-3">
															<small>File Type: {file.file_type || 'Unknown'}</small>
															<small>Category: {file.category_name || 'Uncategorized'}</small>
														</div>
													</div>
													<div class="ms-3">
														<button
															class="btn btn-sm btn-outline-secondary"
															disabled
															style="opacity: 0.5; cursor: not-allowed;"
															title="Preview functionality coming soon"
														>
															Preview
														</button>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center text-muted py-4">
										<p>No files found for this employee.</p>
									</div>
								{/if}
							{:else}
								<div class="text-center text-muted py-4">
									<p>Unable to load file data. Please try again.</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
</div>

<style>
	.cursor-pointer {
		cursor: pointer;
	}

	.cursor-pointer:hover {
		background-color: var(--bs-gray-50);
	}
</style>
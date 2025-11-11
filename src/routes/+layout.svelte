<script>
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../app.css';

	// Import Bootstrap CSS
	import '$lib/styles/bootstrap.css';

	// Import custom company styles
	import '$lib/styles/custom.css';

	let { children } = $props();

	// Navigation state
	const currentRoute = $derived($page.url.pathname);

	// User state
	let user = $state({
		authenticated: false,
		email: null,
		isAdmin: false,
		loading: true
	});

	// Fetch user information
	async function fetchUser() {
		try {
			const response = await fetch('/api/auth/user');
			if (response.ok) {
				const userData = await response.json();
				user = { ...userData, loading: false };
			} else {
				user = { authenticated: false, email: null, isAdmin: false, loading: false };
			}
		} catch (error) {
			console.error('Failed to fetch user:', error);
			user = { authenticated: false, email: null, isAdmin: false, loading: false };
		}
	}

	onMount(async () => {
		// Template initialization
		console.log('SvelteKit + Cloudflare Workers Template loaded');

		// Fetch user information
		await fetchUser();

		// Dynamically import Bootstrap JS (tree-shakeable)
		// Only import what you need - uncomment as needed:

		// For dropdowns:
		// await import('bootstrap/js/dist/dropdown');

		// For modals:
		// await import('bootstrap/js/dist/modal');

		// For tooltips:
		// await import('bootstrap/js/dist/tooltip');

		// For popovers:
		// await import('bootstrap/js/dist/popover');

		// For collapse (accordions, navbar toggle):
		// await import('bootstrap/js/dist/collapse');

		// For navigation tabs:
		await import('bootstrap/js/dist/tab');

		// Or import everything (larger bundle):
		// await import('bootstrap');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<title>EZ-Westcor File Search</title>
</svelte:head>

<!-- EZ-Westcor Header -->
<div class="usaf-header">
	<div class="container-fluid">
		<div class="d-flex justify-content-between align-items-center py-3">
			<div class="d-flex align-items-center gap-4">
				<div>
					<h1 class="h4 mb-0 fw-bold text-usaf-blue">EZ-Westcor File Search</h1>
					<small class="text-muted">Employee File Discovery & Preview System</small>
				</div>
			</div>

			<!-- User Display -->
			<div class="d-flex align-items-center gap-2">
				{#if user.loading}
					<div class="spinner-border spinner-border-sm text-primary" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				{:else if user.authenticated}
					<div class="d-flex align-items-center gap-2">
						<div class="text-end">
							<div class="fw-semibold text-usaf-blue small">{user.email}</div>
							{#if user.isAdmin}
								<div class="badge bg-success text-white small">Admin</div>
							{:else}
								<div class="badge bg-secondary text-white small">User</div>
							{/if}
						</div>
						<div class="bg-usaf-blue text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
							<i class="bi bi-person"></i>
						</div>
					</div>
				{:else}
					<div class="text-muted small">Not authenticated</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Navigation Tabs -->
<div class="bg-white border-bottom">
	<div class="container-fluid">
		<ul class="nav nav-tabs border-0" role="tablist">
			<li class="nav-item" role="presentation">
				<a
					href="/"
					class="nav-link {currentRoute === '/' ? 'active' : ''}"
					role="tab"
				>
					<i class="bi bi-search me-2"></i>
					File Search
				</a>
			</li>
			<li class="nav-item" role="presentation">
				<a
					href="/downloads"
					class="nav-link {currentRoute === '/downloads' ? 'active' : ''}"
					role="tab"
				>
					<i class="bi bi-download me-2"></i>
					Downloads
				</a>
			</li>
		</ul>
	</div>
</div>

<!-- Main Content -->
<main class="bg-light min-vh-100">
	{@render children?.()}
</main>


<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
			'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
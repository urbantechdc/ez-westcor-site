<script>
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import '../app.css';

	// Import Bootstrap CSS
	import '$lib/styles/bootstrap.css';

	// Import custom company styles
	import '$lib/styles/custom.css';

	let { children } = $props();


	onMount(async () => {
		// Template initialization
		console.log('SvelteKit + Cloudflare Workers Template loaded');

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

		// Or import everything (larger bundle):
		// await import('bootstrap');
	});


	// No tabs needed anymore
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
		</div>
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
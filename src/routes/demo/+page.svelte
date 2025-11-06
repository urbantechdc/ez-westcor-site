<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	let message = 'Loading...';
	let inputName = '';
	let responseData: Record<string, unknown> | null = null;
	
	async function fetchHello(name: string = '') {
		try {
			const response = await fetch(`/api/hello${name ? `?name=${encodeURIComponent(name)}` : ''}`);
			const data = await response.json();
			message = data.message;
			responseData = data;
		} catch (error) {
			message = 'Error fetching data';
			console.error(error);
		}
	}
	
	async function sendPost() {
		try {
			const response = await fetch('/api/hello', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: inputName || 'Test message' })
			});
			const data = await response.json();
			responseData = data;
		} catch (error) {
			console.error('Error sending POST:', error);
		}
	}
	
	onMount(() => {
		fetchHello();
	});
</script>

<main>
	<h1>Demo Page</h1>
	<p>This page demonstrates API communication between the frontend and backend.</p>
	
	<section>
		<h2>GET Request Example</h2>
		<p>{message}</p>
		
		<div class="input-group">
			<input
				type="text"
				bind:value={inputName}
				placeholder="Enter your name"
				onkeydown={(e) => e.key === 'Enter' && fetchHello(inputName)}
			/>
			<button onclick={() => fetchHello(inputName)}>
				Fetch Greeting
			</button>
		</div>
	</section>
	
	<section>
		<h2>POST Request Example</h2>
		<button onclick={sendPost}>
			Send POST Request
		</button>
	</section>
	
	{#if responseData}
		<section class="response">
			<h3>API Response:</h3>
			<pre>{JSON.stringify(responseData, null, 2)}</pre>
		</section>
	{/if}
	
	<nav>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<button onclick={() => goto('/')}>← Back to Home</button>
	</nav>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}
	
	h1 {
		color: #ff3e00;
	}
	
	section {
		margin: 2rem 0;
		padding: 1rem;
		background: #f4f4f4;
		border-radius: 8px;
	}
	
	.input-group {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	
	input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}
	
	button {
		background: #ff3e00;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: transform 0.2s;
	}
	
	button:hover {
		transform: scale(1.05);
	}
	
	button:active {
		transform: scale(0.95);
	}
	
	.response {
		background: #2d2d2d;
		color: #f0f0f0;
	}
	
	pre {
		overflow-x: auto;
		padding: 1rem;
		background: #1a1a1a;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
	}
	
	nav {
		margin-top: 2rem;
	}
	
</style>
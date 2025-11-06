<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
	export let disabled = false;
	export let size: 'small' | 'medium' | 'large' = 'medium';
</script>

<button 
	class="btn btn-{variant} btn-{size}" 
	{disabled}
	on:click
>
	<slot />
</button>

<style>
	.btn {
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-small {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}
	
	.btn-medium {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}
	
	.btn-large {
		padding: 0.75rem 1.5rem;
		font-size: 1.125rem;
	}
	
	.btn-primary {
		background: #ff3e00;
		color: white;
	}
	
	.btn-primary:not(:disabled):hover {
		background: #e03500;
		transform: translateY(-1px);
	}
	
	.btn-secondary {
		background: #f0f0f0;
		color: #333;
	}
	
	.btn-secondary:not(:disabled):hover {
		background: #e0e0e0;
		transform: translateY(-1px);
	}
	
	.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	.btn-danger:not(:disabled):hover {
		background: #c82333;
		transform: translateY(-1px);
	}
	
	.btn:not(:disabled):active {
		transform: translateY(0);
	}
</style>
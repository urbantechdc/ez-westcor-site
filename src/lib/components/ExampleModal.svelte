<script>
  export let modalId = 'exampleModal';
  export let title = 'Modal Title';
  export let show = false;

  function closeModal() {
    show = false;
  }

  function handleModalClick(e) {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }
</script>

{#if show}
<!-- Svelte Modal -->
<div class="modal d-block" tabindex="-1" aria-labelledby="{modalId}Label" aria-hidden="false" role="dialog" onclick={handleModalClick} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="{modalId}Label">{title}</h5>
        <button type="button" class="btn-close" aria-label="Close" onclick={closeModal}></button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={closeModal}>Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
<div class="modal-backdrop show"></div>
{/if}
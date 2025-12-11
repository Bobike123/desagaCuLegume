<script lang="ts">
  export let id = "modal";
  export let title = "";
  export let onConfirm = () => {};
  export let confirmText = "Confirm";
  export let cancelText = "Cancel";
  export let isDestructive = false;

  let modal: any;

  function show() {
    const modalElement = document.getElementById("modal");
    if (modalElement && (window as any).bootstrap) {
      modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  function hide() {
    if (modal) modal.hide();
  }

  export { show, hide };
</script>

<div
  class="modal fade"
  bind:this={modal}
  tabindex="-1"
  aria-labelledby="{id}Label"
  aria-hidden="true"
>
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h1 class="modal-title fs-5" id="{id}Label">{title}</h1>
        <button
          type="button"
          class="btn-close btn-close-white"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div class="modal-body"><slot /></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
          >{cancelText}</button
        >
        <button
          type="button"
          class={`btn ${isDestructive ? "btn-danger" : "btn-primary"}`}
          on:click={() => {
            onConfirm();
            hide();
          }}>{confirmText}</button
        >
      </div>
    </div>
  </div>
</div>

<style>
  .bg-primary {
    background-color: #066423 !important;
  }
</style>

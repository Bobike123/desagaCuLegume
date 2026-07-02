<script lang="ts">
  import { formatDate, statusLabel } from '$lib/format';

  export let orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
  }> = [];
  export let loading = false;
</script>

{#if loading}
  <div class="muted">Se încarcă comenzile…</div>
{:else if orders.length === 0}
  <div class="muted">Nu ai comenzi încă.</div>
{:else}
  <div class="orderList">
    {#each orders as order (order.id)}
      <div class="orderCard">
        <div class="orderTop">
          <div class="fw-bold">{order.orderNumber}</div>
          <span>{statusLabel(order.status)}</span>
        </div>
        <div class="small muted">{formatDate(order.createdAt)}</div>
        <div class="mt-2">Total: {order.total.toFixed(2)} {order.currency}</div>
        <div class="small mt-1 muted">
          Plată: {statusLabel(order.paymentStatus)} · Livrare: {statusLabel(order.fulfillmentStatus)}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .muted {
    color: rgba(0, 0, 0, 0.65);
  }

  .orderList {
    display: grid;
    gap: 10px;
  }

  .orderCard {
    padding: 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .orderTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .orderTop span {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(36, 146, 204, 0.1);
    color: var(--desaga-blue);
    font-size: 0.75rem;
    font-weight: 900;
    white-space: nowrap;
  }
</style>

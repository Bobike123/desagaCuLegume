<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  const orderStatuses = ['PENDING', 'PLACED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
  const paymentStatuses = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'];
  const fulfillmentStatuses = ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED'];

  type OrderItem = {
    id: string;
    orderNumber: string;
    customerFullName: string;
    customerEmail: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
  };

  let items: OrderItem[] = [];
  let loading = true;
  let error = '';

  async function loadOrders() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/orders');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
      items = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca comenzile.';
    } finally {
      loading = false;
    }
  }

  async function saveOrder(item: OrderItem) {
    const res = await fetch(`/api/orders/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: item.status,
        paymentStatus: item.paymentStatus,
        fulfillmentStatus: item.fulfillmentStatus,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error = data?.error ?? 'Nu am putut salva comanda.';
      return;
    }
    items = items.map((row) => (row.id === item.id ? data.item : row));
  }

  onMount(loadOrders);
</script>

<svelte:head>
  <title>Comenzi - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="page">
  <div class="page__head">
    <div>
      <h1>Comenzi</h1>
      <p>Status, plată și fulfillment.</p>
    </div>
    <button class="btn btn-outline-secondary" on:click={loadOrders} disabled={loading}>Reîncarcă</button>
  </div>

  {#if error}<div class="alert alert-danger">{error}</div>{/if}

  {#if loading}
    <div class="panel">Se încarcă comenzile…</div>
  {:else}
    <div class="panel table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Comandă</th>
            <th>Client</th>
            <th>Total</th>
            <th>Status comandă</th>
            <th>Status plată</th>
            <th>Fulfillment</th>
            <th class="text-end">Salvează</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item (item.id)}
            <tr>
              <td>
                <div><strong>{item.orderNumber}</strong></div>
                <div class="muted">{new Date(item.createdAt).toLocaleString('ro-RO')}</div>
              </td>
              <td>
                <div>{item.customerFullName}</div>
                <div class="muted">{item.customerEmail}</div>
              </td>
              <td>{item.total.toFixed(2)} {item.currency}</td>
              <td>
                <select class="form-select" bind:value={item.status}>
                  {#each orderStatuses as status}
                    <option value={status}>{status}</option>
                  {/each}
                </select>
              </td>
              <td>
                <select class="form-select" bind:value={item.paymentStatus}>
                  {#each paymentStatuses as status}
                    <option value={status}>{status}</option>
                  {/each}
                </select>
              </td>
              <td>
                <select class="form-select" bind:value={item.fulfillmentStatus}>
                  {#each fulfillmentStatuses as status}
                    <option value={status}>{status}</option>
                  {/each}
                </select>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-primary" on:click={() => saveOrder(item)}>Salvează</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
  }

  .page__head h1 { margin: 0; font-weight: 900; }
  .page__head p { margin: 6px 0 0; color: rgba(0, 0, 0, 0.65); }

  .panel {
    background: white;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .muted { color: rgba(0, 0, 0, 0.65); }
</style>
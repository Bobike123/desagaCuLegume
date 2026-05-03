<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  const orderStatuses = [
    { value: 'PENDING', label: 'În așteptare' },
    { value: 'PLACED', label: 'Plasată' },
    { value: 'PAID', label: 'Plătită' },
    { value: 'PROCESSING', label: 'În procesare' },
    { value: 'SHIPPED', label: 'Expediată' },
    { value: 'DELIVERED', label: 'Livrată' },
    { value: 'COMPLETED', label: 'Finalizată' },
    { value: 'CANCELLED', label: 'Anulată' },
    { value: 'REFUNDED', label: 'Rambursată' }
  ];

  const paymentStatuses = [
    { value: 'PENDING', label: 'În așteptare' },
    { value: 'AUTHORIZED', label: 'Autorizată' },
    { value: 'PAID', label: 'Plătită' },
    { value: 'FAILED', label: 'Eșec' },
    { value: 'REFUNDED', label: 'Rambursată' },
    { value: 'PARTIALLY_REFUNDED', label: 'Parțial rambursată' },
    { value: 'CANCELLED', label: 'Anulată' }
  ];

  const fulfillmentStatuses = [
    { value: 'UNFULFILLED', label: 'Neîndeplinită' },
    { value: 'PARTIALLY_FULFILLED', label: 'Parțial îndeplinită' },
    { value: 'FULFILLED', label: 'Îndeplinită' },
    { value: 'RETURNED', label: 'Returnată' }
  ];

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
  let successMessage = '';

  function getStatusLabel(value: string, statuses: { value: string; label: string }[]): string {
    return statuses.find((s) => s.value === value)?.label || value;
  }

  function getStatusBadgeClass(value: string, type: 'order' | 'payment' | 'fulfillment'): string {
    const successStates = ['PAID', 'COMPLETED', 'DELIVERED', 'FULFILLED', 'AUTHORIZED'];
    const pendingStates = ['PENDING', 'PROCESSING', 'PARTIALLY_FULFILLED'];
    const errorStates = ['CANCELLED', 'FAILED', 'REFUNDED', 'RETURNED'];

    if (successStates.includes(value)) return 'badge-success';
    if (pendingStates.includes(value)) return 'badge-warning';
    if (errorStates.includes(value)) return 'badge-danger';
    return 'badge-secondary';
  }

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
    successMessage = '';
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
    successMessage = 'Comanda a fost salvată cu succes!';
    setTimeout(() => {
      successMessage = '';
    }, 3000);
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
      <p>Gestionează statusul, plăți și livrări.</p>
    </div>
    <button class="btn btn-outline-secondary" on:click={loadOrders} disabled={loading}>
      ⟳ Reîncarcă
    </button>
  </div>

  {#if error}
    <div class="alert alert-danger">
      <strong>❌ Eroare:</strong> {error}
    </div>
  {/if}

  {#if successMessage}
    <div class="alert alert-success">
      <strong>✓ Succes:</strong> {successMessage}
    </div>
  {/if}

  {#if loading}
    <div class="panel text-center">
      <div class="spinner mb-3">⟳</div>
      <p>Se încarcă comenzile…</p>
    </div>
  {:else if items.length === 0}
    <div class="panel text-center empty-state">
      <p>Nu sunt comenzi disponibile.</p>
    </div>
  {:else}
    <div class="panel table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr class="table-header">
            <th>Comandă</th>
            <th>Client</th>
            <th>Total</th>
            <th>Status comandă</th>
            <th>Plată</th>
            <th>Livrare</th>
            <th class="text-end">Acțiune</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item (item.id)}
            <tr class="table-row">
              <td>
                <div><strong>#{item.orderNumber}</strong></div>
                <div class="muted text-sm">{new Date(item.createdAt).toLocaleString('ro-RO')}</div>
              </td>
              <td>
                <div><strong>{item.customerFullName}</strong></div>
                <div class="muted text-sm">{item.customerEmail}</div>
              </td>
              <td>
                <strong>{item.total.toFixed(2)} {item.currency}</strong>
              </td>
              <td>
                <div class="status-control">
                  <select class="form-select form-select-sm" bind:value={item.status}>
                    {#each orderStatuses as status}
                      <option value={status.value}>{status.label}</option>
                    {/each}
                  </select>
                  <span class="badge {getStatusBadgeClass(item.status, 'order')} ms-2">
                    {getStatusLabel(item.status, orderStatuses)}
                  </span>
                </div>
              </td>
              <td>
                <div class="status-control">
                  <select class="form-select form-select-sm" bind:value={item.paymentStatus}>
                    {#each paymentStatuses as status}
                      <option value={status.value}>{status.label}</option>
                    {/each}
                  </select>
                  <span class="badge {getStatusBadgeClass(item.paymentStatus, 'payment')} ms-2">
                    {getStatusLabel(item.paymentStatus, paymentStatuses)}
                  </span>
                </div>
              </td>
              <td>
                <div class="status-control">
                  <select class="form-select form-select-sm" bind:value={item.fulfillmentStatus}>
                    {#each fulfillmentStatuses as status}
                      <option value={status.value}>{status.label}</option>
                    {/each}
                  </select>
                  <span class="badge {getStatusBadgeClass(item.fulfillmentStatus, 'fulfillment')} ms-2">
                    {getStatusLabel(item.fulfillmentStatus, fulfillmentStatuses)}
                  </span>
                </div>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-primary" on:click={() => saveOrder(item)}>
                  💾 Salvează
                </button>
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
    margin-bottom: 24px;
  }

  .page__head h1 {
    margin: 0;
    font-weight: 900;
    font-size: 28px;
    color: #0f172a;
  }

  .page__head p {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
  }

  .panel {
    background: white;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .panel.empty-state {
    text-align: center;
    padding: 48px 24px;
    color: rgba(0, 0, 0, 0.5);
  }

  .alert {
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .alert-danger {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #7f1d1d;
  }

  .alert-success {
    background: #dcfce7;
    border: 1px solid #86efac;
    color: #166534;
  }

  .spinner {
    display: inline-block;
    font-size: 24px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .muted {
    color: rgba(0, 0, 0, 0.6);
  }

  .text-sm {
    font-size: 12px;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .table {
    margin-bottom: 0;
  }

  .table-header {
    background: #f1f5f9;
    border-bottom: 2px solid #e2e8f0;
  }

  .table-header th {
    font-weight: 600;
    color: #475569;
    font-size: 13px;
    padding: 12px 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-row {
    border-bottom: 1px solid #e2e8f0;
    transition: background-color 0.2s ease;
  }

  .table-row:hover {
    background-color: #f8fafc;
  }

  .table-row td {
    padding: 14px 8px;
    vertical-align: middle;
  }

  .status-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-select-sm {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    flex: 1;
    max-width: 150px;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .badge-success {
    background: #dcfce7;
    color: #166534;
  }

  .badge-warning {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-danger {
    background: #fee2e2;
    color: #7f1d1d;
  }

  .badge-secondary {
    background: #e2e8f0;
    color: #334155;
  }

  .btn {
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .btn-outline-secondary {
    border: 1px solid #cbd5e1;
    color: #475569;
    background: white;
  }

  .btn-outline-secondary:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .btn-outline-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    border: 1px solid #3b82f6;
  }

  .btn-primary:hover {
    background: #2563eb;
    border-color: #2563eb;
  }

  .text-end {
    text-align: right;
  }

  .ms-2 {
    margin-left: 8px;
  }

  .mb-0 {
    margin-bottom: 0;
  }

  .mb-3 {
    margin-bottom: 16px;
  }
</style>
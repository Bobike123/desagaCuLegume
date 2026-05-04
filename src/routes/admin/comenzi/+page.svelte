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
  <header class="topbar">
    <div>
      <p class="eyebrow">Operațiuni</p>
      <h1>Comenzi</h1>
      <p>Actualizează statusul comenzilor, plăților și livrărilor fără să pierzi contextul clientului.</p>
    </div>
    <button class="action" on:click={loadOrders} disabled={loading}>
      <i class="bi bi-arrow-clockwise"></i>
      <span>{loading ? 'Se încarcă…' : 'Reîncarcă'}</span>
    </button>
  </header>

  {#if error}
    <div class="notice danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <span>{error}</span>
    </div>
  {/if}

  {#if successMessage}
    <div class="notice success" role="status">
      <i class="bi bi-check-circle"></i>
      <span>{successMessage}</span>
    </div>
  {/if}

  {#if loading}
    <section class="stateCard">
      <span class="spinner" aria-hidden="true"></span>
      <strong>Se încarcă comenzile…</strong>
    </section>
  {:else if items.length === 0}
    <section class="emptyCard">
      <i class="bi bi-receipt"></i>
      <h2>Nu sunt comenzi disponibile</h2>
      <p>Comenzile noi vor apărea aici după plasare.</p>
    </section>
  {:else}
    <section class="ordersGrid" aria-label="Lista comenzilor">
      {#each items as item (item.id)}
        <article class="orderCard">
          <header class="orderHead">
            <div>
              <span class="orderNumber">#{item.orderNumber}</span>
              <time>{new Date(item.createdAt).toLocaleString('ro-RO')}</time>
            </div>
            <strong class="total">{item.total.toFixed(2)} {item.currency}</strong>
          </header>

          <div class="customerBlock">
            <span>Client</span>
            <strong>{item.customerFullName}</strong>
            <small>{item.customerEmail}</small>
          </div>

          <div class="statusGrid">
            <label>
              <span>Status comandă</span>
              <select bind:value={item.status}>
                {#each orderStatuses as status}
                  <option value={status.value}>{status.label}</option>
                {/each}
              </select>
              <em class={`badge ${getStatusBadgeClass(item.status, 'order')}`}>{getStatusLabel(item.status, orderStatuses)}</em>
            </label>

            <label>
              <span>Plată</span>
              <select bind:value={item.paymentStatus}>
                {#each paymentStatuses as status}
                  <option value={status.value}>{status.label}</option>
                {/each}
              </select>
              <em class={`badge ${getStatusBadgeClass(item.paymentStatus, 'payment')}`}>{getStatusLabel(item.paymentStatus, paymentStatuses)}</em>
            </label>

            <label>
              <span>Livrare</span>
              <select bind:value={item.fulfillmentStatus}>
                {#each fulfillmentStatuses as status}
                  <option value={status.value}>{status.label}</option>
                {/each}
              </select>
              <em class={`badge ${getStatusBadgeClass(item.fulfillmentStatus, 'fulfillment')}`}>{getStatusLabel(item.fulfillmentStatus, fulfillmentStatuses)}</em>
            </label>
          </div>

          <button class="saveBtn" on:click={() => saveOrder(item)}>
            <i class="bi bi-save"></i>
            Salvează modificările
          </button>
        </article>
      {/each}
    </section>
  {/if}
</div>

<style>
  .page {
    --bg: #f6f1e7;
    --surface: #fffdf7;
    --ink: #1d241b;
    --muted: #6b7165;
    --line: rgba(31, 42, 28, 0.12);
    --accent: #274f2a;
    --green: #8bd450;
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(18px, 3vw, 34px);
    background: radial-gradient(900px 420px at 8% -5%, rgba(139, 212, 80, 0.2), transparent 60%), var(--bg);
    color: var(--ink);
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 20px;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0 0 6px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.13em;
    font-size: 0.75rem;
    font-weight: 950;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 7vw, 4.6rem);
    line-height: 0.94;
    letter-spacing: -0.07em;
    font-weight: 950;
  }

  .topbar p:not(.eyebrow) {
    max-width: 700px;
    margin: 12px 0 0;
    color: var(--muted);
  }

  .action,
  .saveBtn {
    min-height: 46px;
    border: 0;
    border-radius: 999px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 950;
    cursor: pointer;
  }

  .action {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.08);
  }

  .action:disabled {
    opacity: 0.6;
  }

  .notice {
    margin-bottom: 14px;
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    gap: 10px;
    align-items: center;
    font-weight: 850;
  }

  .notice.danger {
    background: #fff1f1;
    border: 1px solid #facaca;
    color: #842029;
  }

  .notice.success {
    background: #ecf8df;
    border: 1px solid #b9e58d;
    color: #285b20;
  }

  .ordersGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 390px), 1fr));
    gap: 14px;
  }

  .orderCard,
  .stateCard,
  .emptyCard {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.9);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
  }

  .orderCard {
    padding: 18px;
    display: grid;
    gap: 16px;
  }

  .orderHead {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
  }

  .orderNumber {
    display: block;
    font-size: 1.15rem;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  time,
  .customerBlock span,
  .customerBlock small,
  label span {
    color: var(--muted);
  }

  time,
  .customerBlock small {
    display: block;
    margin-top: 4px;
  }

  .total {
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(139, 212, 80, 0.2);
    color: var(--accent);
    white-space: nowrap;
  }

  .customerBlock {
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 14px;
    background: rgba(255, 255, 255, 0.5);
  }

  .customerBlock strong {
    display: block;
    margin-top: 4px;
    overflow-wrap: anywhere;
  }

  .statusGrid {
    display: grid;
    gap: 12px;
  }

  label {
    display: grid;
    gap: 7px;
  }

  label span {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 950;
  }

  select {
    min-height: 46px;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 0 12px;
    background: #fff;
    color: var(--ink);
    font-weight: 800;
  }

  .badge {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    border-radius: 999px;
    padding: 0 10px;
    font-style: normal;
    font-size: 0.78rem;
    font-weight: 950;
  }

  .badge-success { background: #e7f7dd; color: #25631c; }
  .badge-warning { background: #fff1c2; color: #7a5200; }
  .badge-danger { background: #ffe2e2; color: #842029; }
  .badge-secondary { background: #ece8dd; color: #5b5f52; }

  .saveBtn {
    background: var(--accent);
    color: #fffdf7;
  }

  .stateCard,
  .emptyCard {
    padding: 36px 20px;
    display: grid;
    place-items: center;
    text-align: center;
    gap: 12px;
    color: var(--muted);
  }

  .emptyCard i {
    font-size: 2rem;
    color: var(--accent);
  }

  .emptyCard h2 {
    margin: 0;
    color: var(--ink);
    font-weight: 950;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 3px solid rgba(39, 79, 42, 0.18);
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding: 88px 16px 24px;
    }
  }

  @media (max-width: 640px) {
    .topbar,
    .orderHead {
      align-items: stretch;
      flex-direction: column;
    }

    .action,
    .saveBtn {
      width: 100%;
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

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
    customerEmail: string | null;
    customerPhone: string | null;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
  };

  let items: OrderItem[] = [];
  let loading = true;
  let loadingMore = false;
  let error = '';
  let successMessage = '';
  let searchQuery = '';
  let statusFilter = '';
  let sortMode = 'newest';
  let page = 1;
  let hasMore = false;
  const pageLimit = 50;

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

  async function loadOrders(reset = true) {
    if (reset) {
      page = 1;
      loading = true;
    } else {
      loadingMore = true;
    }
    error = '';
    try {
      const params = new URLSearchParams({ limit: String(pageLimit), page: String(page) });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      items = reset ? nextItems : [...items, ...nextItems];
      hasMore = Boolean(data?.page?.hasMore);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca comenzile.';
    } finally {
      loading = false;
      loadingMore = false;
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    page += 1;
    await loadOrders(false);
  }

  function orderMatches(item: OrderItem) {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${item.orderNumber} ${item.customerFullName ?? ''} ${item.customerEmail ?? ''} ${item.customerPhone ?? ''} ${item.status} ${item.paymentStatus} ${item.fulfillmentStatus}`
      .toLowerCase()
      .includes(q);
  }

  $: filteredItems = items
    .filter((item) => (!statusFilter || item.status === statusFilter) && orderMatches(item))
    .slice()
    .sort((a, b) => {
      if (sortMode === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortMode === 'total-desc') return b.total - a.total;
      if (sortMode === 'total-asc') return a.total - b.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  onMount(() => loadOrders());
</script>

<svelte:head>
  <title>Comenzi - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Operațiuni</p>
      <h1>Comenzi</h1>
      <p>Actualizează statusul comenzilor, plăților și livrărilor fără să pierzi contextul clientului.</p>
    </div>
    <button class="action" on:click={() => loadOrders()} disabled={loading}>
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

  <section class="toolbar">
    <label class="searchBox" aria-label="Caută comenzi">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input
        type="search"
        placeholder="Caută #comandă, client, email, telefon sau status"
        bind:value={searchQuery}
        on:keydown={(event) => {
          if (event.key === 'Enter') void loadOrders();
        }}
      />
    </label>
    <select bind:value={statusFilter} aria-label="Filtrează status comandă" on:change={() => loadOrders()}>
      <option value="">Toate statusurile</option>
      {#each orderStatuses as status}
        <option value={status.value}>{status.label}</option>
      {/each}
    </select>
    <select bind:value={sortMode} aria-label="Sortează comenzi">
      <option value="newest">Cele mai noi</option>
      <option value="oldest">Cele mai vechi</option>
      <option value="total-desc">Total descrescător</option>
      <option value="total-asc">Total crescător</option>
    </select>
    <span class="count">{loading ? '…' : filteredItems.length} comenzi</span>
  </section>

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
  {:else if filteredItems.length === 0}
    <section class="emptyCard">
      <i class="bi bi-search"></i>
      <h2>Nu am găsit comenzi</h2>
      <p>Schimbă termenul de căutare sau filtrul de status.</p>
    </section>
  {:else}
    <section class="ordersGrid" aria-label="Lista comenzilor">
      {#each filteredItems as item (item.id)}
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
            <small>{item.customerEmail ?? 'Fără email'}</small>
            {#if item.customerPhone}
              <small>{item.customerPhone}</small>
            {/if}
          </div>

          <div class="statusGrid">
            <label>
              <span>Stare comandă</span>
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
    {#if hasMore}
      <div class="loadMore">
        <button class="action muted" type="button" on:click={loadMore} disabled={loadingMore}>
          <i class={`bi ${loadingMore ? 'bi-arrow-repeat' : 'bi-plus-circle'}`}></i>
          <span>{loadingMore ? 'Se încarcă…' : 'Încarcă mai multe'}</span>
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .action {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 950;
    cursor: pointer;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.08);
  }

  .action:disabled {
    opacity: 0.6;
  }

  .action.muted {
    background: #fff;
  }

  .toolbar {
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: minmax(240px, 1fr) minmax(160px, 220px) minmax(160px, 220px) auto;
    gap: 10px;
    align-items: center;
  }

  .searchBox {
    position: relative;
  }

  .searchBox i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
  }

  .searchBox input,
  .toolbar select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 850;
  }

  .searchBox input {
    padding: 0 14px 0 38px;
  }

  .toolbar select {
    padding: 0 14px;
  }

  .count {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    background: rgba(255, 253, 247, 0.9);
    color: var(--muted);
    font-weight: 950;
    white-space: nowrap;
  }

  .ordersGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 390px), 1fr));
    gap: 14px;
  }

  .loadMore {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .orderCard {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.9);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
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
  .badge-danger  { background: #ffe2e2; color: #842029; }
  .badge-secondary { background: #ece8dd; color: #5b5f52; }

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
    background: var(--accent);
    color: #fffdf7;
  }

  @media (max-width: 640px) {
    .topbar,
    .orderHead,
    .toolbar {
      align-items: stretch;
      grid-template-columns: 1fr;
    }

    .topbar,
    .orderHead {
      flex-direction: column;
    }

    .action,
    .saveBtn {
      width: 100%;
    }
  }
</style>

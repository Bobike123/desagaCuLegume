<script lang="ts">
  import { onMount } from 'svelte';

  type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'DRAFT';

  type ProductItem = {
    id: string;
    sku?: string;
    name: string;
    category: string;
    price: number;
    stock_quantity: number;
    status?: ProductStatus | string;
    in_stock: boolean;
  };

  const STATUS_LABELS: Record<ProductStatus, string> = {
    ACTIVE: 'În stoc',
    OUT_OF_STOCK: 'Stoc epuizat',
    DISCONTINUED: 'Retras',
    DRAFT: 'Draft',
  };

  let items: ProductItem[] = [];
  let loading = true;
  let error = '';
  let notice = '';
  let noticeType: 'success' | 'danger' | 'info' = 'info';
  let searchQuery = '';
  let selectedProductIds = new Set<string>();
  let bulkStatus: ProductStatus = 'ACTIVE';
  let bulkWorking = false;

  function productStatusLabel(status: string | undefined, inStock: boolean) {
    const key = String(status ?? '').toUpperCase() as ProductStatus;
    return STATUS_LABELS[key] ?? (inStock ? 'În stoc' : 'Stoc epuizat');
  }

  function isPositiveProductStatus(item: ProductItem) {
    const key = String(item.status ?? '').toUpperCase();
    return key ? key === 'ACTIVE' : item.in_stock;
  }

  function showNotice(message: string, type: typeof noticeType = 'info') {
    notice = message;
    noticeType = type;
    setTimeout(() => {
      if (notice === message) notice = '';
    }, 2800);
  }

  function setSelection(id: string, checked: boolean) {
    const next = new Set(selectedProductIds);
    if (checked) next.add(id);
    else next.delete(id);
    selectedProductIds = next;
  }

  function selectVisibleProducts() {
    selectedProductIds = new Set([...selectedProductIds, ...filtered.map((item) => item.id)]);
  }

  function clearSelection() {
    selectedProductIds = new Set();
  }

  async function loadItems() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/products?limit=100');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Eroare la încărcarea produselor');
items = Array.isArray(data?.items) ? (data.items as ProductItem[]) : [];      selectedProductIds = new Set([...selectedProductIds].filter((id) => items.some((item) => item.id === id)));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Eroare la încărcare';
    } finally {
      loading = false;
    }
  }

  async function applyBulkStatus() {
    if (selectedIds.length === 0) {
      showNotice('Selectează cel puțin un produs.', 'danger');
      return;
    }

    const label = STATUS_LABELS[bulkStatus] ?? bulkStatus;
    if (!confirm(`Schimbi ${selectedIds.length} produse în statusul „${label}”?`)) return;

    bulkWorking = true;
    error = '';

    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showNotice(data?.error ?? 'Nu s-au putut actualiza produsele.', 'danger');
        return;
      }

      const updatedCount = Number(data?.count ?? selectedIds.length);

      clearSelection();
      await loadItems();

      showNotice(`${updatedCount} produse actualizate.`, 'success');
    } catch (err) {
      console.error(err);
      showNotice('Nu s-au putut actualiza produsele.', 'danger');
    } finally {
      bulkWorking = false;
    }
  }

  async function remove(id: string) {
    if (!confirm('Ștergi produsul?')) return;

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error = data?.error ?? 'Nu s-a putut șterge produsul.';
      return;
    }

    items = items.filter((item) => item.id !== id);
    setSelection(id, false);
  }

  onMount(loadItems);

  $: filtered = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${item.name} ${item.sku ?? ''} ${item.category}`.toLowerCase().includes(q);
  });

  $: selectedIds = [...selectedProductIds];
  $: selectedCount = selectedIds.length;
  $: allVisibleSelected = filtered.length > 0 && filtered.every((item) => selectedProductIds.has(item.id));
</script>

<svelte:head>
  <title>Produse - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Catalog</p>
      <h1>Produse</h1>
      <p>Gestionează produsele, prețurile, categoriile, stocurile și vizibilitatea publică.</p>
    </div>
    <div class="actions">
      <button class="pill" on:click={loadItems} disabled={loading}><i class="bi bi-arrow-clockwise"></i> Reîncarcă</button>
      <a href="/admin/produse/new" class="pill primary"><i class="bi bi-plus-circle"></i> Produs nou</a>
    </div>
  </header>

  <section class="toolbar">
    <label class="searchBox" aria-label="Caută produse">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input type="search" placeholder="Caută după nume, SKU sau categorie..." bind:value={searchQuery} />
    </label>
    <span class="count">{loading ? '…' : filtered.length} produse</span>
  </section>

  <section class="bulkBar" aria-label="Acțiuni produse selectate">
    <div class="bulkSummary">
      <strong>{selectedCount}</strong>
      <span>{selectedCount === 1 ? 'produs selectat' : 'produse selectate'}</span>
    </div>
    <div class="bulkActions">
      <button class="pill" type="button" on:click={selectVisibleProducts} disabled={loading || filtered.length === 0 || allVisibleSelected}>
        Selectează toate
      </button>
      <button class="pill" type="button" on:click={clearSelection} disabled={selectedCount === 0 || bulkWorking}>
        Curăță selecția
      </button>
      <select bind:value={bulkStatus} aria-label="Status nou pentru produsele selectate" disabled={bulkWorking}>
        <option value="ACTIVE">În stoc</option>
        <option value="OUT_OF_STOCK">Stoc epuizat</option>
        <option value="DRAFT">Draft</option>
        <option value="DISCONTINUED">Retras</option>
      </select>
      <button class="pill primary" type="button" on:click={applyBulkStatus} disabled={selectedCount === 0 || bulkWorking}>
        {bulkWorking ? 'Se aplică…' : 'Aplică în masă'}
      </button>
    </div>
  </section>

  {#if notice}
    <div class={`notice ${noticeType}`} role="status"><i class="bi bi-info-circle"></i>{notice}</div>
  {/if}

  {#if error}
    <div class="notice danger" role="alert"><i class="bi bi-exclamation-triangle"></i>{error}</div>
  {/if}

  {#if loading}
    <section class="stateCard"><span class="spinner" aria-hidden="true"></span><strong>Se încarcă produsele…</strong></section>
  {:else if filtered.length === 0}
    <section class="emptyCard">
      <i class="bi bi-box-seam"></i>
      <h2>Nu există produse pentru filtrul curent</h2>
      <p>Schimbă căutarea sau adaugă un produs nou.</p>
    </section>
  {:else}
    <section class="productGrid" aria-label="Lista produselor">
      {#each filtered as item (item.id)}
        <article class:selected={selectedProductIds.has(item.id)} class="productCard">
          <label class="selectControl cardSelect">
            <input
              type="checkbox"
              checked={selectedProductIds.has(item.id)}
              on:change={(event) => setSelection(item.id, event.currentTarget.checked)}
            />
            <span>Selectează produsul</span>
          </label>

          <header>
            <div>
              <h2>{item.name}</h2>
              <p>{item.sku ?? 'Fără SKU'}</p>
            </div>
            <span class:mutedBadge={!isPositiveProductStatus(item)} class="stockBadge">{productStatusLabel(item.status, item.in_stock)}</span>
          </header>

          <div class="metaGrid">
            <div><span>Categorie</span><strong>{item.category}</strong></div>
            <div><span>Preț</span><strong>{item.price.toFixed(2)} RON</strong></div>
            <div><span>Stoc</span><strong>{item.stock_quantity}</strong></div>
          </div>

          <footer>
            <a class="cardBtn" href={`/admin/produse/${item.id}`}>Editează</a>
            <button class="cardBtn danger" on:click={() => remove(item.id)}>Șterge</button>
          </footer>
        </article>
      {/each}
    </section>
  {/if}
</div>

<style>
  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .pill,
  .cardBtn {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--surface);
    color: var(--ink);
    text-decoration: none;
    font-weight: 950;
    cursor: pointer;
  }

  .pill.primary {
    background: var(--accent);
    color: #fffdf7;
    border-color: transparent;
  }

  .pill:disabled,
  .cardBtn:disabled,
  .bulkActions select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .toolbar {
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .count {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 12px 16px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--muted);
    font-weight: 950;
    white-space: nowrap;
  }

  .bulkBar {
    margin: 0 0 16px;
    border: 1px solid var(--line);
    border-radius: 24px;
    padding: 12px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 16px 40px rgba(35, 51, 30, 0.06);
  }

  .bulkSummary {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 10px 14px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    background: rgba(255, 255, 255, 0.54);
    white-space: nowrap;
  }

  .bulkSummary strong {
    font-size: 1.2rem;
    font-weight: 950;
  }

  .bulkSummary span {
    color: var(--muted);
    font-weight: 900;
  }

  .bulkActions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .bulkActions select {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 14px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--ink);
    font-weight: 850;
  }

  .productGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
    gap: 14px;
  }

  .productCard {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
    display: grid;
    gap: 18px;
  }

  .productCard.selected {
    border-color: rgba(139, 212, 80, 0.9);
    box-shadow: 0 20px 58px rgba(93, 151, 48, 0.16);
  }

  .selectControl {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--muted);
    font-weight: 950;
    cursor: pointer;
    user-select: none;
  }

  .selectControl input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }

  .cardSelect {
    width: fit-content;
  }

  .productCard header,
  .productCard footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  .productCard h2 {
    margin: 0;
    font-size: 1.18rem;
    font-weight: 950;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }

  .productCard p {
    margin: 4px 0 0;
    color: var(--muted);
  }

  .stockBadge {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 7px 10px;
    background: rgba(139, 212, 80, 0.22);
    color: var(--accent);
    font-size: 0.72rem;
    font-weight: 950;
  }

  .stockBadge.mutedBadge {
    background: #eee9dd;
    color: #65685d;
  }

  .metaGrid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .metaGrid div {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.48);
  }

  .metaGrid span {
    display: block;
    color: var(--muted);
    font-size: 0.76rem;
    font-weight: 900;
  }

  .metaGrid strong {
    display: block;
    margin-top: 4px;
    overflow-wrap: anywhere;
  }

  .cardBtn {
    width: 100%;
  }

  .cardBtn.danger {
    color: #842029;
    background: #fff4f4;
    border-color: #facaca;
  }

  @media (max-width: 900px) {
    .bulkBar {
      grid-template-columns: 1fr;
    }

    .bulkActions {
      justify-content: stretch;
    }

    .bulkActions .pill,
    .bulkActions select {
      flex: 1 1 180px;
    }
  }

  @media (max-width: 720px) {
    .toolbar {
      grid-template-columns: 1fr;
    }

    .productCard header,
    .productCard footer {
      grid-template-columns: 1fr;
      display: grid;
      align-items: stretch;
    }

    .actions,
    .pill {
      width: 100%;
    }

    .metaGrid {
      grid-template-columns: 1fr;
    }
  }
</style>
<script lang="ts">
  import { onMount } from 'svelte';

  type ProductItem = {
    id: string;
    sku?: string;
    name: string;
    category: string;
    price: number;
    stock_quantity: number;
    status?: string;
    in_stock: boolean;
  };

  let items: ProductItem[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';

  async function loadItems() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/products?limit=100');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Eroare la încărcarea produselor');
      items = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Eroare la încărcare';
    } finally {
      loading = false;
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
  }

  onMount(loadItems);

  $: filtered = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${item.name} ${item.sku ?? ''} ${item.category}`.toLowerCase().includes(q);
  });
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
        <article class="productCard">
          <header>
            <div>
              <h2>{item.name}</h2>
              <p>{item.sku ?? 'Fără SKU'}</p>
            </div>
            <span class:mutedBadge={!item.in_stock} class="stockBadge">{item.status ?? (item.in_stock ? 'ACTIVE' : 'OUT_OF_STOCK')}</span>
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

  .pill:disabled {
    opacity: 0.6;
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

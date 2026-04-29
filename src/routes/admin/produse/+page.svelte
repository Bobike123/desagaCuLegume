<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

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
      const res = await fetch('/api/products');
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

<AdminNav />

<div class="page">
  <div class="page__head">
    <div>
      <h1>Produse</h1>
      <p>Catalogul conectat la tabelele products și product_categories.</p>
    </div>
    <div class="actions">
      <button class="btn btn-outline-secondary" on:click={loadItems} disabled={loading}>Reîncarcă</button>
      <a href="/admin/produse/new" class="btn btn-primary">Produs nou</a>
    </div>
  </div>

  <div class="toolbar">
    <input class="form-control" type="search" placeholder="Caută produse..." bind:value={searchQuery} />
  </div>

  {#if error}
    <div class="alert alert-danger">{error}</div>
  {/if}

  {#if loading}
    <div class="panel">Se încarcă produsele…</div>
  {:else}
    <div class="panel table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Nume</th>
            <th>SKU</th>
            <th>Categorie</th>
            <th>Preț</th>
            <th>Stoc</th>
            <th>Status</th>
            <th class="text-end">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as item (item.id)}
            <tr>
              <td>{item.name}</td>
              <td>{item.sku ?? '—'}</td>
              <td>{item.category}</td>
              <td>{item.price.toFixed(2)} RON</td>
              <td>{item.stock_quantity}</td>
              <td>{item.status ?? (item.in_stock ? 'ACTIVE' : 'OUT_OF_STOCK')}</td>
              <td class="text-end">
                <div class="rowActions">
                  <a class="btn btn-sm btn-outline-secondary" href={`/admin/produse/${item.id}`}>Editează</a>
                  <button class="btn btn-sm btn-outline-danger" on:click={() => remove(item.id)}>Șterge</button>
                </div>
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

  .page__head h1 {
    margin: 0;
    font-weight: 900;
  }

  .page__head p {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.65);
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .toolbar {
    margin-bottom: 16px;
  }

  .panel {
    background: white;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .rowActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>

<script>
  import { onMount } from 'svelte';

  let products = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let selectedCategory = 'all';

  onMount(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        products = await res.json();
      }
    } catch (err) {
      error = 'Eroare la încărcarea produselor';
      console.error(err);
    } finally {
      loading = false;
    }
  });

  $: filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function deleteProduct(id) {
    if (!confirm('Ești sigur că vrei să ștergi acest produs?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        products = products.filter((p) => p.id !== id);
      }
    } catch (err) {
      error = 'Eroare la ștergerea produsului';
      console.error(err);
    }
  }
</script>

<svelte:head>
  <title>Gestionare Produse - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <div class="d-flex justify-content-between align-items-center">
      <h1 class="h2 text-brown fw-bold m-0">
        <i class="bi bi-box"></i> Gestionare Produse
      </h1>
      <a href="/admin/produse/new" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> Produs nou
      </a>
    </div>
  </div>
</div>

{#if error}
  <div class="alert alert-danger" role="alert">
    <i class="bi bi-exclamation-triangle"></i> {error}
  </div>
{/if}

<!-- Search & Filter -->
<div class="row g-3 mb-4">
  <div class="col-md-6">
    <input
      type="text"
      class="form-control"
      placeholder="Caută produse..."
      bind:value={searchQuery}
    />
  </div>
  <div class="col-md-6">
    <select class="form-select" bind:value={selectedCategory}>
      <option value="all">Toate categoriile</option>
      <option value="de-sezon">De Sezon</option>
      <option value="la-borcan">La Borcan</option>
      <option value="colaboratori">Colaboratori</option>
      <option value="horeca">HORECA</option>
    </select>
  </div>
</div>

{#if loading}
  <div class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Se încarcă...</span>
    </div>
  </div>
{:else if filteredProducts.length > 0}
  <div class="card border-0 shadow-sm">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="bg-brown text-white">
          <tr>
            <th>Nume</th>
            <th>Categorie</th>
            <th>Preț</th>
            <th>Stoc</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredProducts as product (product.id)}
            <tr>
              <td class="fw-bold">{product.name}</td>
              <td>
                <span class="badge bg-cream text-brown">
                  {product.category}
                </span>
              </td>
              <td>{product.price?.toFixed(2) || '--'} RON</td>
              <td>
                <span class={`badge ${product.in_stock ? 'bg-success' : 'bg-danger'}`}>
                  {product.in_stock ? 'În stoc' : 'Indisponibil'}
                </span>
              </td>
              <td>
                <a href="/admin/produse/{product.id}" class="btn btn-sm btn-primary me-2">
                  <i class="bi bi-pencil"></i> Edit
                </a>
                <button
                  class="btn btn-sm btn-danger"
                  on:click={() => deleteProduct(product.id)}
                >
                  <i class="bi bi-trash"></i> Șterge
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{:else}
  <div class="alert alert-info">
    <i class="bi bi-info-circle"></i> Nu sunt produse disponibile
  </div>
{/if}

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .bg-brown {
    background-color: var(--desaga-brown) !important;
  }

  .bg-cream {
    background-color: var(--desaga-cream) !important;
  }
</style>

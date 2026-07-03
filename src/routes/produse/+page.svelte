<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { onMount } from 'svelte';
  import { getAllProducts, sortProductPriority, type Product } from '$lib/stores/products';

  let products: Product[] = [];
  let filteredProducts: Product[] = [];
  let loading = true;
  let q = '';

  const phoneHref = 'tel:+40729969822';
  const phoneLabel = '+40 729 969 822';

  onMount(async () => {
    loading = true;
    products = await getAllProducts();
    loading = false;
  });

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ă/g, 'a')
      .replace(/â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ș|ş/g, 's')
      .replace(/ț|ţ/g, 't');
  }

  function clearSearch() {
    q = '';
  }

  $: availableProducts = products.filter((p) => p.in_stock === true).sort(sortProductPriority);
  $: totalProducts = products.length;
  $: totalAvailable = availableProducts.length;
  $: filteredProducts = availableProducts.filter((p) => {
    const needle = normalizeText(q.trim());
    if (!needle) return true;

    const haystack = normalizeText(`${p.name ?? ''} ${p.description ?? ''} ${p.category ?? ''}`);
    return haystack.includes(needle);
  });
</script>

<svelte:head>
  <title>Produse - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Produse disponibile"
  subtitle="Stocul se schimbă în funcție de recoltă. Verifică lista sau sună pentru confirmare."
  backgroundImage="/images/produse/hero-produse-la-borcan.jpg"
  height="300px"
/>

<section class="products-page py-5">
  <div class="container">
    <div class="toolbar">
      <div>
        <p class="eyebrow mb-2">Stoc de azi</p>
        <h2 class="toolbar-title">Alege produse disponibile acum</h2>
        <p class="toolbar-subtitle mb-0">
          {totalAvailable} produse disponibile din {totalProducts} afișate. Pentru stocul exact de la rulotă, sună la {phoneLabel}.
        </p>
      </div>

      <div class="toolbar-actions">
        <a href={phoneHref} class="btn btn-primary">
          <i class="bi bi-telephone"></i> Sună pentru stoc
        </a>
        <a href="/contact" class="btn btn-outline-primary">
          <i class="bi bi-geo-alt"></i> Unde ne găsești
        </a>
      </div>
    </div>

    <div class="search-panel">
      <div class="search" role="search">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input
          class="search__input"
          type="search"
          placeholder="Caută roșii, zacuscă, miere…"
          aria-label="Caută produs"
          bind:value={q}
        />
        {#if q.trim()}
          <button class="search__clear" type="button" aria-label="Șterge căutarea" on:click={clearSearch}>
            <i class="bi bi-x-lg"></i>
          </button>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="products-grid" aria-label="Se încarcă produsele">
        {#each Array(10) as _}
          <div class="skeleton"></div>
        {/each}
      </div>
    {:else if filteredProducts.length === 0}
      <div class="empty-state">
        <div class="empty-icon"><i class="bi bi-basket"></i></div>
        <div class="empty-copy">
          <h3>Nu sunt produse disponibile pentru căutarea curentă</h3>
          <p>
            Produsele se actualizează în funcție de recoltă și stoc. Caută alt produs sau sună pentru lista disponibilă azi.
          </p>
          <div class="empty-actions">
            <button type="button" class="btn btn-primary" on:click={clearSearch}>
              <i class="bi bi-arrow-counterclockwise"></i> Șterge căutarea
            </button>
            <a href={phoneHref} class="btn btn-outline-primary">
              <i class="bi bi-telephone"></i> Sună acum
            </a>
          </div>
        </div>
      </div>
    {:else}
      <div class="results-head">
        <div>
          <strong>{filteredProducts.length}</strong> produse disponibile
        </div>
        <div class="results-note">Afișăm doar produse disponibile în stoc.</div>
      </div>

      <div class="products-grid">
        {#each filteredProducts as product (product.id)}
          <ProductCard {product} />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .products-page {
    background: linear-gradient(180deg, #fff 0%, rgba(var(--desaga-accent-rgb), 0.05) 100%);
  }

  .toolbar {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    margin-bottom: 18px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(var(--desaga-accent-rgb), 0.14);
    background: #fff;
    box-shadow: var(--desaga-shadow-sm);
  }

  @media (min-width: 992px) {
    .toolbar {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  .eyebrow {
    color: var(--desaga-blue);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem;
  }

  .toolbar-title {
    margin: 0 0 0.4rem;
    font-weight: 950;
    color: var(--desaga-brown);
    letter-spacing: -0.04em;
  }

  .toolbar-subtitle {
    color: rgba(0, 0, 0, 0.68);
    max-width: 680px;
  }

  .toolbar-actions,
  .empty-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .search-panel {
    display: grid;
    gap: 14px;
    margin-bottom: 20px;
  }

  .search {
    position: relative;
    width: 100%;
  }

  .search > i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
  }

  .search__input {
    width: 100%;
    padding: 12px 42px;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.04);
  }

  .search__input:focus {
    outline: none;
    border-color: rgba(var(--desaga-accent-rgb), 0.5);
    box-shadow: var(--desaga-focus-ring);
  }

  .search__clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.04);
    opacity: 0.75;
  }

  .results-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    color: rgba(0, 0, 0, 0.7);
  }

  .results-note {
    font-size: 0.9rem;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 18px;
  }

  @media (min-width: 1200px) {
    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }

  @media (max-width: 767.98px) {
    .products-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
  }

  .skeleton {
    height: 360px;
    border-radius: 18px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05));
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite linear;
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  .empty-state {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: flex-start;
    padding: 22px;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(var(--desaga-accent-rgb), 0.14);
    box-shadow: var(--desaga-shadow-sm);
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.12);
    font-size: 1.25rem;
  }

  .empty-copy h3 {
    margin: 0 0 0.4rem;
    font-weight: 950;
    color: var(--desaga-brown);
  }

  .empty-copy p {
    margin: 0 0 1rem;
    color: rgba(0, 0, 0, 0.68);
  }

  @media (max-width: 576px) {
    .empty-state {
      grid-template-columns: 1fr;
    }

    .toolbar-actions .btn,
    .empty-actions .btn {
      width: 100%;
    }
  }
</style>

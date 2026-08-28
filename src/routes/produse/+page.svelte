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

<!-- The page title and its actions live in the hero. The old layout repeated
     the title in a bordered panel directly underneath, so the page opened with
     two competing headings. -->
<Hero
  title="Produse disponibile"
  subtitle="Stocul se schimbă în funcție de recoltă. Verifică lista sau sună pentru confirmare."
  backgroundImage="/images/produse/hero-produse-la-borcan.jpg"
  height="300px"
  primaryHref={phoneHref}
  primaryLabel="Sună pentru stoc"
  secondaryHref="/contact"
  secondaryLabel="Unde ne găsești"
  secondaryIcon="bi-geo-alt"
/>

<section class="section-y">
  <div class="container">
    <div class="toolbar">
      <div class="search" role="search">
        <i class="bi bi-search" aria-hidden="true"></i>
        <label class="visually-hidden" for="product-search">Caută produs</label>
        <input
          id="product-search"
          class="search__input"
          type="search"
          placeholder="Caută roșii, zacuscă, miere…"
          bind:value={q}
        />
        {#if q.trim()}
          <button class="search__clear" type="button" aria-label="Șterge căutarea" on:click={clearSearch}>
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        {/if}
      </div>

      <p class="stock-line">
        {totalAvailable} din {totalProducts} produse sunt în stoc azi. Pentru stocul exact de la rulotă, sună la
        <a href={phoneHref}>{phoneLabel}</a>.
      </p>
    </div>

    {#if loading}
      <div class="products-grid" aria-label="Se încarcă produsele">
        {#each Array(10) as _}
          <div class="skeleton skeleton-card"></div>
        {/each}
      </div>
    {:else if filteredProducts.length === 0}
      <div class="empty-state">
        <p class="empty-title">Nu sunt produse disponibile pentru căutarea curentă</p>
        <p class="empty-sub">
          Produsele se actualizează în funcție de recoltă și stoc. Caută alt produs sau sună pentru lista disponibilă azi.
        </p>
        <div class="empty-actions">
          <button type="button" class="btn btn-accent" on:click={clearSearch}>
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Șterge căutarea
          </button>
          <a href={phoneHref} class="btn btn-outline-accent">
            <i class="bi bi-telephone" aria-hidden="true"></i> Sună acum
          </a>
        </div>
      </div>
    {:else}
      <div class="results-head">
        <p class="results-count"><strong>{filteredProducts.length}</strong> produse disponibile</p>
        <p class="results-note">Afișăm doar produse disponibile în stoc.</p>
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
  .toolbar {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }

  .search {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search > i {
    position: absolute;
    left: var(--space-3);
    color: var(--ink-3);
    pointer-events: none;
  }

  .search__input {
    width: 100%;
    min-height: 48px;
    padding: 0.5rem 2.75rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
  }

  .search__input::placeholder {
    color: var(--ink-3);
  }

  .search__input:focus {
    outline: none;
    border-color: var(--tomato-ink);
    box-shadow: var(--focus-ring);
  }

  /* Native clear affordance is removed so the styled button is the only one. */
  .search__input::-webkit-search-cancel-button {
    appearance: none;
  }

  .search__clear {
    position: absolute;
    right: 4px;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }

  .search__clear:hover,
  .search__clear:focus-visible {
    background: var(--paper-2);
    color: var(--tomato-deep);
  }

  .stock-line {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }

  .stock-line a {
    font-weight: 600;
    white-space: nowrap;
  }

  .results-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding-bottom: var(--space-2);
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--line-strong);
  }

  .results-count,
  .results-note {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }

  .results-count strong {
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  .results-note {
    color: var(--ink-3);
  }

  /* Two per row on the narrowest phones, filling out to six on a wide
     monitor, without a breakpoint per step. */
  .products-grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fill, minmax(min(158px, 100%), 1fr));
  }

  .skeleton-card {
    height: 300px;
  }

  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  @media (min-width: 768px) {
    .toolbar {
      grid-template-columns: minmax(0, 26rem) minmax(0, 1fr);
      align-items: center;
      gap: var(--space-4);
    }

    .products-grid {
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
    }
  }
</style>

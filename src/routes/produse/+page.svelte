<!-- FILE: src/routes/produse/+page.svelte -->
<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { onMount } from "svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";

  let products: Product[] = [];
  let selectedCategory: string = "all";
  let filteredProducts: Product[] = [];
  let loading = true;

  // UI-only search
  let q = "";

  const categories = [
    { key: "all", label: "Toate", icon: "bi-list-ul" },
    { key: "de-sezon", label: "De Sezon", icon: "bi-leaf" },
    { key: "la-borcan", label: "La Borcan", icon: "bi-jar" },
  ];

  onMount(async () => {
    try {
      loading = true;
      products = await getAllProducts();
    } finally {
      loading = false;
    }
  });

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ă/g, "a")
      .replace(/â/g, "a")
      .replace(/î/g, "i")
      .replace(/ș/g, "s")
      .replace(/ț/g, "t");
  }

  $: filteredProducts = products
    .filter((p) => p.in_stock === true)
    .filter(
      (p) => selectedCategory === "all" || p.category === selectedCategory,
    )
    .filter((p) => {
      const needle = normalizeText(q.trim());
      if (!needle) return true;

      const haystack = normalizeText(
        `${p.name ?? ""} ${p.description ?? ""} ${p.category ?? ""}`,
      );

      return haystack.includes(needle);
    });
</script>

<svelte:head>
  <title>Produse - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Produse"
  subtitle="Din fermă direct la tine"
  backgroundImage=""
  height="340px"
/>

<section class="py-5">
  <div class="container">
    <div class="head">
      <h2 class="head__title">Consumă local. Gustos. Sănătos.</h2>

      <div class="search">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input
          class="search__input"
          type="search"
          placeholder="Caută produs…"
          bind:value={q}
        />
        {#if q.trim()}
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button class="search__clear" on:click={() => (q = "")}>
            <i class="bi bi-x-lg"></i>
          </button>
        {/if}
      </div>
    </div>

    <div class="filters">
      {#each categories as c (c.key)}
        <button
          class={`chip ${selectedCategory === c.key ? "chip--active" : ""}`}
          on:click={() => (selectedCategory = c.key)}
        >
          <i class={`bi ${c.icon}`}></i>
          {c.label}
        </button>
      {/each}
    </div>

    {#if loading}
      <div class="products-grid">
        {#each Array(10) as _}
          <div class="skeleton"></div>
        {/each}
      </div>
    {:else if filteredProducts.length === 0}
      <div class="empty">
        <i class="bi bi-info-circle"></i>
        <div>
          <strong>Nu sunt produse disponibile</strong>
          <div>Schimbă categoria sau caută alt produs.</div>
        </div>
      </div>
    {:else}
      <div class="products-grid">
        {#each filteredProducts as product (product.id)}
          <ProductCard {product} />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .head__title {
    font-weight: 900;
    color: var(--desaga-brown);
    letter-spacing: -0.03em;
  }

  .search {
    position: relative;
    width: min(420px, 100%);
  }

  .search i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
  }

  .search__input {
    width: 100%;
    padding: 10px 38px;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .search__clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    opacity: 0.6;
  }

  .filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .chip {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    font-weight: 700;
  }

  .chip--active {
    background: rgba(36, 146, 204, 0.14);
    border-color: rgba(36, 146, 204, 0.4);
  }

  /* COLUMN-BASED GRID (no fixed 4-per-row) */
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

  @media (max-width: 576px) {
    .products-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }
  }

  .skeleton {
    height: 360px;
    border-radius: 16px;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.05),
      rgba(0, 0, 0, 0.1),
      rgba(0, 0, 0, 0.05)
    );
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite linear;
  }

  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }

  .empty {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 18px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.03);
  }
</style>

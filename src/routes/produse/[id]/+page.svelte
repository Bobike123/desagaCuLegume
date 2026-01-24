<!-- FILE: src/routes/produse/[id]/+page.svelte -->

<script lang="ts">
  import { page } from "$app/stores";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { productsStore, type Product } from "$lib/stores/products";
  import { onDestroy } from "svelte";

  let product: Product | null = null;
  let relatedProducts: Product[] = [];
  let allProducts: Product[] = [];

  let loading = true;
  let error: string | null = null;

  let alive = true;
  onDestroy(() => {
    alive = false;
  });

  let token = 0;

  $: productId = $page.params.id;

  $: if (productId) {
    void loadProduct(productId);
  }

  async function loadProduct(id: string) {
    const t = ++token;
    loading = true;
    error = null;
    product = null;
    relatedProducts = [];

    try {
      // ALWAYS fetch by id (fixes numeric/string id mismatch and avoids "Produs nu găsit" for existing items)
      const p = await productsStore.getById(id);
      if (!alive || t !== token) return;

      product = p;

      // Related products: load list, then match by category; show only in-stock
      allProducts = await productsStore.loadAll();
      if (!alive || t !== token) return;

      relatedProducts = allProducts
        .filter(
          (x) =>
            x.category === p.category &&
            String(x.id) !== String(p.id) &&
            x.in_stock === true,
        )
        .slice(0, 4);
    } catch (e) {
      if (!alive || t !== token) return;
      error = e instanceof Error ? e.message : "Eroare necunoscută";
    } finally {
      if (!alive || t !== token) return;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{product?.name || "Produs"} - DeSaga cu Legume</title>
</svelte:head>

<div class="container py-5">
  {#if loading}
    <div class="card border-0 shadow-sm">
      <div class="card-body py-5 text-center">
        <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
        <div class="mt-3 text-muted">Se încarcă produsul…</div>
      </div>
    </div>
  {:else if product}
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="/">Acasă</a></li>
        <li class="breadcrumb-item"><a href="/produse">Produse</a></li>
        <li class="breadcrumb-item active" aria-current="page">
          {product.name}
        </li>
      </ol>
    </nav>

    {#if product.in_stock === false}
      <div
        class="alert alert-warning d-flex align-items-center gap-2"
        role="alert"
      >
        <i class="bi bi-exclamation-circle"></i>
        <div>
          <strong>Stoc epuizat.</strong> Produsul există, dar nu este disponibil
          momentan.
        </div>
      </div>
    {/if}

    <div class="row g-5">
      <div class="col-lg-6">
        <img
          src={product.image_url}
          alt={product.name}
          class="img-fluid rounded shadow"
        />
      </div>

      <div class="col-lg-6">
        <h1 class="h1 text-brown fw-bold mb-3">{product.name}</h1>

        {#if product.category}
          <div class="mb-3">
            <span
              class="badge bg-cream text-brown px-3 py-2"
              style="font-size: 0.95rem;"
            >
              {product.category === "de-sezon"
                ? "🌱 De Sezon"
                : product.category === "la-borcan"
                  ? "🫙 La Borcan"
                  : product.category === "colaboratori"
                    ? "🤝 Colaboratori"
                    : "🍽️ HORECA"}
            </span>
          </div>
        {/if}

        {#if product.price !== undefined}
          <p class="fs-3 fw-bold text-green mb-4">
            {product.price.toFixed(2)} RON
          </p>
        {/if}

        {#if product.description}
          <p class="lead text-secondary mb-5">{product.description}</p>
        {/if}

        <div class="d-grid gap-2 mb-5">
          <a href="/produse" class="btn btn-outline-secondary btn-lg">
            <i class="bi bi-arrow-left"></i> Înapoi la produse
          </a>
        </div>
      </div>
    </div>

    {#if relatedProducts.length > 0}
      <section class="py-5 mt-5">
        <h2 class="h2 text-brown fw-bold mb-4">
          <i class="bi bi-arrow-left-right"></i> Produse similare
        </h2>

        <div class="row g-4">
          {#each relatedProducts as relProduct (relProduct.id)}
            <div class="col-md-6 col-lg-3">
              <ProductCard product={relProduct} />
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {:else}
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">
        <i class="bi bi-exclamation-triangle"></i> Produs nu găsit
      </h4>

      {#if error}
        <p class="mb-2">{error}</p>
      {:else}
        <p class="mb-2">Produsul pe care îl cauți nu există.</p>
      {/if}

      <p class="mb-0">
        <a href="/produse">Înapoi la produse</a>
      </p>
    </div>
  {/if}
</div>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }
  .text-green {
    color: var(--desaga-green) !important;
  }
  .bg-cream {
    background-color: var(--desaga-cream) !important;
  }
</style>

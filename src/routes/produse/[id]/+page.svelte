<script lang="ts">
  import { page } from "$app/stores";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";
  import { onMount } from "svelte";

  let product: Product | null = null;
  let relatedProducts: Product[] = [];
  let allProducts: Product[] = [];

  onMount(async () => {
    allProducts = await getAllProducts();

    const found = allProducts.find((p) => p.id === $page.params.id);
    if (found) {
      product = found;
      relatedProducts = allProducts
        .filter((p) => p.category === found.category && p.id !== found.id)
        .slice(0, 4);
    }
  });
</script>

<svelte:head>
  <title>{product?.name || "Produs"} - DeSaga cu Legume</title>
</svelte:head>

<div class="container py-5">
  {#if product}
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="/">Acasă</a></li>
        <li class="breadcrumb-item"><a href="/produse">Produse</a></li>
        <li class="breadcrumb-item active" aria-current="page">
          {product.name}
        </li>
      </ol>
    </nav>

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
      <p>
        Produsul pe care îl cauți nu există. <a href="/produse"
          >Înapoi la produse</a
        >
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

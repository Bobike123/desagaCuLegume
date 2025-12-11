<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { onMount } from "svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";

  let products: Product[] = [];
  let selectedCategory: string = "all";
  let filteredProducts: Product[] = [];

  onMount(async () => {
    products = await getAllProducts();
  });

  $: filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);
</script>

<svelte:head>
  <title>Produse - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Produse"
  subtitle="Din Fermă direct la Rulota DeSaga"
  backgroundImage="/images/produse-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <h2 class="h1 text-brown fw-bold mb-5 text-center">
      Consumă LOCAL - GUSTOS - SĂNĂTOS
    </h2>

    <div class="row mb-5">
      <div class="col-12">
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          <button
            class={`btn ${selectedCategory === "all" ? "btn-primary" : "btn-outline-primary"}`}
            on:click={() => (selectedCategory = "all")}
          >
            <i class="bi bi-list-ul"></i> Toate Produsele
          </button>

          <button
            class={`btn ${selectedCategory === "de-sezon" ? "btn-primary" : "btn-outline-primary"}`}
            on:click={() => (selectedCategory = "de-sezon")}
          >
            <i class="bi bi-leaf"></i> De Sezon
          </button>

          <button
            class={`btn ${selectedCategory === "la-borcan" ? "btn-primary" : "btn-outline-primary"}`}
            on:click={() => (selectedCategory = "la-borcan")}
          >
            <i class="bi bi-jar"></i> La Borcan
          </button>

          <button
            class={`btn ${selectedCategory === "colaboratori" ? "btn-primary" : "btn-outline-primary"}`}
            on:click={() => (selectedCategory = "colaboratori")}
          >
            <i class="bi bi-people"></i> Colaboratori
          </button>

          <button
            class={`btn ${selectedCategory === "horeca" ? "btn-primary" : "btn-outline-primary"}`}
            on:click={() => (selectedCategory = "horeca")}
          >
            <i class="bi bi-cup"></i> HORECA
          </button>
        </div>
      </div>
    </div>

    <div class="row g-4">
      {#each filteredProducts as product (product.id)}
        <div class="col-md-6 col-lg-3">
          <ProductCard {product} />
        </div>
      {/each}
    </div>

    {#if filteredProducts.length === 0}
      <div class="alert alert-info text-center" role="alert">
        <h4 class="alert-heading">
          <i class="bi bi-info-circle"></i> Nu sunt produse disponibile
        </h4>
        <p>Încearcă o alta categorie sau revino mai târziu.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }
</style>

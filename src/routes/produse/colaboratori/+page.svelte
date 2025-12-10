<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { products } from "$lib/stores/products";
  import { fetchProducts } from "$lib/stores/products";
  import type { Product } from "$lib/stores/products";
  import { onMount } from "svelte";

  let filteredProducts: Product[] = [];

  onMount(async () => {
    await fetchProducts();
    filteredProducts = $products.filter((p) => p.category === "colaboratori");
  });
</script>

<svelte:head>
  <title>Colaboratori - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Colaboratori"
  subtitle="O mică Băcănie cu produse de calitate"
  backgroundImage="/images/colaboratori-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row mb-5">
      <div class="col-lg-8 mx-auto">
        <h2 class="h2 text-brown fw-bold mb-3">
          <i class="bi bi-people"></i> Consumă SĂNĂTOS
        </h2>
        <p class="lead">Din Fermă direct la Rulota DeSaga</p>
        <p>
          Pentru că vrem ca Rulota DeSaga să fie o mică Băcănie, am hotărât să
          completăm oferta de legume-fructe proaspete și procesate și cu alte
          produse făcute de oameni faini, pe care am avut ocazia să-i cunoaștem
          la târguri și evenimente.
        </p>

        <div class="card bg-light border-0 my-4">
          <div class="card-body">
            <h5 class="card-title text-brown fw-bold mb-3">
              🛍️ Categoria de produse:
            </h5>

            <div class="row">
              <div class="col-md-4 mb-3">
                <h6 class="text-green fw-bold">🧀 Brânzeturi:</h6>
                <ul class="list-unstyled small">
                  <li>• Brânză proaspătă</li>
                  <li>• Telemea maturată</li>
                  <li>• Unt</li>
                  <li>• Smântână</li>
                  <li>• Ouă</li>
                  <li>• Mozzarella</li>
                  <li>• Cașcaval</li>
                </ul>
              </div>
              <div class="col-md-4 mb-3">
                <h6 class="text-green fw-bold">🌾 Alimente:</h6>
                <ul class="list-unstyled small">
                  <li>• Ulei presat la rece</li>
                  <li>• Paste</li>
                  <li>• Ouă</li>
                  <li>• Legume uscate</li>
                  <li>• Usturoi pulbere</li>
                  <li>• Boia</li>
                </ul>
              </div>
              <div class="col-md-4 mb-3">
                <h6 class="text-green fw-bold">🍯 Dulcegării:</h6>
                <ul class="list-unstyled small">
                  <li>• Miere de albine</li>
                  <li>• Propolis</li>
                  <li>• Polen</li>
                  <li>• Dulcețuri</li>
                  <li>• Siropuri</li>
                  <li>• Batoane din fructe</li>
                  <li>• Sucuri naturale</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <h3 class="h3 text-brown fw-bold mb-4 text-center">Produse disponibile</h3>
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
          <i class="bi bi-info-circle"></i> Niciun produs disponibil
        </h4>
        <p>Revino mai târziu pentru produse de la colaboratori!</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .text-green {
    color: var(--desaga-green) !important;
  }

  .bg-light {
    background-color: var(--desaga-cream) !important;
  }
</style>

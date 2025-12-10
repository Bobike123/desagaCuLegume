<script>
  import Hero from '$lib/components/Hero.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { products } from '$lib/stores/products';
  import { fetchProducts } from '$lib/stores/products';
  import { onMount } from 'svelte';

  let filteredProducts = [];

  onMount(async () => {
    await fetchProducts();
    filteredProducts = $products.filter((p) => p.category === 'de-sezon');
  });
</script>

<svelte:head>
  <title>Produse de Sezon - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Produse de Sezon"
  subtitle="Legume și fructe proaspete, crescute cu pasiune"
  backgroundImage="/images/sezon-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row mb-5">
      <div class="col-lg-8 mx-auto">
        <h2 class="h2 text-brown fw-bold mb-3">
          <i class="bi bi-leaf"></i> Consumă LOCAL
        </h2>
        <p class="lead">
          Din Fermă direct la Rulota DeSaga
        </p>
        <p>
          Din cei 2500 mp de solarii ce îi deținem noi dar și din fermele celorlalți producători
          de seamă cu care colaboram, aducem zilnic la Rulota DeSaga o gamă largă de legume și
          fructe DE SEZON.
        </p>

        <div class="card bg-light border-0 my-4">
          <div class="card-body">
            <h5 class="card-title text-brown fw-bold mb-3">
              🌱 Ce găsești în funcție de sezon:
            </h5>

            <div class="row">
              <div class="col-md-6">
                <h6 class="text-green fw-bold">Primăvară:</h6>
                <p class="small">dovlecel, zucchini, gulie, varză timpurie, salată, fasole păstăi, mazăre, ceapă verde, usturoi verde, leurdă, mărar, pătrunjel, ridichi, spanac, țelină, cartofi noi, castraveți, căpșuni, cireșe</p>
              </div>
              <div class="col-md-6">
                <h6 class="text-green fw-bold">Vară:</h6>
                <p class="small">roșii, roșii Cherry, zarzavaturi, ardei, dovlecel, vinete, cartofi, castraveți, varză, ceapa, usturoi, sfeclă roșie, țelină, fasole, verdeață, porumb dulce, mere de vară, pere, prune, caise, piersici, vișine, zmeură, afine, coacăze, mure, pepene</p>
              </div>
            </div>

            <div class="row mt-3">
              <div class="col-md-6">
                <h6 class="text-green fw-bold">Toamnă:</h6>
                <p class="small">sfecla roșie, varză, conopida, broccoli, fasole boabe, gogoșar, ardei capia, ardei gras, ardei iute, morcovi, pătrunjel, țelină, cartofi, hrean, ceapă, usturoi, dovleac, roșii, gogonele, castraveți, mere, pere, gutui, nuci, prune, struguri</p>
              </div>
              <div class="col-md-6">
                <h6 class="text-green fw-bold">Iarnă:</h6>
                <p class="small">morcovi, pătrunjel, țelină, cartofi, sfecla, usturoi, dovleac, mere, pere, nuci</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <h3 class="h3 text-brown fw-bold mb-4 text-center">Produse disponibile acum</h3>
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
          <i class="bi bi-info-circle"></i> Nicio produto disponibilă
        </h4>
        <p>Revino mai târziu pentru produse de sezon!</p>
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

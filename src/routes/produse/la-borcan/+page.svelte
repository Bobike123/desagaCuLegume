<script>
  import Hero from '$lib/components/Hero.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { products } from '$lib/stores/products';
  import { fetchProducts } from '$lib/stores/products';
  import { onMount } from 'svelte';

  let filteredProducts = [];

  onMount(async () => {
    await fetchProducts();
    filteredProducts = $products.filter((p) => p.category === 'la-borcan');
  });
</script>

<svelte:head>
  <title>Produse la Borcan - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Produse la Borcan"
  subtitle="Rețete tradiționale în borcane"
  backgroundImage="/images/borcan-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row mb-5">
      <div class="col-lg-8 mx-auto">
        <h2 class="h2 text-brown fw-bold mb-3">
          <i class="bi bi-jar"></i> Consumă GUSTOS
        </h2>
        <p class="lead">
          Din Fermă direct la Rulota DeSaga
        </p>
        <p>
          Aici am îmbuteliat toată dragostea și pasiunea noastră pentru legume de sezon. Din caietul cu rețete al bunicii, în căldarea de cupru, la foc încet de lemne.
        </p>

        <div class="card bg-light border-0 my-4">
          <div class="card-body">
            <h5 class="card-title text-brown fw-bold mb-3">
              📋 Categorii de produse:
            </h5>

            <div class="row">
              <div class="col-md-6 mb-3">
                <h6 class="text-green fw-bold">🥒 Murături:</h6>
                <ul class="list-unstyled small">
                  <li>• Murături asortată</li>
                  <li>• Castraveți murați</li>
                  <li>• Varză murată</li>
                  <li>• Hrean răzălit</li>
                  <li>• Sfeclă murată</li>
                </ul>
              </div>
              <div class="col-md-6 mb-3">
                <h6 class="text-green fw-bold">🍲 Produse Tradiționale:</h6>
                <ul class="list-unstyled small">
                  <li>• Zacuscă cu vinete</li>
                  <li>• Zacuscă cu fasole</li>
                  <li>• Vinete coapte</li>
                </ul>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <h6 class="text-green fw-bold">🌶️ Sosuri:</h6>
                <ul class="list-unstyled small">
                  <li>• Dulceață ardei iute</li>
                  <li>• Sos chilli</li>
                  <li>• Sos cherry</li>
                  <li>• Sos ceapa roșie</li>
                  <li>• Sos spanac</li>
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
          <i class="bi bi-info-circle"></i> Nicio produs disponibilă
        </h4>
        <p>Revino mai târziu pentru produse la borcan!</p>
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

<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";
  import { onMount } from "svelte";

  let filteredProducts: Product[] = [];

  onMount(async () => {
    const allProducts = await getAllProducts();
    filteredProducts = allProducts.filter(
      (p: Product) => p.category === "la-borcan",
    );
  });
</script>

<svelte:head>
  <title>Produse la Borcan - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Produse la Borcan"
  subtitle="Legume și fructe conservate cu grijă"
  backgroundImage="/images/borcan-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row mb-5">
      <div class="col-lg-8 mx-auto">
        <h2 class="h2 text-brown fw-bold mb-3">
          <i class="bi bi-archive"></i> În cămara DeSaga CuLegume
        </h2>
        <p class="lead">
          Tot ce creștem peste an, punem cu grijă la păstrare în borcane curate,
          exact ca la bunici.
        </p>
        <p>
          Murături crocante, zarzavaturi de ciorbă, sosuri naturale, zacuscă sau
          dulcețuri, din caietul cu rețete al bunicii în căldarea de cupru, la
          foc încet de lemne, fără grabă și fără compromisuri.
        </p>
        <p>
          Fiecare borcan înseamnă legume-fructe proaspete din grădină, rețete
          simple, fără aditivi sau conservanți, gust autentic, de acasă. La
          Rulota DeSaga, le aducem pentru iarnă, pentru daruri, pentru zile în
          care ai poftă de ceva bun și sănătos.
        </p>
      </div>
    </div>

    <!-- Products Grid -->
    <h3 class="h3 text-brown fw-bold mb-4 text-center">
      Produse disponibile acum
    </h3>
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
        <p>Revino mai târziu pentru produsele noastre la borcan!</p>
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

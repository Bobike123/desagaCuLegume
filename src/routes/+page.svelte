<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import NoutateCard from "$lib/components/NoutateCard.svelte";
  import EventCard from "$lib/components/EventCard.svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";
  import { getAllNoutati, type Noutate } from "$lib/stores/noutati";
  import { getAllEvents, type Event } from "$lib/stores/events";
  import { onMount } from "svelte";

  let products: Product[] = [];
  let noutati: Noutate[] = [];
  let events: Event[] = [];

  onMount(async () => {
    products = await getAllProducts();
    noutati = await getAllNoutati();
    events = await getAllEvents();
  });
</script>

<svelte:head>
  <title>Acasă - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="DeSaga cu Legume"
  subtitle="Local • Gustos • Sănătos"
  backgroundImage="images/hero.jpg"
  height="500px"
/>

<!-- Local Section -->
<section class="py-5">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-6 mb-4">
        <img src="images/local.jpg" alt="Local" class="img-fluid rounded" />
      </div>
      <div class="col-md-6">
        <h2 class="h1 text-brown fw-bold mb-4">
          <span class="text-green">Local</span>
        </h2>
        <p class="lead">
          DeSaga și-și continuă "SAGA". Așa cum desaga țărănească unea pe
          vremuri două traiste, la fel DeSaga cu Legume unește acum mai mulți
          producători locali ce aduc pe mesele voastre legume sănătoase, cu
          gustul de altădată.
        </p>
        <p>
          O gamă variată de Legume-Fructe de sezon, crescute cu drag de natură
          și om, dar și alte produse 100% românești.
        </p>
        <p class="text-muted fst-italic">
          Acum mai aproape de tine ca oricând, din Fermă direct la noi la Rulota
          DeSaga.
        </p>
        <a href="/produse/de-sezon" class="btn btn-primary btn-lg">
          <i class="bi bi-leaf"></i> Vezi produse de sezon
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Gustos Section -->
<section class="py-5 bg-light">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-6 order-md-2 mb-4">
        <img src="images/gustos.jpg" alt="Gustos" class="img-fluid rounded" />
      </div>
      <div class="col-md-6 order-md-1">
        <h2 class="h1 text-brown fw-bold mb-4">
          <span class="text-green">Gustos</span>
        </h2>
        <p class="lead">
          Produse românești, ca la mama acasă. Gustul mâncării din farfurie, cel
          dat de ingrediente nu doar de condimente, care-ți aduce aminte de
          bucătăria bunicii de la țară din zilele toride ale vacanței de vară.
        </p>
        <p>
          Asta am promis și livrat de aproape 10 ani. Acum mai aproape de tine
          ca oricând, din Fermă direct la Rulota DeSaga.
        </p>
        <a href="/produse/la-borcan" class="btn btn-primary btn-lg">
          <i class="bi bi-jar"></i> Produse la borcan
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Sănătos Section -->
<section class="py-5">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-6 mb-4">
        <img src="images/sanatos.jpg" alt="Sănătos" class="img-fluid rounded" />
      </div>
      <div class="col-md-6">
        <h2 class="h1 text-brown fw-bold mb-4">
          <span class="text-green">Sănătos</span>
        </h2>
        <p class="lead">
          În ritmul naturii. Creștem hrană în ritmul naturii! Doar de sezon,
          fără substanțe chimice agresive ce forțează creșterea plantelor și
          coacerea fructelor.
        </p>
        <p>
          Respectăm cu sfințenie timpii de pauză și dozele recomandate atunci
          când facem tratamente. Ne alegem cu mare atenție colaboratorii și
          furnizorii, punem sănătatea noastră și a clienților noștri pe primul
          loc.
        </p>
        <a href="/produse/colaboratori" class="btn btn-primary btn-lg">
          <i class="bi bi-people"></i> Colaboratori
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Featured Products -->
<section class="py-5 bg-light">
  <div class="container">
    <h2 class="h1 text-center text-brown fw-bold mb-5">
      <i class="bi bi-box"></i> Produse Recente
    </h2>

    <div class="row g-4">
      {#each products.slice(0, 8) as product (product.id)}
        <div class="col-md-6 col-lg-3">
          <ProductCard {product} />
        </div>
      {/each}
    </div>

    <div class="text-center mt-5">
      <a href="/produse" class="btn btn-outline-primary btn-lg">
        <i class="bi bi-arrow-right"></i> Vezi toate produsele
      </a>
    </div>
  </div>
</section>

<!-- Latest News -->
<section class="py-5">
  <div class="container">
    <h2 class="h1 text-center text-brown fw-bold mb-5">
      <i class="bi bi-newspaper"></i> Noutăți și Momente
    </h2>

    <div class="row g-4">
      {#each noutati.slice(0, 3) as item (item.id)}
        <div class="col-md-4">
          <NoutateCard noutate={item} />
        </div>
      {/each}
    </div>

    <div class="text-center mt-5">
      <a href="/noutati" class="btn btn-outline-primary btn-lg">
        <i class="bi bi-arrow-right"></i> Vezi toate noutățile
      </a>
    </div>
  </div>
</section>

<!-- Upcoming Events -->
<section class="py-5 bg-light">
  <div class="container">
    <h2 class="h1 text-center text-brown fw-bold mb-5">
      <i class="bi bi-calendar-event"></i> Evenimente
    </h2>

    <div class="row g-4">
      {#each events.slice(0, 3) as item (item.id)}
        <div class="col-md-4">
          <EventCard event={item} />
        </div>
      {/each}
    </div>

    <div class="text-center mt-5">
      <a href="/evenimente" class="btn btn-outline-primary btn-lg">
        <i class="bi bi-arrow-right"></i> Vezi toate evenimentele
      </a>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-5 bg-brown text-white text-center">
  <div class="container">
    <h2 class="h1 fw-bold mb-4">Consumă LOCAL - GUSTOS - SĂNĂTOS</h2>
    <p class="lead mb-4">Din Fermă direct la Rulota DeSaga</p>
    <p class="mb-4">
      Susținem consumul alimentelor de sezon, direct de la producători locali,
      conform principiului "DIN FERMĂ ÎN FARFURIE"
    </p>
    <div class="d-flex gap-3 justify-content-center flex-wrap">
      <a href="/produse/de-sezon" class="btn btn-light btn-lg">
        <i class="bi bi-leaf"></i> De Sezon
      </a>
      <a href="/produse/la-borcan" class="btn btn-light btn-lg">
        <i class="bi bi-jar"></i> La Borcan
      </a>
      <a href="/produse/colaboratori" class="btn btn-light btn-lg">
        <i class="bi bi-people"></i> Colaboratori
      </a>
    </div>
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }
  .text-green {
    color: var(--desaga-green) !important;
  }
  .bg-brown {
    background-color: var(--desaga-brown) !important;
  }
  .bg-light {
    background-color: var(--desaga-cream) !important;
  }
</style>

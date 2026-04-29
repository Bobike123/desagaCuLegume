<!-- FILE: src/routes/produse/colaboratori/+page.svelte -->
<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";
  import { onMount } from "svelte";

  const categorySlug = "colaboratori";
  const phoneHref = "tel:+40729969822";

  let products: Product[] = [];
  let loading = true;

  onMount(async () => {
    loading = true;
    products = (await getAllProducts(categorySlug)).filter((p: Product) => p.in_stock === true);
    loading = false;
  });
</script>

<svelte:head>
  <title>Colaboratori - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Colaboratori"
  subtitle="Produse locale de la oameni faini, alese pentru calitate."
  backgroundImage=""
  height="300px"
/>

<section class="category-page py-5">
  <div class="container">
    <div class="intro-card">
      <div class="intro-icon"><i class="bi bi-people"></i></div>
      <div>
        <p class="eyebrow mb-2">Mică băcănie locală</p>
        <h2>Produse de la colaboratori verificați</h2>
        <p class="lead mb-0">Completăm legumele și produsele DeSaga cu alimente locale, lactate, miere și alte produse făcute responsabil.</p>
      </div>
      <div class="intro-actions">
        <a href="/produse" class="btn btn-outline-primary"><i class="bi"></i> Toate produsele</a>
        <a href={phoneHref} class="btn btn-primary"><i class="bi bi-telephone"></i> Sună pentru stoc</a>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card"><strong>Brânzeturi</strong><span>Produse lactate de la colaboratori locali.</span></div>
      <div class="info-card"><strong>Alimente</strong><span>Ulei presat la rece, paste, legume uscate, condimente.</span></div>
      <div class="info-card"><strong>Dulcegării</strong><span>Miere, siropuri, dulcețuri, sucuri naturale și alte produse.</span></div>
    </div>

    <div class="section-head">
      <div>
        <h3>Produse disponibile acum</h3>
        <p>Afișăm doar produsele marcate disponibile în baza de date.</p>
      </div>
      <span class="count-pill">{products.length} disponibile</span>
    </div>

    {#if loading}
      <div class="products-grid" aria-label="Se încarcă produsele">
        {#each Array(8) as _}
          <div class="skeleton"></div>
        {/each}
      </div>
    {:else if products.length === 0}
      <div class="empty-state">
        <div class="empty-icon"><i class="bi bi-info-circle"></i></div>
        <div>
          <h4>Niciun produs disponibil momentan</h4>
          <p>Nu avem produse de la colaboratori disponibile momentan. Stocul depinde de livrările colaboratorilor.</p>
          <div class="empty-actions">
            <a href="/produse" class="btn btn-outline-primary">Vezi toate produsele</a>
            <a href={phoneHref} class="btn btn-primary">Sună pentru stocul de azi</a>
          </div>
        </div>
      </div>
    {:else}
      <div class="products-grid">
        {#each products as product (product.id)}
          <ProductCard {product} />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .category-page {
    background: linear-gradient(180deg, #fff 0%, rgba(36, 146, 204, 0.05) 100%);
  }

  .intro-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 24px;
    padding: 20px;
    border-radius: 24px;
    border: 1px solid rgba(36, 146, 204, 0.14);
    background: #fff;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
  }

  @media (min-width: 992px) {
    .intro-card {
      grid-template-columns: auto 1fr auto;
      align-items: center;
    }
  }

  .intro-icon {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    color: var(--desaga-blue);
    background: rgba(36, 146, 204, 0.12);
    font-size: 1.35rem;
  }

  .eyebrow {
    color: var(--desaga-blue);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem;
  }

  .intro-card h2 {
    margin: 0 0 0.4rem;
    color: var(--desaga-brown);
    font-weight: 950;
    letter-spacing: -0.04em;
  }

  .intro-card .lead {
    color: rgba(0, 0, 0, 0.68);
    line-height: 1.65;
  }

  .intro-actions,
  .empty-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
    margin-bottom: 28px;
  }

  .info-card {
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: #fff;
    padding: 14px;
  }

  .info-card strong {
    display: block;
    color: var(--desaga-brown);
    margin-bottom: 4px;
  }

  .info-card span {
    color: rgba(0, 0, 0, 0.66);
    font-size: 0.92rem;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: end;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .section-head h3 {
    margin: 0 0 0.25rem;
    color: var(--desaga-brown);
    font-weight: 950;
  }

  .section-head p {
    margin: 0;
    color: rgba(0, 0, 0, 0.64);
  }

  .count-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 7px 12px;
    color: var(--desaga-blue);
    background: rgba(36, 146, 204, 0.12);
    font-weight: 900;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 18px;
  }

  @media (max-width: 576px) {
    .products-grid { grid-template-columns: 1fr; }
    .intro-card { grid-template-columns: 1fr; }
    .intro-actions .btn,
    .empty-actions .btn { width: 100%; }
  }

  .skeleton {
    height: 360px;
    border-radius: 18px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05));
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite linear;
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  .empty-state {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    padding: 20px;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(36, 146, 204, 0.14);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: var(--desaga-blue);
    background: rgba(36, 146, 204, 0.12);
  }

  .empty-state h4 {
    margin: 0 0 0.4rem;
    color: var(--desaga-brown);
    font-weight: 950;
  }

  .empty-state p {
    color: rgba(0, 0, 0, 0.68);
  }
</style>
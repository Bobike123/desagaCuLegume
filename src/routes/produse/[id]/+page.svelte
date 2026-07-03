<script lang="ts">
  import { page } from "$app/stores";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import ProductImageSlideshow from "$lib/components/ProductImageSlideshow.svelte";
  import { cart } from "$lib/stores/cart";
  import { productImageUrls, productsStore, sortProductPriority, type Product } from "$lib/stores/products";
  import { PLACEHOLDER_IMAGE } from "$lib/images";
  import { productMeasureUnitSuffix, productPromotionBadges } from "$lib/format";
  import { onDestroy } from "svelte";

  let product: Product | null = null;
  let relatedProducts: Product[] = [];
  let loading = true;
  let error: string | null = null;

  let alive = true;
  let token = 0;
  let lastLoadedId = "";

  onDestroy(() => {
    alive = false;
  });

  $: productId = $page.params.id;
  $: if (productId && productId !== lastLoadedId) {
    lastLoadedId = productId;
    void loadProduct(productId);
  }

  $: imageUrls = productImageUrls(product);
  $: slideshowImages = imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE];
  $: currentQty = product ? ($cart.items.find((item) => item.productId === String(product?.id))?.quantity ?? 0) : 0;
  $: categoryMeta = getCategoryMeta(product?.category ?? "de-sezon");
  $: categoryHref = product?.category === "la-borcan" ? "/produse/la-borcan" : "/produse/de-sezon";
  $: measureUnitSuffix = productMeasureUnitSuffix(product?.measure_unit);
  $: promotionBadges = productPromotionBadges(product?.promotion_label);
  $: hasPromotion = promotionBadges.length > 0;
  $: stockLabel = product?.in_stock
    ? product.stock_quantity && product.stock_quantity > 0
      ? `${product.stock_quantity} disponibile`
      : "Disponibil"
    : "Stoc epuizat";

  async function loadProduct(id: string) {
    const t = ++token;
    loading = true;
    error = null;
    product = null;
    relatedProducts = [];

    try {
      const p = await productsStore.getById(id);
      if (!alive || t !== token) return;

      product = p;

      const allProducts = await productsStore.loadAll(p.category);
      if (!alive || t !== token) return;

      relatedProducts = allProducts
        .filter((x: Product) => String(x.id) !== String(p.id) && x.in_stock === true)
        .sort(sortProductPriority)
        .slice(0, 4);
    } catch (e) {
      if (!alive || t !== token) return;
      error = e instanceof Error ? e.message : "Eroare necunoscută";
    } finally {
      if (!alive || t !== token) return;
      loading = false;
    }
  }

  function getCategoryMeta(category: string) {
    if (category === "la-borcan") return { label: "La borcan", icon: "" };
    return { label: "De sezon", icon: "" };
  }

  function addToBasket() {
    if (!product?.in_stock) return;
    cart.addProduct(product, 1);
  }

  function inc() {
    if (!product?.in_stock) return;
    cart.addProduct(product, 1);
  }

  function dec() {
    if (!product) return;
    cart.setQuantity(String(product.id), Math.max(0, currentQty - 1));
  }
</script>

<svelte:head>
  <title>{product?.name || "Produs"} - DeSaga cu Legume</title>
</svelte:head>

<div class="product-detail-page">
  <div class="container py-5">
    {#if loading}
      <div class="loading-card">
        <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
        <div class="mt-3 text-muted">Se încarcă produsul…</div>
      </div>
    {:else if product}
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="/">Acasă</a></li>
          <li class="breadcrumb-item"><a href="/produse">Produse</a></li>
          <li class="breadcrumb-item active" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <section class:promoted={hasPromotion} class="product-shell">
        <div class="product-media">
          <ProductImageSlideshow images={slideshowImages} alt={product.name} variant="detail" interactive={true} />
          {#if hasPromotion}
            <div class="promotion-ribbons" aria-label="Etichete produs">
              {#each promotionBadges as badge}
                <span>{badge}</span>
              {/each}
            </div>
          {/if}

          <div class={`stock-ribbon ${product.in_stock ? "stock-ribbon--ok" : "stock-ribbon--off"}`}>
            <i class={`bi ${product.in_stock ? "bi-check2-circle" : "bi-exclamation-circle"}`}></i>
            {stockLabel}
          </div>
        </div>

        <div class="product-info">
          <a href="/produse" class="back-link"><i class="bi bi-arrow-left"></i> Înapoi la produse</a>

          <div class="top-pills">
            <div class="category-pill">
              <i class={`bi ${categoryMeta.icon}`}></i>
              {categoryMeta.label}
            </div>
            {#if hasPromotion}
              {#each promotionBadges as badge}
                <span class="promo-pill">{badge}</span>
              {/each}
            {/if}
          </div>

          <h1>{product.name}</h1>

          {#if product.description}
            <p class="description">{product.description}</p>
          {:else}
            <p class="description muted">Descrierea produsului va fi actualizată în curând.</p>
          {/if}

          <div class="purchase-card">
            <div>
              <div class="price-label">Preț / {measureUnitSuffix}</div>
              <div class="price">
                {Number(product.price ?? 0).toFixed(2)}
                <span>RON</span>
                <span class="price-unit">/ {measureUnitSuffix}</span>
              </div>
            </div>

            <div class="status-box">
              <i class={`bi ${product.in_stock ? "bi-basket" : "bi-clock"}`}></i>
              <div>
                <strong>{product.in_stock ? "Disponibil pentru comandă" : "Momentan indisponibil"}</strong>
                <span>{product.in_stock ? "Adaugă în coș sau confirmă telefonic stocul." : "Sună pentru următoarea disponibilitate."}</span>
              </div>
            </div>

            {#if product.in_stock}
              {#if currentQty === 0}
                <button type="button" class="btn btn-primary btn-lg" on:click={addToBasket}>
                  <i class="bi bi-basket"></i> Adaugă în coș
                </button>
              {:else}
                <div class="quantity-row">
                  <div class="stepper" role="group" aria-label="Cantitate în coș">
                    <button type="button" on:click={dec} aria-label="Scade cantitatea"><i class="bi bi-dash"></i></button>
                    <span>{currentQty}</span>
                    <button type="button" on:click={inc} aria-label="Crește cantitatea"><i class="bi bi-plus"></i></button>
                  </div>
                  <a href="/cos" class="btn btn-primary"><i class="bi bi-cart"></i> Vezi coșul</a>
                </div>
              {/if}
            {:else}
              <a href="tel:+40729969822" class="btn btn-outline-primary btn-lg">
                <i class="bi bi-telephone"></i> Sună pentru detalii
              </a>
            {/if}
          </div>

          <div class="help-strip">
            <div><i class="bi bi-geo-alt"></i> Ridicare: Str. Constantin Brâncuși nr. 153</div>
            <div><i class="bi bi-clock"></i> Program: L–V 9:00–18:00</div>
            <div><i class="bi bi-telephone"></i> +40 729 969 822</div>
          </div>
        </div>
      </section>

      {#if relatedProducts.length > 0}
        <section class="related-section">
          <div class="section-head">
            <h2>Produse similare disponibile</h2>
            <a href={categoryHref} class="btn btn-outline-primary btn-sm">Vezi categoria</a>
          </div>

          <div class="related-grid">
            {#each relatedProducts as relProduct (relProduct.id)}
              <ProductCard product={relProduct} />
            {/each}
          </div>
        </section>
      {/if}
    {:else}
      <div class="not-found" role="alert">
        <div class="not-found-icon"><i class="bi bi-exclamation-triangle"></i></div>
        <div>
          <h1>Produs nu găsit</h1>
          {#if error}
            <p>{error}</p>
          {:else}
            <p>Produsul pe care îl cauți nu există sau nu mai este afișat.</p>
          {/if}
          <a href="/produse" class="btn btn-primary"><i class="bi bi-arrow-left"></i> Înapoi la produse</a>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .product-detail-page {
    background: linear-gradient(180deg, #fff 0%, rgba(36, 146, 204, 0.05) 100%);
    min-height: 70vh;
  }

  .loading-card,
  .not-found {
    border-radius: 22px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: #fff;
    padding: 42px 24px;
    text-align: center;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
  }

  .not-found {
    display: grid;
    gap: 16px;
    justify-items: center;
  }

  .not-found-icon {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: rgba(220, 53, 69, 0.12);
    color: var(--desaga-red);
    font-size: 1.4rem;
  }

  .product-shell {
    display: grid;
    grid-template-columns: 1fr;
    gap: 28px;
    align-items: start;
  }

  @media (min-width: 992px) {
    .product-shell {
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    }
  }

  .product-media {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.08);
  }

  .product-shell.promoted .product-media,
  .product-shell.promoted .purchase-card {
    border-color: rgba(194, 37, 45, 0.4);
    box-shadow: 0 18px 44px rgba(194, 37, 45, 0.16), 0 0 0 5px rgba(194, 37, 45, 0.05);
  }

  .promotion-ribbons {
    position: absolute;
    right: 16px;
    top: 16px;
    z-index: 2;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .promotion-ribbons span,
  .promo-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.75);
    background: #c2252d;
    color: #fffdf7;
    box-shadow: 0 10px 24px rgba(194, 37, 45, 0.28);
    padding: 0.42rem 0.78rem;
    font-size: 0.78rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .stock-ribbon {
    position: absolute;
    left: 16px;
    top: 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 900;
    backdrop-filter: blur(8px);
  }

  .stock-ribbon--ok {
    color: #12633a;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(25, 135, 84, 0.24);
  }

  .stock-ribbon--off {
    color: #8a5a00;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 193, 7, 0.35);
  }

  .product-info {
    min-width: 0;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(0, 0, 0, 0.65);
    text-decoration: none;
    font-weight: 800;
    margin-bottom: 18px;
  }

  .top-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 12px;
  }

  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--desaga-blue);
    background: rgba(36, 146, 204, 0.12);
    border: 1px solid rgba(36, 146, 204, 0.25);
    border-radius: 999px;
    padding: 7px 12px;
    font-weight: 900;
  }

  .promo-pill {
    box-shadow: none;
    padding: 7px 12px;
  }

  h1 {
    margin: 0 0 0.8rem;
    color: var(--desaga-brown);
    font-weight: 950;
    letter-spacing: -0.05em;
  }

  .description {
    color: rgba(0, 0, 0, 0.68);
    font-size: 1.08rem;
    line-height: 1.65;
    margin-bottom: 20px;
  }

  .muted {
    opacity: 0.75;
  }

  .purchase-card {
    display: grid;
    gap: 16px;
    border-radius: 22px;
    border: 1px solid rgba(36, 146, 204, 0.15);
    background: #fff;
    padding: 18px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
  }

  .price-label {
    color: rgba(0, 0, 0, 0.56);
    font-weight: 800;
    margin-bottom: 2px;
  }

  .price {
    color: var(--desaga-blue);
    font-weight: 950;
    font-size: 2rem;
    line-height: 1;
  }

  .product-shell.promoted .price {
    color: #c2252d;
  }

  .price span {
    font-size: 1rem;
    opacity: 0.72;
  }

  .price-unit {
    margin-left: 4px;
    font-weight: 850;
  }

  .status-box {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(36, 146, 204, 0.08);
    color: rgba(0, 0, 0, 0.75);
  }

  .status-box i {
    color: var(--desaga-blue);
    font-size: 1.2rem;
    margin-top: 1px;
  }

  .status-box strong,
  .status-box span {
    display: block;
  }

  .status-box span {
    font-size: 0.92rem;
    margin-top: 2px;
  }

  .quantity-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid rgba(36, 146, 204, 0.32);
    background: rgba(36, 146, 204, 0.08);
  }

  .stepper button {
    width: 42px;
    height: 42px;
    border: 0;
    background: transparent;
    color: var(--desaga-blue);
    font-weight: 900;
  }

  .stepper span {
    min-width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    font-weight: 950;
    background: #fff;
    border-left: 1px solid rgba(36, 146, 204, 0.2);
    border-right: 1px solid rgba(36, 146, 204, 0.2);
  }

  .help-strip {
    display: grid;
    gap: 8px;
    margin-top: 16px;
    color: rgba(0, 0, 0, 0.66);
    font-weight: 700;
  }

  .help-strip div {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .help-strip i {
    color: var(--desaga-blue);
  }

  .related-section {
    margin-top: 54px;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .section-head h2 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-brown);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 18px;
  }

  @media (max-width: 767.98px) {
    .related-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
  }

  @media (max-width: 576px) {
    .purchase-card .btn,
    .quantity-row .btn {
      width: 100%;
    }

    .quantity-row {
      align-items: stretch;
    }

    .stepper {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
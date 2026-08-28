<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cart } from '$lib/stores/cart';
  import { fallbackImage, optimizedImageUrl, PLACEHOLDER_IMAGE } from '$lib/images';
  import { productMeasureUnitSuffix, productPromotionBadges } from '$lib/format';
  import { productImageUrls, type Product } from '$lib/stores/products';
  import { categoryMeta as getCategoryMeta, DEFAULT_CATEGORY_SLUG } from '$lib/categories';

  const EMPTY_PRODUCT: Product = {
    id: '',
    name: '',
    description: '',
    category: DEFAULT_CATEGORY_SLUG,
    price: 0,
    measure_unit: 'PER_KG',
    promotion_label: 'NONE',
    image_url: '',
    images: [],
    in_stock: false,
  };

  export let product: Product = EMPTY_PRODUCT;

  function safeText(v: unknown): string {
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  }

  function toNumber(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  $: id = product?.id != null ? String(product.id) : '';
  $: name = safeText(product?.name).trim();
  $: description = safeText(product?.description).trim();
  $: imageUrls = productImageUrls(product);
  $: cardImageUrl = imageUrls[0] || PLACEHOLDER_IMAGE;
  $: cardImageSrc = cardImageUrl === PLACEHOLDER_IMAGE ? PLACEHOLDER_IMAGE : optimizedImageUrl(cardImageUrl, { width: 720, height: 540, quality: 78 });
  $: price = toNumber(product?.price);
  $: measureUnitSuffix = productMeasureUnitSuffix(product?.measure_unit);
  $: promotionBadges = productPromotionBadges(product?.promotion_label);
  $: hasPromotion = promotionBadges.length > 0;
  $: isAvailable = Boolean(product?.in_stock);
  $: currentQty = $cart.items.find((item) => item.productId === id)?.quantity ?? 0;
  $: category = safeText(product?.category);
  $: stockQuantity = toNumber(product?.stock_quantity);
  $: catMeta = getCategoryMeta(category);
  $: href = id ? `/produse/${id}` : undefined;
  $: stockLabel = isAvailable
    ? stockQuantity > 0
      ? `${stockQuantity} în stoc`
      : 'Disponibil'
    : 'Stoc epuizat';

  let lastDelta: 1 | -1 = 1;
  let bumpTick = 0;

  function addToBasket() {
    if (!isAvailable || !id) return;
    lastDelta = 1;
    cart.addProduct(product, 1);
    bumpTick += 1;
  }

  function inc() {
    addToBasket();
  }

  function dec() {
    if (!isAvailable || !id) return;
    lastDelta = -1;
    cart.setQuantity(id, Math.max(0, currentQty - 1));
    bumpTick += 1;
  }

  $: flyY = lastDelta === 1 ? 10 : -10;
</script>

<article class="card" data-available={isAvailable} data-promotion={hasPromotion}>
  <a class="media-link" href={href} tabindex="-1" aria-hidden="true">
    <img
      class="media-img"
      src={cardImageSrc}
      alt=""
      loading="lazy"
      decoding="async"
      on:error={fallbackImage}
    />

    {#if hasPromotion}
      <!-- A printed label pinned to the photo, not a glowing badge. -->
      <div class="flags">
        {#each promotionBadges as badge}
          <span class="flag">{badge}</span>
        {/each}
      </div>
    {/if}
  </a>

  <div class="body">
    <div class="meta">
      <span class="cat">{catMeta.name}</span>
      <span class="stock" data-in={isAvailable}>
        <i class={`bi ${isAvailable ? 'bi-check2' : 'bi-slash-circle'}`} aria-hidden="true"></i>
        {stockLabel}
      </span>
    </div>

    <h3 class="title">
      <a class="title-link" href={href}>{name || 'Produs'}</a>
    </h3>

    <p class="desc">{description || 'Descrierea produsului va fi actualizată în curând.'}</p>

    <div class="footer">
      <p class="price">
        <span class="amount">{price.toFixed(2)}</span>
        <span class="unit">RON / {measureUnitSuffix}</span>
      </p>

      {#if !isAvailable}
        <a class="act act-ghost" href={href}>Detalii</a>
      {:else if currentQty === 0}
        <button class="act act-add" type="button" on:click={addToBasket}>
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
          <span>Adaugă</span>
        </button>
      {:else}
        <div class="stepper" role="group" aria-label={`Cantitate pentru ${name || 'produs'}`}>
          <button class="step" type="button" on:click={dec} aria-label="Scade cantitatea">
            <i class="bi bi-dash-lg" aria-hidden="true"></i>
          </button>
          <span class="qty-wrap">
            {#key `${currentQty}-${bumpTick}`}
              <span class="qty" in:fly={{ y: flyY, duration: 120 }} out:fly={{ y: -flyY, duration: 120 }}>
                {currentQty}
              </span>
            {/key}
          </span>
          <button class="step" type="button" on:click={inc} aria-label="Crește cantitatea">
            <i class="bi bi-plus-lg" aria-hidden="true"></i>
          </button>
        </div>
      {/if}
    </div>
  </div>
</article>

<style>
  /* A produce card is a printed price card: paper, a hairline border, a
     photograph and a number. No elevation, no glow, no pill. */
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    transition: border-color var(--motion-fast) var(--ease);
  }

  @media (hover: hover) and (pointer: fine) {
    .card:hover {
      border-color: var(--line-strong);
    }
  }

  .card[data-available='false'] .media-img {
    filter: saturate(0.45);
  }

  /* Promotion reads as a red rule along the top edge plus the label. That is
     enough signal; it does not need a coloured shadow and a scale transform. */
  .card[data-promotion='true'] {
    border-color: rgba(181, 42, 47, 0.45);
    box-shadow: inset 0 2px 0 0 var(--tomato);
  }

  .media-link {
    display: block;
    position: relative;
    background: var(--paper-2);
    text-decoration: none;
  }

  .media-img {
    display: block;
    width: 100%;
    /* Ratio, not a fixed pixel height: photos arrive at any proportion and
       the grid must not jump while they load. */
    aspect-ratio: 4 / 3;
    object-fit: cover;
    outline: none;
  }

  .flags {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: calc(100% - var(--space-4));
  }

  .flag {
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-sm);
    background: var(--tomato-ink);
    color: #fff;
    font-family: var(--font-display);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.4;
  }

  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: var(--space-3);
  }

  .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-size: var(--text-xs);
  }

  .cat {
    color: var(--ink-3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Stock is the one thing a market customer actually needs, so it carries
     the only colour in the metadata row. */
  .stock {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex: 0 0 auto;
    font-weight: 600;
    color: var(--leaf);
  }

  .stock[data-in='false'] {
    color: var(--clay);
  }

  .title {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 700;
    line-height: var(--leading-snug);
    letter-spacing: -0.01em;
  }

  .title-link {
    color: var(--ink);
    text-decoration: none;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .title-link:hover,
  .title-link:focus-visible {
    color: var(--tomato-ink);
    text-decoration: underline;
  }

  /* The whole card opens the product, so the single accessible link gets a
     card-sized tap target instead of a 22px line of text. */
  .title-link::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .card:focus-within {
    border-color: var(--tomato-ink);
  }

  /* Basket controls stay above the stretched link so they remain clickable. */
  .footer {
    position: relative;
    z-index: 1;
  }

  .desc {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    color: var(--ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-top: auto;
    padding-top: var(--space-3);
  }


  .price {
    margin: 0;
    min-width: 0;
    font-variant-numeric: tabular-nums;
    line-height: 1.15;
  }

  .amount {
    display: block;
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .card[data-promotion='true'] .amount {
    color: var(--tomato-ink);
  }

  .unit {
    display: block;
    margin-top: 1px;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }

  /* Outline by default so a grid of 25 cards stays calm; the accent is spent
     on the page's own primary action instead. */
  .act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    flex: 0 0 auto;
    min-height: 40px;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition-property: background-color, border-color, color;
    transition-duration: var(--motion-fast);
    transition-timing-function: var(--ease);
  }

  .act-add {
    border-color: rgba(181, 42, 47, 0.4);
    color: var(--tomato-ink);
  }

  @media (hover: hover) and (pointer: fine) {
    .act-add:hover {
      background: var(--tomato-ink);
      border-color: var(--tomato-ink);
      color: #fff;
    }

    .act-ghost:hover {
      border-color: var(--line-strong);
      background: var(--paper-2);
    }
  }

  .act-add:focus-visible {
    background: var(--tomato-ink);
    border-color: var(--tomato-ink);
    color: #fff;
  }

  .act-ghost {
    color: var(--ink-2);
  }

  /* Once the product is in the basket the control becomes solid: the filled
     state is what tells you the item is already in there. */
  .stepper {
    display: inline-flex;
    align-items: stretch;
    flex: 0 0 auto;
    border: 1px solid var(--tomato-ink);
    border-radius: var(--radius);
    background: var(--tomato-ink);
    overflow: hidden;
  }

  .step {
    display: grid;
    place-items: center;
    width: 40px;
    min-height: 40px;
    border: 0;
    background: transparent;
    color: #fff;
    cursor: pointer;
  }

  .step:hover,
  .step:focus-visible {
    background: var(--tomato-deep);
  }

  .qty-wrap {
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    min-width: 34px;
    padding-inline: 2px;
    background: #fff;
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .qty {
    grid-area: 1 / 1;
  }

  /* Phones: two per row, so the action goes full width under the price. */
  @media (max-width: 575.98px) {
    .desc {
      display: none;
    }

    .footer {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);
    }

    .act,
    .stepper {
      width: 100%;
    }

    .stepper {
      justify-content: space-between;
    }

    .qty-wrap {
      flex: 1;
    }

    .amount {
      font-size: 1.125rem;
    }
  }
</style>

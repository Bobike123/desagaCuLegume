<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cart } from '$lib/stores/cart';
  import { fallbackImage, optimizedImageUrl, PLACEHOLDER_IMAGE } from '$lib/images';
  import type { Product } from '$lib/stores/products';

  const EMPTY_PRODUCT: Product = {
    id: '',
    name: '',
    description: '',
    category: 'de-sezon',
    price: 0,
    image_url: '',
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
  $: imageUrl =
    typeof product?.image_url === 'string' && product.image_url.trim().length > 0
      ? product.image_url.trim()
      : PLACEHOLDER_IMAGE;
  $: cardImageUrl = imageUrl === PLACEHOLDER_IMAGE ? imageUrl : optimizedImageUrl(imageUrl, { width: 720, height: 540 });
  $: price = toNumber(product?.price);
  $: isAvailable = Boolean(product?.in_stock);
  $: currentQty = $cart.items.find((item) => item.productId === id)?.quantity ?? 0;
  $: category = safeText(product?.category);
  $: stockQuantity = toNumber(product?.stock_quantity);
  $: categoryMeta =
    category === 'la-borcan'
      ? { label: 'La borcan', tone: 'tone-amber' }
      : { label: 'De sezon', tone: 'tone-green' };
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

<article class="card" data-available={isAvailable}>
  <a class="media-link" href={href} aria-label={name || 'Produs'}>
    <img class="img" src={cardImageUrl} alt={name || 'Produs'} loading="lazy" decoding="async" on:error={fallbackImage} />
    <div class="badges">
      <span class={'pill ' + categoryMeta.tone}>
        {categoryMeta.label}
      </span>

      <span class={`pill ${isAvailable ? 'tone-stock' : 'tone-warning'}`}>
        <i class={`bi ${isAvailable ? 'bi-check2-circle' : 'bi-exclamation-triangle'}`}></i>
        {stockLabel}
      </span>
    </div>
  </a>

  <div class="body">
    <a class="content-link" href={href}>
      <h5 class="title">{name || 'Produs'}</h5>
      <p class="desc">{description || 'Descrierea produsului va fi actualizată în curând.'}</p>
    </a>

    <div class="footer">
      <div class="price">
        {price.toFixed(2)} <span class="currency">RON</span>
      </div>

      {#if !isAvailable}
        <a class="details-link" href={href}>Detalii</a>
      {:else if currentQty === 0}
        <button class="btn-add" type="button" on:click={addToBasket}>
          <i class="bi bi-basket"></i>
          Adaugă
        </button>
      {:else}
        <div class="stepper" role="group" aria-label="Cantitate în coș">
          <button class="step-btn" type="button" on:click={dec} aria-label="Scade cantitatea">
            <i class="bi bi-dash"></i>
          </button>
          <div class="qty-wrap" aria-label="Cantitate">
            {#key `${currentQty}-${bumpTick}`}
              <div class={lastDelta === 1 ? 'step-qty qty-up' : 'step-qty qty-down'} in:fly={{ y: flyY, duration: 120 }} out:fly={{ y: -flyY, duration: 120 }}>
                {currentQty}
              </div>
            {/key}
          </div>
          <button class="step-btn" type="button" on:click={inc} aria-label="Crește cantitatea">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      {/if}
    </div>
  </div>
</article>

<style>
  .card {
    width: 100%;
    height: 100%;
    min-height: 340px;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    overflow: hidden;
    background: #fff;
    color: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .card[data-available='false'] {
    opacity: 0.78;
  }

  .media-link,
  .content-link {
    color: inherit;
    text-decoration: none;
  }

  .media-link {
    position: relative;
    display: block;
    height: 160px;
    flex: 0 0 auto;
    background: rgba(0, 0, 0, 0.03);
    overflow: hidden;
  }

  .img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.18s ease;
  }

  .card:hover .img {
    transform: scale(1.03);
  }

  .badges {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 850;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(6px);
    white-space: nowrap;
  }

  .tone-green { border-color: rgba(25, 135, 84, 0.22); background: rgba(25, 135, 84, 0.12); }
  .tone-amber { border-color: rgba(255, 193, 7, 0.28); background: rgba(255, 193, 7, 0.14); }
  .tone-blue { border-color: rgba(13, 110, 253, 0.22); background: rgba(13, 110, 253, 0.12); }
  .tone-purple { border-color: rgba(111, 66, 193, 0.22); background: rgba(111, 66, 193, 0.12); }
  .tone-warning { border-color: rgba(255, 193, 7, 0.35); background: rgba(255, 193, 7, 0.24); }
  .tone-stock { border-color: rgba(25, 135, 84, 0.22); background: rgba(255, 255, 255, 0.92); }

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 12px 14px;
  }

  .content-link {
    flex: 1;
    min-height: 0;
  }

  .content-link:hover .title {
    color: var(--desaga-blue);
  }

  .title {
    margin: 0;
    font-weight: 950;
    font-size: 1rem;
    line-height: 1.2;
    color: #222;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .desc {
    margin: 8px 0 0;
    font-size: 0.88rem;
    color: rgba(0, 0, 0, 0.68);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .footer {
    margin-top: 12px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
  }

  .price {
    font-weight: 950;
    font-size: 1.05rem;
    color: var(--accent, #2492cc);
    line-height: 1;
  }

  .currency {
    font-size: 0.78rem;
    font-weight: 800;
    opacity: 0.75;
    margin-left: 3px;
  }

  .btn-add,
  .details-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(var(--accent-rgb, 36, 146, 204), 0.35);
    background: rgba(var(--accent-rgb, 36, 146, 204), 0.12);
    color: var(--accent, #2492cc);
    font-weight: 900;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
  }

  .details-link {
    color: rgba(0, 0, 0, 0.65);
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border-radius: 12px;
    border: 1px solid rgba(var(--accent-rgb, 36, 146, 204), 0.35);
    background: rgba(var(--accent-rgb, 36, 146, 204), 0.1);
    overflow: hidden;
  }

  .step-btn {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--accent, #2492cc);
    cursor: pointer;
  }

  .qty-wrap {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.6);
    border-left: 1px solid rgba(var(--accent-rgb, 36, 146, 204), 0.22);
    border-right: 1px solid rgba(var(--accent-rgb, 36, 146, 204), 0.22);
  }

  .step-qty {
    font-weight: 950;
    color: #1f2a33;
    line-height: 1;
    will-change: transform, opacity;
    animation: bump 150ms ease-out;
  }

  @keyframes bump {
    0% { transform: scale(0.9); opacity: 0.85; }
    60% { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
</style>

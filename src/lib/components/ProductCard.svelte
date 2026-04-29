<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cart } from '$lib/stores/cart';
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
      : '/placeholder.png';
  $: price = toNumber(product?.price);
  $: isAvailable = Boolean(product?.in_stock);
  $: currentQty = $cart.items.find((item) => item.productId === id)?.quantity ?? 0;
  $: category = safeText(product?.category);
  $: categoryMeta =
    category === 'de-sezon'
      ? { label: 'De Sezon', icon: 'bi-leaf', tone: 'tone-green' }
      : category === 'la-borcan'
        ? { label: 'La Borcan', icon: 'bi-archive', tone: 'tone-amber' }
        : category === 'colaboratori'
          ? { label: 'Colaboratori', icon: 'bi-people', tone: 'tone-blue' }
          : { label: 'HORECA', icon: 'bi-shop', tone: 'tone-purple' };
  $: href = id ? `/produse/${id}` : undefined;

  let lastDelta: 1 | -1 = 1;
  let bumpTick = 0;

  function addToBasket() {
    if (!isAvailable) return;
    lastDelta = 1;
    cart.addProduct(product, 1);
    bumpTick += 1;
  }

  function inc() {
    if (!isAvailable) return;
    lastDelta = 1;
    cart.addProduct(product, 1);
    bumpTick += 1;
  }

  function dec() {
    if (!isAvailable) return;
    lastDelta = -1;
    cart.setQuantity(id, Math.max(0, currentQty - 1));
    bumpTick += 1;
  }

  function stopAll(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  $: flyY = lastDelta === 1 ? 10 : -10;
</script>

<a class="card" {href} aria-disabled={!isAvailable} aria-label={name || 'Produs'}>
  <div class="media">
    <img class="img" src={imageUrl} alt={name} loading="lazy" />
    <div class="badges">
      <span class={'pill ' + categoryMeta.tone}>
        <i class={'bi ' + categoryMeta.icon}></i>
        {categoryMeta.label}
      </span>

      {#if !isAvailable}
        <span class="pill tone-warning">
          <i class="bi bi-exclamation-triangle"></i>
          Stoc epuizat
        </span>
      {/if}
    </div>
  </div>

  <div class="body">
    <div class="content">
      <h5 class="title">{name || 'Produs'}</h5>
      <p class="desc">{description || 'Produs de calitate.'}</p>
    </div>

    <div class="footer">
      <div class="price">
        {price.toFixed(2)} <span class="currency">RON</span>
      </div>

      {#if !isAvailable}
        <div class="cta cta-off">Indisponibil</div>
      {:else if currentQty === 0}
        <button class="btn-add" type="button" on:click|preventDefault|stopPropagation={addToBasket}>
          <i class="bi bi-basket"></i>
          Adaugă
        </button>
      {:else}
        <div class="stepper" role="group" aria-label="Cantitate în coș">
          <button class="step-btn" type="button" on:click|preventDefault|stopPropagation={dec} aria-label="Scade cantitatea">
            <i class="bi bi-dash"></i>
          </button>
          <div class="qty-wrap" aria-label="Cantitate">
            {#key `${currentQty}-${bumpTick}`}
              <div class={lastDelta === 1 ? 'step-qty qty-up' : 'step-qty qty-down'} in:fly={{ y: flyY, duration: 120 }} out:fly={{ y: -flyY, duration: 120 }}>
                {currentQty}
              </div>
            {/key}
          </div>
          <button class="step-btn" type="button" on:click|preventDefault|stopPropagation={inc} aria-label="Crește cantitatea">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      {/if}
    </div>
  </div>
</a>

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
    text-decoration: none;
    color: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .card[aria-disabled='true'] {
    opacity: 0.62;
    filter: grayscale(0.05);
  }

  .media {
    position: relative;
    height: 160px;
    flex: 0 0 auto;
    background: rgba(0, 0, 0, 0.03);
  }

  .img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
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
    font-size: 0.78rem;
    font-weight: 800;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(6px);
    white-space: nowrap;
  }

  .tone-green { border-color: rgba(25, 135, 84, 0.22); background: rgba(25, 135, 84, 0.12); }
  .tone-amber { border-color: rgba(255, 193, 7, 0.28); background: rgba(255, 193, 7, 0.14); }
  .tone-blue { border-color: rgba(13, 110, 253, 0.22); background: rgba(13, 110, 253, 0.12); }
  .tone-purple { border-color: rgba(111, 66, 193, 0.22); background: rgba(111, 66, 193, 0.12); }
  .tone-warning { border-color: rgba(255, 193, 7, 0.35); background: rgba(255, 193, 7, 0.22); }

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 12px 14px;
  }

  .content {
    flex: 1;
    min-height: 0;
  }

  .title {
    margin: 0;
    font-weight: 900;
    font-size: 0.98rem;
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
    margin-top: 10px;
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

  .btn-add {
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

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    font-size: 0.86rem;
    white-space: nowrap;
  }

  .cta-off { color: rgba(0, 0, 0, 0.55); }
</style>


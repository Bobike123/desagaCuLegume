<script lang="ts">
  import { MAX_CART_QUANTITY } from '$lib/cart-limits';
  import { formatMoney, productMeasureUnitSuffix, productPromotionBadges } from '$lib/format';
  import { fallbackImage, optimizedImageUrl, PLACEHOLDER_IMAGE } from '$lib/images';
  import type { CartLine } from '$lib/stores/cart';

  export let items: CartLine[] = [];
  export let onQuantityChange: (productId: string, quantity: number) => void;
  export let onRemove: (productId: string) => void;

  function rawImageUrl(image: { url?: string | null; image_url?: string | null } | string | null | undefined) {
    if (typeof image === 'string') return image.trim();
    return String(image?.url ?? image?.image_url ?? '').trim();
  }

  function cartImageUrl(item: CartLine) {
    const fromGallery = Array.isArray(item.images)
      ? item.images.map(rawImageUrl).find((url) => url.length > 0)
      : '';
    return fromGallery || String(item.image_url ?? '').trim() || PLACEHOLDER_IMAGE;
  }

  function cartImageSrc(item: CartLine) {
    const url = cartImageUrl(item);
    return url === PLACEHOLDER_IMAGE ? PLACEHOLDER_IMAGE : optimizedImageUrl(url, { width: 180, height: 180, quality: 78 });
  }
</script>

<div class="cart-list" role="list">
  {#each items as item (item.productId)}
    <div class:promoted={productPromotionBadges(item.promotion_label).length > 0} class="cart-row" role="listitem">
      <div class="cart-main">
        <a class="thumb" href={`/produse/${item.productId}`} aria-label={`Vezi ${item.name}`}>
          <img src={cartImageSrc(item)} alt={item.name} loading="lazy" decoding="async" on:error={fallbackImage} />
        </a>
        <div class="cart-info">
          <div class="cart-title-line">
            <a class="cart-title" href={`/produse/${item.productId}`}>{item.name}</a>
            {#if productPromotionBadges(item.promotion_label).length > 0}
              <div class="promo-badges" aria-label="Etichete produs">
                {#each productPromotionBadges(item.promotion_label) as badge}
                  <span>{badge}</span>
                {/each}
              </div>
            {/if}
          </div>
          <div class="cart-sub">{formatMoney(item.price)} / {productMeasureUnitSuffix(item.measure_unit)}</div>
          <div class="cart-actions">
            <div class="qty" aria-label={`Cantitate pentru ${item.name}`}>
              <button class="qty-btn" type="button" aria-label="Scade cantitatea" on:click={() => onQuantityChange(item.productId, item.quantity - 1)}>
                <i class="bi bi-dash"></i>
              </button>
              <input
                class="qty-input"
                inputmode="numeric"
                min="0"
                max={MAX_CART_QUANTITY}
                aria-label="Cantitate"
                value={item.quantity}
                on:input={(e) => onQuantityChange(item.productId, Number((e.target as HTMLInputElement).value))}
              />
              <button class="qty-btn" type="button" aria-label="Crește cantitatea" on:click={() => onQuantityChange(item.productId, item.quantity + 1)}>
                <i class="bi bi-plus"></i>
              </button>
            </div>
            <button class="remove-btn" type="button" on:click={() => onRemove(item.productId)}>
              <i class="bi bi-x-lg"></i> Elimină
            </button>
          </div>
        </div>
      </div>
      <div class="cart-price">
        <div class="price">{formatMoney(item.price * item.quantity)}</div>
        <div class="muted small">Total linie</div>
      </div>
    </div>
  {/each}
</div>

<style>
  .cart-list {
    display: grid;
    border-top: 1px solid var(--line-strong);
  }

  /* Cart lines read as rows on a receipt, separated by rules. */
  .cart-row {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-4);
    border-bottom: 1px solid var(--line);
  }

  .cart-row.promoted {
    box-shadow: inset 3px 0 0 0 var(--tomato);
    padding-left: var(--space-3);
  }

  .cart-main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-3);
    align-items: start;
  }

  .thumb {
    display: block;
    width: 72px;
    flex: 0 0 auto;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--paper-2);
  }

  .thumb img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    outline: none;
  }

  .cart-info {
    min-width: 0;
  }

  .cart-title-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .cart-title {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    line-height: var(--leading-snug);
    color: var(--ink);
    text-decoration: none;
  }

  .cart-title:hover,
  .cart-title:focus-visible {
    color: var(--tomato-ink);
    text-decoration: underline;
  }

  .promo-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .promo-badges span {
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-sm);
    background: var(--tomato-ink);
    color: #fff;
    font-family: var(--font-display);
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .cart-sub {
    margin-top: 2px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }

  .cart-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  /* 44px controls: at 36px these were below the touch-target floor and
     awkward to hit while holding a phone one-handed. */
  .qty {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--surface);
  }

  .qty-btn {
    display: grid;
    place-items: center;
    width: 44px;
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }

  .qty-btn:hover,
  .qty-btn:focus-visible {
    background: var(--tomato-wash);
    color: var(--tomato-deep);
  }

  .qty-input {
    width: 52px;
    min-height: 44px;
    padding: 0 var(--space-1);
    border: 0;
    border-inline: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .qty-input:focus {
    outline: 2px solid var(--tomato-ink);
    outline-offset: -2px;
  }

  .remove-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .remove-btn:hover,
  .remove-btn:focus-visible {
    border-color: rgba(181, 42, 47, 0.35);
    background: var(--tomato-wash);
    color: var(--tomato-deep);
  }

  .cart-price {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px dashed var(--line);
  }

  .price {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  .muted {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }

  @media (min-width: 768px) {
    .cart-row {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--space-4);
    }

    .thumb {
      width: 88px;
    }

    .cart-price {
      display: block;
      padding-top: 0;
      border-top: 0;
      text-align: right;
      white-space: nowrap;
    }
  }
</style>

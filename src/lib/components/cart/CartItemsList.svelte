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
  .muted,
  .cart-sub {
    color: rgba(0, 0, 0, 0.65);
  }

  .cart-list {
    display: grid;
    gap: 12px;
  }

  .cart-row {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .cart-row.promoted {
    border-color: rgba(194, 37, 45, 0.34);
    background: linear-gradient(135deg, rgba(194, 37, 45, 0.08), rgba(255, 255, 255, 0.96));
    box-shadow: 0 14px 34px rgba(194, 37, 45, 0.12), 0 0 0 4px rgba(194, 37, 45, 0.04);
  }

  .cart-main {
    display: flex;
    gap: 12px;
    min-width: 0;
  }

  .thumb {
    width: 78px;
    height: 78px;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.05);
    display: grid;
    place-items: center;
    color: rgba(0, 0, 0, 0.45);
    flex: 0 0 auto;
    text-decoration: none;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .cart-info {
    min-width: 0;
  }

  .cart-title-line {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .cart-title {
    display: inline-block;
    font-weight: 900;
    color: inherit;
    text-decoration: none;
  }

  .promo-badges {
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .promo-badges span {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    border-radius: 999px;
    padding: 0.24rem 0.52rem;
    background: #c2252d;
    color: #fffdf7;
    font-size: 0.7rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .cart-title:hover {
    color: var(--desaga-blue);
  }

  .cart-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
  }

  .qty {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(36, 146, 204, 0.35);
    background: #fff;
  }

  .qty-btn {
    border: 0;
    background: rgba(36, 146, 204, 0.1);
    width: 36px;
    height: 36px;
    color: var(--desaga-blue);
    font-weight: 900;
  }

  .qty-input {
    width: 56px;
    border: 0;
    text-align: center;
    height: 36px;
    font-weight: 900;
  }

  .remove-btn {
    border: 0;
    background: transparent;
    color: #dc3545;
    font-weight: 800;
  }

  .cart-price {
    text-align: right;
    min-width: 120px;
  }

  .price {
    font-weight: 900;
    font-size: 1.05rem;
  }

  .cart-row.promoted .price,
  .cart-row.promoted .cart-title {
    color: #c2252d;
  }

  @media (max-width: 767.98px) {
    .cart-row {
      flex-direction: column;
    }

    .cart-price {
      width: 100%;
      text-align: left;
      min-width: 0;
    }
  }
</style>

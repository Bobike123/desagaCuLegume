<script lang="ts">
  import { onMount, tick } from 'svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import type { Product } from '$lib/stores/products';

  // One horizontal, snapping product slider for a single category. The home page
  // renders one of these per category that has products. Behaviour (scroll snap,
  // settle, prev/next, the occasional "peek" nudge) is self-contained here so the
  // page just maps over categories.
  export let kicker = '';
  export let title = '';
  export let titleId = '';
  export let products: Product[] = [];

  const SETTLE_DELAY = 130;
  const NUDGE_DURATION = 1500;
  const FIRST_NUDGE_MIN = 4000;
  const FIRST_NUDGE_MAX = 9000;
  const NUDGE_MIN = 15000;
  const NUDGE_MAX = 20000;

  let viewport: HTMLDivElement | null = null;
  let slideIndex = 0;
  let visibleItems = 4;
  let nudge = false;
  let scrollTimer: number | null = null;
  let nudgeTimer: number | null = null;
  let nudgeResetTimer: number | null = null;

  $: maxIndex = Math.max(0, products.length - visibleItems);
  $: if (slideIndex > maxIndex) slideIndex = maxIndex;

  function shouldAnimate() {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function clamp(value: number, max: number) {
    return Math.min(Math.max(value, 0), max);
  }

  function randomBetween(min: number, max: number) {
    return Math.floor(min + Math.random() * (max - min));
  }

  function updateVisibleItems() {
    if (typeof window === 'undefined') return;
    visibleItems = window.innerWidth >= 992 ? 4 : 2;
    void scrollToIndex(slideIndex, false);
  }

  function sliderItems() {
    if (!viewport) return [];
    return Array.from(viewport.querySelectorAll<HTMLElement>('[data-slide-index]'));
  }

  function leftForIndex(index: number) {
    const items = sliderItems();
    const first = items[0];
    const target = items[index];
    if (!first || !target) return 0;
    return Math.max(0, target.offsetLeft - first.offsetLeft);
  }

  function nearestIndex() {
    const items = sliderItems();
    const first = items[0];
    if (!viewport || !first || items.length === 0) return 0;

    const currentLeft = viewport.scrollLeft;
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const item of items) {
      const index = Number(item.dataset.slideIndex ?? 0);
      const itemLeft = Math.max(0, item.offsetLeft - first.offsetLeft);
      const distance = Math.abs(currentLeft - itemLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    }

    return clamp(nearest, maxIndex);
  }

  async function scrollToIndex(index: number, smooth = true) {
    await tick();
    if (!viewport) return;
    viewport.scrollTo({ left: leftForIndex(index), behavior: smooth && shouldAnimate() ? 'smooth' : 'auto' });
  }

  function settle() {
    if (!viewport) return;
    const nearest = nearestIndex();
    slideIndex = nearest;
    void scrollToIndex(nearest, true);
  }

  function scheduleSettle() {
    if (typeof window === 'undefined') return;
    if (scrollTimer !== null) window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      scrollTimer = null;
      settle();
    }, SETTLE_DELAY);
  }

  function handleScroll() {
    if (!viewport) return;
    const nearest = nearestIndex();
    if (nearest !== slideIndex) slideIndex = nearest;
    scheduleSettle();
  }

  function move(direction: 1 | -1) {
    const next = clamp(slideIndex + direction, maxIndex);
    if (next === slideIndex) return;
    slideIndex = next;
    void scrollToIndex(slideIndex);
  }

  function triggerNudge() {
    if (typeof window === 'undefined' || !shouldAnimate()) return;
    if (products.length <= visibleItems) return;

    nudge = true;
    if (nudgeResetTimer !== null) window.clearTimeout(nudgeResetTimer);
    nudgeResetTimer = window.setTimeout(() => {
      nudge = false;
      nudgeResetTimer = null;
    }, NUDGE_DURATION);
  }

  function scheduleNudge(delay: number) {
    if (typeof window === 'undefined' || !shouldAnimate()) return;
    if (nudgeTimer !== null) window.clearTimeout(nudgeTimer);
    nudgeTimer = window.setTimeout(() => {
      nudgeTimer = null;
      triggerNudge();
      scheduleNudge(randomBetween(NUDGE_MIN, NUDGE_MAX));
    }, delay);
  }

  function clearTimers() {
    if (typeof window === 'undefined') return;
    for (const timer of [scrollTimer, nudgeTimer, nudgeResetTimer]) {
      if (timer !== null) window.clearTimeout(timer);
    }
    scrollTimer = null;
    nudgeTimer = null;
    nudgeResetTimer = null;
  }

  onMount(() => {
    updateVisibleItems();
    window.addEventListener('resize', updateVisibleItems);
    scheduleNudge(randomBetween(FIRST_NUDGE_MIN, FIRST_NUDGE_MAX));

    return () => {
      window.removeEventListener('resize', updateVisibleItems);
      clearTimers();
    };
  });
</script>

<section class="product-slider-panel" aria-labelledby={titleId}>
  <div class="slider-head">
    <div>
      <span class="slider-kicker">{kicker}</span>
      <h3 id={titleId}>{title}</h3>
    </div>

    <div class="slider-meta">
      <span class="slider-count">
        {slideIndex + 1}–{Math.min(slideIndex + visibleItems, products.length)} din {products.length}
      </span>
    </div>
  </div>

  <div class="slider-shell">
    <button
      type="button"
      class="slider-btn slider-btn-side slider-btn-prev"
      aria-label={`${title}: produsele anterioare`}
      disabled={slideIndex === 0}
      on:click={() => move(-1)}
    >
      <i class="bi bi-chevron-left"></i>
    </button>

    <div
      class="slider-window"
      bind:this={viewport}
      aria-label={`Slider ${title}`}
      aria-live="polite"
      role="region"
      on:scroll={handleScroll}
      on:touchend={settle}
      on:pointerup={settle}
    >
      <div class="slider-track" class:slider-track-nudge={nudge}>
        {#each products as product, index (product.id)}
          <div class="grid-item slider-item home-slider-item" data-slide-index={index}>
            <ProductCard {product} />
          </div>
        {/each}
      </div>
    </div>

    <button
      type="button"
      class="slider-btn slider-btn-side slider-btn-next"
      aria-label={`${title}: produsele următoare`}
      disabled={slideIndex >= maxIndex}
      on:click={() => move(1)}
    >
      <i class="bi bi-chevron-right"></i>
    </button>
  </div>
</section>

<style>
  .product-slider-panel {
    overflow: hidden;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.07);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
  }

  .slider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: linear-gradient(135deg, rgba(var(--accent-rgb, 36, 146, 204), 0.08), rgba(255, 255, 255, 0.94));
  }

  .slider-kicker {
    display: inline-flex;
    margin-bottom: 0.28rem;
    color: var(--accent, #2492cc);
    font-size: 0.72rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .slider-head h3 {
    margin: 0;
    font-size: 1.08rem;
    font-weight: 950;
    letter-spacing: -0.01em;
  }

  .slider-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex: 0 0 auto;
  }

  .slider-count {
    display: none;
    color: rgba(0, 0, 0, 0.62);
    font-size: 0.82rem;
    font-weight: 850;
    white-space: nowrap;
  }

  .slider-btn {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    border: 1px solid rgba(var(--accent-rgb, 36, 146, 204), 0.26);
    background: rgba(var(--accent-rgb, 36, 146, 204), 0.1);
    color: var(--accent, #2492cc);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.12s ease,
      background 0.12s ease,
      border-color 0.12s ease,
      opacity 0.12s ease;
  }

  .slider-btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  .slider-btn-side {
    position: absolute;
    top: 50%;
    z-index: 4;
    width: 52px;
    height: 58px;
    font-size: 1.45rem;
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(var(--accent-rgb, 36, 146, 204), 0.34);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  }

  .slider-btn-prev {
    left: 8px;
    transform: translateY(-50%);
  }

  .slider-btn-next {
    right: 8px;
    transform: translateY(-50%);
  }

  .slider-btn-prev:hover:not(:disabled),
  .slider-btn-prev:focus-visible:not(:disabled),
  .slider-btn-next:hover:not(:disabled),
  .slider-btn-next:focus-visible:not(:disabled) {
    transform: translateY(-50%) scale(1.03);
    outline: none;
  }

  .slider-btn-prev:active:not(:disabled),
  .slider-btn-next:active:not(:disabled) {
    transform: translateY(-50%) scale(0.98);
  }

  .slider-shell {
    position: relative;
    padding: 0 58px;
  }

  .slider-window {
    --slider-gap: 14px;
    --slider-peek-distance: min(140px, 36vw);
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 14px 0;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 0;
    scrollbar-width: none;
    overscroll-behavior-inline: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x pan-y;
  }

  .slider-window:focus-visible {
    outline: 3px solid rgba(var(--accent-rgb, 36, 146, 204), 0.28);
    outline-offset: -3px;
  }

  .slider-window::-webkit-scrollbar {
    display: none;
  }

  .slider-track {
    display: flex;
    gap: var(--slider-gap);
    align-items: stretch;
  }

  .slider-track-nudge {
    animation: slider-peek 1.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes slider-peek {
    0%,
    100% {
      transform: translateX(0);
    }

    42%,
    62% {
      transform: translateX(calc(-1 * var(--slider-peek-distance)));
    }
  }

  .slider-item {
    flex: 0 0 calc((100% - var(--slider-gap)) / 2);
    min-width: 0;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .slider-item :global(*) {
    -webkit-tap-highlight-color: transparent;
  }

  @media (min-width: 576px) {
    .slider-item {
      flex-basis: calc((100% - var(--slider-gap)) / 2);
    }

    .slider-count {
      display: inline-flex;
    }
  }

  @media (min-width: 992px) {
    .slider-item {
      flex-basis: calc((100% - (var(--slider-gap) * 3)) / 4);
    }
  }

  @media (max-width: 575.98px) {
    .product-slider-panel {
      border-radius: 20px;
      border-color: rgba(var(--accent-rgb, 36, 146, 204), 0.14);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    }

    .slider-head {
      align-items: center;
      flex-direction: row;
      padding: 13px 16px 11px;
      background: linear-gradient(135deg, rgba(var(--accent-rgb, 36, 146, 204), 0.1), rgba(255, 255, 255, 0.96));
    }

    .slider-kicker {
      margin-bottom: 0.16rem;
      font-size: 0.64rem;
      letter-spacing: 0.09em;
    }

    .slider-head h3 {
      font-size: 1rem;
      line-height: 1.05;
    }

    .slider-meta {
      align-self: center;
    }

    .slider-count {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      min-height: 0;
      padding: 0.32rem 0.52rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.74);
      border: 1px solid rgba(var(--accent-rgb, 36, 146, 204), 0.16);
      color: rgba(15, 23, 42, 0.72);
      font-size: 0.7rem;
      line-height: 1;
    }

    .slider-shell {
      padding: 0;
    }

    .slider-window {
      --slider-gap: 8px;
      --slider-peek-distance: min(96px, 32vw);
      padding: 12px 18px 16px;
      scroll-padding-inline: 18px;
    }

    .slider-item {
      flex: 0 0 clamp(132px, 41.5vw, 158px);
    }

    .slider-btn-side {
      width: 34px;
      height: 44px;
      font-size: 1rem;
      opacity: 0.92;
      background: rgba(255, 255, 255, 0.94);
      border-color: rgba(var(--accent-rgb, 36, 146, 204), 0.3);
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
    }

    .slider-btn-side:disabled {
      opacity: 0.2;
    }

    .slider-btn-prev {
      left: 4px;
    }

    .slider-btn-next {
      right: 4px;
    }

    /* Compact, app-style product cards inside the home sliders. */
    .home-slider-item :global(.card) {
      min-height: 0 !important;
      border-radius: 12px !important;
      box-shadow: none !important;
      transform: none !important;
    }

    .home-slider-item :global(.card[data-promotion='true']) {
      border-color: rgba(194, 37, 45, 0.28) !important;
      box-shadow: 0 8px 18px rgba(194, 37, 45, 0.1) !important;
    }

    .home-slider-item :global(.media-link) {
      height: 86px !important;
    }

    .home-slider-item :global(.promo-stack) {
      top: 5px !important;
      right: 5px !important;
      gap: 3px !important;
      max-width: calc(100% - 10px) !important;
    }

    .home-slider-item :global(.promo-badge) {
      min-height: 18px !important;
      padding: 0.16rem 0.34rem !important;
      font-size: 0.5rem !important;
      letter-spacing: 0.04em !important;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.14) !important;
    }

    .home-slider-item :global(.promo-badge::before) {
      width: 5px !important;
      height: 5px !important;
      margin-right: 4px !important;
      box-shadow: 0 0 0 2px rgba(194, 37, 45, 0.12) !important;
    }

    .home-slider-item :global(.badges) {
      left: 5px !important;
      right: 5px !important;
      bottom: 5px !important;
      gap: 3px !important;
    }

    .home-slider-item :global(.badges .pill:first-child) {
      display: none !important;
    }

    .home-slider-item :global(.pill) {
      padding: 0.16rem 0.34rem !important;
      font-size: 0.54rem !important;
      gap: 3px !important;
    }

    .home-slider-item :global(.body) {
      padding: 7px 8px 9px !important;
    }

    .home-slider-item :global(.title) {
      font-size: 0.76rem !important;
      line-height: 1.13 !important;
      letter-spacing: -0.01em !important;
    }

    .home-slider-item :global(.footer) {
      margin-top: 7px !important;
      gap: 6px !important;
    }

    .home-slider-item :global(.price) {
      font-size: 0.84rem !important;
      line-height: 1.05 !important;
    }

    .home-slider-item :global(.currency),
    .home-slider-item :global(.unit) {
      margin-left: 1px !important;
      font-size: 0.58rem !important;
    }

    .home-slider-item :global(.btn-add),
    .home-slider-item :global(.details-link) {
      min-height: 32px !important;
      padding: 0.32rem 0.45rem !important;
      border-radius: 10px !important;
      font-size: 0.74rem !important;
      gap: 5px !important;
    }

    .home-slider-item :global(.step-btn) {
      width: 32px !important;
      height: 32px !important;
    }

    .home-slider-item :global(.qty-wrap) {
      height: 32px !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slider-window {
      scroll-behavior: auto;
    }

    .slider-btn {
      transition: none;
    }

    .slider-track-nudge {
      animation: none;
      transform: none;
    }
  }
</style>

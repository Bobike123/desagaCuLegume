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
  /* The slider is a shelf on the market board: a titled band with a hairline
     frame. The previous version was a shadowed white card whose arrow buttons
     overlapped and clipped the first and last product. */
  .product-slider-panel {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }

  .slider-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line);
    background: var(--paper-2);
  }

  .slider-kicker {
    display: block;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--tomato-ink);
  }

  .slider-head h3 {
    margin: 2px 0 0;
    font-size: var(--text-lg);
  }

  .slider-meta {
    flex: 0 0 auto;
  }

  .slider-count {
    font-size: var(--text-xs);
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .slider-shell {
    position: relative;
  }

  .slider-window {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .slider-window::-webkit-scrollbar {
    display: none;
  }

  /* Flex, not grid: with grid-auto-columns: minmax(0, 50%) and 26 products
     the free space goes negative and every track collapses to its 0 minimum,
     which rendered the shelf as a row of hairlines. A flex item's percentage
     width resolves against the scroll port instead, so each card keeps its
     size and the track simply overflows. */
  .slider-track {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3);
    align-items: stretch;
  }

  .slider-item {
    flex: 0 0 auto;
    /* Two cards plus a sliver of the third, so the shelf reads as scrollable. */
    width: calc(50% - var(--space-4));
    min-width: 148px;
    scroll-snap-align: start;
    display: flex;
  }

  .slider-item > :global(*) {
    width: 100%;
  }

  /* Arrows are desktop-only: on touch the shelf is swiped. They sit in the
     header band rather than on top of the products. */
  .slider-btn {
    display: none;
  }

  @media (min-width: 576px) {
    .slider-item {
      width: calc(33.333% - var(--space-4));
    }
  }

  @media (min-width: 992px) {
    .slider-track {
      padding: var(--space-4);
      gap: var(--space-4);
    }

    .slider-item {
      width: calc(25% - var(--space-4));
    }

    .slider-shell {
      display: flex;
      align-items: stretch;
    }

    .slider-btn {
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      width: 44px;
      border: 0;
      border-inline: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink-2);
      cursor: pointer;
      transition: background-color var(--motion-fast) var(--ease),
        color var(--motion-fast) var(--ease);
    }

    .slider-btn-prev {
      border-left: 0;
      order: -1;
    }

    .slider-btn-next {
      border-right: 0;
    }

    .slider-btn:hover:not(:disabled),
    .slider-btn:focus-visible:not(:disabled) {
      background: var(--tomato-wash);
      color: var(--tomato-deep);
    }

    .slider-btn:disabled {
      color: var(--line-strong);
      cursor: default;
    }

    .slider-window {
      flex: 1;
      min-width: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slider-window {
      scroll-behavior: auto;
    }

    .slider-btn {
      transition: none;
    }
  }
</style>

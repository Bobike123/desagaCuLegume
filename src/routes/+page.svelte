<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import { getAllProducts, sortProductPriority, type Product } from '$lib/stores/products';
  import { getAllEvents, type Event } from '$lib/stores/events';
  import { onMount, tick } from 'svelte';

  const MAX_VISIBLE_SLIDER_ITEMS = 4;
  const SLIDER_SETTLE_DELAY = 130;
  const SLIDER_ANIMATION_DURATION = 480;
  const SLIDER_ARROW_STEP = 3;
  const FIRST_SLIDER_NUDGE_DELAY = 4000;
  const MIN_SLIDER_NUDGE_DELAY = 15000;
  const MAX_SLIDER_NUDGE_DELAY = 20000;
  const SLIDER_NUDGE_DURATION = 1500;

  let products: Product[] = [];
  let events: Event[] = [];
  let loadingProducts = true;
  let loadingEvents = true;
  let borcaneSlideIndex = 0;
  let sezonSlideIndex = 0;
  let visibleSliderItems = MAX_VISIBLE_SLIDER_ITEMS;
  let borcaneSliderViewport: HTMLDivElement | null = null;
  let sezonSliderViewport: HTMLDivElement | null = null;
  let borcaneScrollTimer: number | null = null;
  let sezonScrollTimer: number | null = null;
  let sliderNudgeTimer: number | null = null;
  let sliderNudgeResetTimer: number | null = null;
  let borcaneNudge = false;
  let sezonNudge = false;
  let sortedProducts: Product[] = [];
  let borcaneProducts: Product[] = [];
  let sezonProducts: Product[] = [];
  let borcaneMaxIndex = 0;
  let sezonMaxIndex = 0;
  let hasCatalogProducts = false;

  const heroTitle = 'Legume locale, proaspete, în\u00A0Cluj\u2011Napoca';

  const contact = {
    phone: '+40 729 969 822',
    phoneHref: 'tel:+40729969822',
    address: 'Str. Constantin Brâncuși nr. 153, Cluj\u2011Napoca',
    shortAddress: 'Brâncuși 153',
    schedule: 'L–V: 9:00–18:00',
  };

  const orderSteps = [
    {
      title: 'Alegi produsele',
      text: 'Vezi produsele disponibile și adaugă în coș ce vrei să ridici sau să comanzi.',
    },
    {
      title: 'Confirmi comanda',
      text: 'Trimiți comanda, iar disponibilitatea se confirmă în funcție de stocul real.',
    },
    {
      title: 'Ridici sau primești livrarea',
      text: 'Ridicare de la rulota DeSaga sau livrare în Cluj\u2011Napoca, confirmată telefonic.',
    },
  ];

  onMount(() => {
    let mounted = true;

    void (async () => {
      try {
        loadingProducts = true;
        const loadedProducts = await getAllProducts();

        if (mounted) {
          products = loadedProducts;
        }
      } finally {
        if (mounted) {
          loadingProducts = false;
        }
      }

      try {
        loadingEvents = true;
        const loadedEvents = await getAllEvents();

        if (mounted) {
          events = loadedEvents;
        }
      } finally {
        if (mounted) {
          loadingEvents = false;
        }
      }

      if (mounted) {
        updateVisibleSliderItems();
      }
    })();

    window.addEventListener('resize', updateVisibleSliderItems);
    scheduleSliderNudge(FIRST_SLIDER_NUDGE_DELAY);

    return () => {
      mounted = false;
      window.removeEventListener('resize', updateVisibleSliderItems);
      clearSliderTimers();
    };
  });

  function productCategory(product: Product) {
    const raw = String(product.category ?? '').toLowerCase().trim();

    if (raw === 'la-borcan' || raw === 'borcane' || raw.includes('borcan')) {
      return 'la-borcan';
    }

    return 'de-sezon';
  }

  function updateVisibleSliderItems() {
    if (typeof window === 'undefined') return;

    if (window.innerWidth >= 992) {
      visibleSliderItems = 4;
    } else {
      visibleSliderItems = 2;
    }

    void syncSliderPositions(false);
  }

  async function syncSliderPositions(smooth = false) {
    await tick();

    borcaneSlideIndex = clampSliderIndex(borcaneSlideIndex, borcaneMaxIndex);
    sezonSlideIndex = clampSliderIndex(sezonSlideIndex, sezonMaxIndex);

    await scrollSliderToIndex(borcaneSliderViewport, borcaneSlideIndex, smooth);
    await scrollSliderToIndex(sezonSliderViewport, sezonSlideIndex, smooth);
  }

  function clearSliderTimers() {
    if (typeof window === 'undefined') return;

    if (borcaneScrollTimer !== null) {
      window.clearTimeout(borcaneScrollTimer);
      borcaneScrollTimer = null;
    }

    if (sezonScrollTimer !== null) {
      window.clearTimeout(sezonScrollTimer);
      sezonScrollTimer = null;
    }

    if (sliderNudgeTimer !== null) {
      window.clearTimeout(sliderNudgeTimer);
      sliderNudgeTimer = null;
    }

    if (sliderNudgeResetTimer !== null) {
      window.clearTimeout(sliderNudgeResetTimer);
      sliderNudgeResetTimer = null;
    }

    cancelSliderAnimation(borcaneSliderViewport);
    cancelSliderAnimation(sezonSliderViewport);
  }

  function clampSliderIndex(value: number, max: number) {
    return Math.min(Math.max(value, 0), max);
  }

  function shouldAnimateSlider() {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function randomSliderNudgeDelay() {
    return Math.floor(
      MIN_SLIDER_NUDGE_DELAY + Math.random() * (MAX_SLIDER_NUDGE_DELAY - MIN_SLIDER_NUDGE_DELAY)
    );
  }

  function scheduleSliderNudge(delay = randomSliderNudgeDelay()) {
    if (typeof window === 'undefined' || !shouldAnimateSlider()) return;

    if (sliderNudgeTimer !== null) {
      window.clearTimeout(sliderNudgeTimer);
    }

    sliderNudgeTimer = window.setTimeout(() => {
      sliderNudgeTimer = null;
      triggerSliderNudge();
      scheduleSliderNudge();
    }, delay);
  }

  function triggerSliderNudge() {
    if (typeof window === 'undefined' || !shouldAnimateSlider()) return;

    const availableSliders = [
      { key: 'borcane', canNudge: borcaneProducts.length > visibleSliderItems },
      { key: 'sezon', canNudge: sezonProducts.length > visibleSliderItems },
    ].filter((item) => item.canNudge);

    if (availableSliders.length === 0) return;

    const target = availableSliders[Math.floor(Math.random() * availableSliders.length)]?.key;

    borcaneNudge = target === 'borcane';
    sezonNudge = target === 'sezon';

    if (sliderNudgeResetTimer !== null) {
      window.clearTimeout(sliderNudgeResetTimer);
    }

    sliderNudgeResetTimer = window.setTimeout(() => {
      borcaneNudge = false;
      sezonNudge = false;
      sliderNudgeResetTimer = null;
    }, SLIDER_NUDGE_DURATION);
  }

  function getSliderItems(viewport: HTMLDivElement | null) {
    if (!viewport) return [];
    return Array.from(viewport.querySelectorAll<HTMLElement>('[data-slide-index]'));
  }

  function getSliderLeftForIndex(viewport: HTMLDivElement | null, index: number) {
    const items = getSliderItems(viewport);
    const first = items[0];
    const target = items[index];

    if (!first || !target) return 0;

    return Math.max(0, target.offsetLeft - first.offsetLeft);
  }

  function getNearestSliderIndex(viewport: HTMLDivElement | null, maxIndex: number) {
    const items = getSliderItems(viewport);
    const first = items[0];

    if (!viewport || !first || items.length === 0) return 0;

    const currentLeft = viewport.scrollLeft;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const item of items) {
      const index = Number(item.dataset.slideIndex ?? 0);
      const itemLeft = Math.max(0, item.offsetLeft - first.offsetLeft);
      const distance = Math.abs(currentLeft - itemLeft);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return clampSliderIndex(nearestIndex, maxIndex);
  }

  // Scripted arrow animation instead of native smooth scrollTo: with
  // scroll-snap-type mandatory, native smooth scrolling jumps instantly in
  // Safari and can be cut short elsewhere, so the slide was not visible.
  type SliderAnimation = { frame: number; restoreSnap: string; restoreBehavior: string };
  const sliderAnimations = new Map<HTMLDivElement, SliderAnimation>();

  function cancelSliderAnimation(viewport: HTMLDivElement | null) {
    if (!viewport) return;

    const animation = sliderAnimations.get(viewport);
    if (!animation) return;

    cancelAnimationFrame(animation.frame);
    viewport.style.scrollSnapType = animation.restoreSnap;
    viewport.style.scrollBehavior = animation.restoreBehavior;
    sliderAnimations.delete(viewport);
  }

  function isSliderAnimating(viewport: HTMLDivElement | null) {
    return Boolean(viewport && sliderAnimations.has(viewport));
  }

  function animateSliderTo(viewport: HTMLDivElement, targetLeft: number) {
    const from = viewport.scrollLeft;
    const delta = targetLeft - from;

    if (Math.abs(delta) < 1) {
      cancelSliderAnimation(viewport);
      return;
    }

    // Keep the original inline values across chained clicks: a restarted
    // animation must not capture the temporary 'none'/'auto' as the restore
    // point.
    const existing = sliderAnimations.get(viewport);
    const restoreSnap = existing ? existing.restoreSnap : viewport.style.scrollSnapType;
    const restoreBehavior = existing ? existing.restoreBehavior : viewport.style.scrollBehavior;
    if (existing) cancelAnimationFrame(existing.frame);

    // Mandatory snap and CSS smooth behavior both fight a scripted scroll;
    // park them while the animation runs.
    viewport.style.scrollSnapType = 'none';
    viewport.style.scrollBehavior = 'auto';

    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const stepFrame = (now: number) => {
      const progress = Math.min(1, (now - startTime) / SLIDER_ANIMATION_DURATION);
      viewport.scrollLeft = from + delta * easeOutCubic(progress);

      if (progress < 1) {
        sliderAnimations.set(viewport, {
          frame: requestAnimationFrame(stepFrame),
          restoreSnap,
          restoreBehavior,
        });
      } else {
        viewport.style.scrollSnapType = restoreSnap;
        viewport.style.scrollBehavior = restoreBehavior;
        sliderAnimations.delete(viewport);
      }
    };

    sliderAnimations.set(viewport, {
      frame: requestAnimationFrame(stepFrame),
      restoreSnap,
      restoreBehavior,
    });
  }

  async function scrollSliderToIndex(viewport: HTMLDivElement | null, index: number, smooth = true) {
    await tick();

    if (!viewport) return;

    const left = getSliderLeftForIndex(viewport, index);

    // Deliberately not gated on prefers-reduced-motion: OS-level "animations
    // off" (e.g. GNOME) would otherwise make arrow presses jump instantly.
    // This is short, user-initiated, functional motion; only the decorative
    // idle nudge respects the OS setting (shouldAnimateSlider).
    if (smooth) {
      animateSliderTo(viewport, left);
    } else {
      cancelSliderAnimation(viewport);
      viewport.scrollTo({ left, behavior: 'auto' });
    }
  }

  function settleSlider(
    viewport: HTMLDivElement | null,
    maxIndex: number,
    setIndex: (index: number) => void
  ) {
    if (!viewport) return;

    const nearestIndex = getNearestSliderIndex(viewport, maxIndex);
    setIndex(nearestIndex);
    void scrollSliderToIndex(viewport, nearestIndex, true);
  }

  function settleBorcaneSlider() {
    settleSlider(borcaneSliderViewport, borcaneMaxIndex, (index) => {
      borcaneSlideIndex = index;
    });
  }

  function settleSezonSlider() {
    settleSlider(sezonSliderViewport, sezonMaxIndex, (index) => {
      sezonSlideIndex = index;
    });
  }

  function scheduleBorcaneSettle() {
    if (typeof window === 'undefined') return;

    if (borcaneScrollTimer !== null) {
      window.clearTimeout(borcaneScrollTimer);
    }

    borcaneScrollTimer = window.setTimeout(() => {
      borcaneScrollTimer = null;
      settleBorcaneSlider();
    }, SLIDER_SETTLE_DELAY);
  }

  function scheduleSezonSettle() {
    if (typeof window === 'undefined') return;

    if (sezonScrollTimer !== null) {
      window.clearTimeout(sezonScrollTimer);
    }

    sezonScrollTimer = window.setTimeout(() => {
      sezonScrollTimer = null;
      settleSezonSlider();
    }, SLIDER_SETTLE_DELAY);
  }

  function handleBorcaneScroll() {
    if (!borcaneSliderViewport || isSliderAnimating(borcaneSliderViewport)) return;

    const nearestIndex = getNearestSliderIndex(borcaneSliderViewport, borcaneMaxIndex);

    if (nearestIndex !== borcaneSlideIndex) {
      borcaneSlideIndex = nearestIndex;
    }

    scheduleBorcaneSettle();
  }

  function handleSezonScroll() {
    if (!sezonSliderViewport || isSliderAnimating(sezonSliderViewport)) return;

    const nearestIndex = getNearestSliderIndex(sezonSliderViewport, sezonMaxIndex);

    if (nearestIndex !== sezonSlideIndex) {
      sezonSlideIndex = nearestIndex;
    }

    scheduleSezonSettle();
  }

  function moveBorcaneSlider(direction: 1 | -1) {
    const nextIndex = clampSliderIndex(borcaneSlideIndex + direction * SLIDER_ARROW_STEP, borcaneMaxIndex);
    if (nextIndex === borcaneSlideIndex) return;

    borcaneSlideIndex = nextIndex;
    void scrollSliderToIndex(borcaneSliderViewport, borcaneSlideIndex);
  }

  function moveSezonSlider(direction: 1 | -1) {
    const nextIndex = clampSliderIndex(sezonSlideIndex + direction * SLIDER_ARROW_STEP, sezonMaxIndex);
    if (nextIndex === sezonSlideIndex) return;

    sezonSlideIndex = nextIndex;
    void scrollSliderToIndex(sezonSliderViewport, sezonSlideIndex);
  }

  $: sortedProducts = [...products].sort((a, b) => {
    const stockRank = Number(Boolean(b.in_stock)) - Number(Boolean(a.in_stock));
    return stockRank || sortProductPriority(a, b);
  });
  $: borcaneProducts = sortedProducts.filter((product) => productCategory(product) === 'la-borcan');
  $: sezonProducts = sortedProducts.filter((product) => productCategory(product) === 'de-sezon');
  $: borcaneMaxIndex = Math.max(0, borcaneProducts.length - visibleSliderItems);
  $: sezonMaxIndex = Math.max(0, sezonProducts.length - visibleSliderItems);
  $: if (borcaneSlideIndex > borcaneMaxIndex) borcaneSlideIndex = borcaneMaxIndex;
  $: if (sezonSlideIndex > sezonMaxIndex) sezonSlideIndex = sezonMaxIndex;
  $: hasCatalogProducts = borcaneProducts.length > 0 || sezonProducts.length > 0;
  $: availableCount = products.filter((product) => product.in_stock).length;
  $: upcoming = events.slice(0, 3);
</script>

<svelte:head>
  <title>Acasă - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Legume locale, produse de sezon și produse la borcan în Cluj-Napoca. Vezi stocul de azi sau comandă telefonic de la DeSaga cu Legume."
  />
</svelte:head>

<Hero
  title={heroTitle}
  subtitle="Vezi stocul de azi, adaugă produsele în coș și ridică de la rulota DeSaga sau primește livrarea în Cluj-Napoca."
  backgroundImage="/images/home/hero-produse-locale.jpg"
  height="430px"
  primaryHref="/produse"
  primaryLabel="Vezi produsele disponibile"
/>

<section class="section">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">Stoc de azi</span>
        <h2 class="h4 fw-bold m-0">Stocul disponibil</h2>
        <p class="stock-note">
          {#if loadingProducts}
            Se încarcă produsele…
          {:else if availableCount > 0}
            {availableCount} produse disponibile azi - disponibilitatea variază după recoltă.
          {:else}
            Stocul se confirmă telefonic la <a href={contact.phoneHref}>{contact.phone}</a>.
          {/if}
        </p>
      </div>
      <a href="/produse" class="btn btn-outline-accent btn-sm">
        Vezi toate <i class="bi bi-arrow-right"></i>
      </a>
    </div>

    {#if loadingProducts}
      <div class="catalog-sliders" aria-label="Se încarcă produsele">
        {#each ['Produse la borcan', 'Produse de sezon'] as title}
          <div class="product-slider-panel">
            <div class="slider-head">
              <div>
                <span class="slider-kicker">Catalog</span>
                <h3>{title}</h3>
              </div>
              <div class="slider-controls skeleton-controls">
                <span></span>
                <span></span>
              </div>
            </div>

            <div class="slider-grid">
              {#each Array(4) as _}
                <div class="skeleton-card skeleton-product"></div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else if !hasCatalogProducts}
      <div class="empty-state">
        <div class="empty-title">Nu avem produse afișate momentan</div>
        <div class="empty-sub">
          Produsele se actualizează în funcție de recoltă. Pentru stocul de azi, sună la {contact.phone}.
        </div>
        <div class="actions">
          <a href={contact.phoneHref} class="btn btn-accent">
            <i class="bi bi-telephone"></i> Sună pentru stoc
          </a>
          <a href="/contact" class="btn btn-outline-accent">
            <i class="bi bi-geo-alt"></i> Vezi locația
          </a>
        </div>
      </div>
    {:else}
      <div class="catalog-sliders">
        {#if borcaneProducts.length > 0}
        <section class="product-slider-panel" aria-labelledby="borcane-slider-title">
          <div class="slider-head">
            <div>
              <span class="slider-kicker">La borcan</span>
              <h3 id="borcane-slider-title">Borcane</h3>
            </div>

            <div class="slider-meta">
              <span class="slider-count">
                {#if borcaneProducts.length > 0}
                  {borcaneSlideIndex + 1}–{Math.min(borcaneSlideIndex + visibleSliderItems, borcaneProducts.length)} din {borcaneProducts.length}
                {:else}
                  0 produse
                {/if}
              </span>
            </div>
          </div>

          <div class="slider-shell">
            <button
              type="button"
              class="slider-btn slider-btn-side slider-btn-prev"
              aria-label="Produsele la borcan anterioare"
              disabled={borcaneSlideIndex === 0}
              on:click={() => moveBorcaneSlider(-1)}
            >
              <i class="bi bi-chevron-left"></i>
            </button>

            <div
              class="slider-window"
              bind:this={borcaneSliderViewport}
              aria-label="Slider produse la borcan"
              aria-live="polite"
              role="region"
              on:scroll={handleBorcaneScroll}
              on:touchstart={() => cancelSliderAnimation(borcaneSliderViewport)}
              on:wheel={() => cancelSliderAnimation(borcaneSliderViewport)}
              on:touchend={settleBorcaneSlider}
              on:pointerup={settleBorcaneSlider}
            >
              <div class="slider-track" class:slider-track-nudge={borcaneNudge}>
                {#each borcaneProducts as product, index (product.id)}
                  <div class="grid-item slider-item home-slider-item" data-slide-index={index}>
                    <ProductCard {product} />
                  </div>
                {/each}
              </div>
            </div>

            <button
              type="button"
              class="slider-btn slider-btn-side slider-btn-next"
              aria-label="Produsele la borcan următoare"
              disabled={borcaneSlideIndex >= borcaneMaxIndex}
              on:click={() => moveBorcaneSlider(1)}
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </section>
        {/if}

        {#if sezonProducts.length > 0}
        <section class="product-slider-panel" aria-labelledby="sezon-slider-title">
          <div class="slider-head">
            <div>
              <span class="slider-kicker">De sezon</span>
              <h3 id="sezon-slider-title">Produse de sezon</h3>
            </div>

            <div class="slider-meta">
              <span class="slider-count">
                {#if sezonProducts.length > 0}
                  {sezonSlideIndex + 1}–{Math.min(sezonSlideIndex + visibleSliderItems, sezonProducts.length)} din {sezonProducts.length}
                {:else}
                  0 produse
                {/if}
              </span>
            </div>
          </div>

          <div class="slider-shell">
            <button
              type="button"
              class="slider-btn slider-btn-side slider-btn-prev"
              aria-label="Produsele de sezon anterioare"
              disabled={sezonSlideIndex === 0}
              on:click={() => moveSezonSlider(-1)}
            >
              <i class="bi bi-chevron-left"></i>
            </button>

            <div
              class="slider-window"
              bind:this={sezonSliderViewport}
              aria-label="Slider produse de sezon"
              aria-live="polite"
              role="region"
              on:scroll={handleSezonScroll}
              on:touchstart={() => cancelSliderAnimation(sezonSliderViewport)}
              on:wheel={() => cancelSliderAnimation(sezonSliderViewport)}
              on:touchend={settleSezonSlider}
              on:pointerup={settleSezonSlider}
            >
              <div class="slider-track" class:slider-track-nudge={sezonNudge}>
                {#each sezonProducts as product, index (product.id)}
                  <div class="grid-item slider-item home-slider-item" data-slide-index={index}>
                    <ProductCard {product} />
                  </div>
                {/each}
              </div>
            </div>

            <button
              type="button"
              class="slider-btn slider-btn-side slider-btn-next"
              aria-label="Produsele de sezon următoare"
              disabled={sezonSlideIndex >= sezonMaxIndex}
              on:click={() => moveSezonSlider(1)}
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </section>
        {/if}
      </div>
    {/if}

    <div class="text-center mt-4 d-lg-none">
      <a href="/produse" class="btn btn-outline-accent btn-lg">
        <i class="bi bi-arrow-right"></i> Vezi toate produsele
      </a>
    </div>
  </div>
</section>

<section class="section bg-soft">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">Comandă</span>
        <h2 class="h4 fw-bold m-0">Cum cumperi de la DeSaga</h2>
      </div>
    </div>

    <div class="grid three-col order-steps">
      {#each orderSteps as step, index}
        <article class="step-card">
          <div class="step-number">{index + 1}</div>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>
      {/each}
    </div>

    <p class="order-note">
      Ridicare de la rulota DeSaga ({contact.shortAddress}, {contact.schedule}) sau livrare în
      Cluj&#8209;Napoca — detaliile se confirmă telefonic la
      <a href={contact.phoneHref}>{contact.phone}</a>.
    </p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">Noutăți</span>
        <h2 class="h4 fw-bold m-0">
          <i class="bi bi-calendar-event"></i> Evenimente
        </h2>
      </div>
      <a href="/evenimente" class="btn btn-outline-accent btn-sm">
        Vezi toate <i class="bi bi-arrow-right"></i>
      </a>
    </div>

    {#if loadingEvents}
      <div class="grid events-grid" aria-label="Se încarcă evenimentele">
        {#each Array(3) as _}
          <div class="skeleton-card skeleton-event"></div>
        {/each}
      </div>
    {:else if upcoming.length === 0}
      <div class="empty-state">
        <div class="empty-title">Nu avem evenimente afișate momentan</div>
        <div class="empty-sub">Urmărește pagina de evenimente pentru noutăți.</div>
        <a href="/evenimente" class="btn btn-outline-accent mt-3">
          <i class="bi bi-calendar-event"></i> Evenimente
        </a>
      </div>
    {:else}
      <div class="grid events-grid">
        {#each upcoming as item (item.id)}
          <div class="grid-item">
            <EventCard event={{ ...item, image_url: item.image_url ?? undefined }} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2492cc);
    --accent-rgb: 36, 146, 204;
  }

  :global(.hero h1),
  :global(.hero-title),
  :global(.hero__title) {
    line-height: 1.08 !important;
  }

  .section {
    padding: 3.25rem 0;
  }

  .bg-soft {
    background: rgba(var(--accent-rgb), 0.06);
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 1rem;
  }

  .section-kicker {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.35rem;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .grid {
    display: grid;
    gap: 14px;
  }

  .three-col,
  .events-grid {
    grid-template-columns: 1fr;
  }

  .catalog-sliders {
    display: grid;
    gap: 18px;
  }

  .product-slider-panel {
    overflow: hidden;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.07);
  }

  .slider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08), rgba(255, 255, 255, 0.94));
  }

  .slider-kicker {
    display: inline-flex;
    margin-bottom: 0.28rem;
    color: var(--accent);
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

  .slider-controls,
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
    border: 1px solid rgba(var(--accent-rgb), 0.26);
    background: rgba(var(--accent-rgb), 0.1);
    color: var(--accent);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.12s ease,
      background 0.12s ease,
      border-color 0.12s ease,
      opacity 0.12s ease;
  }

  .slider-btn:hover:not(:disabled),
  .slider-btn:focus-visible:not(:disabled) {
    transform: translateY(-1px);
    background: rgba(var(--accent-rgb), 0.16);
    border-color: rgba(var(--accent-rgb), 0.46);
    outline: none;
  }

  .slider-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.97);
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
    border-color: rgba(var(--accent-rgb), 0.34);
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
    outline: 3px solid rgba(var(--accent-rgb), 0.28);
    outline-offset: -3px;
  }

  .slider-window::-webkit-scrollbar {
    display: none;
  }

  .slider-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 14px;
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

  @media (max-width: 575.98px) {
    .slider-shell {
      padding: 0;
    }

    .slider-window {
      --slider-gap: 8px;
      --slider-peek-distance: min(96px, 32vw);
      padding: 12px 18px 16px;
      scroll-padding-inline: 18px;
    }

    .slider-track {
      gap: var(--slider-gap);
    }

    .slider-item {
      flex: 0 0 clamp(132px, 41.5vw, 158px);
    }

    .slider-btn-side {
      width: 34px;
      height: 44px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.94);
      border-color: rgba(var(--accent-rgb), 0.3);
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
    }

    .slider-btn-prev {
      left: 4px;
    }

    .slider-btn-next {
      right: 4px;
    }
  }

  .slider-item :global(*) {
    -webkit-tap-highlight-color: transparent;
  }

  .skeleton-controls span {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.07);
  }

  @media (min-width: 576px) {
    .slider-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .slider-item {
      flex-basis: calc((100% - var(--slider-gap)) / 2);
    }

    .slider-count {
      display: inline-flex;
    }
  }

  @media (min-width: 768px) {
    .events-grid,
    .three-col {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 992px) {
    .slider-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .slider-item {
      flex-basis: calc((100% - (var(--slider-gap) * 3)) / 4);
    }
  }

  .stock-note {
    margin: 0.4rem 0 0;
    color: rgba(0, 0, 0, 0.62);
    font-size: 0.9rem;
  }

  .stock-note a {
    color: var(--accent);
    font-weight: 900;
    text-decoration: none;
  }

  .step-card,
  .empty-state {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .actions {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .order-note {
    margin: 18px 0 0;
    color: rgba(0, 0, 0, 0.62);
    font-size: 0.95rem;
  }

  .order-note a {
    color: var(--accent);
    font-weight: 900;
    text-decoration: none;
  }

  .step-card {
    padding: 20px;
  }

  .step-number {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-weight: 950;
  }

  .step-card h3 {
    margin: 1rem 0 0.45rem;
    font-size: 1.05rem;
    font-weight: 950;
  }

  .step-card p {
    margin: 0;
    color: rgba(0, 0, 0, 0.66);
    line-height: 1.45;
  }

  .skeleton-card {
    width: 100%;
    border-radius: 16px;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.06),
      rgba(0, 0, 0, 0.1),
      rgba(0, 0, 0, 0.06)
    );
    background-size: 200% 100%;
    animation: shimmer 1.25s infinite linear;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .skeleton-product {
    height: 360px;
  }

  .skeleton-event {
    height: 320px;
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

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }

  .empty-state {
    padding: 18px;
    background: rgba(0, 0, 0, 0.02);
    box-shadow: none;
  }

  .empty-title {
    font-weight: 950;
    font-size: 1.05rem;
  }

  .empty-sub {
    opacity: 0.75;
    margin-top: 4px;
  }

  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.22);
    font-weight: 900;
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    filter: brightness(0.95);
    box-shadow: 0 12px 26px rgba(var(--accent-rgb), 0.28);
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.55) !important;
    color: var(--accent) !important;
    font-weight: 900;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.12) !important;
    border-color: rgba(var(--accent-rgb), 0.75) !important;
    color: var(--accent) !important;
  }

  @media (max-width: 575.98px) {
    :global(.hero h1),
    :global(.hero-title),
    :global(.hero__title) {
      line-height: 1.1 !important;
    }

    .section-head {
      align-items: flex-start;
      flex-direction: column;
    }

    .catalog-sliders {
      gap: 16px;
      margin-inline: -2px;
    }

    .product-slider-panel {
      border-radius: 20px;
      border-color: rgba(var(--accent-rgb), 0.14);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    }

    .slider-head {
      align-items: center;
      flex-direction: row;
      padding: 13px 16px 11px;
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.1), rgba(255, 255, 255, 0.96));
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

    .slider-controls {
      width: 100%;
      justify-content: space-between;
      gap: 10px;
    }

    .slider-count {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      min-height: 0;
      padding: 0.32rem 0.52rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.74);
      border: 1px solid rgba(var(--accent-rgb), 0.16);
      color: rgba(15, 23, 42, 0.72);
      font-size: 0.7rem;
      line-height: 1;
    }

    .slider-btn:not(.slider-btn-side) {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .slider-btn-side {
      opacity: 0.92;
    }

    .slider-btn-side:disabled {
      opacity: 0.2;
    }

    .slider-window {
      --slider-gap: 8px;
      padding: 12px 18px 16px;
      scroll-padding-inline: 18px;
    }

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

    .actions,
    .actions a {
      width: 100%;
    }

    .actions a {
      justify-content: center;
    }
  }
</style>
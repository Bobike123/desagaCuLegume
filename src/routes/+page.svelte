<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import { getAllProducts, sortProductPriority, type Product } from '$lib/stores/products';
  import { getAllEvents, type Event } from '$lib/stores/events';
  import { onMount, tick } from 'svelte';

  const MAX_VISIBLE_SLIDER_ITEMS = 4;
  const SLIDER_SETTLE_DELAY = 130;

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

  const heroFacts = [
    { href: '/contact', icon: 'bi-geo-alt-fill', label: contact.address },
    { href: '/contact', icon: 'bi-clock-fill', label: contact.schedule },
    { href: contact.phoneHref, icon: 'bi-telephone-fill', label: contact.phone },
  ];

  const quickLinks = [
    {
      href: '/produse',
      icon: 'bi-basket',
      label: 'Vezi stocul de azi',
      text: 'Produse disponibile și prețuri actuale',
    },
    {
      href: contact.phoneHref,
      icon: 'bi-telephone',
      label: 'Sună pentru comandă',
      text: contact.phone,
    },
    {
      href: '/contact',
      icon: 'bi-geo-alt',
      label: 'Ridicare de la rulotă',
      text: contact.shortAddress,
    },
    {
      href: '/produse/de-sezon',
      icon: 'bi-flower1',
      label: 'Produse de sezon',
      text: 'Alegi ce este disponibil acum',
    },
  ];

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

  const trustItems = [
    {
      icon: 'bi-arrow-repeat',
      title: 'Stoc actualizat după recoltă',
      text: 'Disponibilitatea se schimbă natural. Produsele afișate vin din catalogul aplicației.',
    },
    {
      icon: 'bi-bag-check',
      title: 'Coș conectat la produsele reale',
      text: 'Adaugi produse direct din lista încărcată prin API, fără liste statice separate.',
    },
    {
      icon: 'bi-telephone',
      title: 'Confirmare rapidă',
      text: 'Pentru stoc, ridicare și livrare, ai numărul de telefon vizibil în primul ecran.',
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
    } else if (window.innerWidth >= 576) {
      visibleSliderItems = 2;
    } else {
      visibleSliderItems = 1;
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
  }

  function clampSliderIndex(value: number, max: number) {
    return Math.min(Math.max(value, 0), max);
  }

  function shouldAnimateSlider() {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  async function scrollSliderToIndex(viewport: HTMLDivElement | null, index: number, smooth = true) {
    await tick();

    if (!viewport) return;

    const left = getSliderLeftForIndex(viewport, index);

    viewport.scrollTo({
      left,
      behavior: smooth && shouldAnimateSlider() ? 'smooth' : 'auto',
    });
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
    if (!borcaneSliderViewport) return;

    const nearestIndex = getNearestSliderIndex(borcaneSliderViewport, borcaneMaxIndex);

    if (nearestIndex !== borcaneSlideIndex) {
      borcaneSlideIndex = nearestIndex;
    }

    scheduleBorcaneSettle();
  }

  function handleSezonScroll() {
    if (!sezonSliderViewport) return;

    const nearestIndex = getNearestSliderIndex(sezonSliderViewport, sezonMaxIndex);

    if (nearestIndex !== sezonSlideIndex) {
      sezonSlideIndex = nearestIndex;
    }

    scheduleSezonSettle();
  }

  function moveBorcaneSlider(direction: 1 | -1) {
    const nextIndex = clampSliderIndex(borcaneSlideIndex + direction, borcaneMaxIndex);
    if (nextIndex === borcaneSlideIndex) return;

    borcaneSlideIndex = nextIndex;
    void scrollSliderToIndex(borcaneSliderViewport, borcaneSlideIndex);
  }

  function moveSezonSlider(direction: 1 | -1) {
    const nextIndex = clampSliderIndex(sezonSlideIndex + direction, sezonMaxIndex);
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
  eyebrow="DeSaga cu Legume"
  title={heroTitle}
  subtitle="Vezi stocul de azi, adaugă produsele în coș și ridică de la rulota DeSaga. Pentru confirmare rapidă, sună direct."
  backgroundImage="/images/home/hero-produse-locale.jpg"
  height="430px"
  primaryHref="/produse"
  primaryLabel="Vezi produsele disponibile"
  secondaryHref={contact.phoneHref}
  secondaryLabel="Sună acum"
  facts={heroFacts}
/>

<section class="section section-compact">
  <div class="container">
    <div class="order-strip">
      <div class="order-copy">
        <span class="eyebrow">Stoc de azi</span>
        <h2>
          {#if loadingProducts}
            Se încarcă produsele
          {:else if availableCount > 0}
            {availableCount} produse disponibile
          {:else}
            Stocul se confirmă telefonic
          {/if}
        </h2>
        <p>
          Lista de produse este încărcată din catalogul aplicației. Disponibilitatea poate varia în funcție de recoltă și vânzări.
        </p>
      </div>

      <div class="strip-actions">
        <a href="/produse" class="btn btn-accent btn-lg">
          <i class="bi bi-basket"></i> Cumpără din stoc
        </a>
        <a href={contact.phoneHref} class="phone-pill">
          <i class="bi bi-telephone-fill"></i>
          <span>{contact.phone}</span>
        </a>
      </div>
    </div>
  </div>
</section>

<section class="section section-compact pt-0">
  <div class="container">
    <div class="quick-grid" aria-label="Acțiuni rapide">
      {#each quickLinks as item (item.href)}
        <a class="quick-card" href={item.href}>
          <span class="quick-icon"><i class={'bi ' + item.icon}></i></span>
          <span class="quick-body">
            <span class="quick-label">{item.label}</span>
            <span class="quick-text">{item.text}</span>
          </span>
          <i class="bi bi-arrow-right short-arrow" aria-hidden="true"></i>
        </a>
      {/each}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">Catalog</span>
        <h2 class="h4 fw-bold m-0">Stocul disponibil</h2>
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
        <section class="product-slider-panel" aria-labelledby="borcane-slider-title">
          <div class="slider-head">
            <div>
              <span class="slider-kicker">La borcan</span>
              <h3 id="borcane-slider-title">Borcane</h3>
            </div>

            <div class="slider-controls">
              <span class="slider-count">
                {#if borcaneProducts.length > 0}
                  {borcaneSlideIndex + 1}–{Math.min(borcaneSlideIndex + visibleSliderItems, borcaneProducts.length)} din {borcaneProducts.length}
                {:else}
                  0 produse
                {/if}
              </span>
              <button
                type="button"
                class="slider-btn"
                aria-label="Produsele la borcan anterioare"
                disabled={borcaneSlideIndex === 0}
                on:click={() => moveBorcaneSlider(-1)}
              >
                <i class="bi bi-chevron-left"></i>
              </button>
              <button
                type="button"
                class="slider-btn"
                aria-label="Produsele la borcan următoare"
                disabled={borcaneSlideIndex >= borcaneMaxIndex}
                on:click={() => moveBorcaneSlider(1)}
              >
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {#if borcaneProducts.length === 0}
            <div class="category-empty">
              Nu avem produse la borcan afișate momentan.
            </div>
          {:else}
            <div
              class="slider-window"
              bind:this={borcaneSliderViewport}
              aria-label="Slider produse la borcan"
              aria-live="polite"
              role="region"
              on:scroll={handleBorcaneScroll}
              on:touchend={settleBorcaneSlider}
              on:pointerup={settleBorcaneSlider}
            >
              <div class="slider-track">
                {#each borcaneProducts as product, index (product.id)}
                  <div class="grid-item slider-item" data-slide-index={index}>
                    <ProductCard {product} />
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </section>

        <section class="product-slider-panel" aria-labelledby="sezon-slider-title">
          <div class="slider-head">
            <div>
              <span class="slider-kicker">De sezon</span>
              <h3 id="sezon-slider-title">Produse de sezon</h3>
            </div>

            <div class="slider-controls">
              <span class="slider-count">
                {#if sezonProducts.length > 0}
                  {sezonSlideIndex + 1}–{Math.min(sezonSlideIndex + visibleSliderItems, sezonProducts.length)} din {sezonProducts.length}
                {:else}
                  0 produse
                {/if}
              </span>
              <button
                type="button"
                class="slider-btn"
                aria-label="Produsele de sezon anterioare"
                disabled={sezonSlideIndex === 0}
                on:click={() => moveSezonSlider(-1)}
              >
                <i class="bi bi-chevron-left"></i>
              </button>
              <button
                type="button"
                class="slider-btn"
                aria-label="Produsele de sezon următoare"
                disabled={sezonSlideIndex >= sezonMaxIndex}
                on:click={() => moveSezonSlider(1)}
              >
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {#if sezonProducts.length === 0}
            <div class="category-empty">
              Nu avem produse de sezon afișate momentan.
            </div>
          {:else}
            <div
              class="slider-window"
              bind:this={sezonSliderViewport}
              aria-label="Slider produse de sezon"
              aria-live="polite"
              role="region"
              on:scroll={handleSezonScroll}
              on:touchend={settleSezonSlider}
              on:pointerup={settleSezonSlider}
            >
              <div class="slider-track">
                {#each sezonProducts as product, index (product.id)}
                  <div class="grid-item slider-item" data-slide-index={index}>
                    <ProductCard {product} />
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </section>
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
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="grid two-col">
      <div class="panel panel-soft">
        <div class="panel-head">
          <h2 class="h5 fw-bold m-0">
            <i class="bi bi-shop-window"></i> Ridicare și livrare
          </h2>
          <span class="badge-soft">confirmare rapidă</span>
        </div>

        <div class="list">
          <div class="list-row">
            <span class="list-icon"><i class="bi bi-geo-alt-fill"></i></span>
            <div class="list-text">
              <div class="list-title">Ridicare de la rulota DeSaga</div>
              <div class="list-sub">{contact.address}</div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-clock-fill"></i></span>
            <div class="list-text">
              <div class="list-title">Program</div>
              <div class="list-sub">{contact.schedule}</div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-truck"></i></span>
            <div class="list-text">
              <div class="list-title">Livrare în Cluj\u2011Napoca</div>
              <div class="list-sub">Costul și intervalul se confirmă telefonic în funcție de comandă.</div>
            </div>
          </div>
        </div>

        <div class="actions">
          <a href={contact.phoneHref} class="btn btn-accent">
            <i class="bi bi-telephone"></i> Sună acum
          </a>
          <a href="/contact" class="btn btn-outline-accent">
            <i class="bi bi-map"></i> Hartă și contact
          </a>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2 class="h5 fw-bold m-0">
            <i class="bi bi-shield-check"></i> De ce e mai simplu
          </h2>
        </div>

        <div class="list">
          {#each trustItems as item}
            <div class="list-row">
              <span class="list-icon"><i class={'bi ' + item.icon}></i></span>
              <div class="list-text">
                <div class="list-title">{item.title}</div>
                <div class="list-sub">{item.text}</div>
              </div>
            </div>
          {/each}
        </div>

        <div class="actions">
          <a href="/produse" class="btn btn-accent">
            <i class="bi bi-basket"></i> Vezi produsele
          </a>
          <a href="/despre-noi" class="btn btn-outline-accent">
            <i class="bi bi-info-circle"></i> Despre noi
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="panel seasonal-panel">
      <div>
        <span class="section-kicker">Sezon</span>
        <h2 class="h4 fw-bold mb-2">Produse locale, în ritmul sezonului</h2>
        <p class="m-0 text-muted">
          Disponibilitatea se schimbă în funcție de recoltă. Verifică produsele de sezon înainte să comanzi.
        </p>
      </div>

      <div class="category-pills">
        <a href="/produse/de-sezon" class="category-pill"><i class="bi bi-flower1"></i> De sezon</a>
        <a href="/produse/la-borcan" class="category-pill"><i class="bi bi-jar"></i> La borcan</a>
      </div>
    </div>
  </div>
</section>

<section class="section bg-soft">
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
    padding: 2.5rem 0;
  }

  .section-compact {
    padding: 1.25rem 0;
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

  .section-kicker,
  .eyebrow {
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

  .two-col,
  .three-col,
  .events-grid {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
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

  .slider-controls {
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

  .slider-window {
    --slider-gap: 14px;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 14px;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 14px;
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

  .slider-item {
    flex: 0 0 100%;
    min-width: 0;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .slider-item :global(*) {
    -webkit-tap-highlight-color: transparent;
  }

  .category-empty {
    margin: 14px;
    padding: 18px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.025);
    border: 1px dashed rgba(0, 0, 0, 0.12);
    color: rgba(0, 0, 0, 0.66);
    font-weight: 800;
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
    .products-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .events-grid,
    .three-col {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 992px) {
    .two-col {
      grid-template-columns: 1fr 1fr;
      align-items: stretch;
    }

    .products-grid,
    .slider-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .slider-item {
      flex-basis: calc((100% - (var(--slider-gap) * 3)) / 4);
    }
  }

  .order-strip {
    margin-top: -3.25rem;
    position: relative;
    z-index: 5;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.12);
  }

  @media (min-width: 768px) {
    .order-strip {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      padding: 1.25rem;
    }
  }

  .order-copy h2 {
    margin: 0;
    font-weight: 950;
    letter-spacing: -0.02em;
  }

  .order-copy p {
    margin: 0.35rem 0 0;
    color: rgba(0, 0, 0, 0.68);
  }

  .strip-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .phone-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0.65rem 1rem;
    border-radius: 999px;
    text-decoration: none;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.1);
    border: 1px solid rgba(var(--accent-rgb), 0.24);
    font-weight: 950;
  }

  .phone-pill:hover {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.16);
  }

  .quick-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .quick-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .quick-card {
    min-height: 108px;
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    border-radius: 18px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.07);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.05);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      border-color 0.12s ease;
  }

  .quick-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.09);
    border-color: rgba(var(--accent-rgb), 0.3);
  }

  .quick-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .quick-body {
    flex: 1 1 auto;
    min-width: 0;
  }

  .quick-label {
    display: block;
    font-weight: 950;
    line-height: 1.1;
  }

  .quick-text {
    display: block;
    margin-top: 0.25rem;
    color: rgba(0, 0, 0, 0.62);
    font-size: 0.88rem;
    line-height: 1.25;
  }

  .short-arrow {
    opacity: 0.55;
  }

  .panel,
  .step-card,
  .empty-state,
  .seasonal-panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
  }

  .panel {
    padding: 16px;
    height: 100%;
  }

  .panel-soft {
    background: rgba(var(--accent-rgb), 0.06);
    border-color: rgba(var(--accent-rgb), 0.18);
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .badge-soft {
    display: inline-flex;
    align-items: center;
    font-size: 0.78rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(var(--accent-rgb), 0.14);
    border: 1px solid rgba(var(--accent-rgb), 0.25);
    color: var(--accent);
    white-space: nowrap;
    font-weight: 900;
  }

  .actions {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .list {
    display: grid;
    gap: 10px;
  }

  .list-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .panel:not(.panel-soft) .list-row {
    background: rgba(0, 0, 0, 0.02);
  }

  .list-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .list-title {
    font-weight: 950;
    line-height: 1.2;
  }

  .list-sub {
    font-size: 0.92rem;
    opacity: 0.78;
    margin-top: 2px;
  }

  .step-card {
    padding: 16px;
    min-height: 190px;
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
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.24);
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

  .seasonal-panel {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
  }

  @media (min-width: 768px) {
    .seasonal-panel {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
  }

  .category-pills {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.65rem 0.85rem;
    border-radius: 999px;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.1);
    border: 1px solid rgba(var(--accent-rgb), 0.22);
    text-decoration: none;
    font-weight: 900;
  }

  .category-pill:hover {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.16);
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

    .slider-btn,
    .quick-card {
      transition: none;
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

    .product-slider-panel {
      border-radius: 18px;
    }

    .slider-head {
      align-items: stretch;
      flex-direction: column;
      padding: 14px 14px 10px;
    }

    .slider-controls {
      width: 100%;
      justify-content: space-between;
      gap: 10px;
    }

    .slider-count {
      display: inline-flex;
      flex: 1 1 auto;
      align-items: center;
      min-height: 46px;
    }

    .slider-btn {
      width: 46px;
      height: 46px;
      font-size: 1.05rem;
    }

    .slider-window {
      --slider-gap: 12px;
      padding: 12px;
      scroll-padding-inline: 12px;
    }

    .strip-actions,
    .strip-actions a,
    .actions,
    .actions a {
      width: 100%;
    }

    .strip-actions a,
    .actions a {
      justify-content: center;
    }
  }
</style>
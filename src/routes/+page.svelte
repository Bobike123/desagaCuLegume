<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';
  import CategorySlider from '$lib/components/CategorySlider.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import { getAllProducts, sortProductPriority, type Product } from '$lib/stores/products';
  import { getAllEvents, type Event } from '$lib/stores/events';
  import { PRODUCT_CATEGORIES, categoryMeta } from '$lib/categories';
  import { onMount } from 'svelte';

  let products: Product[] = [];
  let events: Event[] = [];
  let loadingProducts = true;
  let loadingEvents = true;
  let sortedProducts: Product[] = [];

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

    })();

    return () => {
      mounted = false;
    };
  });

  function productCategorySlug(product: Product) {
    return categoryMeta(product.category).slug;
  }

  $: sortedProducts = [...products].sort((a, b) => {
    const stockRank = Number(Boolean(b.in_stock)) - Number(Boolean(a.in_stock));
    return stockRank || sortProductPriority(a, b);
  });
  $: categoryBuckets = PRODUCT_CATEGORIES.map((category) => ({
    slug: category.slug,
    kicker: category.homeKicker,
    title: category.name,
    products: sortedProducts.filter((product) => productCategorySlug(product) === category.slug),
  })).filter((bucket) => bucket.products.length > 0);
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
        {#each Array(2) as _}
          <div class="slider-skeleton">
            <div class="slider-skeleton__head">
              <span class="slider-skeleton__title"></span>
              <span class="slider-skeleton__count"></span>
            </div>
            <div class="slider-skeleton__grid">
              {#each Array(4) as _}
                <div class="skeleton-card skeleton-product"></div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else if categoryBuckets.length === 0}
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
        {#each categoryBuckets as bucket (bucket.slug)}
          <CategorySlider
            kicker={bucket.kicker}
            title={bucket.title}
            products={bucket.products}
            titleId={`slider-${bucket.slug}`}
          />
        {/each}
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
              <div class="list-title">Livrare în Cluj&#8209;Napoca</div>
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

  .slider-skeleton {
    overflow: hidden;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.07);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
  }

  .slider-skeleton__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08), rgba(255, 255, 255, 0.94));
  }

  .slider-skeleton__title,
  .slider-skeleton__count {
    height: 18px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
  }

  .slider-skeleton__title {
    width: 160px;
  }

  .slider-skeleton__count {
    width: 64px;
  }

  .slider-skeleton__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 14px;
  }

  @media (min-width: 992px) {
    .slider-skeleton__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
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

    .products-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
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

  .panel,
  .step-card,
  .empty-state {
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

    .actions,
    .actions a {
      width: 100%;
    }

    .actions a {
      justify-content: center;
    }
  }
</style>
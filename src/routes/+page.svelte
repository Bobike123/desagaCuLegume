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

<section class="section-y">
  <div class="container">
    <div class="sec-head">
      <div>
        <span class="sec-kicker">Stoc de azi</span>
        <h2 class="sec-title">Stocul disponibil</h2>
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
      <a href="/produse" class="btn btn-outline-accent btn-sm see-all">
        Vezi toate <i class="bi bi-arrow-right" aria-hidden="true"></i>
      </a>
    </div>

    {#if loadingProducts}
      <div class="catalog-sliders" aria-label="Se încarcă produsele">
        {#each Array(2) as _}
          <div class="slider-skeleton">
            <div class="slider-skeleton__head">
              <span class="skeleton skeleton-bar" style="width: 150px"></span>
              <span class="skeleton skeleton-bar" style="width: 60px"></span>
            </div>
            <div class="slider-skeleton__grid">
              {#each Array(4) as _}
                <div class="skeleton skeleton-product"></div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else if categoryBuckets.length === 0}
      <div class="empty-state">
        <p class="empty-title">Nu avem produse afișate momentan</p>
        <p class="empty-sub">
          Produsele se actualizează în funcție de recoltă. Pentru stocul de azi, sună la {contact.phone}.
        </p>
        <div class="actions">
          <a href={contact.phoneHref} class="btn btn-accent">
            <i class="bi bi-telephone" aria-hidden="true"></i> Sună pentru stoc
          </a>
          <a href="/contact" class="btn btn-outline-accent">
            <i class="bi bi-geo-alt" aria-hidden="true"></i> Vezi locația
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

    <div class="see-all-mobile d-lg-none">
      <a href="/produse" class="btn btn-outline-accent">
        Vezi toate produsele <i class="bi bi-arrow-right" aria-hidden="true"></i>
      </a>
    </div>
  </div>
</section>

<!-- Ordering: a printed three-step band, not three identical cards. The
     numerals do the work; no boxes required. -->
<section class="section-y band">
  <div class="container">
    <h2 class="sec-title rule-mark steps-title">Cum cumperi de la DeSaga</h2>

    <ol class="steps">
      {#each orderSteps as step, index}
        <li class="step">
          <span class="step-num" aria-hidden="true">{index + 1}</span>
          <div class="step-body">
            <h3 class="step-title">{step.title}</h3>
            <p class="step-text">{step.text}</p>
          </div>
        </li>
      {/each}
    </ol>
  </div>
</section>

<!-- Practical details and the reasons to order, as one section on paper with
     hairline rules. Previously these were two near-identical shadowed panels
     sitting side by side, which read as duplicated furniture. -->
<section class="section-y">
  <div class="container">
    <div class="split">
      <div class="split-main">
        <h2 class="sec-title rule-mark">Ridicare și livrare</h2>

        <dl class="facts">
          <div class="fact">
            <dt>Ridicare de la rulota DeSaga</dt>
            <dd>{contact.address}</dd>
          </div>
          <div class="fact">
            <dt>Program</dt>
            <dd>{contact.schedule}</dd>
          </div>
          <div class="fact">
            <dt>Livrare în Cluj&#8209;Napoca</dt>
            <dd>Costul și intervalul se confirmă telefonic în funcție de comandă.</dd>
          </div>
        </dl>

        <div class="actions">
          <a href={contact.phoneHref} class="btn btn-accent">
            <i class="bi bi-telephone" aria-hidden="true"></i> Sună acum
          </a>
          <a href="/contact" class="btn btn-outline-accent">
            <i class="bi bi-map" aria-hidden="true"></i> Hartă și contact
          </a>
        </div>
      </div>

      <aside class="split-side" aria-labelledby="why-title">
        <h2 class="side-title" id="why-title">De ce e mai simplu</h2>

        <ul class="why">
          {#each trustItems as item}
            <li>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </li>
          {/each}
        </ul>

        <a href="/produse" class="side-link">
          Vezi produsele <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </a>
      </aside>
    </div>
  </div>
</section>

<section class="section-y band">
  <div class="container">
    <div class="sec-head">
      <h2 class="sec-title rule-mark">Evenimente</h2>
      <a href="/evenimente" class="btn btn-outline-accent btn-sm see-all">
        Vezi toate <i class="bi bi-arrow-right" aria-hidden="true"></i>
      </a>
    </div>

    {#if loadingEvents}
      <div class="events-grid" aria-label="Se încarcă evenimentele">
        {#each Array(3) as _}
          <div class="skeleton skeleton-event"></div>
        {/each}
      </div>
    {:else if upcoming.length === 0}
      <div class="empty-state">
        <p class="empty-title">Nu avem evenimente afișate momentan</p>
        <p class="empty-sub">Urmărește pagina de evenimente pentru noutăți.</p>
        <div class="actions">
          <a href="/evenimente" class="btn btn-outline-accent">
            <i class="bi bi-calendar-event" aria-hidden="true"></i> Evenimente
          </a>
        </div>
      </div>
    {:else}
      <div class="events-grid">
        {#each upcoming as item (item.id)}
          <EventCard event={{ ...item, image_url: item.image_url ?? undefined }} />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .stock-note {
    margin: var(--space-2) 0 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }

  .stock-note a {
    font-weight: 600;
  }

  .see-all {
    flex: 0 0 auto;
  }

  .see-all-mobile {
    margin-top: var(--space-5);
  }

  .see-all-mobile .btn {
    width: 100%;
  }

  .catalog-sliders {
    display: grid;
    gap: var(--space-5);
  }

  /* ---- Loading ---------------------------------------------------------- */
  .slider-skeleton {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }

  .slider-skeleton__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3);
    border-bottom: 1px solid var(--line);
  }

  .skeleton-bar {
    height: 16px;
  }

  .slider-skeleton__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .skeleton-product {
    height: 260px;
  }

  .skeleton-event {
    height: 280px;
  }

  /* ---- Steps ------------------------------------------------------------ */
  .steps-title {
    margin-bottom: var(--space-5);
  }

  .steps {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line-strong);
  }

  .step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-4);
    align-items: start;
    padding-block: var(--space-4);
    border-bottom: 1px solid var(--line-strong);
  }

  .step-num {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    color: var(--tomato);
    font-variant-numeric: tabular-nums;
  }

  .step-title {
    margin: 0;
    font-size: var(--text-md);
  }

  .step-text {
    margin: var(--space-1) 0 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }

  /* ---- Pickup / delivery ------------------------------------------------ */
  .split {
    display: grid;
    gap: var(--space-6);
  }

  .split-main,
  .split-side {
    min-width: 0;
  }

  .facts {
    margin: var(--space-5) 0 0;
    border-top: 1px solid var(--line-strong);
  }

  .fact {
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line);
  }

  .fact dt {
    font-weight: 600;
    color: var(--ink);
  }

  .fact dd {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-5);
  }

  .split-side {
    padding: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper-2);
    align-self: start;
  }

  .side-title {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
  }

  .why {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .why li {
    display: grid;
    gap: 2px;
  }

  .why strong {
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .why span {
    font-size: var(--text-sm);
    color: var(--ink-2);
    line-height: var(--leading-snug);
  }

  .side-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;
  }

  .side-link:hover,
  .side-link:focus-visible {
    text-decoration: underline;
  }

  /* ---- Events ----------------------------------------------------------- */
  /* auto-fit, so a single event does not sit in a 3-column grid with two
     empty cells beside it. */
  /* auto-fill, not auto-fit: with a single upcoming event auto-fit collapses
     the empty tracks and stretches that one card across the full 1440px row,
     blowing its 16:9 image up to ~700px tall. auto-fill keeps the track
     rhythm so one event stays card-sized. */
  .events-grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
  }

  .empty-state .actions {
    margin-top: var(--space-4);
  }

  @media (min-width: 768px) {
    .steps {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      border-top: 0;
      border-left: 1px solid var(--line-strong);
    }

    .step {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-2);
      padding: 0 var(--space-4);
      border-bottom: 0;
    }

    .slider-skeleton__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (min-width: 992px) {
    .split {
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr);
      gap: var(--space-7);
    }
  }

  @media (max-width: 575.98px) {
    .sec-head {
      align-items: flex-start;
    }

    .actions .btn {
      width: 100%;
    }
  }
</style>

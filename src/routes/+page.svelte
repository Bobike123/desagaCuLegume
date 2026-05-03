<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import { getAllProducts, type Product } from '$lib/stores/products';
  import { getAllEvents, type Event } from '$lib/stores/events';
  import { onMount } from 'svelte';

  let products: Product[] = [];
  let events: Event[] = [];
  let loadingProducts = true;
  let loadingEvents = true;

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

  onMount(async () => {
    try {
      loadingProducts = true;
      products = await getAllProducts();
    } finally {
      loadingProducts = false;
    }

    try {
      loadingEvents = true;
      events = await getAllEvents();
    } finally {
      loadingEvents = false;
    }
  });

  $: featured = [...products]
    .sort((a, b) => Number(Boolean(b.in_stock)) - Number(Boolean(a.in_stock)))
    .slice(0, 12);

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
  backgroundImage="https://www.pngall.com/wp-content/uploads/2016/03/Vegetable-Free-Download-PNG.png"
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
      <div class="grid products-grid" aria-label="Se încarcă produsele">
        {#each Array(12) as _}
          <div class="skeleton-card skeleton-product"></div>
        {/each}
      </div>
    {:else if featured.length === 0}
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
      <div class="grid products-grid" aria-label="Produse recomandate">
        {#each featured as product (product.id)}
          <div class="grid-item">
            <ProductCard {product} />
          </div>
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
        <a href="/produse/colaboratori" class="category-pill"><i class="bi bi-people"></i> Colaboratori</a>
        <a href="/produse/horeca" class="category-pill"><i class="bi bi-shop"></i> HORECA</a>
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
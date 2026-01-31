<!-- FILE: src/routes/+page.svelte -->
<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import EventCard from "$lib/components/EventCard.svelte";
  import { getAllProducts, type Product } from "$lib/stores/products";
  import { getAllEvents, type Event } from "$lib/stores/events";
  import { onMount } from "svelte";

  let products: Product[] = [];
  let events: Event[] = [];
  let loadingProducts = true;
  let loadingEvents = true;

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

  $: featured = products.slice(0, 12);
  $: upcoming = events.slice(0, 3);

  // WIP delivery/ordering info: replace values later
  const deliveryInfo = {
    freeDeliveryMin: "— RON", // TODO
    minimumOrder: "— RON", // TODO
    pickup: {
      title: "Pick-up rulota",
      bullets: [
        "Ridicare din rulota DeSaga",
        "Cartonaș cu ștampile",
        "Premii (în lucru)",
      ],
    },
    delivery: {
      title: "Livrare",
      bullets: [
        "Cost calculat în funcție de prețul comenzii",
        "Comandă minimă (în lucru)",
        "Opțiuni livrare (în lucru)",
      ],
    },
  };

  const quickLinks = [
    { href: "/produse", icon: "bi-box", label: "Produse" },
    { href: "/cos", icon: "bi-cart", label: "Coș" },
    { href: "/produse/de-sezon", icon: "bi-leaf", label: "De sezon" },
    { href: "/contact", icon: "bi-chat-dots", label: "Contact" },
  ];
</script>

<svelte:head>
  <title>Acasă - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="DeSaga cu Legume"
  subtitle="Din fermă. Direct la tine."
  backgroundImage="https://www.pngall.com/wp-content/uploads/2016/03/Vegetable-Free-Download-PNG.png"
  height="260px"
/>

<!-- Quick actions (above the fold) -->
<section class="section section-compact">
  <div class="container">
    <div class="panel panel-soft">
      <div class="panel-head">
        <h2 class="h5 fw-bold m-0">
          <i class="bi bi-lightning-charge"></i> Acces rapid
        </h2>
        <span class="badge-soft">simplu</span>
      </div>

      <div class="quick-grid" aria-label="Acces rapid">
        {#each quickLinks as item (item.href)}
          <a class="quick-card" href={item.href}>
            <span class="quick-icon"><i class={"bi " + item.icon}></i></span>
            <span class="quick-label">{item.label}</span>
            <i class="bi bi-arrow-right short-arrow" aria-hidden="true"></i>
          </a>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- Produse -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2 class="h4 fw-bold m-0">Cele mai gustoase produse</h2>
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
          Revino curând sau verifică toate categoriile.
        </div>
        <a href="/produse" class="btn btn-accent mt-3">
          <i class="bi bi-box"></i> Vezi produsele
        </a>
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
  </div>
  <div class="text-center mt-4 d-lg-none">
    <a href="/produse" class="btn btn-outline-accent btn-lg">
      <i class="bi bi-arrow-right"></i> Vezi toate preodusele
    </a>
  </div>
</section>

<!-- Delivery + Sezon + Recenzii -->
<section class="section">
  <div class="container">
    <div class="grid two-col">
      <!-- Delivery / Pickup -->
      <div class="panel panel-soft">
        <div class="panel-head">
          <h2 class="h5 fw-bold m-0">
            <i class="bi bi-truck"></i> Livrare / Pick-up
          </h2>
          <span class="badge-soft">în lucru</span>
        </div>

        <div class="list">
          <div class="list-row">
            <span class="list-icon"><i class="bi bi-gift"></i></span>
            <div class="list-text">
              <div class="list-title">Livrare gratuită</div>
              <div class="list-sub">
                Prag minim: <strong>{deliveryInfo.freeDeliveryMin}</strong>
              </div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-bag"></i></span>
            <div class="list-text">
              <div class="list-title">Comandă minimă</div>
              <div class="list-sub">
                <strong>{deliveryInfo.minimumOrder}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="mini-cards">
          <div class="mini-card">
            <div class="mini-card-head">
              <span class="pill-icon"><i class="bi bi-shop-window"></i></span>
              <div class="mini-card-title">{deliveryInfo.pickup.title}</div>
            </div>
            <ul class="bullets">
              {#each deliveryInfo.pickup.bullets as b}
                <li>{b}</li>
              {/each}
            </ul>
          </div>

          <div class="mini-card">
            <div class="mini-card-head">
              <span class="pill-icon"><i class="bi bi-truck"></i></span>
              <div class="mini-card-title">{deliveryInfo.delivery.title}</div>
            </div>
            <ul class="bullets">
              {#each deliveryInfo.delivery.bullets as b}
                <li>{b}</li>
              {/each}
            </ul>
          </div>
        </div>

        <div class="actions">
          <a href="/contact" class="btn btn-accent">
            <i class="bi bi-chat-dots"></i> Întrebări
          </a>
          <a href="/produse" class="btn btn-outline-accent">
            <i class="bi bi-leaf"></i> Stocul nostru
          </a>
        </div>
      </div>

      <!-- Sezon + Social -->
      <div class="panel">
        <div class="panel-head">
          <h2 class="h5 fw-bold m-0">
            <i class="bi bi-calendar2-week"></i> Sezon și transparență
          </h2>
        </div>

        <div class="list">
          <div class="list-row">
            <span class="list-icon"><i class="bi bi-arrow-repeat"></i></span>
            <div class="list-text">
              <div class="list-title">Disponibilitatea se schimbă</div>
              <div class="list-sub">
                Lista de produse se actualizează în funcție de recoltă.
              </div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-box-seam"></i></span>
            <div class="list-text">
              <div class="list-title">Stoc limitat</div>
              <div class="list-sub">
                Unele produse se epuizează rapid, în funcție de cerere.
              </div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-check2-square"></i></span>
            <div class="list-text">
              <div class="list-title">Fără promisiuni false</div>
              <div class="list-sub">
                Alegi din ce este disponibil acum, fără “în afara sezonului”.
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="panel-head">
          <h3 class="h6 fw-bold m-0">
            <i class="bi bi-chat-quote"></i> Recenzii
          </h3>
          <span class="badge-soft">work in progress</span>
        </div>

        <div class="proof-grid">
          <div class="proof-card">
            <div class="proof-top">
              <div class="proof-avatar" aria-hidden="true">
                <i class="bi bi-person-fill"></i>
              </div>
              <div class="proof-meta">
                <div class="proof-name">Client (în lucru)</div>
                <div class="proof-tag">Recenzie</div>
              </div>
            </div>
            <div class="proof-text">
              Placeholder. Urmează recenzii reale și poze de la clienți.
            </div>
          </div>

          <div class="proof-card">
            <div class="proof-top">
              <div class="proof-avatar" aria-hidden="true">
                <i class="bi bi-person-fill"></i>
              </div>
              <div class="proof-meta">
                <div class="proof-name">Client (în lucru)</div>
                <div class="proof-tag">Recenzie</div>
              </div>
            </div>
            <div class="proof-text">
              Placeholder. Urmează recenzii reale și poze de la clienți.
            </div>
          </div>
        </div>

        <div class="actions">
          <a href="/contact" class="btn btn-outline-accent">
            <i class="bi bi-send"></i> Trimite feedback
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- De ce + Unde -->
<section class="section">
  <div class="container">
    <div class="grid two-col">
      <div class="panel">
        <div class="panel-head">
          <h2 class="h5 fw-bold m-0">
            <i class="bi bi-shield-check"></i> De ce DeSaga
          </h2>
        </div>

        <div class="list">
          <div class="list-row">
            <span class="list-icon"><i class="bi bi-check2-circle"></i></span>
            <div class="list-text">
              <div class="list-title">Producători locali verificați</div>
              <div class="list-sub">
                Colaboratori aleși pe calitate și gust.
              </div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-truck"></i></span>
            <div class="list-text">
              <div class="list-title">Fără intermediari inutili</div>
              <div class="list-sub">Lanț scurt. Preț corect. Prospețime.</div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-calendar2-week"></i></span>
            <div class="list-text">
              <div class="list-title">Sezon real</div>
              <div class="list-sub">Alegi din ce e disponibil acum.</div>
            </div>
          </div>
        </div>

        <div class="actions">
          <a href="/produse" class="btn btn-accent">
            <i class="bi bi-box"></i> Vezi produsele
          </a>
          <a href="/despre-noi" class="btn btn-outline-accent">
            <i class="bi bi-info-circle"></i> Despre noi
          </a>
        </div>
      </div>

      <div class="panel panel-soft">
        <div class="panel-head">
          <h2 class="h5 fw-bold m-0">
            <i class="bi bi-geo-alt"></i> Unde ne găsești
          </h2>
        </div>

        <div class="list">
          <div class="list-row">
            <span class="list-icon"><i class="bi bi-geo-alt-fill"></i></span>
            <div class="list-text">
              <div class="list-title">Cluj-Napoca</div>
              <div class="list-sub">Str. Constantin Brâncuși nr. 153</div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-clock-fill"></i></span>
            <div class="list-text">
              <div class="list-title">Program</div>
              <div class="list-sub">L–V: 9:00 – 18:00</div>
            </div>
          </div>

          <div class="list-row">
            <span class="list-icon"><i class="bi bi-telephone-fill"></i></span>
            <div class="list-text">
              <div class="list-title">Telefon</div>
              <div class="list-sub">+40 729 969 822</div>
            </div>
          </div>
        </div>

        <div class="actions">
          <a href="/contact" class="btn btn-accent">
            <i class="bi bi-chat-dots"></i> Contact rapid
          </a>
          <a href="tel:+40729969822" class="btn btn-outline-accent">
            <i class="bi bi-telephone"></i> Sună acum
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Evenimente -->
<section class="section bg-soft">
  <div class="container">
    <div class="section-head">
      <h2 class="h4 fw-bold m-0">
        <i class="bi bi-calendar-event"></i> Evenimente
      </h2>
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
        <div class="empty-sub">
          Urmărește pagina de evenimente pentru noutăți.
        </div>
        <a href="/evenimente" class="btn btn-outline-accent mt-3">
          <i class="bi bi-calendar-event"></i> Evenimente
        </a>
      </div>
    {:else}
      <div class="grid events-grid">
        {#each upcoming as item (item.id)}
          <div class="grid-item">
            <EventCard
              event={{ ...item, image_url: item.image_url ?? undefined }}
            />
          </div>
        {/each}
      </div>

      <div class="text-center mt-4 d-lg-none">
        <a href="/evenimente" class="btn btn-outline-accent btn-lg">
          <i class="bi bi-arrow-right"></i> Vezi toate evenimentele
        </a>
      </div>
    {/if}
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2492cc);
    --accent-rgb: 36, 146, 204;
  }

  /* layout */
  .section {
    padding: 2.25rem 0;
  }
  .section-compact {
    padding: 0.75rem 0 1.25rem;
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

  .grid {
    display: grid;
    gap: 14px;
  }

  .two-col {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .products-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .events-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 992px) {
    .two-col {
      grid-template-columns: 1.15fr 0.85fr;
      align-items: stretch;
    }
    .products-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  /* panels */
  .panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
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

  /* badges */
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
  }

  /* actions */
  .actions {
    margin-top: 12px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* unified list rows */
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
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .panel:not(.panel-soft) .list-row {
    background: rgba(0, 0, 0, 0.02);
  }

  .list-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .list-title {
    font-weight: 900;
    line-height: 1.2;
  }

  .list-sub {
    font-size: 0.92rem;
    opacity: 0.8;
    margin-top: 2px;
  }

  /* mini cards inside panels */
  .mini-cards {
    margin-top: 12px;
    display: grid;
    gap: 10px;
  }

  .mini-card {
    padding: 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .mini-card-head {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 8px;
  }

  .pill-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .mini-card-title {
    font-weight: 900;
    line-height: 1.2;
  }

  .bullets {
    margin: 0;
    padding-left: 1.1rem;
    opacity: 0.86;
    font-size: 0.92rem;
  }

  .bullets li {
    margin: 0.2rem 0;
  }

  .divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.06);
    margin: 14px 0;
  }

  /* quick actions */
  .quick-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 768px) {
    .quick-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .quick-card {
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease;
  }

  .quick-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
  }

  .quick-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .quick-label {
    font-weight: 900;
    line-height: 1.1;
    flex: 1 1 auto;
  }

  .short-arrow {
    opacity: 0.65;
  }

  /* social proof */
  .proof-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 992px) {
    .proof-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .proof-card {
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.02);
    padding: 12px;
    height: 100%;
  }

  .proof-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .proof-avatar {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .proof-name {
    font-weight: 900;
    line-height: 1.2;
  }

  .proof-tag {
    font-size: 0.78rem;
    opacity: 0.7;
    margin-top: 1px;
  }

  .proof-text {
    font-size: 0.92rem;
    opacity: 0.82;
  }

  /* skeletons + empty */
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
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.02);
    padding: 18px;
  }

  .empty-title {
    font-weight: 900;
    font-size: 1.05rem;
  }

  .empty-sub {
    opacity: 0.75;
    margin-top: 4px;
  }

  /* CTA */
  .cta {
    background: linear-gradient(
      135deg,
      rgba(var(--accent-rgb), 0.92),
      rgba(var(--accent-rgb), 0.72)
    );
  }

  .cta-card {
    padding: 1.75rem;
    border-radius: 1.25rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(6px);
  }

  @media (max-width: 576px) {
    .cta-card {
      padding: 1.25rem;
    }
  }

  /* buttons */
  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.22);
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    filter: brightness(0.95);
    box-shadow: 0 12px 26px rgba(var(--accent-rgb), 0.28);
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.55) !important;
    color: var(--accent) !important;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.12) !important;
    border-color: rgba(var(--accent-rgb), 0.75) !important;
    color: var(--accent) !important;
  }
</style>

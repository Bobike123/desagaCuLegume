
<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';

  const phoneHref = 'tel:+40729969822';

  type QuickInfoItem = { icon: string; label: string; href?: string };
  type ProductGroup = { title: string; icon: string; href: string };

  const stats = [
    { value: '2.500 m²', label: 'solarii lucrate', icon: 'bi-house-heart' },
    { value: '2016', label: 'primul sezon', icon: 'bi-calendar-heart' },
    { value: '20+', label: 'colaboratori locali', icon: 'bi-people' },
    { value: 'zilnic', label: 'stoc după recoltă', icon: 'bi-arrow-repeat' },
  ] as const;

  const principles = [
    {
      title: 'Lanț scurt',
      text: 'Produsele ajung rapid din fermă și de la colaboratori locali la rulota DeSaga.',
      icon: 'bi-signpost-split',
    },
    {
      title: 'Sezon real',
      text: 'Stocul se schimbă în funcție de recoltă. Nu promitem produse care nu sunt disponibile.',
      icon: 'bi-calendar2-week',
    },
    {
      title: 'Gust înainte de volum',
      text: 'Alegem produse pentru prospețime, gust și utilitate în bucătăria de zi cu zi.',
      icon: 'bi-emoji-smile',
    },
    {
      title: 'Comunitate locală',
      text: 'Lucrăm cu oameni din zonă și păstrăm o relație directă cu clienții.',
      icon: 'bi-heart',
    },
  ] as const;

  const timeline = [
    {
      year: '2016',
      title: 'Primul contact cu ferma',
      text: 'În weekenduri și în timpul liber am început să ajutăm la o fermă de legume din Jucu. După un sezon agricol, direcția era clară.',
    },
    {
      year: '2017–2018',
      title: 'Ritm mai simplu',
      text: 'Munca în aer liber, liniștea din natură și satisfacția de a pune pe masă ceva crescut de la sămânță au schimbat felul în care vedeam munca.',
    },
    {
      year: '2019',
      title: 'DeSaga cu Legume',
      text: 'Am preluat oficial ferma de la Jucu, am numit-o DeSaga cu Legume și am investit timpul, banii și energia în proiect.',
    },
    {
      year: 'Astăzi',
      title: 'Rulota și comunitatea',
      text: 'Aducem produse locale la rulota din Cluj-Napoca și construim o mică rețea de clienți și producători care apreciază gustul simplu și corect.',
    },
  ] as const;

  const quickInfo: QuickInfoItem[] = [
    {
      icon: 'bi-geo-alt-fill',
      label: 'Str. Constantin Brâncuși nr. 153, Cluj-Napoca',
      href: '/contact',
    },
    { icon: 'bi-clock-fill', label: 'L–V: 9:00–18:00' },
    { icon: 'bi-telephone-fill', label: '+40 729 969 822', href: phoneHref },
  ];

  const productGroups: ProductGroup[] = [
    { title: 'Legume și fructe de sezon', icon: '', href: '/produse/de-sezon' },
    { title: 'Produse la borcan', icon: '', href: '/produse/la-borcan' },
    { title: 'Produse de la colaboratori', icon: '', href: '/produse/colaboratori' },
    { title: 'Oferte HORECA', icon: '', href: '/horeca' },
  ];
</script>

<svelte:head>
  <title>Despre noi - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Povestea DeSaga cu Legume: fermă locală, produse de sezon, colaboratori locali și rulota DeSaga din Cluj-Napoca."
  />
</svelte:head>

<Hero
  title="Despre DeSaga cu Legume"
  subtitle="O fermă locală crescută din muncă, sezon, gust și relații directe cu oamenii din comunitate."
  eyebrow="Din fermă. Direct la rulota DeSaga."
  primaryHref="/produse"
  primaryLabel="Vezi produsele"
  secondaryHref={phoneHref}
  secondaryLabel="Sună pentru stoc"
  facts={quickInfo}
  backgroundImage=""
  height="360px"
/>

<section class="section section-intro">
  <div class="container">
    <div class="intro-grid">
      <article class="panel story-panel">
        <div class="section-kicker">
          <i class="bi "></i>
          Povestea noastră
        </div>

        <h2>Doi orășeni care au ales ferma, nu vitrina perfectă.</h2>

        <p class="lead-text">
          DeSaga cu Legume a pornit din dorința de a lucra cu mâinile, de a vedea
          rezultatul în sol și de a pune pe masă produse care au gust.
        </p>

        <p>
          Ferma, rulota și colaboratorii locali formează același traseu simplu:
          produse crescute sau alese cu grijă, aduse aproape de oamenii din
          Cluj-Napoca. Stocul se schimbă des, iar asta este normal pentru un loc
          care lucrează cu sezonul, nu împotriva lui.
        </p>

        <div class="story-actions">
          <a class="btn btn-accent" href="/produse">
            <i class="bi bi-basket"></i>
            Cumpără local
          </a>
          <a class="btn btn-outline-accent" href="/contact">
            <i class="bi bi-geo-alt"></i>
            Unde ne găsești
          </a>
        </div>
      </article>

      <aside class="panel panel-soft trust-panel" aria-label="Informații rapide">
        <div class="farm-visual" aria-hidden="true">
          <div class="farm-visual__sun"></div>
          <div class="farm-visual__rows">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="farm-visual__label">
            <i class="bi bi-shop-window"></i>
            Rulota DeSaga
          </div>
        </div>

        <div class="quick-list">
          {#each quickInfo as item (item.label)}
            {#if item.href}
              <a class="quick-row" href={item.href}>
                <i class={'bi ' + item.icon}></i>
                <span>{item.label}</span>
              </a>
            {:else}
              <div class="quick-row">
                <i class={'bi ' + item.icon}></i>
                <span>{item.label}</span>
              </div>
            {/if}
          {/each}
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="section bg-soft">
  <div class="container">
    <div class="section-title">
      <div>
        <div class="section-kicker">
          <i class="bi bi-shield-check"></i>
          Încredere
        </div>
        <h2>Ce promitem clar</h2>
      </div>
      <a href="/contact" class="section-link">Contact rapid <i class="bi bi-arrow-right"></i></a>
    </div>

    <div class="principles-grid">
      {#each principles as item (item.title)}
        <article class="principle-card">
          <span class="card-icon"><i class={'bi ' + item.icon}></i></span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="split-grid">
      <article class="panel timeline-panel">
        <div class="section-title section-title--compact">
          <div>
            <div class="section-kicker">
              <i class="bi bi-signpost-2"></i>
              Timeline
            </div>
            <h2>Cum a crescut DeSaga</h2>
          </div>
        </div>

        <div class="timeline">
          {#each timeline as step (step.year)}
            <div class="timeline-item">
              <div class="timeline-dot" aria-hidden="true"></div>
              <div class="timeline-card">
                <div class="timeline-top">
                  <span class="timeline-year">{step.year}</span>
                  <h3>{step.title}</h3>
                </div>
                <p>{step.text}</p>
              </div>
            </div>
          {/each}
        </div>
      </article>

      <aside class="side-stack">
        <div class="panel stats-panel">
          <div class="section-kicker">
            <i class="bi bi-info-circle"></i>
            Pe scurt
          </div>

          <div class="stats-grid">
            {#each stats as stat (stat.label)}
              <div class="stat-card">
                <span class="stat-icon"><i class={'bi ' + stat.icon}></i></span>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            {/each}
          </div>
        </div>

        <div class="panel product-panel">
          <div class="section-kicker">
            <i class="bi bi-basket"></i>
            Ce găsești la noi
          </div>

          <div class="product-links">
            {#each productGroups as group (group.href)}
              <a href={group.href}>
                <span><i class={'bi ' + group.icon}></i> {group.title}</span>
                <i class="bi bi-chevron-right"></i>
              </a>
            {/each}
          </div>
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="section final-cta">
  <div class="container">
    <div class="cta-card">
      <div>
        <div class="section-kicker section-kicker--light">
          <i class="bi bi-telephone-fill"></i>
          Stocul se schimbă des
        </div>
        <h2>Sună sau treci pe la rulotă pentru produsele disponibile azi.</h2>
      </div>
      <div class="cta-actions">
        <a class="btn btn-light btn-lg" href={phoneHref}>Sună acum</a>
        <a class="btn btn-outline-light btn-lg" href="/produse">Vezi produsele</a>
      </div>
    </div>
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2492cc);
    --accent-rgb: 36, 146, 204;
  }

  .section {
    padding: 3rem 0;
  }

  .section-intro {
    padding-bottom: 2.25rem;
  }

  .bg-soft {
    background: rgba(var(--accent-rgb), 0.06);
  }

  .intro-grid,
  .split-grid {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 992px) {
    .intro-grid {
      grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
      align-items: stretch;
    }

    .split-grid {
      grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
      align-items: start;
    }
  }

  .panel {
    height: 100%;
    padding: 1.2rem;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  }

  .panel-soft {
    background: rgba(var(--accent-rgb), 0.07);
    border-color: rgba(var(--accent-rgb), 0.18);
  }

  .story-panel h2,
  .section-title h2,
  .cta-card h2 {
    margin: 0;
    font-weight: 950;
    letter-spacing: -0.035em;
    color: #17212b;
  }

  .story-panel h2 {
    max-width: 780px;
    font-size: clamp(1.75rem, 4vw, 3rem);
    line-height: 1.03;
  }

  .story-panel p {
    color: rgba(0, 0, 0, 0.68);
    line-height: 1.65;
  }

  .lead-text {
    margin-top: 1rem;
    font-size: 1.15rem;
    color: rgba(0, 0, 0, 0.78) !important;
  }

  .section-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.75rem;
    color: var(--accent);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.055em;
    font-size: 0.78rem;
  }

  .section-kicker--light {
    color: rgba(255, 255, 255, 0.88);
  }

  .story-actions,
  .cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .farm-visual {
    position: relative;
    min-height: 240px;
    overflow: hidden;
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.08)),
      linear-gradient(135deg, rgba(38, 153, 214, 0.28), rgba(93, 132, 71, 0.22));
    border: 1px solid rgba(var(--accent-rgb), 0.16);
  }

  .farm-visual__sun {
    position: absolute;
    top: 28px;
    right: 34px;
    width: 68px;
    height: 68px;
    border-radius: 999px;
    background: rgba(255, 211, 100, 0.88);
    box-shadow: 0 0 0 18px rgba(255, 211, 100, 0.14);
  }

  .farm-visual__rows {
    position: absolute;
    inset: auto 0 0;
    height: 58%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 0 22px 22px;
    transform: perspective(280px) rotateX(48deg);
    transform-origin: bottom;
  }

  .farm-visual__rows span {
    border-radius: 999px 999px 10px 10px;
    background: linear-gradient(180deg, rgba(47, 128, 73, 0.94), rgba(82, 55, 34, 0.78));
  }

  .farm-visual__label {
    position: absolute;
    left: 16px;
    bottom: 16px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    color: #17212b;
    font-weight: 950;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  }

  .quick-list {
    display: grid;
    gap: 0.7rem;
    margin-top: 1rem;
  }

  .quick-row {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    padding: 0.85rem;
    border-radius: 16px;
    color: rgba(20, 33, 43, 0.82);
    background: rgba(255, 255, 255, 0.68);
    border: 1px solid rgba(15, 23, 42, 0.06);
    text-decoration: none;
    font-weight: 850;
  }

  .quick-row i {
    color: var(--accent);
    margin-top: 2px;
  }

  a.quick-row:hover,
  a.quick-row:focus {
    color: var(--accent);
    background: #fff;
  }

  .section-title {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .section-title--compact {
    margin-bottom: 1rem;
  }

  .section-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 900;
    white-space: nowrap;
  }

  .section-link:hover,
  .section-link:focus {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .principles-grid {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .principles-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .principle-card {
    min-height: 100%;
    padding: 1rem;
    border-radius: 20px;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  }

  .card-icon,
  .stat-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.13);
  }

  .principle-card h3 {
    margin: 0.85rem 0 0.35rem;
    font-size: 1rem;
    font-weight: 950;
  }

  .principle-card p {
    margin: 0;
    color: rgba(0, 0, 0, 0.68);
    line-height: 1.48;
  }

  .timeline {
    display: grid;
    gap: 1rem;
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 22px 1fr;
    gap: 0.85rem;
    position: relative;
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    margin-top: 18px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 7px rgba(var(--accent-rgb), 0.12);
    justify-self: center;
    position: relative;
    z-index: 1;
  }

  .timeline-dot::before {
    content: '';
    position: absolute;
    top: -42px;
    bottom: -70px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: rgba(var(--accent-rgb), 0.2);
    z-index: -1;
  }

  .timeline-item:first-child .timeline-dot::before {
    top: 50%;
  }

  .timeline-item:last-child .timeline-dot::before {
    bottom: 50%;
  }

  .timeline-card {
    padding: 1rem;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.025);
    border: 1px solid rgba(15, 23, 42, 0.07);
  }

  .timeline-top {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .timeline-year {
    color: var(--accent);
    font-weight: 950;
  }

  .timeline-card h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 950;
  }

  .timeline-card p {
    margin: 0;
    color: rgba(0, 0, 0, 0.68);
    line-height: 1.55;
  }

  .side-stack {
    display: grid;
    gap: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .stat-card {
    display: grid;
    gap: 0.45rem;
    padding: 0.9rem;
    border-radius: 18px;
    background: rgba(var(--accent-rgb), 0.06);
    border: 1px solid rgba(var(--accent-rgb), 0.14);
  }

  .stat-card strong {
    font-size: 1.25rem;
    font-weight: 1000;
    line-height: 1;
  }

  .stat-card span:last-child {
    color: rgba(0, 0, 0, 0.62);
    font-weight: 850;
    line-height: 1.2;
  }

  .product-links {
    display: grid;
    gap: 0.65rem;
  }

  .product-links a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.82rem;
    border-radius: 16px;
    color: rgba(20, 33, 43, 0.82);
    background: rgba(15, 23, 42, 0.025);
    border: 1px solid rgba(15, 23, 42, 0.07);
    text-decoration: none;
    font-weight: 900;
  }

  .product-links a:hover,
  .product-links a:focus {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.08);
  }

  .final-cta {
    padding-top: 0;
  }

  .cta-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    padding: 1.5rem;
    border-radius: 24px;
    color: #fff;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent 22rem),
      var(--desaga-blue);
    box-shadow: 0 18px 42px rgba(38, 153, 214, 0.24);
  }

  .cta-card h2 {
    max-width: 680px;
    color: #fff;
    font-size: clamp(1.45rem, 3vw, 2.25rem);
  }

  .cta-actions {
    margin: 0;
    flex: 0 0 auto;
  }

  .cta-actions .btn {
    border-radius: 999px;
    font-weight: 950;
  }

  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.22);
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    background: var(--desaga-dark-blue) !important;
    border-color: var(--desaga-dark-blue) !important;
    color: #fff !important;
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.55) !important;
    color: var(--accent) !important;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.12) !important;
    color: var(--accent) !important;
  }

  @media (max-width: 767.98px) {
    .section {
      padding: 2rem 0;
    }

    .section-title,
    .cta-card {
      align-items: stretch;
      flex-direction: column;
    }

    .section-link {
      width: fit-content;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .cta-actions .btn {
      width: 100%;
    }
  }
</style>
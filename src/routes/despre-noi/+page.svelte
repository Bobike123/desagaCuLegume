<script lang="ts">
  import { onMount } from 'svelte';
  import Hero from '$lib/components/Hero.svelte';

  const phoneHref = 'tel:+40729969822';

  type QuickInfoItem = { icon: string; label: string; href?: string };

  const stats = [
    { value: '2.500 m²', label: 'solarii lucrate', icon: 'bi-house-heart' },
    { value: '2016', label: 'primul sezon', icon: 'bi-calendar-heart' },
    { value: '20+', label: 'parteneri locali', icon: 'bi-people' },
    { value: 'zilnic', label: 'stoc după recoltă', icon: 'bi-arrow-repeat' },
  ] as const;

  const principles = [
    {
      title: 'Lanț scurt',
      text: 'Produsele ajung rapid din fermă și de la parteneri locali la rulota DeSaga.',
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
      image: '/images/despre-noi/2016.jpeg',
      imageAlt: 'Rânduri cultivate în solar la începutul poveștii DeSaga',
    },
    {
      year: '2017–2018',
      title: 'Ritm mai simplu',
      text: 'Munca în aer liber, liniștea din natură și satisfacția de a pune pe masă ceva crescut de la sămânță au schimbat felul în care vedeam munca.',
      image: '/images/despre-noi/2017-2018.jpeg',
      imageAlt: 'Legume proaspăt recoltate așezate pe iarbă',
    },
    {
      year: '2019',
      title: 'DeSaga cu Legume',
      text: 'Am preluat oficial ferma de la Jucu, am numit-o DeSaga cu Legume și am investit timpul, banii și energia în proiect.',
      image: '/images/despre-noi/2019.jpeg',
      imageAlt: 'Solar DeSaga cu plante crescute pe rânduri',
    },
    {
      year: 'Astăzi',
      title: 'Rulota și comunitatea',
      text: 'Aducem produse locale la rulota din Cluj-Napoca și construim o mică rețea de clienți și producători care apreciază gustul simplu și corect.',
      image: '/images/despre-noi/zacusca-cu-fasole.jpg',
      imageAlt: 'Borcan DeSaga cu zacuscă de fasole și ingrediente locale',
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

  const storyPhotos = [
    {
      src: '/images/despre-noi/zacusca-cu-fasole.jpg',
      alt: 'Zacuscă DeSaga cu fasole, ardei și usturoi',
      caption: 'Loturi mici, făcute pentru mese simple și bune.',
    },
    {
      src: '/images/despre-noi/dulceata-rosii-cherry.jpg',
      alt: 'Dulceață de roșii cherry DeSaga pe ștergar tradițional',
      caption: 'Produse păstrate cu grijă pentru gustul de peste sezon.',
    },
    {
      src: '/images/despre-noi/muraturi-asortate.jpg',
      alt: 'Murături asortate DeSaga în borcan',
      caption: 'Cămara completează ce se întâmplă în fermă.',
    },
  ] as const;

  // --- Scroll-activated timeline (recipe-steps style) ---------------------
  // A virtual "activation line" sits at ~38% of the viewport height. While
  // scrolling down, each year whose badge passes above that line becomes
  // active; scrolling back up deactivates it again. A continuous fill bar
  // tracks the line's position through the timeline.
  let timelineEl: HTMLElement | undefined = $state();
  let enhanced = $state(false);
  let activeCount = $state(0);
  let fillPx = $state(0);

  let itemEls: HTMLElement[] = [];
  let ticking = false;

  function activationLineY() {
    return Math.min(window.innerHeight * 0.38, 420);
  }

  function update() {
    ticking = false;
    if (!timelineEl) return;
    const lineY = activationLineY();
    let n = 0;
    for (const el of itemEls) {
      if (el.getBoundingClientRect().top < lineY) n++;
    }
    activeCount = n;
    const rect = timelineEl.getBoundingClientRect();
    fillPx = Math.max(0, Math.min(lineY - rect.top, rect.height));
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  onMount(() => {
    if (!timelineEl) return;
    itemEls = Array.from(timelineEl.querySelectorAll<HTMLElement>('.tl-item'));

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      activeCount = itemEls.length;
      fillPx = timelineEl.scrollHeight;
      return;
    }

    enhanced = true;
    update();

    // Image loads shift layout, so re-measure whenever the timeline resizes.
    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(timelineEl);

    return () => resizeObserver.disconnect();
  });
</script>

<svelte:window onscroll={requestUpdate} onresize={requestUpdate} />

<svelte:head>
  <title>Despre noi - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Povestea DeSaga cu Legume: fermă locală, produse de sezon, parteneri locali și rulota DeSaga din Cluj-Napoca."
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
  backgroundImage="/images/despre-noi/hero-produse-la-borcan.jpg"
  height="360px"
/>

<section class="section section-intro">
  <div class="container">
    <div class="intro-head">
      <div class="section-kicker">
        <i class="bi bi-flower1"></i>
        Povestea noastră
      </div>
      <h2>Doi orășeni care au ales ferma, nu vitrina perfectă.</h2>
      <p class="lead-text">
        DeSaga cu Legume a pornit din dorința de a lucra cu mâinile, de a vedea rezultatul în sol
        și de a pune pe masă produse care au gust. Ferma, rulota și partenerii locali formează
        același traseu simplu: produse crescute sau alese cu grijă, aduse aproape de oamenii din
        Cluj-Napoca.
      </p>
    </div>

    <div class="story-photo-grid" aria-label="Produse DeSaga fotografiate">
      {#each storyPhotos as photo (photo.src)}
        <figure class="story-photo">
          <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
          <figcaption>{photo.caption}</figcaption>
        </figure>
      {/each}
    </div>
  </div>
</section>

<section class="section timeline-section">
  <div class="container">
    <header class="tl-head">
      <div class="section-kicker">
        <i class="bi bi-signpost-2"></i>
        An cu an
      </div>
      <h2>Cum a crescut DeSaga</h2>
      <p>Derulează povestea — fiecare an se aprinde pe măsură ce ajungi la el.</p>
    </header>

    <div class="tl" class:enhanced bind:this={timelineEl}>
      <div class="tl-track" aria-hidden="true">
        <div class="tl-fill" style:height="{fillPx}px"></div>
      </div>

      {#each timeline as step, i (step.year)}
        <article class="tl-item" class:active={i < activeCount}>
          <div class="tl-rail" aria-hidden="true">
            <span class="tl-badge">{step.year}</span>
          </div>
          <div class="tl-card">
            <img
              class="tl-image"
              src={step.image}
              alt={step.imageAlt}
              loading="lazy"
              decoding="async"
            />
            <div class="tl-body">
              <span class="tl-year-sr">{step.year}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </div>
        </article>
      {/each}
    </div>

    <div class="stats-strip" aria-label="DeSaga pe scurt">
      {#each stats as stat (stat.label)}
        <div class="stat-card">
          <span class="stat-icon"><i class={'bi ' + stat.icon}></i></span>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      {/each}
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
  .section {
    padding: 3rem 0;
  }

  .bg-soft {
    background: var(--desaga-surface-soft);
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

  h2 {
    margin: 0;
    font-weight: 950;
    letter-spacing: -0.035em;
    color: var(--desaga-heading);
  }

  /* --- Intro ------------------------------------------------------------ */
  .intro-head {
    max-width: 820px;
  }

  .intro-head h2 {
    font-size: clamp(1.75rem, 4vw, 3rem);
    line-height: 1.03;
  }

  .lead-text {
    margin: 1rem 0 0;
    font-size: 1.15rem;
    color: rgba(0, 0, 0, 0.72);
    line-height: 1.65;
  }

  .story-photo-grid {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  @media (min-width: 768px) {
    .story-photo-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .story-photo {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    border-radius: 18px;
    background: var(--desaga-surface);
    border: 1px solid var(--desaga-border);
    box-shadow: var(--desaga-shadow-sm);
  }

  .story-photo img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .story-photo figcaption {
    padding: 0.7rem;
    color: rgba(20, 33, 43, 0.74);
    font-size: 0.86rem;
    font-weight: 850;
    line-height: 1.35;
  }

  /* --- Scroll timeline ---------------------------------------------------- */
  .timeline-section {
    background: var(--desaga-cream);
  }

  .tl-head {
    max-width: 720px;
    margin: 0 auto 2.25rem;
    text-align: center;
  }

  .tl-head h2 {
    font-size: clamp(1.6rem, 3.5vw, 2.5rem);
  }

  .tl-head p {
    margin: 0.6rem 0 0;
    color: var(--desaga-muted);
    font-weight: 700;
  }

  .tl {
    --rail: 108px;
    position: relative;
    max-width: 820px;
    margin: 0 auto;
    display: grid;
    gap: 2.5rem;
  }

  .tl-track {
    position: absolute;
    top: 14px;
    bottom: 40px;
    left: calc(var(--rail) / 2 - 2px);
    width: 4px;
    border-radius: 999px;
    background: rgba(var(--accent-rgb), 0.16);
    overflow: hidden;
  }

  .tl-fill {
    width: 100%;
    height: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, var(--desaga-blue), var(--desaga-dark-blue));
  }

  .tl-item {
    position: relative;
    display: grid;
    grid-template-columns: var(--rail) 1fr;
    align-items: start;
  }

  .tl-rail {
    position: sticky;
    top: 96px;
    display: flex;
    justify-content: center;
  }

  .tl-badge {
    display: inline-block;
    padding: 0.42rem 0.85rem;
    border-radius: 999px;
    background: var(--desaga-surface);
    border: 2px solid rgba(var(--accent-rgb), 0.35);
    color: var(--desaga-heading);
    font-weight: 950;
    font-size: 0.88rem;
    white-space: nowrap;
    box-shadow: var(--desaga-shadow-sm);
    transition:
      background 0.45s ease,
      color 0.45s ease,
      border-color 0.45s ease,
      box-shadow 0.45s ease,
      transform 0.45s ease;
  }

  .tl-card {
    overflow: hidden;
    border-radius: 22px;
    background: var(--desaga-surface);
    border: 2px solid var(--desaga-border);
    box-shadow: var(--desaga-shadow-sm);
    transition:
      border-color 0.45s ease,
      box-shadow 0.45s ease,
      opacity 0.45s ease,
      transform 0.45s ease;
  }

  .tl-image {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 8;
    object-fit: cover;
    background: rgba(15, 23, 42, 0.05);
    transition: filter 0.45s ease;
  }

  .tl-body {
    padding: 1.1rem 1.25rem 1.25rem;
  }

  .tl-year-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .tl-body h3 {
    margin: 0 0 0.4rem;
    font-size: 1.15rem;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .tl-body p {
    margin: 0;
    color: rgba(0, 0, 0, 0.68);
    line-height: 1.6;
  }

  /* Dormant state — only once JS is driving the activation. */
  .tl.enhanced .tl-item:not(.active) .tl-card {
    opacity: 0.55;
    transform: translateY(14px);
  }

  .tl.enhanced .tl-item:not(.active) .tl-image {
    filter: grayscale(0.45) saturate(0.75);
  }

  .tl-item.active .tl-badge {
    background: var(--desaga-blue);
    border-color: var(--desaga-blue);
    color: #fff;
    transform: scale(1.06);
    box-shadow: 0 0 0 7px rgba(var(--accent-rgb), 0.16);
  }

  .tl-item.active .tl-card {
    border-color: rgba(var(--accent-rgb), 0.55);
    box-shadow: var(--desaga-shadow-md);
  }

  @media (prefers-reduced-motion: reduce) {
    .tl-badge,
    .tl-card,
    .tl-image {
      transition: none;
    }
  }

  /* --- Stats strip -------------------------------------------------------- */
  .stats-strip {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    max-width: 820px;
    margin: 2.5rem auto 0;
  }

  @media (min-width: 768px) {
    .stats-strip {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .stat-card {
    display: grid;
    gap: 0.45rem;
    padding: 0.9rem;
    border-radius: 18px;
    background: var(--desaga-surface);
    border: 1px solid rgba(var(--accent-rgb), 0.14);
    box-shadow: var(--desaga-shadow-sm);
  }

  .stat-card strong {
    font-size: 1.25rem;
    font-weight: 1000;
    line-height: 1;
    color: var(--desaga-heading);
  }

  .stat-card span:last-child {
    color: rgba(0, 0, 0, 0.62);
    font-weight: 850;
    line-height: 1.2;
    font-size: 0.9rem;
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

  /* --- Principles ----------------------------------------------------------- */
  .section-title {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
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
    background: var(--desaga-surface);
    border: 1px solid var(--desaga-border);
    box-shadow: var(--desaga-shadow-sm);
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

  /* --- CTA -------------------------------------------------------------------- */
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
      linear-gradient(90deg, rgba(18, 91, 130, 0.94), rgba(18, 91, 130, 0.78)),
      url('/images/despre-noi/ceapa-rosie-la-borcan.jpg') center/cover;
    box-shadow: 0 18px 42px rgba(38, 153, 214, 0.24);
  }

  .cta-card h2 {
    max-width: 680px;
    color: #fff;
    font-size: clamp(1.45rem, 3vw, 2.25rem);
  }

  .cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    flex: 0 0 auto;
  }

  .cta-actions .btn {
    border-radius: 999px;
    font-weight: 950;
  }

  /* --- Mobile ------------------------------------------------------------------ */
  @media (max-width: 767.98px) {
    .section {
      padding: 2rem 0;
    }

    .tl {
      --rail: 84px;
      gap: 1.75rem;
    }

    .tl-badge {
      font-size: 0.78rem;
      padding: 0.35rem 0.6rem;
    }

    .tl-rail {
      top: 82px;
    }

    .section-title,
    .cta-card {
      align-items: stretch;
      flex-direction: column;
    }

    .section-link {
      width: fit-content;
    }

    .cta-actions .btn {
      width: 100%;
    }
  }
</style>

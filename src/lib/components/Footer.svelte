<script lang="ts">
  import LocationMapPreview from '$lib/components/LocationMapPreview.svelte';
  import { DESAGA_ADDRESS } from '$lib/location';
  import { PRODUCT_CATEGORIES } from '$lib/categories';

  let openMenu = false;
  let openLocation = false;
  let openLegal = false;

  const menuLinks = [
    { href: '/', label: 'Acasă' },
    { href: '/produse', label: 'Produse' },
    ...PRODUCT_CATEGORIES.map((category) => ({ href: `/produse/${category.slug}`, label: category.name })),
    { href: '/horeca', label: 'HORECA' },
    { href: '/legume-proaspete-cluj-napoca', label: 'Legume proaspete Cluj' },
    { href: '/contact', label: 'Contact' },
  ];

  const legalLinks = [
    { href: '/legal', label: 'Legal și conformitate' },
    { href: '/politica-de-confidentialitate', label: 'Politica de confidențialitate' },
    { href: '/politica-cookies', label: 'Politica de cookie-uri' },
    { href: '/termeni-si-conditii', label: 'Termeni și condiții' },
    { href: '/livrare-ridicare', label: 'Livrare și ridicare' },
    { href: '/retururi-rambursari-reclamatii', label: 'Retururi și reclamații' },
    { href: '/informatii-companie', label: 'Informații companie' },
    { href: '/calitate-produse', label: 'Calitatea produselor' },
  ];

  const phoneHref = 'tel:+40729969822';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';
</script>

<footer class="footer">
  <div class="footer-main">
    <div class="container">
      <div class="footer-grid">
        <section class="footer-brand" aria-label="DeSaga cu Legume">
          <h2 class="footer-logo">
            <img src="/images/shared/logo.png" alt="" width="34" height="34" class="footer-mark" />
            <span>DeSaga cu Legume</span>
          </h2>
          <p>
            Legume locale, produse de sezon și bunătăți la borcan, direct de la
            rulota DeSaga din Cluj-Napoca.
          </p>

          <div class="footer-cta">
            <a class="footer-call" href={phoneHref}>
              <i class="bi bi-telephone-fill"></i>
              <span>Sună pentru stocul de azi</span>
            </a>
          </div>

          <div class="footer-social" aria-label="Social media">
            <a href={facebookHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i class="bi bi-facebook"></i>
            </a>
            <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i class="bi bi-instagram"></i>
            </a>
          </div>
        </section>

        <section class="footer-group">
          <button
            type="button"
            class="footer-title"
            on:click={() => (openMenu = !openMenu)}
            aria-expanded={openMenu}
          >
            <span>Meniu</span>
            <i class="bi bi-chevron-down footer-caret" class:rotated={openMenu} aria-hidden="true"></i>
          </button>

          <div class="footer-panel" class:open={openMenu}>
            <nav aria-label="Meniu footer">
              {#each menuLinks as item}
                <a href={item.href}>{item.label}</a>
              {/each}
              <a class="footer-muted-link" href="/despre-noi">Despre noi</a>
              <a class="footer-muted-link" href="/evenimente">Evenimente</a>
            </nav>
          </div>
        </section>

        <section class="footer-group">
          <button
            type="button"
            class="footer-title"
            on:click={() => (openLocation = !openLocation)}
            aria-expanded={openLocation}
          >
            <span>Locație și program</span>
            <i class="bi bi-chevron-down footer-caret" class:rotated={openLocation} aria-hidden="true"></i>
          </button>

          <div class="footer-panel" class:open={openLocation}>
            <address class="footer-address">
              <a href="/contact">
                <i class="bi bi-geo-alt-fill"></i>
                <span>{DESAGA_ADDRESS}</span>
              </a>
              <span>
                <i class="bi bi-clock-fill"></i>
                <span>L–V: 9:00–18:00</span>
              </span>
              <a href={phoneHref}>
                <i class="bi bi-telephone-fill"></i>
                <span>0729 969 822</span>
              </a>
            </address>

            <LocationMapPreview compact />
          </div>
        </section>

        <section class="footer-group">
          <button
            type="button"
            class="footer-title"
            on:click={() => (openLegal = !openLegal)}
            aria-expanded={openLegal}
          >
            <span>Legal</span>
            <i class="bi bi-chevron-down footer-caret" class:rotated={openLegal} aria-hidden="true"></i>
          </button>

          <div class="footer-panel" class:open={openLegal}>
            <nav aria-label="Documente legale">
              {#each legalLinks as item}
                <a href={item.href}>{item.label}</a>
              {/each}
            </nav>
          </div>
        </section>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="container footer-bottom-wrap">
      <p>&copy; 2024–2026 DeSaga cu Legume. Toate drepturile rezervate.</p>
      <p>Realizat pentru comunitatea locală. Păstrăm verdele aproape.</p>
      <a href="/admin/login">Administrare</a>
    </div>
  </div>
</footer>

<style>
  /* Ink-dark footer, so the paper page ends on a firm edge. No radial glow
     behind it - the previous version tinted the whole slab with the accent. */
  .footer {
    color: #fff;
  }

  .footer-main {
    background: #26231f;
    border-top: 3px solid var(--tomato);
    padding-block: var(--space-6);
  }

  .footer-grid {
    display: grid;
    gap: var(--space-5);
  }

  .footer-mark {
    width: 34px;
    height: auto;
    outline: none;
    flex: 0 0 auto;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: #fff;
  }

  .footer-brand p {
    max-width: 34rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.72);
    line-height: var(--leading-normal);
  }

  .footer-cta {
    margin-top: var(--space-4);
  }

  .footer-call {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0.55rem 1rem;
    border: 1px solid var(--tomato-ink);
    border-radius: var(--radius);
    background: var(--tomato-ink);
    color: #fff;
    font-weight: 600;
    text-decoration: none;
  }

  .footer-call:hover,
  .footer-call:focus-visible {
    background: var(--tomato-deep);
    border-color: var(--tomato-deep);
    color: #fff;
  }

  .footer-social {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .footer-social a {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius);
    color: #fff;
    text-decoration: none;
  }

  .footer-social a:hover,
  .footer-social a:focus-visible {
    border-color: var(--tomato);
    background: rgba(228, 60, 64, 0.16);
    color: #fff;
  }

  .footer-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    width: 100%;
    min-height: 44px;
    padding: 0;
    margin-bottom: var(--space-3);
    border: 0;
    background: transparent;
    color: #fff;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
  }

  .footer-caret {
    display: none;
    transition: transform var(--motion) var(--ease);
  }

  .footer-caret.rotated {
    transform: rotate(180deg);
  }

  .footer-panel {
    display: block;
  }

  .footer-panel nav {
    display: grid;
  }

  .footer-panel a,
  .footer-address > span {
    color: rgba(255, 255, 255, 0.76);
    text-decoration: none;
  }

  .footer-panel nav a {
    padding-block: 0.3rem;
    font-size: var(--text-sm);
  }

  .footer-panel a:hover,
  .footer-panel a:focus-visible {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .footer-muted-link {
    opacity: 0.78;
  }

  .footer-address {
    display: grid;
    gap: var(--space-2);
    margin: 0 0 var(--space-4);
    font-style: normal;
    font-size: var(--text-sm);
  }

  .footer-address a,
  .footer-address > span {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    /* Tappable rows: these were 20-22px tall, under the touch-target floor. */
    min-height: 44px;
    padding-block: var(--space-1);
    line-height: var(--leading-snug);
  }

  .footer-address i {
    color: var(--tomato);
    margin-top: 2px;
    flex: 0 0 auto;
  }

  .footer-bottom {
    background: #1a1815;
    padding-block: var(--space-3);
  }

  .footer-bottom-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .footer-bottom p {
    margin: 0;
    font-size: var(--text-xs);
    color: rgba(255, 255, 255, 0.66);
  }

  .footer-bottom a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: rgba(255, 255, 255, 0.66);
    font-size: var(--text-xs);
    text-decoration: none;
  }

  .footer-bottom a:hover,
  .footer-bottom a:focus-visible {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (min-width: 768px) {
    .footer-grid {
      grid-template-columns: minmax(0, 1.2fr) minmax(140px, 0.6fr) minmax(210px, 0.85fr) minmax(200px, 0.8fr);
      gap: var(--space-6);
      align-items: start;
    }

    .footer-main {
      padding-block: var(--space-7);
    }
  }

  @media (max-width: 767.98px) {
    /* Collapsed sections on phones: four link lists stacked open is a wall
       of text nobody scrolls past. */
    .footer-group {
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      padding-top: var(--space-2);
    }

    .footer-caret {
      display: inline-flex;
    }

    .footer-panel {
      max-height: 0;
      overflow: hidden;
      transition: max-height var(--motion) var(--ease);
    }

    .footer-panel.open {
      max-height: 900px;
    }

    .footer-panel nav a {
      min-height: 44px;
      display: flex;
      align-items: center;
    }

    .footer-bottom-wrap {
      justify-content: center;
      text-align: center;
      gap: var(--space-2);
    }
  }
</style>

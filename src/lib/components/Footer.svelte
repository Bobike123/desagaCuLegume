<script lang="ts">
  import LocationMapPreview from '$lib/components/LocationMapPreview.svelte';
  import { DESAGA_ADDRESS } from '$lib/location';

  let openMenu = false;
  let openLocation = false;
  let openLegal = false;

  const menuLinks = [
    { href: '/', label: 'Acasă' },
    { href: '/produse', label: 'Produse' },
    { href: '/produse/de-sezon', label: 'De sezon' },
    { href: '/produse/la-borcan', label: 'La borcan' },
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

  let newsletterEmail = '';
  let newsletterState: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  let newsletterMessage = '';

  async function subscribeNewsletter() {
    if (newsletterState === 'loading') return;
    newsletterState = 'loading';
    newsletterMessage = '';

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        newsletterState = 'error';
        newsletterMessage = payload?.error ?? 'Abonarea a eșuat. Încearcă din nou.';
        return;
      }

      newsletterState = 'success';
      newsletterMessage = 'Te-ai abonat! Mulțumim.';
      newsletterEmail = '';
    } catch {
      newsletterState = 'error';
      newsletterMessage = 'Abonarea a eșuat. Încearcă din nou.';
    }
  }
</script>

<footer class="footer">
  <div class="footer-main">
    <div class="container">
      <div class="footer-grid">
        <section class="footer-brand" aria-label="DeSaga cu Legume">
          <h2 class="footer-logo">
            <i class="bi "></i>
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

          <form class="footer-newsletter" on:submit|preventDefault={subscribeNewsletter} aria-label="Newsletter">
            <label class="footer-newsletter-label" for="footer-newsletter-email">Noutăți pe email</label>
            <div class="footer-newsletter-row">
              <input
                id="footer-newsletter-email"
                type="email"
                required
                maxlength="120"
                placeholder="adresa@email.ro"
                autocomplete="email"
                bind:value={newsletterEmail}
                disabled={newsletterState === 'loading'}
              />
              <button type="submit" disabled={newsletterState === 'loading'}>
                {newsletterState === 'loading' ? 'Se trimite…' : 'Abonează-te'}
              </button>
            </div>
            {#if newsletterMessage}
              <p class="footer-newsletter-status" class:error={newsletterState === 'error'} role="status">
                {newsletterMessage}
              </p>
            {/if}
            <p class="footer-newsletter-consent">
              Prin abonare ești de acord să primești emailuri cu noutăți. Te poți dezabona oricând.
              Detalii în <a href="/politica-de-confidentialitate">politica de confidențialitate</a>.
            </p>
          </form>
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
  .footer {
    color: #fff;
  }

  .footer-main {
    background:
      radial-gradient(circle at top left, rgba(var(--desaga-accent-rgb), 0.22), transparent 32rem),
      var(--desaga-slate);
    padding: clamp(2rem, 5vw, 3rem) 0;
  }

  .footer-grid {
    display: grid;
    gap: 2rem;
  }

  @media (min-width: 768px) {
    .footer-grid {
      grid-template-columns: minmax(0, 1.15fr) minmax(150px, 0.6fr) minmax(230px, 0.85fr) minmax(210px, 0.85fr);
      align-items: start;
    }
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.2rem;
    font-weight: 950;
    margin: 0 0 0.75rem;
  }

  .footer-brand p {
    max-width: 34rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.78);
    line-height: 1.55;
  }

  .footer-cta {
    margin-top: 1rem;
  }

  .footer-call {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #fff;
    background: var(--desaga-blue);
    border-radius: 999px;
    padding: 0.72rem 1rem;
    font-weight: 900;
    text-decoration: none;
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
  }

  .footer-call:hover,
  .footer-call:focus {
    color: #fff;
    background: var(--desaga-dark-blue);
  }

  .footer-social {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 1rem;
  }

  .footer-social a {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    color: #fff;
    background: rgba(255, 255, 255, 0.09);
    text-decoration: none;
  }

  .footer-social a:hover,
  .footer-social a:focus {
    background: rgba(255, 255, 255, 0.16);
  }

  .footer-newsletter {
    margin-top: 1.25rem;
    max-width: 26rem;
  }

  .footer-newsletter-label {
    display: block;
    font-weight: 950;
    margin-bottom: 0.5rem;
  }

  .footer-newsletter-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .footer-newsletter-row input {
    flex: 1 1 12rem;
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    padding: 0.6rem 1rem;
  }

  .footer-newsletter-row input::placeholder {
    color: rgba(255, 255, 255, 0.55);
  }

  .footer-newsletter-row button {
    border: 0;
    border-radius: 999px;
    background: var(--desaga-blue);
    color: #fff;
    font-weight: 900;
    padding: 0.6rem 1.1rem;
  }

  .footer-newsletter-row button:hover,
  .footer-newsletter-row button:focus {
    background: var(--desaga-dark-blue);
  }

  .footer-newsletter-row button:disabled {
    opacity: 0.7;
  }

  .footer-newsletter-status {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: #b9f0c9;
  }

  .footer-newsletter-status.error {
    color: #ffc2c2;
  }

  .footer-newsletter-consent {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .footer-newsletter-consent a {
    color: rgba(255, 255, 255, 0.75);
  }

  .footer-title {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: transparent;
    border: 0;
    color: #fff;
    padding: 0;
    margin-bottom: 0.85rem;
    text-align: left;
    font-weight: 950;
  }

  .footer-caret {
    display: none;
    transition: transform 0.2s ease;
  }

  .footer-caret.rotated {
    transform: rotate(180deg);
  }

  .footer-panel {
    display: block;
  }

  .footer-panel nav {
    display: grid;
    gap: 0.55rem;
  }

  .footer-panel a,
  .footer-address > span {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
  }

  .footer-panel a:hover,
  .footer-panel a:focus {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .footer-muted-link {
    opacity: 0.76;
  }

  .footer-address {
    display: grid;
    gap: 0.68rem;
    margin: 0 0 1rem;
    font-style: normal;
  }

  .footer-address a,
  .footer-address > span {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    line-height: 1.35;
  }

  .footer-address i {
    color: #a8dff8;
    margin-top: 2px;
  }

  .footer-bottom {
    background: var(--desaga-dark-blue);
    padding: 0.78rem 0;
  }

  .footer-bottom-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .footer-bottom p {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.86);
  }

  .footer-bottom a {
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.85rem;
    text-decoration: none;
  }

  .footer-bottom a:hover,
  .footer-bottom a:focus {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 767.98px) {
    .footer-main {
      padding: 2rem 0;
    }

    .footer-brand {
      text-align: center;
    }

    .footer-logo,
    .footer-social,
    .footer-cta {
      justify-content: center;
    }

    .footer-group {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1rem;
    }

    .footer-caret {
      display: inline-flex;
    }

    .footer-panel {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease;
    }

    .footer-panel.open {
      max-height: 720px;
    }

    .footer-bottom-wrap {
      justify-content: center;
      text-align: center;
    }
  }
</style>

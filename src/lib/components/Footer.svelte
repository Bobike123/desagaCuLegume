<script lang="ts">
  let openMenu = false;
  let openLocation = false;
  let openLegal = false;

  const menuLinks = [
    { href: '/', label: 'Acasă' },
    { href: '/produse', label: 'Produse' },
    { href: '/produse/de-sezon', label: 'De sezon' },
    { href: '/produse/la-borcan', label: 'La borcan' },
    { href: '/produse/colaboratori', label: 'Colaboratori' },
    { href: '/horeca', label: 'HORECA' },
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
                <span>Cluj-Napoca, Str. Constantin Brâncuși nr. 153</span>
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

            <iframe
              class="footer-map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2733.2627958985477!2d23.613140411901085!3d46.759716245953896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47490c49b6ff9853%3A0x2cdb1ae569801b0b!2sStrada%20Constantin%20Br%C3%A2ncu%C8%99i%20153%2C%20Cluj-Napoca%20400645%2C%20Rom%C3%A2nia!5e0!3m2!1sro!2sdk!4v1765492717214!5m2!1sro!2sdk"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Harta locației DeSaga cu Legume"
            ></iframe>
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
      <p>Realizat pentru comunitatea locală. Keep it green.</p>
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

  .footer-map {
    width: 100%;
    height: 170px;
    border: 0;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
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

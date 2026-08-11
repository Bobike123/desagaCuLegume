<script lang="ts">
  const phone = '+40 729 969 822';
  const phoneHref = 'tel:+40729969822';
  const email = 'desagatech@gmail.com';
  const emailHref = `mailto:${email}`;
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';
</script>

<div class="maintenance-page">
  <div class="info-bar">
    <div class="page-container info-bar-inner">
      <span>
        <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
        Cluj-Napoca, Str. Constantin Brâncuși nr. 153
      </span>
      <span>
        <i class="bi bi-clock-fill" aria-hidden="true"></i>
        L–V: 9:00–18:00
      </span>
      <a href={phoneHref}>
        <i class="bi bi-telephone-fill" aria-hidden="true"></i>
        {phone}
      </a>
    </div>
  </div>

  <header class="site-header">
    <div class="page-container header-inner">
      <div class="brand" aria-label="DeSaga cu Legume">
        <img src="/images/shared/logo.png" alt="DeSaga cu Legume" />
        <span class="brand-copy">
          <strong>DeSaga cu Legume</strong>
          <small>fermă locală</small>
        </span>
      </div>

      <a class="header-call" href={phoneHref}>
        <i class="bi bi-telephone-fill" aria-hidden="true"></i>
        <span>Sună-ne</span>
      </a>
    </div>
  </header>

  <main>
    <section class="maintenance-hero" aria-labelledby="maintenance-title">
      <div class="page-container hero-grid">
        <div class="hero-content">
          <div class="status-badge">
            <span class="status-dot" aria-hidden="true"></span>
            Site în mentenanță
          </div>

          <p class="eyebrow">Punem lucrurile în ordine</p>
          <h1 id="maintenance-title">Revenim în curând, mai proaspeți.</h1>
          <p class="hero-lead">
            Lucrăm la site pentru a-ți pregăti o experiență mai bună. Între timp,
            suntem în continuare aproape de tine pentru produse, stoc și comenzi.
          </p>

          <div class="primary-actions" aria-label="Contact rapid">
            <a class="primary-button" href={phoneHref}>
              <i class="bi bi-telephone-fill" aria-hidden="true"></i>
              Sună pentru stocul de azi
            </a>
            <a class="secondary-button" href={emailHref}>
              <i class="bi bi-envelope-fill" aria-hidden="true"></i>
              Trimite-ne un email
            </a>
          </div>

          <div class="contact-strip">
            <div class="contact-item">
              <span class="contact-icon">
                <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
              </span>
              <span>
                <small>Ne găsești la</small>
                <strong>Brâncuși 153, Cluj-Napoca</strong>
              </span>
            </div>

            <div class="contact-item">
              <span class="contact-icon">
                <i class="bi bi-clock-fill" aria-hidden="true"></i>
              </span>
              <span>
                <small>Program</small>
                <strong>Luni–Vineri, 9:00–18:00</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="image-panel">
            <img src="/images/home/hero.jpg" alt="" />
            <div class="image-note">
              <i class="bi bi-basket2-fill" aria-hidden="true"></i>
              <span>
                <small>Direct de la producător</small>
                <strong>Local, gustos, sănătos</strong>
              </span>
            </div>
          </div>
          <span class="decorative-circle circle-one"></span>
          <span class="decorative-circle circle-two"></span>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="page-container footer-inner">
      <p>© 2026 DeSaga cu Legume. Mulțumim pentru răbdare!</p>
      <div class="social-links" aria-label="Urmărește DeSaga cu Legume">
        <span>Rămânem aproape:</span>
        <a href={facebookHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <i class="bi bi-facebook" aria-hidden="true"></i>
        </a>
        <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <i class="bi bi-instagram" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </footer>
</div>

<style>
  .maintenance-page {
    --page-blue: var(--desaga-blue, #2699d6);
    --page-blue-dark: var(--desaga-dark-blue, #1f7fb3);
    --page-green: var(--desaga-green, #1f6f45);
    --page-heading: var(--desaga-heading, #14212b);
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background:
      radial-gradient(circle at 12% 74%, rgba(31, 111, 69, 0.08), transparent 25rem),
      linear-gradient(135deg, #ffffff 0%, #f7fbf5 55%, #eef7f1 100%);
  }

  .page-container {
    width: min(1180px, calc(100% - 2rem));
    margin-inline: auto;
  }

  .info-bar {
    color: #fff;
    background: var(--page-blue);
    font-size: 0.84rem;
    font-weight: 650;
  }

  .info-bar-inner {
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: clamp(1rem, 3vw, 2.5rem);
  }

  .info-bar span,
  .info-bar a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .info-bar a {
    color: #fff;
    text-decoration: none;
  }

  .site-header {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.92);
    border-bottom: 1px solid rgba(15, 23, 42, 0.07);
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.05);
    backdrop-filter: blur(12px);
  }

  .header-inner {
    min-height: 86px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .brand img {
    width: 92px;
    height: 58px;
    object-fit: contain;
  }

  .brand-copy {
    display: flex;
    flex-direction: column;
    color: var(--page-heading);
    line-height: 1.05;
  }

  .brand-copy strong {
    font-size: 1.05rem;
    font-weight: 900;
  }

  .brand-copy small {
    margin-top: 0.32rem;
    color: var(--page-green);
    font-size: 0.69rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .header-call {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0.7rem 1rem;
    color: #fff;
    background: var(--page-blue);
    border-radius: 999px;
    font-weight: 850;
    text-decoration: none;
    box-shadow: 0 10px 22px rgba(38, 153, 214, 0.22);
    transition: transform 160ms ease, background-color 160ms ease;
  }

  .header-call:hover,
  .header-call:focus-visible {
    color: #fff;
    background: var(--page-blue-dark);
    transform: translateY(-1px);
  }

  main {
    flex: 1;
    display: flex;
  }

  .maintenance-hero {
    width: 100%;
    display: flex;
    align-items: center;
    padding-block: clamp(3rem, 7vw, 6.5rem);
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(360px, 0.98fr);
    align-items: center;
    gap: clamp(2.5rem, 7vw, 6.5rem);
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.48rem 0.78rem;
    color: var(--page-green);
    background: rgba(31, 111, 69, 0.08);
    border: 1px solid rgba(31, 111, 69, 0.18);
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 850;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    background: var(--page-green);
    border-radius: 50%;
    box-shadow: 0 0 0 5px rgba(31, 111, 69, 0.1);
  }

  .eyebrow {
    margin: 1.55rem 0 0.55rem;
    color: var(--page-blue-dark);
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 700px;
    margin: 0;
    color: var(--page-heading);
    font-size: clamp(2.55rem, 5.4vw, 5rem);
    font-weight: 950;
    letter-spacing: -0.052em;
    line-height: 0.98;
    text-wrap: balance;
  }

  .hero-lead {
    max-width: 650px;
    margin: 1.45rem 0 0;
    color: rgba(20, 33, 43, 0.72);
    font-size: clamp(1rem, 1.6vw, 1.16rem);
    line-height: 1.7;
  }

  .primary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 2rem;
  }

  .primary-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    min-height: 52px;
    padding: 0.8rem 1.15rem;
    border-radius: 13px;
    font-weight: 850;
    text-decoration: none;
    transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
  }

  .primary-actions a:hover,
  .primary-actions a:focus-visible {
    transform: translateY(-2px);
  }

  .primary-button {
    color: #fff;
    background: var(--page-blue);
    box-shadow: 0 14px 28px rgba(38, 153, 214, 0.22);
  }

  .primary-button:hover,
  .primary-button:focus-visible {
    color: #fff;
    background: var(--page-blue-dark);
    box-shadow: 0 16px 32px rgba(38, 153, 214, 0.28);
  }

  .secondary-button {
    color: var(--page-heading);
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.12);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  }

  .secondary-button:hover,
  .secondary-button:focus-visible {
    color: var(--page-blue-dark);
    border-color: rgba(38, 153, 214, 0.35);
  }

  .contact-strip {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 2.25rem;
    padding-top: 1.45rem;
    border-top: 1px solid rgba(15, 23, 42, 0.1);
  }

  .contact-item {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .contact-icon {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    color: var(--page-green);
    background: rgba(31, 111, 69, 0.09);
    border-radius: 11px;
  }

  .contact-item > span:last-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .contact-item small {
    color: rgba(20, 33, 43, 0.58);
    font-size: 0.74rem;
    font-weight: 750;
  }

  .contact-item strong {
    color: var(--page-heading);
    font-size: 0.86rem;
    line-height: 1.35;
  }

  .hero-visual {
    position: relative;
    padding: 1.25rem 1rem 1.75rem 1.75rem;
  }

  .image-panel {
    position: relative;
    z-index: 1;
    overflow: visible;
    padding: 0.6rem;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 32px;
    box-shadow: 0 28px 70px rgba(38, 53, 68, 0.18);
    transform: rotate(1.5deg);
  }

  .image-panel > img {
    width: 100%;
    min-height: 420px;
    display: block;
    object-fit: cover;
    border-radius: 25px;
  }

  .image-note {
    position: absolute;
    right: -1.25rem;
    bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 250px;
    padding: 0.85rem 1rem;
    color: #fff;
    background: var(--page-green);
    border: 5px solid #fff;
    border-radius: 17px;
    box-shadow: 0 18px 36px rgba(23, 69, 45, 0.28);
    transform: rotate(-1.5deg);
  }

  .image-note > i {
    font-size: 1.35rem;
  }

  .image-note span {
    display: flex;
    flex-direction: column;
  }

  .image-note small {
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.68rem;
    font-weight: 700;
  }

  .image-note strong {
    font-size: 0.9rem;
  }

  .decorative-circle {
    position: absolute;
    display: block;
    border-radius: 50%;
  }

  .circle-one {
    top: -0.5rem;
    right: -1.5rem;
    width: 140px;
    height: 140px;
    background: rgba(38, 153, 214, 0.1);
  }

  .circle-two {
    bottom: -1rem;
    left: 0;
    width: 92px;
    height: 92px;
    background: rgba(31, 111, 69, 0.1);
  }

  footer {
    color: rgba(255, 255, 255, 0.78);
    background: var(--desaga-slate, #263544);
  }

  .footer-inner {
    min-height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .footer-inner p {
    margin: 0;
    font-size: 0.82rem;
  }

  .social-links {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.78rem;
  }

  .social-links a {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    text-decoration: none;
    transition: background-color 160ms ease;
  }

  .social-links a:hover,
  .social-links a:focus-visible {
    color: #fff;
    background: var(--page-blue);
  }

  @media (max-width: 900px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    .hero-content {
      max-width: 720px;
    }

    .hero-visual {
      width: min(640px, 100%);
      margin-inline: auto;
    }

    .image-panel > img {
      min-height: 340px;
    }
  }

  @media (max-width: 680px) {
    .page-container {
      width: min(100% - 1.25rem, 1180px);
    }

    .info-bar-inner {
      min-height: 34px;
      justify-content: center;
    }

    .info-bar-inner > span {
      display: none;
    }

    .header-inner {
      min-height: 74px;
    }

    .brand img {
      width: 72px;
      height: 48px;
    }

    .brand-copy strong {
      font-size: 0.93rem;
    }

    .header-call span {
      display: none;
    }

    .header-call {
      width: 42px;
      min-height: 42px;
      justify-content: center;
      padding: 0;
    }

    .maintenance-hero {
      padding-block: 2.5rem 3.25rem;
    }

    h1 {
      font-size: clamp(2.35rem, 13vw, 3.5rem);
    }

    .primary-actions {
      display: grid;
    }

    .contact-strip {
      grid-template-columns: 1fr;
    }

    .hero-visual {
      padding: 0.75rem 0.25rem 1rem;
    }

    .image-panel {
      border-radius: 24px;
      transform: none;
    }

    .image-panel > img {
      min-height: 250px;
      border-radius: 18px;
    }

    .image-note {
      right: 0.75rem;
      bottom: -1.25rem;
      min-width: 0;
      border-width: 4px;
      transform: none;
    }

    .footer-inner {
      min-height: 92px;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }

    .social-links > span {
      display: none;
    }
  }
</style>

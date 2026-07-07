<script lang="ts">
  import { onMount } from 'svelte';
  import Hero from '$lib/components/Hero.svelte';
  import LocationMapPreview from '$lib/components/LocationMapPreview.svelte';
  import MessageThread from '$lib/components/MessageThread.svelte';
  import { DESAGA_ADDRESS, DESAGA_MAPS_URL } from '$lib/location';
  import { auth } from '$lib/stores/auth';

  const phone = '+40 729 969 822';
  const phoneHref = 'tel:+40729969822';
  const email = 'desagatech@gmail.com';
  const emailHref = `mailto:${email}`;
  const schedule = 'L–V, 9:00–18:00';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';

  const contactMethods = [
    {
      title: 'Telefon',
      value: phone,
      text: 'Pentru stocul de azi, comenzi rapide și detalii despre ridicare.',
      href: phoneHref,
      action: 'Sună acum',
      icon: 'bi-telephone-fill',
    },
    {
      title: 'Email',
      value: email,
      text: 'Pentru întrebări generale, colaborări sau mesaje care nu sunt urgente.',
      href: emailHref,
      action: 'Trimite email',
      icon: 'bi-envelope-fill',
    },
    {
      title: 'Program',
      value: schedule,
      text: 'Programul poate varia în funcție de stoc, vreme și perioadele cu evenimente.',
      href: phoneHref,
      action: 'Confirmă telefonic',
      icon: 'bi-clock-fill',
    },
  ];

  let authChecked = false;

  onMount(async () => {
    await auth.refresh();
    authChecked = true;
  });
</script>

<svelte:head>
  <title>Contact - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Contact DeSaga cu Legume: telefon, email, adresă, program, hartă și mesaje despre comenzi."
  />
</svelte:head>

<Hero
  title="Contact DeSaga cu Legume"
  subtitle="Stocul se confirmă cel mai rapid telefonic. Pentru întrebări generale, folosește emailul sau mesajele din cont."
  backgroundImage="/images/contact/hero-contact.jpg"
  height="300px"
/>

<section class="contact-page">
  <div class="container">
    <section class="contact-intro" aria-labelledby="contact-title">
      <div class="intro-copy">
        <span class="eyebrow">Contact direct</span>
        <h1 id="contact-title">Comenzi, ridicare și informații despre stoc</h1>
        <p>
          Pentru produse disponibile azi, sună direct. Pentru colaborări, întrebări generale sau detalii care nu sunt urgente,
          trimite email la <a href={emailHref}>{email}</a>.
        </p>
      </div>

      <div class="intro-actions" aria-label="Acțiuni rapide de contact">
        <a class="quick-action primary" href={phoneHref}>
          <i class="bi bi-telephone-fill"></i>
          <span>
            <small>Telefon</small>
            <strong>{phone}</strong>
          </span>
        </a>
        <a class="quick-action" href={emailHref}>
          <i class="bi bi-envelope-fill"></i>
          <span>
            <small>Email</small>
            <strong>{email}</strong>
          </span>
        </a>
      </div>
    </section>

    <div class="contact-layout">
      <div class="contact-main">
        <section class="section-card" aria-labelledby="contact-methods-title">
          <div class="section-heading">
            <span class="eyebrow">Date de contact</span>
            <h2 id="contact-methods-title">Alege canalul potrivit</h2>
          </div>

          <div class="method-grid">
            {#each contactMethods as method}
              <article class="method-card">
                <span class="method-icon"><i class={'bi ' + method.icon}></i></span>
                <div class="method-content">
                  <h3>{method.title}</h3>
                  <a class="method-value" href={method.href}>{method.value}</a>
                  <p>{method.text}</p>
                  <a class="method-action" href={method.href}>{method.action} <i class="bi bi-arrow-right"></i></a>
                </div>
              </article>
            {/each}
          </div>
        </section>

        <section class="section-card social-card" aria-labelledby="social-title">
          <div>
            <span class="eyebrow">Noutăți</span>
            <h2 id="social-title">Urmărește stocul și evenimentele</h2>
            <p>Produsele se schimbă în funcție de recoltă. Social media este util pentru anunțuri rapide și noutăți.</p>
          </div>
          <div class="social-links">
            <a href={facebookHref} target="_blank" rel="noopener noreferrer"><i class="bi bi-facebook"></i> Facebook</a>
            <a href={instagramHref} target="_blank" rel="noopener noreferrer"><i class="bi bi-instagram"></i> Instagram</a>
          </div>
        </section>
      </div>

      <aside class="location-card" aria-labelledby="location-title">
        <div class="section-heading">
          <span class="eyebrow">Locație</span>
          <h2 id="location-title">Rulota DeSaga</h2>
        </div>

        <LocationMapPreview compact />

        <div class="location-details">
          <div class="detail-row">
            <i class="bi bi-geo-alt-fill"></i>
            <div>
              <strong>Adresă</strong>
              <span>{DESAGA_ADDRESS}</span>
            </div>
          </div>
          <div class="detail-row">
            <i class="bi bi-clock-fill"></i>
            <div>
              <strong>Program</strong>
              <span>{schedule}</span>
            </div>
          </div>
        </div>

        <div class="location-actions">
          <a class="btn btn-accent" href={DESAGA_MAPS_URL} target="_blank" rel="noopener noreferrer">
            <i class="bi bi-map-fill"></i> Deschide harta
          </a>
          <a class="btn btn-outline-accent" href={phoneHref}>
            <i class="bi bi-telephone"></i> Confirmă stocul
          </a>
        </div>
      </aside>
    </div>

    <section class="messages-shell" aria-labelledby="messages-title">
      <div class="messages-head">
        <div>
          <span class="eyebrow">Mesaje</span>
          <h2 id="messages-title">Conversații despre comenzi</h2>
          <p>Autentificarea este necesară ca mesajele să fie legate de comenzile tale.</p>
        </div>
      </div>

      {#if $auth.loading || !authChecked}
        <div class="panel loading-panel">
          <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
          <span>Se verifică autentificarea…</span>
        </div>
      {:else if !$auth.isAuthenticated}
        <div class="panel guest-panel">
          <div>
            <h3>Ai o întrebare despre o comandă?</h3>
            <p>Intră în cont ca să vezi comenzile și conversațiile legate de ele.</p>
          </div>
          <div class="action-row">
            <a class="btn btn-accent" href="/cont"><i class="bi bi-person-circle"></i> Intră în cont</a>
            <a class="btn btn-outline-accent" href={phoneHref}><i class="bi bi-telephone"></i> Sună direct</a>
          </div>
        </div>
      {:else if $auth.isAdmin}
        <div class="panel guest-panel">
          <div>
            <h3>Mesaje administrator</h3>
            <p>Administratorii gestionează conversațiile din panoul dedicat.</p>
          </div>
          <a class="btn btn-accent" href="/admin/messages"><i class="bi bi-inbox"></i> Deschide mesajele</a>
        </div>
      {:else}
        <MessageThread
          mode="user"
          title="Conversații despre comenzi"
          subtitle="Scrie adminului despre comenzi, disponibilitate, livrare sau ridicare."
        />
      {/if}
    </section>
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2699d6);
    --accent-rgb: 38, 153, 214;
  }

  .contact-page {
    padding: 2rem 0 3.25rem;
    background:
      radial-gradient(circle at 12% 0%, rgba(var(--accent-rgb), 0.13), transparent 20rem),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 48%, #f9f7f2 100%);
  }

  .contact-intro,
  .section-card,
  .location-card,
  .panel {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 24px;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  }

  .contact-intro {
    display: grid;
    gap: 1rem;
    padding: clamp(1.1rem, 2vw, 1.6rem);
    margin-bottom: 1.2rem;
  }

  .intro-copy h1,
  .section-heading h2,
  .social-card h2,
  .messages-head h2,
  .guest-panel h3 {
    margin: 0;
    color: var(--desaga-heading, #14212b);
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .intro-copy h1 {
    max-width: 760px;
    font-size: clamp(1.55rem, 4vw, 2.7rem);
    line-height: 1.02;
  }

  .intro-copy p,
  .social-card p,
  .messages-head p,
  .guest-panel p,
  .method-card p {
    margin: 0.55rem 0 0;
    color: rgba(20, 33, 43, 0.68);
    line-height: 1.55;
  }

  .intro-copy a {
    color: var(--accent);
    font-weight: 900;
    text-decoration: none;
  }

  .eyebrow {
    display: inline-flex;
    margin-bottom: 0.42rem;
    color: var(--accent);
    font-size: 0.76rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .intro-actions {
    display: grid;
    gap: 0.75rem;
  }

  .quick-action {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.95rem;
    border-radius: 18px;
    color: var(--desaga-heading, #14212b);
    text-decoration: none;
    background: rgba(15, 23, 42, 0.035);
    border: 1px solid rgba(15, 23, 42, 0.08);
  }

  .quick-action.primary {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 12px 26px rgba(var(--accent-rgb), 0.24);
  }

  .quick-action i {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 14px;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.12);
  }

  .quick-action.primary i {
    color: #fff;
    background: rgba(255, 255, 255, 0.18);
  }

  .quick-action span {
    min-width: 0;
    display: grid;
    line-height: 1.15;
  }

  .quick-action small {
    color: currentColor;
    opacity: 0.72;
    font-weight: 850;
  }

  .quick-action strong {
    overflow-wrap: anywhere;
    font-weight: 950;
  }

  .contact-layout {
    display: grid;
    gap: 1.2rem;
  }

  .contact-main {
    display: grid;
    gap: 1.2rem;
  }

  .section-card,
  .location-card {
    padding: clamp(1rem, 2vw, 1.35rem);
  }

  .section-heading {
    margin-bottom: 1rem;
  }

  .section-heading h2,
  .social-card h2,
  .messages-head h2 {
    font-size: clamp(1.25rem, 2.4vw, 1.65rem);
  }

  .method-grid {
    display: grid;
    gap: 0.85rem;
  }

  .method-card {
    display: flex;
    gap: 0.85rem;
    padding: 1rem;
    border-radius: 18px;
    background: rgba(248, 250, 252, 0.9);
    border: 1px solid rgba(15, 23, 42, 0.07);
  }

  .method-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 15px;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.12);
  }

  .method-card h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--desaga-heading, #14212b);
    font-weight: 950;
  }

  .method-value {
    display: inline-flex;
    margin-top: 0.2rem;
    color: var(--desaga-heading, #14212b);
    font-weight: 950;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .method-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.65rem;
    color: var(--accent);
    font-weight: 900;
    text-decoration: none;
  }

  .social-card {
    display: grid;
    gap: 1rem;
    background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.09), rgba(255, 255, 255, 0.96));
  }

  .social-links,
  .location-actions,
  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    align-items: center;
  }

  .social-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.68rem 0.85rem;
    border-radius: 999px;
    color: var(--accent);
    background: #fff;
    border: 1px solid rgba(var(--accent-rgb), 0.18);
    font-weight: 900;
    text-decoration: none;
  }

  .location-card {
    align-self: start;
  }

  .location-details {
    display: grid;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .detail-row {
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.035);
    border: 1px solid rgba(15, 23, 42, 0.06);
  }

  .detail-row i {
    color: var(--accent);
    flex: 0 0 auto;
  }

  .detail-row div {
    display: grid;
    gap: 0.15rem;
  }

  .detail-row strong {
    color: var(--desaga-heading, #14212b);
    font-weight: 950;
  }

  .detail-row span {
    color: rgba(20, 33, 43, 0.68);
    line-height: 1.4;
  }

  .messages-shell {
    margin-top: 1.4rem;
  }

  .messages-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .panel {
    padding: 1rem;
  }

  .loading-panel,
  .guest-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .loading-panel {
    justify-content: center;
  }

  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    font-weight: 850;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.2);
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    background: var(--desaga-dark-blue, #1f7fb3) !important;
    border-color: var(--desaga-dark-blue, #1f7fb3) !important;
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.45) !important;
    color: var(--accent) !important;
    font-weight: 850;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.1) !important;
    color: var(--accent) !important;
  }

  @media (min-width: 768px) {
    .intro-actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .method-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .method-card {
      flex-direction: column;
    }
  }

  @media (min-width: 992px) {
    .contact-intro {
      grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
      align-items: center;
    }

    .intro-actions {
      grid-template-columns: 1fr;
    }

    .contact-layout {
      grid-template-columns: minmax(0, 1.35fr) minmax(330px, 0.65fr);
      align-items: start;
    }
  }

  @media (max-width: 767.98px) {
    .contact-page {
      padding-top: 1.2rem;
    }

    .method-card {
      padding: 0.9rem;
    }

    .messages-head,
    .loading-panel,
    .guest-panel {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>

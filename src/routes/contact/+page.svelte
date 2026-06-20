<script lang="ts">
  import { onMount } from 'svelte';
  import Hero from '$lib/components/Hero.svelte';
  import LocationMapPreview from '$lib/components/LocationMapPreview.svelte';
  import MessageThread from '$lib/components/MessageThread.svelte';
  import { DESAGA_ADDRESS } from '$lib/location';
  import { auth } from '$lib/stores/auth';

  const phoneHref = 'tel:+40729969822';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';

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
    content="Contact DeSaga cu Legume: telefon, adresă, program, hartă și mesaje despre comenzi."
  />
</svelte:head>

<Hero
  title="Contact DeSaga"
  subtitle="Sună pentru stocul de azi sau trimite un mesaj despre comandă"
  backgroundImage="/images/contact/hero-contact.jpg"
  height="300px"
/>

<section class="contact-page">
  <div class="container">
    <div class="contact-grid">
      <section class="contact-card contact-card-primary" aria-labelledby="contact-direct-title">
        <div class="card-icon"><i class="bi bi-telephone-fill"></i></div>
        <div>
          <h2 id="contact-direct-title">Contact rapid</h2>
          <p>Pentru stocul disponibil azi, comenzi rapide sau detalii despre ridicare.</p>
          <div class="action-row">
            <a class="btn btn-accent" href={phoneHref}>
              <i class="bi bi-telephone-fill"></i> Sună acum
            </a>
            <a class="btn btn-outline-accent" href="/produse">
              <i class="bi bi-basket"></i> Vezi produsele
            </a>
          </div>
        </div>
      </section>

      <section class="contact-card" aria-labelledby="location-title">
        <div class="card-icon"><i class="bi bi-geo-alt-fill"></i></div>
        <div>
          <h2 id="location-title">Rulota DeSaga</h2>
          <p>{DESAGA_ADDRESS}</p>
          <p class="muted mb-0">Program: L–V, 9:00–18:00</p>
        </div>
      </section>

      <section class="contact-card" aria-labelledby="social-title">
        <div class="card-icon"><i class="bi bi-chat-dots-fill"></i></div>
        <div>
          <h2 id="social-title">Urmărește noutățile</h2>
          <p>Stocul se schimbă în funcție de recoltă și cerere.</p>
          <div class="social-row">
            <a href={facebookHref} target="_blank" rel="noopener noreferrer"><i class="bi bi-facebook"></i> Facebook</a>
            <a href={instagramHref} target="_blank" rel="noopener noreferrer"><i class="bi bi-instagram"></i> Instagram</a>
          </div>
        </div>
      </section>
    </div>

    <div class="map-panel">
      <LocationMapPreview />
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
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 44%);
    padding: 2rem 0 3rem;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (min-width: 992px) {
    .contact-grid {
      grid-template-columns: 1.25fr 0.9fr 0.9fr;
    }
  }

  .contact-card,
  .panel {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 20px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.07);
  }

  .contact-card {
    display: flex;
    gap: 1rem;
    padding: 1.2rem;
  }

  .contact-card-primary {
    background: rgba(var(--accent-rgb), 0.08);
    border-color: rgba(var(--accent-rgb), 0.18);
  }

  .contact-card h2,
  .messages-head h2,
  .guest-panel h3 {
    margin: 0;
    font-weight: 950;
    color: #152432;
    letter-spacing: -0.02em;
  }

  .contact-card h2 {
    font-size: 1.05rem;
  }

  .contact-card p,
  .messages-head p,
  .guest-panel p {
    margin: 0.35rem 0 0;
    color: rgba(21, 36, 50, 0.68);
    line-height: 1.45;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.12);
    flex: 0 0 auto;
  }

  .action-row,
  .social-row {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 0.9rem;
  }

  .social-row a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 850;
  }

  .map-panel {
    margin-bottom: 1.4rem;
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

  .eyebrow {
    display: inline-block;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
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

  .muted {
    color: rgba(21, 36, 50, 0.65);
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

  @media (max-width: 767.98px) {
    .contact-page {
      padding-top: 1.2rem;
    }

    .messages-head,
    .loading-panel,
    .guest-panel {
      align-items: stretch;
      flex-direction: column;
    }

  }
</style>

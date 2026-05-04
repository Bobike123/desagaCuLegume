<script lang="ts">
  import AdminNav from '$lib/components/AdminNav.svelte';
</script>

<svelte:head>
  <title>Admin - DeSaga</title>
</svelte:head>

<AdminNav />

<div class="adminPage">
  <section class="hero">
    <div class="hero__copy">
      <p class="eyebrow">DeSaga admin</p>
      <h1>Panou de control</h1>
      <p class="lead">Gestionează catalogul, comenzile, mesajele, evenimentele și cererile HORECA dintr-un spațiu clar pe desktop și rapid pe telefon.</p>
    </div>
    <div class="hero__badge">
      <i class="bi bi-grid-1x2"></i>
      <span>Admin</span>
    </div>
  </section>

  <section class="navGrid" aria-label="Secțiuni admin">
    <a href="/admin/dashboard" class="navCard primary">
      <span class="icon"><i class="bi bi-speedometer2"></i></span>
      <span>
        <strong>Dashboard</strong>
        <small>Statistici rapide și scurtături.</small>
      </span>
    </a>

    <a href="/admin/produse" class="navCard">
      <span class="icon"><i class="bi bi-box-seam"></i></span>
      <span>
        <strong>Produse</strong>
        <small>Catalog, prețuri, stocuri.</small>
      </span>
    </a>

    <a href="/admin/comenzi" class="navCard">
      <span class="icon"><i class="bi bi-receipt"></i></span>
      <span>
        <strong>Comenzi</strong>
        <small>Status comandă, plată și livrare.</small>
      </span>
    </a>

    <a href="/admin/messages" class="navCard">
      <span class="icon"><i class="bi bi-chat-dots"></i></span>
      <span>
        <strong>Mesaje</strong>
        <small>Inbox suport clienți.</small>
      </span>
    </a>
  </section>
</div>

<style>
  .adminPage {
    --bg: #f6f1e7;
    --card: rgba(255, 255, 255, 0.92);
    --ink: #1d241b;
    --muted: #697161;
    --line: rgba(34, 43, 30, 0.12);
    --accent: #274f2a;
    --accent-2: #8bd450;
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(18px, 3vw, 36px);
    background:
      radial-gradient(900px 420px at 10% 0%, rgba(139, 212, 80, 0.24), transparent 60%),
      linear-gradient(135deg, #fbf7ef 0%, var(--bg) 100%);
    color: var(--ink);
  }

  .hero {
    min-height: 280px;
    border: 1px solid var(--line);
    border-radius: 32px;
    padding: clamp(22px, 5vw, 46px);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 24px;
    background:
      linear-gradient(135deg, rgba(39, 79, 42, 0.94), rgba(26, 45, 29, 0.92)),
      radial-gradient(500px 220px at 80% 10%, rgba(139, 212, 80, 0.5), transparent 70%);
    box-shadow: 0 28px 80px rgba(35, 51, 30, 0.18);
    color: #fffdf7;
    overflow: hidden;
    position: relative;
  }

  .hero::after {
    content: '';
    position: absolute;
    inset: auto -80px -140px auto;
    width: 320px;
    height: 320px;
    border-radius: 999px;
    background: rgba(139, 212, 80, 0.18);
  }

  .hero__copy,
  .hero__badge {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    margin: 0 0 10px;
    font-size: 0.8rem;
    font-weight: 950;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #bdf48a;
  }

  h1 {
    margin: 0;
    max-width: 760px;
    font-size: clamp(2.25rem, 7vw, 5rem);
    line-height: 0.92;
    letter-spacing: -0.07em;
    font-weight: 950;
  }

  .lead {
    max-width: 640px;
    margin: 18px 0 0;
    color: rgba(255, 253, 247, 0.78);
    font-size: clamp(1rem, 2vw, 1.18rem);
  }

  .hero__badge {
    min-width: 142px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 24px;
    padding: 18px;
    display: grid;
    gap: 12px;
    justify-items: start;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px);
  }

  .hero__badge i {
    font-size: 2rem;
  }

  .hero__badge span {
    font-weight: 950;
  }

  .navGrid {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .navCard {
    min-height: 168px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 22px;
    padding: 20px;
    border-radius: 26px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--ink);
    text-decoration: none;
    box-shadow: 0 18px 50px rgba(35, 51, 30, 0.08);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .navCard:hover,
  .navCard:focus-visible {
    transform: translateY(-3px);
    border-color: rgba(39, 79, 42, 0.32);
    box-shadow: 0 24px 60px rgba(35, 51, 30, 0.14);
    color: var(--ink);
  }

  .navCard.primary {
    background: #fffdf7;
  }

  .icon {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    color: var(--accent);
    background: rgba(139, 212, 80, 0.22);
    font-size: 1.35rem;
  }

  .navCard strong {
    display: block;
    font-size: 1.15rem;
    font-weight: 950;
    letter-spacing: -0.02em;
  }

  .navCard small {
    display: block;
    margin-top: 5px;
    color: var(--muted);
    line-height: 1.35;
  }

  @media (max-width: 1180px) {
    .navGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 991.98px) {
    .adminPage {
      margin-left: 0;
      padding: 88px 16px 24px;
    }
  }

  @media (max-width: 680px) {
    .hero {
      min-height: auto;
      grid-template-columns: 1fr;
      border-radius: 24px;
    }

    .hero__badge {
      min-width: 0;
      width: 100%;
      grid-template-columns: auto 1fr;
      align-items: center;
    }

    .navGrid {
      grid-template-columns: 1fr;
    }

    .navCard {
      min-height: 136px;
    }
  }
</style>

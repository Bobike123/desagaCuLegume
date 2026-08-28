<script lang="ts">
  // AdminNav is provided by the admin layout
</script>

<svelte:head>
  <title>Admin - DeSaga</title>
</svelte:head>

<div class="admin-page">
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
        <strong>Panou</strong>
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
        <small>Stare comandă, plată și livrare.</small>
      </span>
    </a>

    <a href="/admin/messages" class="navCard">
      <span class="icon"><i class="bi bi-chat-dots"></i></span>
      <span>
        <strong>Mesaje</strong>
        <small>Mesagerie suport clienți.</small>
      </span>
    </a>
  </section>
</div>

<style>
  .admin-page {
    background:
      radial-gradient(900px 420px at 10% 0%, rgba(139, 212, 80, 0.24), transparent 60%),
      linear-gradient(135deg, #fbf7ef 0%, var(--bg) 100%);
  }

  .hero {
    min-height: 280px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
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
    margin-bottom: 18px;
  }

  .hero::after {
    content: '';
    position: absolute;
    inset: auto -80px -140px auto;
    width: 320px;
    height: 320px;
    border-radius: var(--radius-lg);
    background: rgba(139, 212, 80, 0.18);
  }

  .hero__copy,
  .hero__badge {
    position: relative;
    z-index: 1;
  }

  .hero .eyebrow {
    color: #bdf48a;
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
    border-radius: var(--radius-lg);
    padding: 18px;
    display: grid;
    gap: 12px;
    justify-items: start;
    background: rgba(255, 255, 255, 0.12);
  }

  .hero__badge i {
    font-size: 2rem;
  }

  .hero__badge span {
    font-weight: 700;
  }

  .navGrid {
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
    border-radius: var(--radius-lg);
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.92);
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
    background: var(--surface);
  }

  .icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius);
    display: grid;
    place-items: center;
    color: var(--accent);
    background: rgba(139, 212, 80, 0.22);
    font-size: 1.35rem;
  }

  .navCard strong {
    display: block;
    font-size: 1.15rem;
    font-weight: 700;
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

  @media (max-width: 680px) {
    .hero {
      min-height: auto;
      grid-template-columns: 1fr;
      border-radius: var(--radius-lg);
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

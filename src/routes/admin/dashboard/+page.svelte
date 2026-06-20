<script lang="ts">
  import { onMount } from 'svelte';

  type DashboardState = {
    products: number;
    orders: number;
    messages: number;
    unreadMessages: number;
    horecaRequests: number;
    newHorecaRequests: number;
    securityUnread: number;
    securityDecoyHits24h: number;
    securityRateLimits24h: number;
    failedLogins24h: number;
  };

  let stats: DashboardState = {
    products: 0,
    orders: 0,
    messages: 0,
    unreadMessages: 0,
    horecaRequests: 0,
    newHorecaRequests: 0,
    securityUnread: 0,
    securityDecoyHits24h: 0,
    securityRateLimits24h: 0,
    failedLogins24h: 0,
  };

  let loading = true;
  let error = '';

  async function loadDashboard() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca dashboard-ul.');

      stats = {
        products: Number(data?.products ?? 0),
        orders: Number(data?.orders ?? 0),
        messages: Number(data?.messages ?? 0),
        unreadMessages: Number(data?.unreadMessages ?? 0),
        horecaRequests: Number(data?.horecaRequests ?? 0),
        newHorecaRequests: Number(data?.newHorecaRequests ?? 0),
        securityUnread: Number(data?.securityUnread ?? 0),
        securityDecoyHits24h: Number(data?.securityDecoyHits24h ?? 0),
        securityRateLimits24h: Number(data?.securityRateLimits24h ?? 0),
        failedLogins24h: Number(data?.failedLogins24h ?? 0),
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca dashboard-ul.';
    } finally {
      loading = false;
    }
  }

  async function markSecurityRead() {
    try {
      const res = await fetch('/api/admin/security-events', { method: 'PATCH' });
      if (!res.ok) throw new Error('Nu am putut marca notificările ca citite.');
      await loadDashboard();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut marca notificările ca citite.';
    }
  }

  onMount(loadDashboard);
</script>

<svelte:head>
  <title>Panou - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Overview</p>
      <h1>Panou administrare</h1>
      <p>Produse, comenzi, conversații și cereri HORECA într-o singură privire.</p>
    </div>
    <button class="action" on:click={loadDashboard} disabled={loading}>
      <i class="bi bi-arrow-clockwise"></i>
      <span>{loading ? 'Se încarcă…' : 'Reîncarcă'}</span>
    </button>
  </header>

  {#if error}
    <div class="notice danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <span>{error}</span>
    </div>
  {/if}

  <section class:active={stats.securityUnread > 0} class="securityNotice" aria-label="Activitate suspectă">
    <div class="securityNotice__icon">
      <i class="bi bi-shield-exclamation"></i>
    </div>
    <div>
      <p class="eyebrow">Activitate suspectă</p>
      <h2>{loading ? 'Se verifică activitatea' : stats.securityUnread > 0 ? 'Activitate nouă detectată' : 'Nicio notificare nouă'}</h2>
      <p>
        {loading
          ? 'Se încarcă sumarul de securitate.'
          : `${stats.securityDecoyHits24h} accesări decoy, ${stats.securityRateLimits24h} limitări și ${stats.failedLogins24h} autentificări eșuate în ultimele 24h.`}
      </p>
    </div>
    <div class="securityNotice__actions">
      <a class="quick primary" href="/admin/security"><i class="bi bi-list-check"></i> Vezi evenimente</a>
      <button class="quick" type="button" on:click={markSecurityRead} disabled={loading || stats.securityUnread === 0}>
        <i class="bi bi-check2-circle"></i> Marchează citit
      </button>
    </div>
  </section>

  <section class="metricGrid" aria-label="Statistici dashboard">
    <a class="metric featured" href="/admin/produse">
      <span class="metric__icon"><i class="bi bi-box-seam"></i></span>
      <span class="metric__label">Produse</span>
      <strong>{loading ? '…' : stats.products}</strong>
      <small>Catalog activ</small>
    </a>

    <a class="metric" href="/admin/comenzi">
      <span class="metric__icon"><i class="bi bi-receipt"></i></span>
      <span class="metric__label">Comenzi</span>
      <strong>{loading ? '…' : stats.orders}</strong>
      <small>Stări și livrare</small>
    </a>

    <a class="metric" href="/admin/horeca">
      <span class="metric__icon"><i class="bi bi-shop"></i></span>
      <span class="metric__label">HORECA</span>
      <strong>{loading ? '…' : stats.horecaRequests}</strong>
      <small>{loading ? '…' : `${stats.newHorecaRequests} cereri noi`}</small>
    </a>

    <a class="metric" href="/admin/messages">
      <span class="metric__icon"><i class="bi bi-chat-dots"></i></span>
      <span class="metric__label">Conversații</span>
      <strong>{loading ? '…' : stats.messages}</strong>
      <small>{loading ? '…' : `${stats.unreadMessages} necitite`}</small>
    </a>
  </section>

  <section class="commandPanel">
    <div>
      <p class="eyebrow">Scurtături</p>
      <h2>Acțiuni rapide</h2>
      <p>Zonele pe care le folosești cel mai des sunt la un click distanță.</p>
    </div>
    <div class="quickActions">
      <a href="/admin/horeca" class="quick primary"><i class="bi bi-shop"></i> Cereri HORECA</a>
      <a href="/admin/produse/new" class="quick"><i class="bi bi-plus-circle"></i> Produs nou</a>
      <a href="/admin/messages" class="quick"><i class="bi bi-chat-dots"></i> Mesaje</a>
    </div>
  </section>
</div>

<style>
  .admin-page {
    --accent-soft: rgba(139, 212, 80, 0.2);
    background:
      radial-gradient(850px 360px at 12% -8%, rgba(139, 212, 80, 0.24), transparent 60%),
      var(--bg);
  }

  h2 {
    margin: 0;
    font-weight: 950;
    letter-spacing: -0.055em;
    color: var(--ink);
    font-size: clamp(1.5rem, 3vw, 2.35rem);
  }

  .topbar p:not(.eyebrow),
  .commandPanel p:not(.eyebrow),
  .securityNotice p:not(.eyebrow) {
    max-width: 680px;
    margin: 10px 0 0;
    color: var(--muted);
  }

  .action,
  .quick {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    background: var(--surface);
    color: var(--ink);
    text-decoration: none;
    font-weight: 900;
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.08);
    cursor: pointer;
    border: 1px solid var(--line);
  }

  .action:disabled {
    opacity: 0.58;
  }

  button.quick:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .securityNotice {
    margin: 0 0 16px;
    border: 1px solid var(--line);
    border-radius: 30px;
    padding: 18px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    background: rgba(255, 253, 247, 0.88);
    box-shadow: 0 18px 50px rgba(35, 51, 30, 0.08);
  }

  .securityNotice.active {
    border-color: rgba(132, 32, 41, 0.34);
    background: #fff8ec;
    box-shadow: 0 20px 60px rgba(132, 32, 41, 0.12);
  }

  .securityNotice__icon {
    width: 54px;
    height: 54px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    color: #842029;
    background: rgba(132, 32, 41, 0.1);
    font-size: 1.35rem;
  }

  .securityNotice__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .metricGrid {
    display: grid;
    grid-template-columns: 1.25fr repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .metric {
    min-height: 220px;
    border: 1px solid var(--line);
    border-radius: 30px;
    padding: 20px;
    display: grid;
    align-content: space-between;
    gap: 14px;
    color: var(--ink);
    text-decoration: none;
    background: rgba(255, 253, 247, 0.88);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .metric:hover,
  .metric:focus-visible {
    color: var(--ink);
    transform: translateY(-3px);
    box-shadow: 0 30px 70px rgba(35, 51, 30, 0.15);
  }

  .metric.featured {
    color: #fffdf7;
    background: linear-gradient(135deg, #274f2a, #192c1b);
  }

  .metric__icon {
    width: 50px;
    height: 50px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 1.25rem;
  }

  .featured .metric__icon {
    color: #fffdf7;
    background: rgba(255, 255, 255, 0.14);
  }

  .metric__label {
    color: var(--muted);
    font-weight: 900;
  }

  .featured .metric__label,
  .featured small {
    color: rgba(255, 253, 247, 0.72);
  }

  .metric strong {
    display: block;
    font-size: clamp(2.4rem, 6vw, 4.8rem);
    line-height: 0.9;
    letter-spacing: -0.08em;
    font-weight: 950;
  }

  .metric small {
    color: var(--muted);
    font-weight: 750;
  }

  .commandPanel {
    border: 1px solid var(--line);
    border-radius: 30px;
    padding: clamp(18px, 3vw, 28px);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
    background: var(--surface);
    box-shadow: 0 18px 50px rgba(35, 51, 30, 0.08);
  }

  .quickActions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .quick.primary {
    background: var(--accent);
    color: #fffdf7;
    border-color: transparent;
  }

  @media (max-width: 1180px) {
    .metricGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .topbar,
    .commandPanel,
    .securityNotice {
      grid-template-columns: 1fr;
      display: grid;
      align-items: stretch;
    }

    .metricGrid {
      grid-template-columns: 1fr;
    }

    .metric {
      min-height: 170px;
    }

    .action,
    .quick,
    .quickActions {
      width: 100%;
    }
  }
</style>

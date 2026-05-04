<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type DashboardState = {
    products: number;
    orders: number;
    messages: number;
    unreadMessages: number;
    horecaRequests: number;
    newHorecaRequests: number;
  };

  let stats: DashboardState = {
    products: 0,
    orders: 0,
    messages: 0,
    unreadMessages: 0,
    horecaRequests: 0,
    newHorecaRequests: 0,
  };

  let loading = true;
  let error = '';

  async function loadDashboard() {
    loading = true;
    error = '';

    try {
      const [productsRes, ordersRes, messagesRes, horecaRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/messages'),
        fetch('/api/horeca'),
      ]);

      const productsData = await productsRes.json().catch(() => ({}));
      const ordersData = await ordersRes.json().catch(() => ({}));
      const messagesData = await messagesRes.json().catch(() => ({}));
      const horecaData = await horecaRes.json().catch(() => ({}));

      if (!productsRes.ok || !ordersRes.ok || !messagesRes.ok || !horecaRes.ok) {
        throw new Error(
          productsData?.error ??
            ordersData?.error ??
            messagesData?.error ??
            horecaData?.error ??
            'Nu am putut încărca dashboard-ul.'
        );
      }

      const messages = Array.isArray(messagesData?.items) ? messagesData.items : [];
      const horecaItems = Array.isArray(horecaData?.items) ? horecaData.items : [];

      stats.products = Array.isArray(productsData?.items) ? productsData.items.length : 0;
      stats.orders = Array.isArray(ordersData?.items) ? ordersData.items.length : 0;
      stats.messages = messages.length;
      stats.unreadMessages = messages.reduce((sum: number, item: any) => sum + Number(item.unreadCount ?? 0), 0);
      stats.horecaRequests = horecaItems.length;
      stats.newHorecaRequests = horecaItems.filter((item: any) => item.status === 'NEW').length;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca dashboard-ul.';
    } finally {
      loading = false;
    }
  }

  onMount(loadDashboard);
</script>

<svelte:head>
  <title>Dashboard - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Overview</p>
      <h1>Dashboard</h1>
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
      <small>Statusuri și livrare</small>
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
  .page {
    --bg: #f6f1e7;
    --surface: #fffdf7;
    --ink: #1d241b;
    --muted: #6b7165;
    --line: rgba(31, 42, 28, 0.12);
    --accent: #274f2a;
    --accent-soft: rgba(139, 212, 80, 0.2);
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(18px, 3vw, 34px);
    background:
      radial-gradient(850px 360px at 12% -8%, rgba(139, 212, 80, 0.24), transparent 60%),
      var(--bg);
    color: var(--ink);
  }

  .topbar {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0 0 6px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.75rem;
    font-weight: 950;
  }

  h1,
  h2 {
    margin: 0;
    font-weight: 950;
    letter-spacing: -0.055em;
    color: var(--ink);
  }

  h1 {
    font-size: clamp(2.25rem, 7vw, 4.8rem);
    line-height: 0.94;
  }

  h2 {
    font-size: clamp(1.5rem, 3vw, 2.35rem);
  }

  .topbar p:not(.eyebrow),
  .commandPanel p:not(.eyebrow) {
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
  }

  .action:disabled {
    opacity: 0.58;
  }

  .notice {
    margin: 0 0 16px;
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    gap: 10px;
    align-items: center;
    font-weight: 800;
  }

  .notice.danger {
    background: #fff1f1;
    border: 1px solid #facaca;
    color: #842029;
  }

  .metricGrid {
    display: grid;
    grid-template-columns: 1.25fr repeat(3, minmax(0, 1fr));
    gap: 14px;
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
    margin-top: 16px;
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
  }

  @media (max-width: 1180px) {
    .metricGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding: 88px 16px 24px;
    }
  }

  @media (max-width: 720px) {
    .topbar,
    .commandPanel {
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

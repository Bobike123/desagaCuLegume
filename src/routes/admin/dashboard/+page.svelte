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
  <div class="page__head">
    <div>
      <h1>Dashboard</h1>
      <p>Produse, comenzi, conversații și cereri HORECA.</p>
    </div>
    <button class="btn btn-outline-secondary" on:click={loadDashboard} disabled={loading}>
      <i class="bi bi-arrow-clockwise"></i> Reîncarcă
    </button>
  </div>

  {#if error}
    <div class="alert alert-danger">{error}</div>
  {/if}

  <div class="cards">
    <a class="cardStat" href="/admin/produse">
      <div class="cardStat__icon"><i class="bi bi-box-seam"></i></div>
      <div>
        <div class="cardStat__label">Produse</div>
        <div class="cardStat__value">{loading ? '…' : stats.products}</div>
      </div>
    </a>

    <a class="cardStat" href="/admin/comenzi">
      <div class="cardStat__icon"><i class="bi bi-receipt"></i></div>
      <div>
        <div class="cardStat__label">Comenzi</div>
        <div class="cardStat__value">{loading ? '…' : stats.orders}</div>
      </div>
    </a>

    <a class="cardStat" href="/admin/horeca">
      <div class="cardStat__icon"><i class="bi bi-shop"></i></div>
      <div>
        <div class="cardStat__label">Cereri HORECA</div>
        <div class="cardStat__value">{loading ? '…' : stats.horecaRequests}</div>
        <div class="cardStat__meta">{loading ? '…' : `${stats.newHorecaRequests} cereri noi`}</div>
      </div>
    </a>

    <a class="cardStat" href="/admin/messages">
      <div class="cardStat__icon"><i class="bi bi-chat-dots"></i></div>
      <div>
        <div class="cardStat__label">Conversații</div>
        <div class="cardStat__value">{loading ? '…' : stats.messages}</div>
        <div class="cardStat__meta">{loading ? '…' : `${stats.unreadMessages} mesaje necitite`}</div>
      </div>
    </a>
  </div>

  <section class="quickPanel">
    <div>
      <h2>Acțiuni rapide</h2>
      <p>Accesează zonele care cer atenție cel mai des.</p>
    </div>

    <div class="quickActions">
      <a class="btn btn-primary" href="/admin/horeca">
        <i class="bi bi-shop"></i> Vezi cereri HORECA
      </a>
      <a class="btn btn-outline-primary" href="/admin/produse/new">
        <i class="bi bi-plus-circle"></i> Produs nou
      </a>
      <a class="btn btn-outline-primary" href="/admin/messages">
        <i class="bi bi-chat-dots"></i> Mesaje
      </a>
    </div>
  </section>
</div>

<style>
  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .page__head h1 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .page__head p {
    margin: 6px 0 0;
    color: var(--desaga-muted);
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .cardStat {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: white;
    border-radius: 18px;
    padding: 20px;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--desaga-border);
    box-shadow: var(--desaga-shadow-sm);
  }

  .cardStat:hover,
  .cardStat:focus {
    color: inherit;
    transform: translateY(-1px);
    box-shadow: var(--desaga-shadow-md);
  }

  .cardStat__icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.11);
    flex: 0 0 auto;
  }

  .cardStat__label {
    font-weight: 800;
    color: rgba(0, 0, 0, 0.65);
  }

  .cardStat__value {
    font-size: 2rem;
    font-weight: 950;
    margin-top: 4px;
    line-height: 1;
    color: var(--desaga-heading);
  }

  .cardStat__meta {
    margin-top: 8px;
    color: rgba(0, 0, 0, 0.65);
  }

  .quickPanel {
    margin-top: 18px;
    padding: 20px;
    border-radius: 18px;
    background: white;
    border: 1px solid var(--desaga-border);
    box-shadow: var(--desaga-shadow-sm);
    display: grid;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .quickPanel {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  .quickPanel h2 {
    margin: 0 0 0.35rem;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .quickPanel p {
    margin: 0;
    color: var(--desaga-muted);
  }

  .quickActions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding: 18px;
    }
  }

  @media (max-width: 576px) {
    .page__head {
      align-items: stretch;
      flex-direction: column;
    }

    .quickActions .btn,
    .page__head .btn {
      width: 100%;
    }
  }
</style>
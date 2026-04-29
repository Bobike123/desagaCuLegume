<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type DashboardState = {
    products: number;
    orders: number;
    messages: number;
    unreadMessages: number;
  };

  let stats: DashboardState = {
    products: 0,
    orders: 0,
    messages: 0,
    unreadMessages: 0,
  };

  let loading = true;
  let error = '';

  async function loadDashboard() {
    loading = true;
    error = '';

    try {
      const [productsRes, ordersRes, messagesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/messages'),
      ]);

      const productsData = await productsRes.json().catch(() => ({}));
      const ordersData = await ordersRes.json().catch(() => ({}));
      const messagesData = await messagesRes.json().catch(() => ({}));

      if (!productsRes.ok || !ordersRes.ok || !messagesRes.ok) {
        throw new Error(productsData?.error ?? ordersData?.error ?? messagesData?.error ?? 'Nu am putut încărca dashboard-ul.');
      }

      stats.products = Array.isArray(productsData?.items) ? productsData.items.length : 0;
      stats.orders = Array.isArray(ordersData?.items) ? ordersData.items.length : 0;
      stats.messages = Array.isArray(messagesData?.items) ? messagesData.items.length : 0;
      stats.unreadMessages = Array.isArray(messagesData?.items)
        ? messagesData.items.reduce((sum: number, item: any) => sum + Number(item.unreadCount ?? 0), 0)
        : 0;
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
      <p>Produse, comenzi și conversații din baza nouă de date.</p>
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
      <div class="cardStat__label">Produse</div>
      <div class="cardStat__value">{loading ? '…' : stats.products}</div>
    </a>
    <a class="cardStat" href="/admin/comenzi">
      <div class="cardStat__label">Comenzi</div>
      <div class="cardStat__value">{loading ? '…' : stats.orders}</div>
    </a>
    <a class="cardStat" href="/admin/messages">
      <div class="cardStat__label">Conversații</div>
      <div class="cardStat__value">{loading ? '…' : stats.messages}</div>
      <div class="cardStat__meta">{loading ? '…' : `${stats.unreadMessages} mesaje necitite`}</div>
    </a>
  </div>
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
    font-weight: 900;
  }

  .page__head p {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.65);
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .cardStat {
    background: white;
    border-radius: 18px;
    padding: 20px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .cardStat__label {
    font-weight: 700;
    color: rgba(0, 0, 0, 0.65);
  }

  .cardStat__value {
    font-size: 2rem;
    font-weight: 900;
    margin-top: 8px;
  }

  .cardStat__meta {
    margin-top: 8px;
    color: rgba(0, 0, 0, 0.65);
  }
</style>
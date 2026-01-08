<!-- src/routes/admin/dashboard/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
  import type { Noutate } from "$lib/stores/noutati";
  import { onMount } from "svelte";

  interface Stats {
    totalProducts: number;
    totalNews: number;
    totalEvents: number;
    inStock: number;
    totalMessages: number;
    unreadMessages: number;
  }

  let stats: Stats = {
    totalProducts: 0,
    totalNews: 0,
    totalEvents: 0,
    inStock: 0,
    totalMessages: 0,
    unreadMessages: 0,
  };

  let recentNews: Noutate[] = [];
  let loading = true;

  async function loadDashboard() {
    loading = true;
    try {
      const [productsRes, noutatiRes, evenimenteRes, messagesRes] =
        await Promise.all([
          fetch("/api/products"),
          fetch("/api/noutati"),
          fetch("/api/evenimente"),
          fetch("/api/messages"),
        ]);

      if (productsRes.ok) {
        const products: { in_stock: boolean }[] = await productsRes.json();
        stats.totalProducts = products.length;
        stats.inStock = products.filter((p) => p.in_stock).length;
      }

      if (noutatiRes.ok) {
        const news: Noutate[] = await noutatiRes.json();
        stats.totalNews = news.length;
        recentNews = news.slice(0, 5);
      }

      if (evenimenteRes.ok) {
        const events: unknown[] = await evenimenteRes.json();
        stats.totalEvents = events.length;
      }

      if (messagesRes.ok) {
        const payload: { items: { read?: boolean }[] } =
          await messagesRes.json();
        stats.totalMessages = payload.items.length;
        stats.unreadMessages = payload.items.filter((m) => !m.read).length;
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      loading = false;
    }
  }

  onMount(loadDashboard);

  function open(path: string) {
    goto(path);
  }
</script>

<svelte:head>
  <title>Dashboard - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <h1 class="h2 text-brown fw-bold">
      <i class="bi bi-house"></i> Dashboard
    </h1>
    <p class="text-secondary">Bine ai venit, {$user?.email}!</p>
  </div>
</div>

<div class="row g-4 mb-5">
  <div class="col-md-3">
    <button
      type="button"
      class="card border-0 shadow-sm w-100 dashboard-card"
      on:click={() => open("/admin/produse")}
      disabled={loading}
      aria-label="Mergi la Produse"
    >
      <div class="card-body text-center">
        <i class="bi bi-box text-green" style="font-size: 2rem;"></i>
        <h6 class="card-title text-secondary mt-3">Produse</h6>
        <p class="h3 fw-bold text-brown mb-0">{stats.totalProducts}</p>
        <small class="text-success">{stats.inStock} în stoc</small>
      </div>
    </button>
  </div>

  <div class="col-md-3">
    <button
      type="button"
      class="card border-0 shadow-sm w-100 dashboard-card"
      on:click={() => open("/admin/noutati")}
      disabled={loading}
      aria-label="Mergi la Noutăți"
    >
      <div class="card-body text-center">
        <i class="bi bi-newspaper text-green" style="font-size: 2rem;"></i>
        <h6 class="card-title text-secondary mt-3">Noutăți</h6>
        <p class="h3 fw-bold text-brown mb-0">{stats.totalNews}</p>
      </div>
    </button>
  </div>

  <div class="col-md-3">
    <button
      type="button"
      class="card border-0 shadow-sm w-100 dashboard-card"
      on:click={() => open("/admin/evenimente")}
      disabled={loading}
      aria-label="Mergi la Evenimente"
    >
      <div class="card-body text-center">
        <i class="bi bi-calendar-event text-green" style="font-size: 2rem;"></i>
        <h6 class="card-title text-secondary mt-3">Evenimente</h6>
        <p class="h3 fw-bold text-brown mb-0">{stats.totalEvents}</p>
      </div>
    </button>
  </div>

  <div class="col-md-3">
    <button
      type="button"
      class="card border-0 shadow-sm w-100 dashboard-card"
      on:click={() => open("/admin/messages")}
      disabled={loading}
      aria-label="Mergi la Mesaje"
    >
      <div class="card-body text-center">
        <i class="bi bi-chat-dots text-green" style="font-size: 2rem;"></i>
        <h6 class="card-title text-secondary mt-3">Mesaje</h6>
        <p class="h3 fw-bold text-brown mb-0">{stats.totalMessages}</p>
        <small class={stats.unreadMessages > 0 ? "text-danger" : "text-muted"}>
          {stats.unreadMessages > 0
            ? `${stats.unreadMessages} necitite`
            : "Nimic nou"}
        </small>
      </div>
    </button>
  </div>
</div>

<div class="row g-4 mb-5">
  <div class="col-md-6">
    <h3 class="h5 text-brown fw-bold mb-3">
      <i class="bi bi-lightning"></i> Acțiuni rapide
    </h3>

    <div class="list-group">
      <a
        href="/admin/produse/new"
        class="list-group-item list-group-item-action d-flex gap-3 align-items-center"
      >
        <i class="bi bi-plus-circle text-green"></i>
        <div>
          <h6 class="mb-0">Adaugă produs</h6>
          <small class="text-secondary">Crează un nou produs</small>
        </div>
      </a>

      <a
        href="/admin/noutati/new"
        class="list-group-item list-group-item-action d-flex gap-3 align-items-center"
      >
        <i class="bi bi-plus-circle text-green"></i>
        <div>
          <h6 class="mb-0">Adaugă noutate</h6>
          <small class="text-secondary">Publică o nouă noutate</small>
        </div>
      </a>

      <a
        href="/admin/evenimente/new"
        class="list-group-item list-group-item-action d-flex gap-3 align-items-center"
      >
        <i class="bi bi-plus-circle text-green"></i>
        <div>
          <h6 class="mb-0">Adaugă eveniment</h6>
          <small class="text-secondary">Crează un nou eveniment</small>
        </div>
      </a>

      <a
        href="/admin/messages"
        class="list-group-item list-group-item-action d-flex gap-3 align-items-center"
      >
        <i class="bi bi-inbox text-green"></i>
        <div>
          <h6 class="mb-0">Mesaje</h6>
          <small class="text-secondary"
            >Vezi mesajele din formularul de contact</small
          >
        </div>
      </a>
    </div>
  </div>

  <div class="col-md-6">
    <h3 class="h5 text-brown fw-bold mb-3">
      <i class="bi bi-speedometer"></i> Noutăți recente
    </h3>

    {#if recentNews.length > 0}
      <div class="list-group">
        {#each recentNews as item (item.id)}
          <a
            href="/admin/noutati/{item.id}"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
          >
            <div>
              <h6 class="mb-0">{item.title}</h6>
              <small class="text-secondary">
                {item.created_at
                  ? new Date(
                      item.created_at as string | Date,
                    ).toLocaleDateString("ro-RO")
                  : "N/A"}
              </small>
            </div>
            <span
              class={`badge ${item.published ? "bg-success" : "bg-warning"}`}
            >
              {item.published ? "Public" : "Draft"}
            </span>
          </a>
        {/each}
      </div>
    {:else}
      <div class="alert alert-info">
        <i class="bi bi-info-circle"></i> Nu sunt noutăți disponibile
      </div>
    {/if}
  </div>
</div>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .text-green {
    color: var(--desaga-green) !important;
  }

  .dashboard-card {
    cursor: pointer;
    text-align: left;
    background: white;
    border-radius: 14px;
  }

  .dashboard-card:hover {
    transform: translateY(-1px);
  }
</style>

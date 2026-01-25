<!-- FILE: src/routes/admin/dashboard/+page.svelte -->

<!-- src/routes/admin/dashboard/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
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
  let errorMsg: string | null = null;

  async function loadDashboard() {
    loading = true;
    errorMsg = null;

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
      } else {
        stats.totalProducts = 0;
        stats.inStock = 0;
      }

      if (noutatiRes.ok) {
        const news: Noutate[] = await noutatiRes.json();
        stats.totalNews = news.length;
        recentNews = news.slice(0, 6);
      } else {
        stats.totalNews = 0;
        recentNews = [];
      }

      if (evenimenteRes.ok) {
        const events: unknown[] = await evenimenteRes.json();
        stats.totalEvents = events.length;
      } else {
        stats.totalEvents = 0;
      }

      if (messagesRes.ok) {
        const payload: { items: { read?: boolean }[] } =
          await messagesRes.json();
        stats.totalMessages = payload.items.length;
        stats.unreadMessages = payload.items.filter((m) => !m.read).length;
      } else {
        stats.totalMessages = 0;
        stats.unreadMessages = 0;
      }
    } catch (e) {
      errorMsg = "Nu am putut încărca datele dashboard-ului.";
      console.error("Error loading dashboard:", e);
    } finally {
      loading = false;
    }
  }

  onMount(loadDashboard);

  function open(path: string) {
    goto(path);
  }

  function roDate(value: unknown) {
    if (!value) return "N/A";
    try {
      return new Date(value as string | Date).toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Admin DeSaga</title>
</svelte:head>

<div class="dash">
  <header class="dash__header">
    <div>
      <h1 class="dash__title">
        <span class="dash__icon" aria-hidden="true">
          <i class="bi bi-house"></i>
        </span>
        Dashboard
      </h1>
      <p class="dash__subtitle">Bine ai venit!</p>
    </div>

    <div class="dash__headerActions">
      <button
        type="button"
        class="btn btn-outline-secondary dash__refresh"
        on:click={loadDashboard}
        disabled={loading}
      >
        <i class="bi bi-arrow-clockwise"></i>
        <span>Reîncarcă</span>
      </button>
    </div>
  </header>

  {#if errorMsg}
    <div
      class="alert alert-warning d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle"></i>
      <div>{errorMsg}</div>
    </div>
  {/if}

  <section class="dash__cards">
    <button
      type="button"
      class="statcard"
      on:click={() => open("/admin/produse")}
      disabled={loading}
      aria-label="Mergi la Produse"
    >
      <div class="statcard__top">
        <div class="statcard__icon statcard__icon--green">
          <i class="bi bi-box"></i>
        </div>
        <div class="statcard__label">Produse</div>
      </div>

      <div class="statcard__value">
        {#if loading}
          <span class="placeholder-glow"
            ><span class="placeholder col-6"></span></span
          >
        {:else}
          {stats.totalProducts}
        {/if}
      </div>

      <div class="statcard__meta">
        <span class="badge text-bg-light border">
          {#if loading}…{:else}{stats.inStock} în stoc{/if}
        </span>
        <span class="statcard__chev" aria-hidden="true"
          ><i class="bi bi-chevron-right"></i></span
        >
      </div>
    </button>

    <button
      type="button"
      class="statcard"
      on:click={() => open("/admin/noutati")}
      disabled={loading}
      aria-label="Mergi la Noutăți"
    >
      <div class="statcard__top">
        <div class="statcard__icon statcard__icon--green">
          <i class="bi bi-newspaper"></i>
        </div>
        <div class="statcard__label">Noutăți</div>
      </div>

      <div class="statcard__value">
        {#if loading}
          <span class="placeholder-glow"
            ><span class="placeholder col-5"></span></span
          >
        {:else}
          {stats.totalNews}
        {/if}
      </div>

      <div class="statcard__meta">
        <span class="badge text-bg-light border">Total</span>
        <span class="statcard__chev" aria-hidden="true"
          ><i class="bi bi-chevron-right"></i></span
        >
      </div>
    </button>

    <button
      type="button"
      class="statcard"
      on:click={() => open("/admin/evenimente")}
      disabled={loading}
      aria-label="Mergi la Evenimente"
    >
      <div class="statcard__top">
        <div class="statcard__icon statcard__icon--green">
          <i class="bi bi-calendar-event"></i>
        </div>
        <div class="statcard__label">Evenimente</div>
      </div>

      <div class="statcard__value">
        {#if loading}
          <span class="placeholder-glow"
            ><span class="placeholder col-4"></span></span
          >
        {:else}
          {stats.totalEvents}
        {/if}
      </div>

      <div class="statcard__meta">
        <span class="badge text-bg-light border">Total</span>
        <span class="statcard__chev" aria-hidden="true"
          ><i class="bi bi-chevron-right"></i></span
        >
      </div>
    </button>

    <button
      type="button"
      class="statcard"
      on:click={() => open("/admin/messages")}
      disabled={loading}
      aria-label="Mergi la Mesaje"
    >
      <div class="statcard__top">
        <div class="statcard__icon statcard__icon--green">
          <i class="bi bi-chat-dots"></i>
        </div>
        <div class="statcard__label">Mesaje</div>
      </div>

      <div class="statcard__value">
        {#if loading}
          <span class="placeholder-glow"
            ><span class="placeholder col-6"></span></span
          >
        {:else}
          {stats.totalMessages}
        {/if}
      </div>

      <div class="statcard__meta">
        {#if loading}
          <span class="badge text-bg-light border">…</span>
        {:else if stats.unreadMessages > 0}
          <span class="badge text-bg-danger"
            >{stats.unreadMessages} necitit</span
          >
        {:else}
          <span class="badge text-bg-success">Nimic nou</span>
        {/if}
        <span class="statcard__chev" aria-hidden="true"
          ><i class="bi bi-chevron-right"></i></span
        >
      </div>
    </button>
  </section>

  <section class="dash__grid">
    <div class="panel">
      <div class="panel__head">
        <h2 class="panel__title">
          <i class="bi bi-lightning-charge"></i>
          Acțiuni rapide
        </h2>
      </div>

      <div class="panel__body">
        <div class="quick">
          <a class="quick__item" href="/admin/produse/new">
            <div class="quick__left">
              <span class="quick__icon"><i class="bi bi-plus-circle"></i></span>
              <div>
                <div class="quick__title">Adaugă produs</div>
                <div class="quick__sub">Crează un nou produs</div>
              </div>
            </div>
            <i class="bi bi-arrow-right-short quick__arrow" aria-hidden="true"
            ></i>
          </a>

          <a class="quick__item" href="/admin/noutati/new">
            <div class="quick__left">
              <span class="quick__icon"><i class="bi bi-plus-circle"></i></span>
              <div>
                <div class="quick__title">Adaugă noutate</div>
                <div class="quick__sub">Publică o nouă noutate</div>
              </div>
            </div>
            <i class="bi bi-arrow-right-short quick__arrow" aria-hidden="true"
            ></i>
          </a>

          <a class="quick__item" href="/admin/evenimente/new">
            <div class="quick__left">
              <span class="quick__icon"><i class="bi bi-plus-circle"></i></span>
              <div>
                <div class="quick__title">Adaugă eveniment</div>
                <div class="quick__sub">Crează un nou eveniment</div>
              </div>
            </div>
            <i class="bi bi-arrow-right-short quick__arrow" aria-hidden="true"
            ></i>
          </a>

          <a class="quick__item" href="/admin/messages">
            <div class="quick__left">
              <span class="quick__icon"><i class="bi bi-inbox"></i></span>
              <div>
                <div class="quick__title">Mesaje</div>
                <div class="quick__sub">
                  Vezi mesajele din formularul de contact
                </div>
              </div>
            </div>
            <i class="bi bi-arrow-right-short quick__arrow" aria-hidden="true"
            ></i>
          </a>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__head">
        <h2 class="panel__title">
          <i class="bi bi-clock-history"></i>
          Noutăți recente
        </h2>
        <a class="panel__link" href="/admin/noutati">Vezi toate</a>
      </div>

      <div class="panel__body">
        {#if loading}
          <div class="skeleton">
            <div class="skeleton__row"></div>
            <div class="skeleton__row"></div>
            <div class="skeleton__row"></div>
            <div class="skeleton__row"></div>
            <div class="skeleton__row"></div>
          </div>
        {:else if recentNews.length > 0}
          <div class="news">
            {#each recentNews as item (item.id)}
              <a class="news__item" href="/admin/noutati/{item.id}">
                <div class="news__main">
                  <div class="news__title">{item.title}</div>
                  <div class="news__sub">{roDate(item.created_at)}</div>
                </div>
                <span
                  class={`badge ${item.published ? "text-bg-success" : "text-bg-warning"}`}
                >
                  {item.published ? "Public" : "Draft"}
                </span>
              </a>
            {/each}
          </div>
        {:else}
          <div class="empty">
            <div class="empty__icon"><i class="bi bi-info-circle"></i></div>
            <div class="empty__text">Nu sunt noutăți disponibile</div>
          </div>
        {/if}
      </div>
    </div>
  </section>
</div>

<style>
  .dash {
    padding: 6px 0 12px;
  }

  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .dash__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .dash__title {
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--desaga-brown);
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 1.75rem;
    line-height: 1.2;
  }

  .dash__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
  }

  .dash__subtitle {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.55);
  }

  .dash__headerActions {
    display: flex;
    gap: 10px;
  }

  .dash__refresh {
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .dash__cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }

  .statcard {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    border-radius: 16px;
    padding: 14px;
    text-align: left;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      border-color 120ms ease;
    cursor: pointer;
    min-height: 122px;
  }

  .statcard:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .statcard:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .statcard__top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .statcard__icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 1.2rem;
    background: rgba(0, 0, 0, 0.04);
    color: var(--desaga-green);
  }

  .statcard__icon--green {
    background: rgba(0, 0, 0, 0.04);
  }

  .statcard__label {
    color: rgba(0, 0, 0, 0.55);
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .statcard__value {
    margin-top: 10px;
    font-size: 2rem;
    font-weight: 900;
    color: var(--desaga-brown);
    letter-spacing: -0.02em;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .statcard__meta {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .statcard__chev {
    color: rgba(0, 0, 0, 0.35);
    font-size: 0.95rem;
  }

  .dash__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 6px;
  }

  .panel {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .panel__head {
    padding: 14px 14px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.015);
  }

  .panel__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: var(--desaga-brown);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .panel__link {
    color: rgba(0, 0, 0, 0.55);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .panel__link:hover {
    text-decoration: underline;
  }

  .panel__body {
    padding: 12px 14px 14px;
  }

  .quick {
    display: grid;
    gap: 10px;
  }

  .quick__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 12px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 14px;
    text-decoration: none;
    color: inherit;
    background: #fff;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      border-color 120ms ease;
  }

  .quick__item:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .quick__left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .quick__icon {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
    color: var(--desaga-green);
    flex: 0 0 auto;
  }

  .quick__title {
    font-weight: 800;
    color: rgba(0, 0, 0, 0.78);
    line-height: 1.15;
  }

  .quick__sub {
    color: rgba(0, 0, 0, 0.55);
    font-size: 0.9rem;
  }

  .quick__arrow {
    color: rgba(0, 0, 0, 0.35);
    font-size: 1.25rem;
    flex: 0 0 auto;
  }

  .news {
    display: grid;
    gap: 10px;
  }

  .news__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 12px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 14px;
    text-decoration: none;
    color: inherit;
    background: #fff;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      border-color 120ms ease;
  }

  .news__item:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .news__main {
    min-width: 0;
  }

  .news__title {
    font-weight: 800;
    color: rgba(0, 0, 0, 0.78);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .news__sub {
    margin-top: 2px;
    color: rgba(0, 0, 0, 0.55);
    font-size: 0.9rem;
  }

  .empty {
    border: 1px dashed rgba(0, 0, 0, 0.18);
    border-radius: 14px;
    padding: 18px 14px;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.015);
  }

  .empty__icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.55);
    flex: 0 0 auto;
  }

  .empty__text {
    color: rgba(0, 0, 0, 0.65);
    font-weight: 700;
  }

  .skeleton__row {
    height: 54px;
    border-radius: 14px;
    margin-bottom: 10px;
    background: rgba(0, 0, 0, 0.06);
  }

  .skeleton__row:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 992px) {
    .dash__cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .dash__grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 420px) {
    .dash__cards {
      grid-template-columns: 1fr;
    }
  }
</style>

<!-- src/routes/admin/evenimente/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import AdminNav from "$lib/components/AdminNav.svelte";

  type EventItem = {
    id: string;
    title: string | null;
    event_type: string | null;
    date: string | null;
    location: string | null;
    published: boolean | null;
    created_at?: string | null;
  };

  let events: EventItem[] = [];
  let loading = true;
  let errorMsg = "";
  let searchQuery = "";
  let toast = "";
  let toastType: "success" | "danger" | "info" = "info";

  function showToast(msg: string, type: typeof toastType = "info") {
    toast = msg;
    toastType = type;
    setTimeout(() => (toast = ""), 2500);
  }

  function roDateTime(value: string | null) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("ro-RO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  }

  async function loadEvents() {
    loading = true;
    errorMsg = "";
    try {
      const res = await fetch("/api/evenimente?admin=true");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        errorMsg = data?.error ?? "Eroare la încărcarea evenimentelor";
        return;
      }
      events = Array.isArray(data) ? data : (data.items ?? data.events ?? []);
    } catch (err) {
      errorMsg = "Eroare la încărcarea evenimentelor";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  onMount(loadEvents);

  $: filteredEvents = (events ?? []).filter((e) =>
    (e.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function deleteEvent(id: string) {
    if (!confirm("Ești sigur că vrei să ștergi evenimentul?")) return;

    try {
      const res = await fetch(`/api/evenimente/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error ?? "Eroare la ștergere", "danger");
        return;
      }
      events = events.filter((e) => e.id !== id);
      showToast("Eveniment șters", "success");
    } catch (err) {
      console.error(err);
      showToast("Eroare la ștergere", "danger");
    }
  }

  async function togglePublished(id: string, current: boolean | null) {
    const next = !Boolean(current);
    try {
      const res = await fetch(`/api/evenimente/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error ?? "Eroare la actualizare", "danger");
        return;
      }
      events = events.map((e) => (e.id === id ? { ...e, published: next } : e));
      showToast(next ? "Marcat public" : "Marcat draft", "success");
    } catch (err) {
      console.error(err);
      showToast("Eroare la actualizare", "danger");
    }
  }
</script>

<svelte:head>
  <title>Gestionare Evenimente - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true"
          ><i class="bi bi-calendar-event"></i></span
        >
        Evenimente
      </h1>
      <p class="page__subtitle">Listă, căutare, publicare, editare, ștergere</p>
    </div>

    <div class="page__actions">
      <button
        class="btn btn-outline-secondary page__btn"
        on:click={loadEvents}
        disabled={loading}
      >
        <i class="bi bi-arrow-clockwise"></i>
        <span>Reîncarcă</span>
      </button>
      <a href="/admin/evenimente/new" class="btn btn-primary page__btn">
        <i class="bi bi-plus-circle"></i>
        <span>Eveniment nou</span>
      </a>
    </div>
  </header>

  {#if toast}
    <div
      class={`alert alert-${toastType} d-flex align-items-center gap-2 shadow-sm mb-3`}
      role="alert"
    >
      <i class="bi bi-info-circle"></i>
      <div>{toast}</div>
    </div>
  {/if}

  {#if errorMsg}
    <div
      class="alert alert-danger d-flex align-items-center gap-2 shadow-sm mb-3"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle"></i>
      <div>{errorMsg}</div>
    </div>
  {/if}

  <section class="toolbar">
    <div class="toolbar__search">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input
        type="text"
        class="form-control toolbar__input"
        placeholder="Caută după titlu..."
        bind:value={searchQuery}
      />
    </div>

    <div class="toolbar__meta">
      <span class="badge text-bg-light border">
        {#if loading}…{:else}{filteredEvents.length} rezultate{/if}
      </span>
    </div>
  </section>

  {#if loading}
    <div class="card border-0 shadow-sm">
      <div class="card-body py-5 text-center">
        <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
        <div class="mt-3 text-muted">Se încarcă evenimentele…</div>
      </div>
    </div>
  {:else if filteredEvents.length > 0}
    <div class="card border-0 shadow-sm tablecard">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="thead">
            <tr>
              <th>Titlu</th>
              <th class="d-none d-md-table-cell">Tip</th>
              <th>Data</th>
              <th class="d-none d-lg-table-cell">Locație</th>
              <th>Status</th>
              <th class="text-end">Acțiuni</th>
            </tr>
          </thead>

          <tbody>
            {#each filteredEvents as event (event.id)}
              <tr class={!event.published ? "row--draft" : ""}>
                <td class="title">
                  <div class="title__main">{event.title ?? "-"}</div>
                  <div class="title__sub d-md-none">
                    <span class="badge text-bg-light border"
                      >{event.event_type ?? "-"}</span
                    >
                    <span class="dot">•</span>
                    <span class="muted">{event.location ?? "-"}</span>
                  </div>
                </td>

                <td class="d-none d-md-table-cell">
                  <span class="badge typeBadge">{event.event_type ?? "-"}</span>
                </td>

                <td class="muted">{roDateTime(event.date)}</td>

                <td class="d-none d-lg-table-cell muted"
                  >{event.location ?? "-"}</td
                >

                <td>
                  <span
                    class={`badge ${event.published ? "text-bg-success" : "text-bg-secondary"}`}
                  >
                    {event.published ? "Public" : "Draft"}
                  </span>
                </td>

                <td class="text-end text-nowrap">
                  <button
                    class={`btn btn-sm ${event.published ? "btn-outline-secondary" : "btn-success"} me-2`}
                    on:click={() =>
                      togglePublished(event.id, event.published ?? false)}
                    title="Publicare"
                  >
                    {event.published
                      ? "Retrage evenimentul"
                      : "Publică evenimentul"}
                  </button>

                  <a
                    href={`/admin/evenimente/${event.id}`}
                    class="btn btn-sm btn-primary me-2"
                  >
                    <i class="bi bi-pencil"></i>
                    <span class="d-none d-sm-inline">Edit</span>
                  </a>

                  <button
                    class="btn btn-sm btn-outline-danger"
                    on:click={() => deleteEvent(event.id)}
                  >
                    <i class="bi bi-trash"></i>
                    <span class="d-none d-sm-inline">Șterge</span>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="empty">
      <div class="empty__icon"><i class="bi bi-info-circle"></i></div>
      <div class="empty__text">
        <div class="fw-bold">Nu sunt evenimente disponibile</div>
        <div class="text-muted">
          Creează primul eveniment din butonul „Eveniment nou”.
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin: 6px 0 14px;
  }

  .page__title {
    margin: 0;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--desaga-brown);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.6rem;
    line-height: 1.2;
  }

  .page__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
  }

  .page__subtitle {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.55);
  }

  .page__actions {
    display: flex;
    gap: 10px;
  }
  .page__btn {
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 10px 0 14px;
  }

  .toolbar__search {
    position: relative;
    flex: 1 1 auto;
    max-width: 520px;
  }

  .toolbar__search > i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0, 0, 0, 0.45);
  }

  .toolbar__input {
    padding-left: 38px;
    border-radius: 14px;
  }

  .toolbar__meta {
    flex: 0 0 auto;
  }

  .tablecard {
    border-radius: 16px;
    overflow: hidden;
  }

  .thead {
    background: rgba(0, 0, 0, 0.015);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .title {
    font-weight: 800;
    color: rgba(0, 0, 0, 0.78);
  }
  .title__main {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 520px;
  }
  .title__sub {
    margin-top: 4px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .dot {
    color: rgba(0, 0, 0, 0.35);
  }
  .muted {
    color: rgba(0, 0, 0, 0.55);
    font-weight: 600;
  }

  .typeBadge {
    background: rgba(118, 236, 30, 0.18);
    color: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .row--draft {
    background: rgba(255, 193, 7, 0.12);
  }

  .empty {
    border: 1px dashed rgba(0, 0, 0, 0.18);
    border-radius: 16px;
    padding: 18px 14px;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.015);
  }

  .empty__icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.55);
    flex: 0 0 auto;
  }

  .form-control:focus,
  .form-select:focus {
    border-color: var(--desaga-green);
    box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
  }

  @media (max-width: 576px) {
    .page__actions {
      flex-direction: column;
      align-items: stretch;
    }
    .page__btn {
      justify-content: center;
    }
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    .toolbar__search {
      max-width: none;
    }
    .title__main {
      max-width: 240px;
    }
  }

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding-top: 84px;
    }
  }
</style>
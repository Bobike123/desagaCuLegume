<!-- src/routes/admin/evenimente/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";

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
  let statusFilter = "";
  let sortMode = "date-asc";
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
      const res = await fetch("/api/evenimente?admin=true&limit=100");
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

  $: filteredEvents = (events ?? [])
    .filter((event) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "published" ? Boolean(event.published) : !Boolean(event.published));
      if (!q) return matchesStatus;
      const haystack = `${event.title ?? ""} ${event.location ?? ""} ${event.event_type ?? ""} ${event.date ?? ""}`.toLowerCase();
      return matchesStatus && haystack.includes(q);
    })
    .slice()
    .sort((a, b) => {
      const left = new Date(a.date ?? a.created_at ?? 0).getTime();
      const right = new Date(b.date ?? b.created_at ?? 0).getTime();
      if (sortMode === "date-desc") return right - left;
      if (sortMode === "title") return String(a.title ?? "").localeCompare(String(b.title ?? ""), "ro");
      return left - right;
    });

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

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Calendar public</p>
      <h1>Evenimente</h1>
      <p>Administrează evenimentele publice: publicare, editare, căutare și ștergere.</p>
    </div>
    <div class="actions">
      <button class="pill" on:click={loadEvents} disabled={loading}><i class="bi bi-arrow-clockwise"></i> Reîncarcă</button>
      <a href="/admin/evenimente/new" class="pill primary"><i class="bi bi-plus-circle"></i> Eveniment nou</a>
    </div>
  </header>

  {#if toast}
    <div class={`notice ${toastType}`} role="status"><i class="bi bi-info-circle"></i>{toast}</div>
  {/if}

  {#if errorMsg}
    <div class="notice danger" role="alert"><i class="bi bi-exclamation-triangle"></i>{errorMsg}</div>
  {/if}

  <section class="toolbar">
    <label class="searchBox" aria-label="Caută evenimente">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input type="search" placeholder="Caută după titlu, locație, tip sau dată..." bind:value={searchQuery} />
    </label>
    <select bind:value={statusFilter} aria-label="Filtrează evenimente">
      <option value="">Toate</option>
      <option value="published">Publice</option>
      <option value="draft">Draft</option>
    </select>
    <select bind:value={sortMode} aria-label="Sortează evenimente">
      <option value="date-asc">Dată crescător</option>
      <option value="date-desc">Dată descrescător</option>
      <option value="title">Titlu A-Z</option>
    </select>
    <span class="count">{loading ? '…' : filteredEvents.length} rezultate</span>
  </section>

  {#if loading}
    <section class="stateCard"><span class="spinner" aria-hidden="true"></span><strong>Se încarcă evenimentele…</strong></section>
  {:else if filteredEvents.length > 0}
    <section class="eventGrid">
      {#each filteredEvents as event (event.id)}
        <article class:unpublished={!event.published} class="eventCard">
          <header>
            <div>
              <span class="typeTag">{event.event_type ?? '-'}</span>
              <h2>{event.title ?? '-'}</h2>
            </div>
            <span class:published={event.published} class="statusTag">{event.published ? 'Public' : 'Draft'}</span>
          </header>

          <div class="details">
            <div><i class="bi bi-calendar-event"></i><span>{roDateTime(event.date)}</span></div>
            <div><i class="bi bi-geo-alt"></i><span>{event.location ?? '-'}</span></div>
          </div>

          <footer>
            <button class="cardBtn" on:click={() => togglePublished(event.id, event.published ?? false)}>
              {event.published ? 'Retrage' : 'Publică'}
            </button>
            <a class="cardBtn primary" href={`/admin/evenimente/${event.id}`}>Editează</a>
            <button class="cardBtn danger" on:click={() => deleteEvent(event.id)}>Șterge</button>
          </footer>
        </article>
      {/each}
    </section>
  {:else}
    <section class="emptyCard">
      <i class="bi bi-calendar-event"></i>
      <h2>Nu sunt evenimente disponibile</h2>
      <p>Creează primul eveniment din butonul „Eveniment nou".</p>
    </section>
  {/if}
</div>

<style>
  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .pill,
  .cardBtn {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--surface);
    color: var(--ink);
    text-decoration: none;
    font-weight: 950;
    cursor: pointer;
  }

  .pill.primary,
  .cardBtn.primary {
    background: var(--accent);
    color: #fffdf7;
    border-color: transparent;
  }

  .pill:disabled {
    opacity: 0.6;
  }

  .toolbar {
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: minmax(240px, 1fr) minmax(140px, 180px) minmax(150px, 200px) auto;
    gap: 12px;
    align-items: center;
  }

  .toolbar select {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 14px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--ink);
    font-weight: 850;
  }

  .count {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 12px 16px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--muted);
    font-weight: 950;
    white-space: nowrap;
  }

  .searchBox input {
    width: 100%;
  }

  .eventGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: 14px;
  }

  .eventCard {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
    display: grid;
    gap: 18px;
  }

  @media (max-width: 820px) {
    .toolbar {
      grid-template-columns: 1fr;
    }

    .count {
      justify-content: center;
    }
  }

  .eventCard.unpublished {
    background: rgba(255, 249, 232, 0.94);
  }

  .eventCard header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  .typeTag,
  .statusTag {
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    font-size: 0.74rem;
    font-weight: 950;
  }

  .typeTag {
    background: rgba(139, 212, 80, 0.18);
    color: var(--accent);
    margin-bottom: 10px;
  }

  .statusTag {
    background: #ece8dd;
    color: #65685d;
    flex: 0 0 auto;
  }

  .statusTag.published {
    background: rgba(139, 212, 80, 0.22);
    color: var(--accent);
  }

  .eventCard h2 {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.08;
    font-weight: 950;
    letter-spacing: -0.04em;
    overflow-wrap: anywhere;
  }

  .details {
    display: grid;
    gap: 8px;
  }

  .details div {
    display: flex;
    gap: 10px;
    align-items: start;
    color: var(--muted);
    font-weight: 800;
  }

  .details i {
    color: var(--accent);
  }

  .eventCard footer {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .cardBtn.danger {
    color: #842029;
    background: #fff4f4;
    border-color: #facaca;
  }

  @media (max-width: 680px) {
    .toolbar {
      grid-template-columns: 1fr;
    }

    .eventCard header {
      display: grid;
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .actions,
    .pill {
      width: 100%;
    }

    .eventCard footer {
      grid-template-columns: 1fr;
    }
  }
</style>

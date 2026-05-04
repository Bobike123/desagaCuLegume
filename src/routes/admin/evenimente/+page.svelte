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
    <label class="search">
      <i class="bi bi-search"></i>
      <input type="search" placeholder="Caută după titlu..." bind:value={searchQuery} />
    </label>
    <span class="count">{loading ? '…' : filteredEvents.length} rezultate</span>
  </section>

  {#if loading}
    <section class="stateCard"><span class="spinner"></span><strong>Se încarcă evenimentele…</strong></section>
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
      <p>Creează primul eveniment din butonul „Eveniment nou”.</p>
    </section>
  {/if}
</div>

<style>
  .page {
    --bg: #f6f1e7;
    --surface: #fffdf7;
    --ink: #1d241b;
    --muted: #6b7165;
    --line: rgba(31, 42, 28, 0.12);
    --accent: #274f2a;
    --green: #8bd450;
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(18px, 3vw, 34px);
    background: radial-gradient(900px 420px at 8% -5%, rgba(139, 212, 80, 0.2), transparent 60%), var(--bg);
    color: var(--ink);
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 18px;
    margin-bottom: 16px;
  }

  .eyebrow {
    margin: 0 0 6px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.13em;
    font-size: 0.75rem;
    font-weight: 950;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 7vw, 4.6rem);
    line-height: 0.94;
    letter-spacing: -0.07em;
    font-weight: 950;
  }

  .topbar p:not(.eyebrow) {
    margin: 12px 0 0;
    max-width: 720px;
    color: var(--muted);
  }

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
  }

  .pill:disabled {
    opacity: 0.6;
  }

  .toolbar {
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .search {
    position: relative;
    display: block;
  }

  .search i {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
  }

  .search input {
    width: 100%;
    min-height: 54px;
    border: 1px solid var(--line);
    border-radius: 22px;
    padding: 0 18px 0 46px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--ink);
    font-weight: 800;
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.07);
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

  .eventGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: 14px;
  }

  .eventCard,
  .stateCard,
  .emptyCard {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
  }

  .eventCard {
    padding: 18px;
    display: grid;
    gap: 18px;
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

  .notice {
    margin-bottom: 14px;
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    gap: 10px;
    align-items: center;
    font-weight: 850;
  }

  .notice.success { background: #ecf8df; border: 1px solid #b9e58d; color: #285b20; }
  .notice.info { background: #f4f1e8; border: 1px solid var(--line); color: var(--accent); }
  .notice.danger { background: #fff1f1; border: 1px solid #facaca; color: #842029; }

  .stateCard,
  .emptyCard {
    padding: 36px 20px;
    display: grid;
    place-items: center;
    text-align: center;
    gap: 12px;
    color: var(--muted);
  }

  .emptyCard i {
    font-size: 2rem;
    color: var(--accent);
  }

  .emptyCard h2 {
    margin: 0;
    color: var(--ink);
    font-weight: 950;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 3px solid rgba(39, 79, 42, 0.18);
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding: 88px 16px 24px;
    }
  }

  @media (max-width: 680px) {
    .topbar,
    .toolbar,
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

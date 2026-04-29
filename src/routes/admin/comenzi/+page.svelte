<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type EventItem = {
    id: string;
    title: string | null;
    event_type: string | null;
    date: string | null;
    location: string | null;
    published: boolean | null;
    created_at?: string | null;
  };

  type StatusFilter = 'all' | 'published' | 'draft' | 'upcoming' | 'past';
  type ToastType = 'success' | 'danger' | 'info';

  const statusFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'Toate' },
    { value: 'published', label: 'Publice' },
    { value: 'draft', label: 'Draft' },
    { value: 'upcoming', label: 'Urmează' },
    { value: 'past', label: 'Trecute' },
  ];

  let events: EventItem[] = [];
  let loading = true;
  let errorMsg = '';
  let searchQuery = '';
  let statusFilter: StatusFilter = 'all';
  let toast = '';
  let toastType: ToastType = 'info';
  let busyId = '';

  function showToast(msg: string, type: ToastType = 'info') {
    toast = msg;
    toastType = type;
    setTimeout(() => (toast = ''), 2500);
  }

  function normalize(value: string | null | undefined) {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ă|â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ș|ş/g, 's')
      .replace(/ț|ţ/g, 't');
  }

  function roDateTime(value: string | null) {
    if (!value) return 'Fără dată';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fără dată';

    return date.toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isPast(value: string | null) {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time < Date.now();
  }

  function eventTypeLabel(value: string | null) {
    switch (String(value ?? '').toLowerCase()) {
      case 'piata':
        return 'Piață';
      case 'festival':
        return 'Festival';
      case 'atelier':
        return 'Atelier';
      default:
        return value || 'Eveniment';
    }
  }

  async function loadEvents() {
    loading = true;
    errorMsg = '';

    try {
      const res = await fetch('/api/evenimente?admin=true');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Eroare la încărcarea evenimentelor.');
      events = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.events) ? data.events : [];
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Eroare la încărcarea evenimentelor.';
    } finally {
      loading = false;
    }
  }

  onMount(loadEvents);

  async function deleteEvent(id: string) {
    const event = events.find((item) => item.id === id);
    if (!event) return;
    if (!confirm(`Ștergi evenimentul „${event.title ?? 'fără titlu'}”?`)) return;

    busyId = id;

    try {
      const res = await fetch(`/api/evenimente/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Eroare la ștergere.');
      events = events.filter((item) => item.id !== id);
      showToast('Eveniment șters.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Eroare la ștergere.', 'danger');
    } finally {
      busyId = '';
    }
  }

  async function togglePublished(id: string, current: boolean | null) {
    const next = !Boolean(current);
    busyId = id;

    try {
      const res = await fetch(`/api/evenimente/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Eroare la actualizare.');
      events = events.map((item) => (item.id === id ? { ...item, published: next } : item));
      showToast(next ? 'Eveniment publicat.' : 'Eveniment retras în draft.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Eroare la actualizare.', 'danger');
    } finally {
      busyId = '';
    }
  }

  $: publishedCount = events.filter((event) => Boolean(event.published)).length;
  $: draftCount = events.length - publishedCount;
  $: upcomingCount = events.filter((event) => !isPast(event.date)).length;
  $: filteredEvents = events.filter((event) => {
    const q = normalize(searchQuery.trim());
    const matchesSearch = !q || normalize(`${event.title ?? ''} ${event.event_type ?? ''} ${event.location ?? ''}`).includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && Boolean(event.published)) ||
      (statusFilter === 'draft' && !Boolean(event.published)) ||
      (statusFilter === 'upcoming' && !isPast(event.date)) ||
      (statusFilter === 'past' && isPast(event.date));
    return matchesSearch && matchesStatus;
  });
</script>

<svelte:head>
  <title>Evenimente - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="adminPage">
  <header class="pageHead">
    <div>
      <p class="eyebrow">Administrare conținut</p>
      <h1>Evenimente</h1>
      <p class="muted">Listă, căutare, publicare, editare și ștergere.</p>
    </div>

    <div class="actions">
      <button class="btn btn-outline-accent" type="button" on:click={loadEvents} disabled={loading}>
        <i class="bi bi-arrow-clockwise"></i> Reîncarcă
      </button>
      <a href="/admin/evenimente/new" class="btn btn-accent">
        <i class="bi bi-plus-circle"></i> Eveniment nou
      </a>
    </div>
  </header>

  {#if toast}
    <div class={`alert alert-${toastType} d-flex align-items-center gap-2`} role="alert">
      <i class="bi bi-info-circle"></i>
      <div>{toast}</div>
    </div>
  {/if}

  {#if errorMsg}
    <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <div>{errorMsg}</div>
    </div>
  {/if}

  <div class="metricGrid" aria-label="Statistici evenimente">
    <div class="metricCard"><span>Total</span><strong>{loading ? '…' : events.length}</strong></div>
    <div class="metricCard"><span>Publice</span><strong>{loading ? '…' : publishedCount}</strong></div>
    <div class="metricCard"><span>Draft</span><strong>{loading ? '…' : draftCount}</strong></div>
    <div class="metricCard"><span>Urmează</span><strong>{loading ? '…' : upcomingCount}</strong></div>
  </div>

  <section class="toolbar surface" aria-label="Filtrare evenimente">
    <div class="searchBox">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input type="search" class="form-control" placeholder="Caută după titlu, tip sau locație" bind:value={searchQuery} />
    </div>

    <select class="form-select" bind:value={statusFilter} aria-label="Filtru status">
      {#each statusFilters as filter (filter.value)}
        <option value={filter.value}>{filter.label}</option>
      {/each}
    </select>
  </section>

  {#if loading}
    <div class="surface loadingPanel">
      <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
      <span>Se încarcă evenimentele…</span>
    </div>
  {:else if filteredEvents.length === 0}
    <div class="emptyState surface">
      <div class="emptyIcon"><i class="bi bi-calendar-event"></i></div>
      <div>
        <h2>Nu sunt evenimente pentru filtrul curent</h2>
        <p>Creează primul eveniment sau schimbă filtrul.</p>
        <a href="/admin/evenimente/new" class="btn btn-accent btn-sm">Eveniment nou</a>
      </div>
    </div>
  {:else}
    <div class="surface tableCard">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
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
              <tr class:rowDraft={!event.published}>
                <td>
                  <div class="titleMain">{event.title || 'Eveniment fără titlu'}</div>
                  <div class="mobileMeta d-md-none">
                    {eventTypeLabel(event.event_type)} · {event.location || 'Fără locație'}
                  </div>
                </td>
                <td class="d-none d-md-table-cell"><span class="badge-soft">{eventTypeLabel(event.event_type)}</span></td>
                <td>
                  <div class="dateText">{roDateTime(event.date)}</div>
                  <div class="small muted">{isPast(event.date) ? 'Trecut' : 'Urmează'}</div>
                </td>
                <td class="d-none d-lg-table-cell muted">{event.location || '—'}</td>
                <td>
                  <span class={`badge ${event.published ? 'text-bg-success' : 'text-bg-secondary'}`}>
                    {event.published ? 'Public' : 'Draft'}
                  </span>
                </td>
                <td class="text-end">
                  <div class="rowActions">
                    <button
                      class={`btn btn-sm ${event.published ? 'btn-outline-secondary' : 'btn-success'}`}
                      type="button"
                      on:click={() => togglePublished(event.id, event.published ?? false)}
                      disabled={busyId === event.id}
                    >
                      {event.published ? 'Retrage' : 'Publică'}
                    </button>

                    <a href={`/admin/evenimente/${event.id}`} class="btn btn-sm btn-outline-accent">Editează</a>

                    <button class="btn btn-sm btn-outline-danger" type="button" on:click={() => deleteEvent(event.id)} disabled={busyId === event.id}>
                      Șterge
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .adminPage {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .pageHead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0 0 4px;
    color: var(--desaga-blue);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.78rem;
  }

  h1 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-heading, #14212b);
  }

  .muted,
  .mobileMeta {
    color: var(--desaga-muted, rgba(20, 33, 43, 0.66));
  }

  .actions,
  .rowActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .rowActions {
    justify-content: flex-end;
    gap: 8px;
  }

  .metricGrid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .metricCard {
    background: #fff;
    border: 1px solid var(--desaga-border, rgba(15, 23, 42, 0.08));
    border-radius: 18px;
    padding: 14px;
    box-shadow: var(--desaga-shadow-sm, 0 8px 22px rgba(15, 23, 42, 0.06));
  }

  .metricCard span {
    display: block;
    color: var(--desaga-muted, rgba(20, 33, 43, 0.66));
    font-weight: 850;
    font-size: 0.86rem;
  }

  .metricCard strong {
    display: block;
    margin-top: 4px;
    font-size: 1.55rem;
    line-height: 1;
    font-weight: 950;
  }

  .toolbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 190px;
    gap: 12px;
    padding: 14px;
    margin-bottom: 16px;
  }

  .searchBox {
    position: relative;
  }

  .searchBox i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(20, 33, 43, 0.45);
  }

  .searchBox .form-control {
    padding-left: 38px;
  }

  .tableCard {
    overflow: hidden;
  }

  .table thead th {
    color: var(--desaga-muted, rgba(20, 33, 43, 0.66));
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .titleMain {
    max-width: 520px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 900;
    color: var(--desaga-heading, #14212b);
  }

  .dateText {
    font-weight: 850;
  }

  .rowDraft {
    background: rgba(255, 193, 7, 0.05);
  }

  .loadingPanel,
  .emptyState {
    padding: 22px;
  }

  .loadingPanel {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--desaga-muted, rgba(20, 33, 43, 0.66));
  }

  .emptyState {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .emptyState h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 950;
  }

  .emptyState p {
    margin: 4px 0 12px;
    color: var(--desaga-muted, rgba(20, 33, 43, 0.66));
  }

  .emptyIcon {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.1);
    flex: 0 0 auto;
  }

  @media (max-width: 991.98px) {
    .adminPage {
      margin-left: 0;
      padding: 18px;
    }

    .pageHead {
      flex-direction: column;
    }

    .metricGrid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 575.98px) {
    .metricGrid,
    .toolbar {
      grid-template-columns: 1fr;
    }

    .actions,
    .actions :global(.btn) {
      width: 100%;
    }
  }
</style>
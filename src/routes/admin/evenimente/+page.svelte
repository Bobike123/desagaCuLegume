<script lang="ts">
  import { onMount } from 'svelte';

  type EventItem = {
    id: string | number;
    title: string | null;
    description: string | null;
    date: string | null;
    location: string | null;
    event_type: string | null;
    image_url: string | null;
    published: boolean | null;
  };

  const TYPE_LABELS: Record<string, string> = {
    festival: 'Festival',
    piata: 'Piață',
    atelier: 'Atelier',
  };

  let items: EventItem[] = [];
  let loading = true;
  let error = '';
  let notice = '';
  let noticeType: 'success' | 'danger' | 'info' = 'info';
  let searchQuery = '';
  let selectedEventIds = new Set<string>();
  let bulkPublished = 'true';
  let bulkWorking = false;
  let togglingId = '';

  const dateFormat = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium', timeStyle: 'short' });

  function eventId(item: EventItem) {
    return String(item.id);
  }

  function typeLabel(type: string | null) {
    return TYPE_LABELS[String(type ?? '').toLowerCase()] ?? 'Eveniment';
  }

  function formatDate(value: string | null) {
    if (!value) return 'Fără dată';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Fără dată' : dateFormat.format(d);
  }

  function isPast(item: EventItem) {
    if (!item.date) return false;
    const d = new Date(item.date);
    return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  function showNotice(message: string, type: typeof noticeType = 'info') {
    notice = message;
    noticeType = type;
    setTimeout(() => {
      if (notice === message) notice = '';
    }, 2800);
  }

  function setSelection(id: string, checked: boolean) {
    const next = new Set(selectedEventIds);
    if (checked) next.add(id);
    else next.delete(id);
    selectedEventIds = next;
  }

  function selectVisibleEvents() {
    selectedEventIds = new Set([...selectedEventIds, ...filtered.map(eventId)]);
  }

  function clearSelection() {
    selectedEventIds = new Set();
  }

  async function loadItems() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/evenimente?admin=true&limit=100');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Eroare la încărcarea evenimentelor');
      items = Array.isArray(data?.items) ? (data.items as EventItem[]) : [];
      selectedEventIds = new Set(
        [...selectedEventIds].filter((id) => items.some((item) => eventId(item) === id))
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Eroare la încărcare';
    } finally {
      loading = false;
    }
  }

  async function setPublished(ids: string[], published: boolean) {
    const res = await fetch('/api/evenimente', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, published }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Nu s-au putut actualiza evenimentele.');
    return Number(data?.count ?? ids.length);
  }

  async function applyBulkPublish() {
    if (selectedIds.length === 0) {
      showNotice('Selectează cel puțin un eveniment.', 'danger');
      return;
    }

    const publish = bulkPublished === 'true';
    const label = publish ? 'publici' : 'treci în draft';
    if (!confirm(`Sigur ${label} ${selectedIds.length} evenimente?`)) return;

    bulkWorking = true;
    error = '';

    try {
      const updatedCount = await setPublished(selectedIds, publish);
      clearSelection();
      await loadItems();
      showNotice(`${updatedCount} evenimente actualizate.`, 'success');
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Nu s-au putut actualiza evenimentele.', 'danger');
    } finally {
      bulkWorking = false;
    }
  }

  async function togglePublished(item: EventItem) {
    const id = eventId(item);
    togglingId = id;
    try {
      await setPublished([id], !item.published);
      items = items.map((row) =>
        eventId(row) === id ? { ...row, published: !item.published } : row
      );
      showNotice(item.published ? 'Eveniment trecut în draft.' : 'Eveniment publicat.', 'success');
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Nu s-a putut actualiza evenimentul.', 'danger');
    } finally {
      togglingId = '';
    }
  }

  async function remove(item: EventItem) {
    if (!confirm(`Ștergi evenimentul „${item.title ?? 'fără titlu'}”?`)) return;

    const id = eventId(item);
    const res = await fetch(`/api/evenimente/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error = data?.error ?? 'Nu s-a putut șterge evenimentul.';
      return;
    }

    items = items.filter((row) => eventId(row) !== id);
    setSelection(id, false);
    showNotice('Eveniment șters.', 'success');
  }

  onMount(loadItems);

  $: filtered = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${item.title ?? ''} ${item.location ?? ''} ${typeLabel(item.event_type)}`
      .toLowerCase()
      .includes(q);
  });

  $: selectedIds = [...selectedEventIds];
  $: selectedCount = selectedIds.length;
  $: allVisibleSelected =
    filtered.length > 0 && filtered.every((item) => selectedEventIds.has(eventId(item)));
</script>

<svelte:head>
  <title>Evenimente - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Calendar public</p>
      <h1>Evenimente</h1>
      <p>Gestionează evenimentele: creare, editare, publicare și ștergere.</p>
    </div>
    <div class="actions">
      <button class="pill" on:click={loadItems} disabled={loading}><i class="bi bi-arrow-clockwise"></i> Reîncarcă</button>
      <a href="/admin/evenimente/new" class="pill primary"><i class="bi bi-plus-circle"></i> Eveniment nou</a>
    </div>
  </header>

  <section class="toolbar">
    <label class="searchBox" aria-label="Caută evenimente">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input type="search" placeholder="Caută după titlu, locație sau tip..." bind:value={searchQuery} />
    </label>
    <span class="count">{loading ? '…' : filtered.length} evenimente</span>
  </section>

  <section class="bulkBar" aria-label="Acțiuni evenimente selectate">
    <div class="bulkSummary">
      <strong>{selectedCount}</strong>
      <span>{selectedCount === 1 ? 'eveniment selectat' : 'evenimente selectate'}</span>
    </div>
    <div class="bulkActions">
      <button class="pill" type="button" on:click={selectVisibleEvents} disabled={loading || filtered.length === 0 || allVisibleSelected}>
        Selectează toate
      </button>
      <button class="pill" type="button" on:click={clearSelection} disabled={selectedCount === 0 || bulkWorking}>
        Curăță selecția
      </button>
      <select bind:value={bulkPublished} aria-label="Vizibilitate nouă pentru evenimentele selectate" disabled={bulkWorking}>
        <option value="true">Public</option>
        <option value="false">Draft</option>
      </select>
      <button class="pill primary" type="button" on:click={applyBulkPublish} disabled={selectedCount === 0 || bulkWorking}>
        {bulkWorking ? 'Se aplică…' : 'Aplică în masă'}
      </button>
    </div>
  </section>

  {#if notice}
    <div class={`notice ${noticeType}`} role="status"><i class="bi bi-info-circle"></i>{notice}</div>
  {/if}

  {#if error}
    <div class="notice danger" role="alert"><i class="bi bi-exclamation-triangle"></i>{error}</div>
  {/if}

  {#if loading}
    <section class="stateCard"><span class="spinner" aria-hidden="true"></span><strong>Se încarcă evenimentele…</strong></section>
  {:else if filtered.length === 0}
    <section class="emptyCard">
      <i class="bi bi-calendar-x"></i>
      <h2>Nu există evenimente pentru filtrul curent</h2>
      <p>Schimbă căutarea sau adaugă un eveniment nou.</p>
    </section>
  {:else}
    <section class="eventGrid" aria-label="Lista evenimentelor">
      {#each filtered as item (eventId(item))}
        <article class:selected={selectedEventIds.has(eventId(item))} class="eventCard">
          <label class="selectControl cardSelect">
            <input
              type="checkbox"
              checked={selectedEventIds.has(eventId(item))}
              on:change={(event) => setSelection(eventId(item), event.currentTarget.checked)}
            />
            <span>Selectează evenimentul</span>
          </label>

          {#if item.image_url}
            <img class="eventImage" src={item.image_url} alt={item.title ?? 'Imagine eveniment'} loading="lazy" decoding="async" />
          {:else}
            <div class="eventImage placeholder" aria-hidden="true"><i class="bi bi-card-image"></i></div>
          {/if}

          <header>
            <div>
              <h2>{item.title ?? 'Fără titlu'}</h2>
              <p>{typeLabel(item.event_type)}{isPast(item) ? ' · trecut' : ''}</p>
            </div>
            <span class:mutedBadge={!item.published} class="stateBadge">{item.published ? 'Public' : 'Draft'}</span>
          </header>

          <div class="metaGrid">
            <div><span>Data</span><strong>{formatDate(item.date)}</strong></div>
            <div><span>Locație</span><strong>{item.location ?? '-'}</strong></div>
          </div>

          <footer>
            <a class="cardBtn" href={`/admin/evenimente/${eventId(item)}`}>Editează</a>
            <button class="cardBtn" on:click={() => togglePublished(item)} disabled={togglingId === eventId(item)}>
              {item.published ? 'Trece în draft' : 'Publică'}
            </button>
            <button class="cardBtn danger" on:click={() => remove(item)}>Șterge</button>
          </footer>
        </article>
      {/each}
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
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 16px;
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

  .pill.primary {
    background: var(--accent);
    color: #fffdf7;
    border-color: transparent;
  }

  .pill:disabled,
  .cardBtn:disabled,
  .bulkActions select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .toolbar {
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
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

  .bulkBar {
    margin: 0 0 16px;
    border: 1px solid var(--line);
    border-radius: 24px;
    padding: 12px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 16px 40px rgba(35, 51, 30, 0.06);
  }

  .bulkSummary {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 10px 14px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    background: rgba(255, 255, 255, 0.54);
    white-space: nowrap;
  }

  .bulkSummary strong {
    font-size: 1.2rem;
    font-weight: 950;
  }

  .bulkSummary span {
    color: var(--muted);
    font-weight: 900;
  }

  .bulkActions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .bulkActions select {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 14px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--ink);
    font-weight: 850;
  }

  .eventGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
    gap: 14px;
  }

  .eventCard {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
    display: grid;
    gap: 14px;
    align-content: start;
  }

  .eventCard.selected {
    border-color: rgba(139, 212, 80, 0.9);
    box-shadow: 0 20px 58px rgba(93, 151, 48, 0.16);
  }

  .selectControl {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--muted);
    font-weight: 950;
    cursor: pointer;
    user-select: none;
  }

  .selectControl input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }

  .cardSelect {
    width: fit-content;
  }

  .eventImage {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 8;
    object-fit: cover;
    border-radius: 18px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.48);
  }

  .eventImage.placeholder {
    display: grid;
    place-items: center;
    color: var(--muted);
    font-size: 1.6rem;
  }

  .eventCard header,
  .eventCard footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  .eventCard h2 {
    margin: 0;
    font-size: 1.18rem;
    font-weight: 950;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }

  .eventCard header p {
    margin: 4px 0 0;
    color: var(--muted);
  }

  .stateBadge {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 7px 10px;
    background: rgba(139, 212, 80, 0.22);
    color: var(--accent);
    font-size: 0.72rem;
    font-weight: 950;
  }

  .stateBadge.mutedBadge {
    background: #eee9dd;
    color: #65685d;
  }

  .metaGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .metaGrid div {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.48);
  }

  .metaGrid span {
    display: block;
    color: var(--muted);
    font-size: 0.76rem;
    font-weight: 900;
  }

  .metaGrid strong {
    display: block;
    margin-top: 4px;
    overflow-wrap: anywhere;
  }

  .cardBtn {
    width: 100%;
  }

  .cardBtn.danger {
    color: #842029;
    background: #fff4f4;
    border-color: #facaca;
  }

  @media (max-width: 900px) {
    .bulkBar {
      grid-template-columns: 1fr;
    }

    .bulkActions {
      justify-content: stretch;
    }

    .bulkActions .pill,
    .bulkActions select {
      flex: 1 1 180px;
    }
  }

  @media (max-width: 720px) {
    .toolbar {
      grid-template-columns: 1fr;
    }

    .eventCard header,
    .eventCard footer {
      grid-template-columns: 1fr;
      display: grid;
      align-items: stretch;
    }

    .actions,
    .pill {
      width: 100%;
    }

    .metaGrid {
      grid-template-columns: 1fr;
    }
  }
</style>

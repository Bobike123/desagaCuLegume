<script lang="ts">
  import { onMount } from 'svelte';

  type HorecaRequest = {
    id: string;
    businessName: string;
    contactName: string;
    phone: string;
    email: string | null;
    businessType: string | null;
    city: string | null;
    address: string | null;
    productsNeeded: string;
    estimatedQuantity: string | null;
    frequency: string | null;
    preferredContact: string;
    message: string | null;
    status: string;
    adminNote: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const statuses = [
    { key: 'ALL', label: 'Toate' },
    { key: 'NEW', label: 'Noi' },
    { key: 'CONTACTED', label: 'Contactate' },
    { key: 'OFFER_SENT', label: 'Ofertă trimisă' },
    { key: 'CLOSED', label: 'Închise' },
  ];

  let items: HorecaRequest[] = [];
  let selected: HorecaRequest | null = null;
  let loading = true;
  let saving = false;
  let error = '';
  let success = '';
  let query = '';
  let statusFilter = 'ALL';
  let adminNoteDraft = '';

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusLabel(value: string) {
    const labels: Record<string, string> = {
      NEW: 'Nouă',
      CONTACTED: 'Contactată',
      OFFER_SENT: 'Ofertă trimisă',
      CLOSED: 'Închisă',
    };
    return labels[value] ?? value;
  }

  function statusClass(value: string) {
    if (value === 'NEW') return 'danger';
    if (value === 'CONTACTED') return 'warn';
    if (value === 'OFFER_SENT') return 'info';
    return 'neutral';
  }

  async function loadItems() {
    loading = true;
    error = '';
    success = '';
    try {
      const res = await fetch('/api/horeca?limit=100');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca cererile HORECA.');
      items = Array.isArray(data?.items) ? data.items : [];
      selected = selected
        ? items.find((item) => item.id === selected?.id) ?? items[0] ?? null
        : items[0] ?? null;
      adminNoteDraft = selected?.adminNote ?? '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca cererile HORECA.';
    } finally {
      loading = false;
    }
  }

  function selectItem(item: HorecaRequest) {
    selected = item;
    adminNoteDraft = item.adminNote ?? '';
    success = '';
    error = '';
  }

  async function updateSelected(status?: string) {
    if (!selected || saving) return;
    saving = true;
    error = '';
    success = '';
    try {
      const res = await fetch('/api/horeca', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: status ?? selected.status, adminNote: adminNoteDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut actualiza cererea.');
      const updated = data.item as HorecaRequest;
      items = items.map((item) => (item.id === updated.id ? updated : item));
      selected = updated;
      adminNoteDraft = updated.adminNote ?? '';
      success = 'Cererea a fost actualizată.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut actualiza cererea.';
    } finally {
      saving = false;
    }
  }

  $: filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    if (!q) return matchesStatus;
    const text =
      `${item.businessName} ${item.contactName} ${item.phone} ${item.email ?? ''} ${item.city ?? ''} ${item.productsNeeded}`.toLowerCase();
    return matchesStatus && text.includes(q);
  });
  $: totalNew = items.filter((item) => item.status === 'NEW').length;
  $: totalOpen = items.filter((item) => item.status !== 'CLOSED').length;

  onMount(loadItems);
</script>

<svelte:head>
  <title>Cereri HORECA - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">B2B</p>
      <h1>HORECA</h1>
      <p>Cereri de ofertă de la restaurante, cafenele, magazine și parteneri locali.</p>
    </div>
    <button class="pill" on:click={loadItems} disabled={loading}>
      <i class="bi bi-arrow-clockwise"></i> Reîncarcă
    </button>
  </header>

  {#if error}<div class="notice danger">{error}</div>{/if}
  {#if success}<div class="notice success">{success}</div>{/if}

  <section class="stats">
    <div><span>Total cereri</span><strong>{loading ? '…' : items.length}</strong></div>
    <div><span>Cereri noi</span><strong>{loading ? '…' : totalNew}</strong></div>
    <div><span>Deschise</span><strong>{loading ? '…' : totalOpen}</strong></div>
  </section>

  <section class="toolbar">
    <label class="searchBox" aria-label="Caută cereri HORECA">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input type="search" placeholder="Caută business, telefon, oraș, produse..." bind:value={query} />
    </label>
    <div class="filters">
      {#each statuses as status}
        <button
          type="button"
          class:active={statusFilter === status.key}
          on:click={() => (statusFilter = status.key)}
        >
          {status.label}
        </button>
      {/each}
    </div>
  </section>

  {#if loading}
    <section class="stateCard">
      <span class="spinner" aria-hidden="true"></span>
      <strong>Se încarcă cererile HORECA…</strong>
    </section>
  {:else if items.length === 0}
    <section class="emptyCard">
      <i class="bi bi-shop"></i>
      <h2>Nu există cereri HORECA încă</h2>
      <p>Cererile trimise din pagina publică /horeca vor apărea aici.</p>
      <a class="pill primary" href="/horeca" target="_blank" rel="noopener noreferrer">
        Vezi pagina publică
      </a>
    </section>
  {:else}
    <div class="workspace">
      <aside class="listPanel">
        {#if filtered.length === 0}
          <div class="muted">Nu există cereri pentru filtrul curent.</div>
        {:else}
          {#each filtered as item (item.id)}
            <button
              class:selected={selected?.id === item.id}
              class="requestBtn"
              type="button"
              on:click={() => selectItem(item)}
            >
              <div class="requestTop">
                <strong>{item.businessName}</strong>
                <span class={`tag ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
              </div>
              <p>{item.contactName} · {item.phone}</p>
              <small>{item.productsNeeded}</small>
              <time>{formatDate(item.createdAt)}</time>
            </button>
          {/each}
        {/if}
      </aside>

      <section class="detailPanel">
        {#if selected}
          <header class="detailHead">
            <div>
              <h2>{selected.businessName}</h2>
              <p>{selected.businessType ?? 'Business'} · {selected.city ?? 'Oraș nespecificat'}</p>
            </div>
            <span class={`tag ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
          </header>

          <div class="detailGrid">
            <div><span>Persoană contact</span><strong>{selected.contactName}</strong></div>
            <div>
              <span>Telefon</span>
              <a href={`tel:${selected.phone}`}>{selected.phone}</a>
            </div>
            <div>
              <span>Email</span>
              {#if selected.email}
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              {:else}
                <strong>-</strong>
              {/if}
            </div>
            <div><span>Contact preferat</span><strong>{selected.preferredContact}</strong></div>
            <div class="full">
              <span>Adresă / zonă</span>
              <strong>{selected.address || selected.city || '-'}</strong>
            </div>
            <div class="full">
              <span>Produse dorite</span>
              <p>{selected.productsNeeded}</p>
            </div>
            <div><span>Cantitate estimată</span><strong>{selected.estimatedQuantity || '-'}</strong></div>
            <div><span>Frecvență</span><strong>{selected.frequency || '-'}</strong></div>
            <div class="full">
              <span>Mesaj</span>
              <p>{selected.message || '-'}</p>
            </div>
          </div>

          <div class="adminBox">
            <label for="admin-note">Notă internă</label>
            <textarea
              id="admin-note"
              rows="4"
              bind:value={adminNoteDraft}
              placeholder="Ex: sunat, ofertă trimisă, cantități confirmate..."
            ></textarea>
            <div class="statusActions">
              <button type="button" disabled={saving} on:click={() => updateSelected('CONTACTED')}>
                Contactată
              </button>
              <button type="button" disabled={saving} on:click={() => updateSelected('OFFER_SENT')}>
                Ofertă trimisă
              </button>
              <button type="button" disabled={saving} on:click={() => updateSelected('CLOSED')}>
                Închide
              </button>
              <button class="primary" type="button" disabled={saving} on:click={() => updateSelected()}>
                {saving ? 'Se salvează…' : 'Salvează nota'}
              </button>
            </div>
          </div>
        {:else}
          <div class="muted">Selectează o cerere HORECA.</div>
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
  h1 {
    font-size: clamp(2.2rem, 7vw, 4.6rem);
  }

  h2 {
    margin: 0;
    font-weight: 950;
    font-size: clamp(1.35rem, 3vw, 2rem);
    letter-spacing: -0.04em;
    color: var(--ink);
  }

  /* Topbar override: stack pill below heading text on all sizes */
  .topbar p:not(.eyebrow) {
    max-width: 720px;
    margin: 12px 0 0;
    color: var(--muted);
  }

  /* Action buttons */
  .pill,
  .filters button,
  .statusActions button {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 15px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 950;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .pill.primary,
  .statusActions .primary {
    background: var(--accent);
    color: #fffdf7;
    border-color: transparent;
  }

  /* Stats strip */
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .stats div {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
  }

  .stats span {
    display: block;
    color: var(--muted);
    font-weight: 900;
    margin-bottom: 6px;
  }

  .stats strong {
    font-size: 2.2rem;
    font-weight: 950;
    letter-spacing: -0.06em;
    color: var(--ink);
  }

  /* Search + filter toolbar */
  .toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
  }

  .filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .filters button.active {
    background: rgba(139, 212, 80, 0.22);
    color: var(--accent);
    border-color: rgba(139, 212, 80, 0.4);
  }

  /* Two-panel workspace */
  .workspace {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 16px;
  }

  .listPanel,
  .detailPanel {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
  }

  .listPanel {
    display: grid;
    gap: 10px;
    align-content: start;
    max-height: calc(100vh - 310px);
    overflow: auto;
  }

  /* Request list items */
  .requestBtn {
    text-align: left;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: #fff;
    padding: 13px;
    cursor: pointer;
    width: 100%;
  }

  .requestBtn.selected {
    outline: 3px solid rgba(139, 212, 80, 0.24);
    border-color: rgba(39, 79, 42, 0.35);
  }

  .requestTop {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .requestBtn p,
  .requestBtn small,
  .requestBtn time,
  .muted,
  .detailHead p {
    color: var(--muted);
  }

  .requestBtn p {
    margin: 6px 0;
  }

  .requestBtn small {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .requestBtn time {
    display: block;
    margin-top: 6px;
    font-size: 0.82rem;
  }

  /* Status tags */
  .tag {
    border-radius: 999px;
    padding: 6px 9px;
    font-size: 0.72rem;
    font-weight: 950;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tag.danger  { background: #fff1f1; color: #842029; }
  .tag.warn    { background: #fff7db; color: #725100; }
  .tag.info    { background: #e9f0ff; color: #173b7a; }
  .tag.neutral { background: #ece8dd; color: #65685d; }

  /* Detail panel */
  .detailHead {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-start;
  }

  .detailGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .detailGrid div {
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.55);
    padding: 12px;
  }

  .detailGrid .full {
    grid-column: 1 / -1;
  }

  .detailGrid span {
    display: block;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 950;
    margin-bottom: 5px;
  }

  .detailGrid a,
  .detailGrid strong {
    color: var(--ink);
    font-weight: 950;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .detailGrid p {
    margin: 0;
    white-space: pre-wrap;
    color: var(--ink);
  }

  /* Internal note + status actions */
  .adminBox {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }

  .adminBox > label {
    font-weight: 950;
    color: var(--ink);
  }

  textarea {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 12px;
    background: #fff;
    color: var(--ink);
    resize: vertical;
    font-weight: 800;
    min-height: 90px;
  }

  .statusActions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  /* ---- Responsive ---- */

  @media (max-width: 991.98px) {
    .workspace,
    .toolbar {
      grid-template-columns: 1fr;
    }

    .listPanel {
      max-height: none;
    }

    .topbar {
      display: grid;
      align-items: stretch;
    }

    .pill {
      width: 100%;
    }

    .filters {
      justify-content: flex-start;
    }
  }

  @media (max-width: 640px) {
    .stats,
    .detailGrid {
      grid-template-columns: 1fr;
    }

    .detailHead {
      display: grid;
    }

    .statusActions button {
      width: 100%;
    }
  }
</style>

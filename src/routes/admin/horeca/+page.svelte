<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

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
    if (Number.isNaN(date.getTime())) return '—';
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
    if (value === 'NEW') return 'text-bg-danger';
    if (value === 'CONTACTED') return 'text-bg-warning';
    if (value === 'OFFER_SENT') return 'text-bg-primary';
    return 'text-bg-secondary';
  }

  async function loadItems() {
    loading = true;
    error = '';
    success = '';

    try {
      const res = await fetch('/api/horeca');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca cererile HORECA.');

      items = Array.isArray(data?.items) ? data.items : [];

      if (selected) {
        selected = items.find((item) => item.id === selected?.id) ?? items[0] ?? null;
      } else {
        selected = items[0] ?? null;
      }

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
        body: JSON.stringify({
          id: selected.id,
          status: status ?? selected.status,
          adminNote: adminNoteDraft,
        }),
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

    const text = `${item.businessName} ${item.contactName} ${item.phone} ${item.email ?? ''} ${item.city ?? ''} ${item.productsNeeded}`.toLowerCase();
    return matchesStatus && text.includes(q);
  });

  $: totalNew = items.filter((item) => item.status === 'NEW').length;
  $: totalOpen = items.filter((item) => item.status !== 'CLOSED').length;

  onMount(loadItems);
</script>

<svelte:head>
  <title>Cereri HORECA - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="page">
  <div class="page__head">
    <div>
      <h1>HORECA</h1>
      <p>Cereri de ofertă trimise fără login de restaurante, cafenele, magazine și parteneri locali.</p>
    </div>
    <button class="btn btn-outline-secondary" on:click={loadItems} disabled={loading}>
      <i class="bi bi-arrow-clockwise"></i> Reîncarcă
    </button>
  </div>

  {#if error}
    <div class="alert alert-danger" role="alert">{error}</div>
  {/if}
  {#if success}
    <div class="alert alert-success" role="alert">{success}</div>
  {/if}

  <div class="stats">
    <div class="statCard">
      <span>Total cereri</span>
      <strong>{loading ? '…' : items.length}</strong>
    </div>
    <div class="statCard">
      <span>Cereri noi</span>
      <strong>{loading ? '…' : totalNew}</strong>
    </div>
    <div class="statCard">
      <span>Deschise</span>
      <strong>{loading ? '…' : totalOpen}</strong>
    </div>
  </div>

  <div class="toolbar">
    <div class="search">
      <i class="bi bi-search"></i>
      <input class="form-control" type="search" placeholder="Caută business, telefon, oraș, produse..." bind:value={query} />
    </div>
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
  </div>

  {#if loading}
    <div class="panel loadingPanel">Se încarcă cererile HORECA…</div>
  {:else if items.length === 0}
    <div class="emptyState">
      <div class="emptyIcon"><i class="bi bi-shop"></i></div>
      <h2>Nu există cereri HORECA încă</h2>
      <p>Cererile trimise din pagina publică /horeca vor apărea aici.</p>
      <a class="btn btn-primary" href="/horeca" target="_blank" rel="noopener noreferrer">Vezi pagina publică</a>
    </div>
  {:else}
    <div class="grid">
      <aside class="panel listPanel">
        {#if filtered.length === 0}
          <div class="muted">Nu există cereri pentru filtrul curent.</div>
        {:else}
          {#each filtered as item (item.id)}
            <button class:selected={selected?.id === item.id} class="requestBtn" type="button" on:click={() => selectItem(item)}>
              <div class="requestBtn__top">
                <strong>{item.businessName}</strong>
                <span class={`badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
              </div>
              <div class="requestBtn__meta">{item.contactName} · {item.phone}</div>
              <div class="requestBtn__message">{item.productsNeeded}</div>
              <div class="requestBtn__date">{formatDate(item.createdAt)}</div>
            </button>
          {/each}
        {/if}
      </aside>

      <section class="panel detailPanel">
        {#if selected}
          <div class="detailHead">
            <div>
              <h2>{selected.businessName}</h2>
              <div class="muted">{selected.businessType ?? 'Business'} · {selected.city ?? 'Oraș nespecificat'}</div>
            </div>
            <span class={`badge ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
          </div>

          <div class="detailGrid">
            <div class="detailBlock">
              <span>Persoană contact</span>
              <strong>{selected.contactName}</strong>
            </div>
            <div class="detailBlock">
              <span>Telefon</span>
              <a href={`tel:${selected.phone}`}>{selected.phone}</a>
            </div>
            <div class="detailBlock">
              <span>Email</span>
              {#if selected.email}
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              {:else}
                <strong>—</strong>
              {/if}
            </div>
            <div class="detailBlock">
              <span>Contact preferat</span>
              <strong>{selected.preferredContact}</strong>
            </div>
            <div class="detailBlock full">
              <span>Adresă / zonă</span>
              <strong>{selected.address || selected.city || '—'}</strong>
            </div>
            <div class="detailBlock full">
              <span>Produse dorite</span>
              <p>{selected.productsNeeded}</p>
            </div>
            <div class="detailBlock">
              <span>Cantitate estimată</span>
              <strong>{selected.estimatedQuantity || '—'}</strong>
            </div>
            <div class="detailBlock">
              <span>Frecvență</span>
              <strong>{selected.frequency || '—'}</strong>
            </div>
            <div class="detailBlock full">
              <span>Mesaj</span>
              <p>{selected.message || '—'}</p>
            </div>
          </div>

          <div class="adminBox">
            <label for="admin-note">Notă internă</label>
            <textarea id="admin-note" class="form-control" rows="4" bind:value={adminNoteDraft} placeholder="Ex: sunat, ofertă trimisă, cantități confirmate..."></textarea>

            <div class="statusActions">
              <button class="btn btn-outline-secondary" type="button" disabled={saving} on:click={() => updateSelected('CONTACTED')}>Marchează contactată</button>
              <button class="btn btn-outline-primary" type="button" disabled={saving} on:click={() => updateSelected('OFFER_SENT')}>Ofertă trimisă</button>
              <button class="btn btn-outline-secondary" type="button" disabled={saving} on:click={() => updateSelected('CLOSED')}>Închide</button>
              <button class="btn btn-primary" type="button" disabled={saving} on:click={() => updateSelected()}>
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
  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .page__head h1 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .page__head p,
  .muted {
    margin: 6px 0 0;
    color: var(--desaga-muted);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .statCard,
  .panel,
  .emptyState {
    background: #fff;
    border: 1px solid var(--desaga-border);
    border-radius: 18px;
    box-shadow: var(--desaga-shadow-sm);
  }

  .statCard {
    padding: 16px;
    display: grid;
    gap: 6px;
  }

  .statCard span {
    color: var(--desaga-muted);
    font-weight: 800;
  }

  .statCard strong {
    font-size: 1.8rem;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .toolbar {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  @media (min-width: 992px) {
    .toolbar {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
  }

  .search {
    position: relative;
  }

  .search i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0, 0, 0, 0.45);
  }

  .search input {
    padding-left: 38px;
    border-radius: 14px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filters button {
    border: 1px solid var(--desaga-border);
    background: #fff;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 850;
    color: rgba(20, 33, 43, 0.72);
  }

  .filters button.active {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.12);
    border-color: rgba(var(--desaga-accent-rgb), 0.32);
  }

  .grid {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 16px;
  }

  .panel {
    padding: 18px;
  }

  .loadingPanel,
  .emptyState {
    padding: 28px;
  }

  .emptyState {
    text-align: center;
  }

  .emptyIcon {
    width: 54px;
    height: 54px;
    margin: 0 auto 12px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.12);
  }

  .listPanel {
    display: grid;
    align-content: start;
    gap: 10px;
    max-height: calc(100vh - 260px);
    overflow: auto;
  }

  .requestBtn {
    text-align: left;
    border: 1px solid var(--desaga-border);
    background: #fff;
    border-radius: 16px;
    padding: 12px;
  }

  .requestBtn.selected {
    border-color: rgba(var(--desaga-accent-rgb), 0.42);
    background: rgba(var(--desaga-accent-rgb), 0.08);
  }

  .requestBtn__top {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 10px;
  }

  .requestBtn__top strong {
    color: var(--desaga-heading);
  }

  .requestBtn__meta,
  .requestBtn__date {
    margin-top: 6px;
    color: var(--desaga-muted);
    font-size: 0.9rem;
  }

  .requestBtn__message {
    margin-top: 6px;
    color: rgba(20, 33, 43, 0.82);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .detailHead {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .detailHead h2 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .detailGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .detailBlock {
    border: 1px solid var(--desaga-border);
    border-radius: 16px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.015);
  }

  .detailBlock.full {
    grid-column: 1 / -1;
  }

  .detailBlock span {
    display: block;
    color: var(--desaga-muted);
    font-size: 0.82rem;
    font-weight: 850;
    margin-bottom: 4px;
  }

  .detailBlock strong,
  .detailBlock a {
    color: var(--desaga-heading);
    font-weight: 900;
    text-decoration: none;
  }

  .detailBlock p {
    white-space: pre-wrap;
    margin: 0;
    color: rgba(20, 33, 43, 0.82);
  }

  .adminBox {
    margin-top: 16px;
    display: grid;
    gap: 10px;
  }

  .adminBox label {
    font-weight: 900;
    color: var(--desaga-heading);
  }

  .statusActions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding: 18px;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .listPanel {
      max-height: none;
    }
  }

  @media (max-width: 576px) {
    .page__head,
    .detailHead {
      align-items: stretch;
      flex-direction: column;
    }

    .detailGrid {
      grid-template-columns: 1fr;
    }

    .statusActions .btn,
    .page__head .btn {
      width: 100%;
    }
  }
</style>
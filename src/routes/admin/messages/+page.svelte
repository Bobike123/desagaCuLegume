<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type ConversationStatus = 'ALL' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

  type ConversationListItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    updatedAt: string;
    user: {
      fullName: string | null;
      email: string;
      phone: string | null;
    } | null;
    lastMessage: {
      body: string;
      senderType: string;
      createdAt: string;
    } | null;
  };

  type ConversationDetail = {
    id: string;
    subject: string;
    status: string;
    user: {
      fullName: string | null;
      email: string;
      phone: string | null;
    } | null;
    messages: Array<{
      id: string;
      senderType: string;
      body: string;
      createdAt: string;
      isRead: boolean;
    }>;
  };

  let items: ConversationListItem[] = [];
  let current: ConversationDetail | null = null;
  let selectedId = '';
  let reply = '';
  let loading = true;
  let loadingCurrent = false;
  let sending = false;
  let updatingStatus = false;
  let error = '';
  let q = '';
  let statusFilter: ConversationStatus = 'ALL';

  const statusFilters: Array<{ value: ConversationStatus; label: string }> = [
    { value: 'ALL', label: 'Toate' },
    { value: 'OPEN', label: 'Deschise' },
    { value: 'CLOSED', label: 'Închise' },
    { value: 'ARCHIVED', label: 'Arhivate' },
  ];

  function normalizeStatus(value: string | null | undefined) {
    return String(value ?? 'OPEN').trim().toUpperCase();
  }

  function statusLabel(value: string | null | undefined) {
    const status = normalizeStatus(value);
    if (status === 'OPEN') return 'Deschisă';
    if (status === 'CLOSED') return 'Închisă';
    if (status === 'ARCHIVED') return 'Arhivată';
    return status.replaceAll('_', ' ');
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('ro-RO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function customerName(item: ConversationListItem | ConversationDetail | null) {
    return item?.user?.fullName || item?.user?.email || 'Utilizator';
  }

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ă|â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ș|ş/g, 's')
      .replace(/ț|ţ/g, 't');
  }

  $: openCount = items.filter((item: ConversationListItem) => normalizeStatus(item.status) === 'OPEN').length;
  $: unreadCount = items.reduce((sum: number, item: ConversationListItem) => sum + Number(item.unreadCount ?? 0), 0);
  $: filteredItems = items.filter((item: ConversationListItem) => {
    const matchesStatus = statusFilter === 'ALL' || normalizeStatus(item.status) === statusFilter;
    const needle = normalizeText(q.trim());
    if (!needle) return matchesStatus;

    const haystack = normalizeText(
      `${item.subject} ${item.user?.fullName ?? ''} ${item.user?.email ?? ''} ${item.user?.phone ?? ''} ${item.lastMessage?.body ?? ''}`
    );

    return matchesStatus && haystack.includes(needle);
  });

  async function loadList() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');

      items = Array.isArray(data?.items) ? data.items : [];

      if (selectedId && !items.some((item: ConversationListItem) => item.id === selectedId)) {
        selectedId = '';
        current = null;
      }

      if (!selectedId && items.length > 0) {
        selectedId = items[0].id;
      }

      if (selectedId) {
        await loadConversation(selectedId);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
    } finally {
      loading = false;
    }
  }

  async function loadConversation(id: string) {
    selectedId = id;
    loadingCurrent = true;
    error = '';

    try {
      const res = await fetch(`/api/messages/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca conversația.');

      current = data.item;

      await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true }),
      });

      await refreshListSilent();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca conversația.';
    } finally {
      loadingCurrent = false;
    }
  }

  async function refreshListSilent() {
    const res = await fetch('/api/messages');
    const data = await res.json().catch(() => ({}));
    if (res.ok) items = Array.isArray(data?.items) ? data.items : [];
  }

  async function sendReply() {
    if (!selectedId || !reply.trim() || sending) return;

    sending = true;
    error = '';

    try {
      const res = await fetch(`/api/messages/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut trimite răspunsul.');

      reply = '';
      await loadConversation(selectedId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut trimite răspunsul.';
    } finally {
      sending = false;
    }
  }

  async function updateStatus(status: 'OPEN' | 'CLOSED' | 'ARCHIVED') {
    if (!selectedId || updatingStatus) return;

    updatingStatus = true;
    error = '';

    try {
      const res = await fetch(`/api/messages/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut actualiza statusul.');

      await loadConversation(selectedId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut actualiza statusul.';
    } finally {
      updatingStatus = false;
    }
  }

  onMount(loadList);
</script>

<svelte:head>
  <title>Mesaje - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="admin-page">
  <header class="page-head surface">
    <div>
      <span class="badge-soft"><i class="bi bi-chat-dots"></i> Suport clienți</span>
      <h1>Mesaje</h1>
      <p>Conversații dintre utilizatori și administratori.</p>
    </div>

    <div class="head-actions">
      <div class="counter-pill">
        <strong>{loading ? '…' : unreadCount}</strong>
        <span>necitite</span>
      </div>
      <button class="btn btn-accent" type="button" on:click={loadList} disabled={loading}>
        <i class={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
        Reîncarcă
      </button>
    </div>
  </header>

  {#if error}
    <div class="alert alert-danger" role="alert">
      <strong>Eroare.</strong> {error}
    </div>
  {/if}

  <section class="message-shell">
    <aside class="surface list-panel" aria-label="Lista conversațiilor">
      <div class="list-tools">
        <div class="search-box">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input class="form-control" type="search" placeholder="Caută client, email, subiect…" bind:value={q} />
          {#if q.trim()}
            <button type="button" aria-label="Șterge căutarea" on:click={() => (q = '')}>
              <i class="bi bi-x-lg"></i>
            </button>
          {/if}
        </div>

        <div class="filters" aria-label="Filtre status">
          {#each statusFilters as filter (filter.value)}
            <button
              type="button"
              class:active={statusFilter === filter.value}
              aria-pressed={statusFilter === filter.value}
              on:click={() => (statusFilter = filter.value)}
            >
              {filter.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="list-summary">
        <span>{loading ? 'Se încarcă…' : `${filteredItems.length} conversații`}</span>
        <span>{loading ? '' : `${openCount} deschise`}</span>
      </div>

      <div class="conversation-list">
        {#if loading}
          {#each Array(5) as _}
            <div class="skeleton-card"></div>
          {/each}
        {:else if filteredItems.length === 0}
          <div class="empty-state">
            <i class="bi bi-inbox"></i>
            <strong>Nu există conversații pentru filtrul curent.</strong>
            <span>Schimbă filtrul sau caută alt termen.</span>
          </div>
        {:else}
          {#each filteredItems as item (item.id)}
            <button
              class:selected={selectedId === item.id}
              class="conversation-btn"
              type="button"
              on:click={() => loadConversation(item.id)}
            >
              <div class="conversation-btn__top">
                <strong>{customerName(item)}</strong>
                {#if item.unreadCount > 0}
                  <span class="unread-badge">{item.unreadCount}</span>
                {/if}
              </div>

              <div class="conversation-btn__subject">{item.subject}</div>

              <div class="conversation-btn__meta">
                <span class={`status-dot status-${normalizeStatus(item.status).toLowerCase()}`}></span>
                <span>{statusLabel(item.status)}</span>
                <span>·</span>
                <span>{formatDate(item.updatedAt ?? item.lastMessage?.createdAt)}</span>
              </div>

              {#if item.lastMessage}
                <div class="conversation-btn__message">{item.lastMessage.body}</div>
              {:else}
                <div class="conversation-btn__message muted">Fără mesaje.</div>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </aside>

    <section class="surface detail-panel" aria-label="Detalii conversație">
      {#if loadingCurrent}
        <div class="detail-loading">
          <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
          <span>Se încarcă conversația…</span>
        </div>
      {:else if current}
        <div class="detail-head">
          <div>
            <h2>{current.subject}</h2>
            <div class="customer-line">
              <span>{customerName(current)}</span>
              {#if current.user?.email}
                <a href={`mailto:${current.user.email}`}>{current.user.email}</a>
              {/if}
              {#if current.user?.phone}
                <a href={`tel:${current.user.phone}`}>{current.user.phone}</a>
              {/if}
            </div>
          </div>

          <div class="detail-actions">
            <span class={`status-pill status-${normalizeStatus(current.status).toLowerCase()}`}>
              {statusLabel(current.status)}
            </span>
            <div class="status-actions" aria-label="Schimbă status conversație">
              <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('OPEN')} disabled={updatingStatus}>
                Open
              </button>
              <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('CLOSED')} disabled={updatingStatus}>
                Closed
              </button>
              <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('ARCHIVED')} disabled={updatingStatus}>
                Archived
              </button>
            </div>
          </div>
        </div>

        <div class="messages">
          {#if current.messages.length === 0}
            <div class="empty-state">
              <i class="bi bi-chat"></i>
              <strong>Conversație fără mesaje.</strong>
              <span>Scrie primul răspuns pentru client.</span>
            </div>
          {:else}
            {#each current.messages as message (message.id)}
              <div class={`message ${message.senderType === 'ADMIN' ? 'message--admin' : 'message--user'}`}>
                <div class="message__meta">
                  <strong>{message.senderType === 'ADMIN' ? 'Admin' : 'Client'}</strong>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <div class="message__body">{message.body}</div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="reply-box">
          <label for="admin-reply">Răspuns administrator</label>
          <textarea
            id="admin-reply"
            class="form-control"
            rows="4"
            bind:value={reply}
            placeholder="Scrie un răspuns clar pentru client…"
            disabled={sending}
          ></textarea>
          <div class="reply-actions">
            <span class="muted">{reply.trim().length} caractere</span>
            <button class="btn btn-accent" type="button" on:click={sendReply} disabled={sending || !reply.trim()}>
              <i class={`bi ${sending ? 'bi-arrow-repeat spin' : 'bi-send'}`}></i>
              {sending ? 'Se trimite…' : 'Trimite răspuns'}
            </button>
          </div>
        </div>
      {:else}
        <div class="empty-state detail-empty">
          <i class="bi bi-chat-square-text"></i>
          <strong>Selectează o conversație.</strong>
          <span>Lista din stânga conține mesajele clienților.</span>
        </div>
      {/if}
    </section>
  </section>
</div>

<style>
  .admin-page {
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(1rem, 3vw, 1.75rem);
    background: var(--desaga-cream);
  }

  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: clamp(1rem, 3vw, 1.4rem);
    margin-bottom: 1rem;
  }

  .page-head h1 {
    margin: 0.65rem 0 0;
    font-weight: 950;
    color: var(--desaga-heading);
    letter-spacing: -0.035em;
  }

  .page-head p {
    margin: 0.35rem 0 0;
    color: var(--desaga-muted);
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .counter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 40px;
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    background: rgba(var(--desaga-accent-rgb), 0.1);
    border: 1px solid rgba(var(--desaga-accent-rgb), 0.18);
  }

  .counter-pill strong {
    color: var(--desaga-heading);
    font-weight: 950;
  }

  .counter-pill span {
    color: var(--desaga-muted);
    font-weight: 850;
  }

  .message-shell {
    display: grid;
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .list-panel,
  .detail-panel {
    padding: 1rem;
  }

  .list-panel {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow: hidden;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .list-tools {
    display: grid;
    gap: 0.75rem;
  }

  .search-box {
    position: relative;
  }

  .search-box > i {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--desaga-muted);
  }

  .search-box input {
    padding-left: 2.25rem;
    padding-right: 2.25rem;
    border-radius: var(--desaga-radius-md);
    border-color: var(--desaga-border);
  }

  .search-box button {
    position: absolute;
    right: 0.45rem;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--desaga-muted);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .filters button {
    border: 1px solid var(--desaga-border);
    background: #fff;
    border-radius: 999px;
    padding: 0.42rem 0.65rem;
    color: rgba(20, 33, 43, 0.72);
    font-weight: 850;
    font-size: 0.9rem;
  }

  .filters button.active {
    border-color: rgba(var(--desaga-accent-rgb), 0.35);
    background: rgba(var(--desaga-accent-rgb), 0.1);
    color: var(--desaga-blue);
  }

  .list-summary {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0.8rem 0;
    color: var(--desaga-muted);
    font-size: 0.9rem;
    font-weight: 800;
  }

  .conversation-list {
    min-height: 0;
    overflow: auto;
    display: grid;
    align-content: start;
    gap: 0.65rem;
    padding-right: 0.25rem;
  }

  .conversation-btn {
    width: 100%;
    text-align: left;
    border: 1px solid var(--desaga-border);
    background: #fff;
    border-radius: var(--desaga-radius-md);
    padding: 0.85rem;
    color: inherit;
  }

  .conversation-btn:hover,
  .conversation-btn:focus,
  .conversation-btn.selected {
    border-color: rgba(var(--desaga-accent-rgb), 0.42);
    background: rgba(var(--desaga-accent-rgb), 0.06);
  }

  .conversation-btn__top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: start;
  }

  .conversation-btn__top strong,
  .conversation-btn__subject {
    color: var(--desaga-heading);
  }

  .conversation-btn__subject {
    margin-top: 0.45rem;
    font-weight: 900;
  }

  .conversation-btn__meta {
    margin-top: 0.45rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--desaga-muted);
    font-size: 0.85rem;
    font-weight: 750;
  }

  .conversation-btn__message {
    margin-top: 0.5rem;
    color: rgba(20, 33, 43, 0.68);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.35;
  }

  .unread-badge {
    min-width: 22px;
    height: 22px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.4rem;
    background: var(--desaga-red);
    color: #fff;
    font-size: 0.76rem;
    font-weight: 950;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    display: inline-block;
    background: var(--desaga-muted);
  }

  .status-open {
    background: var(--desaga-blue);
  }

  .status-closed {
    background: var(--desaga-green);
  }

  .status-archived {
    background: #64748b;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    color: #fff;
    font-weight: 900;
    font-size: 0.85rem;
    background: #64748b;
  }

  .detail-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--desaga-border);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .detail-head h2 {
    margin: 0;
    color: var(--desaga-heading);
    font-size: clamp(1.15rem, 2vw, 1.45rem);
    font-weight: 950;
  }

  .customer-line {
    margin-top: 0.45rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    color: var(--desaga-muted);
    font-weight: 800;
  }

  .customer-line a {
    text-decoration: none;
  }

  .detail-actions {
    display: grid;
    gap: 0.55rem;
    justify-items: end;
  }

  .status-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    justify-content: flex-end;
  }

  .messages {
    display: grid;
    gap: 0.75rem;
    max-height: 52vh;
    overflow: auto;
    padding-right: 0.25rem;
  }

  .message {
    max-width: min(760px, 92%);
    padding: 0.85rem;
    border-radius: var(--desaga-radius-md);
    white-space: pre-wrap;
    border: 1px solid var(--desaga-border);
  }

  .message--user {
    background: rgba(15, 23, 42, 0.04);
    justify-self: start;
  }

  .message--admin {
    background: rgba(var(--desaga-accent-rgb), 0.08);
    border-color: rgba(var(--desaga-accent-rgb), 0.16);
    justify-self: end;
  }

  .message__meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.45rem;
    color: var(--desaga-muted);
    font-size: 0.82rem;
  }

  .message__body {
    color: rgba(20, 33, 43, 0.86);
    line-height: 1.45;
  }

  .reply-box {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--desaga-border);
  }

  .reply-box label {
    display: block;
    margin-bottom: 0.45rem;
    color: var(--desaga-heading);
    font-weight: 900;
  }

  .reply-box textarea {
    border-radius: var(--desaga-radius-md);
    border-color: var(--desaga-border);
  }

  .reply-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .muted {
    color: var(--desaga-muted);
  }

  .empty-state,
  .detail-loading {
    min-height: 180px;
    display: grid;
    place-items: center;
    text-align: center;
    gap: 0.45rem;
    padding: 1rem;
    color: var(--desaga-muted);
  }

  .empty-state i {
    font-size: 2rem;
    color: var(--desaga-blue);
  }

  .empty-state strong {
    color: var(--desaga-heading);
  }

  .detail-empty {
    min-height: 420px;
  }

  .skeleton-card {
    height: 112px;
    border-radius: var(--desaga-radius-md);
    background: linear-gradient(90deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.05));
    background-size: 200% 100%;
    animation: shimmer 1.15s linear infinite;
  }

  .spin {
    animation: spin 0.8s linear infinite;
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 991.98px) {
    .admin-page {
      margin-left: 0;
    }

    .page-head,
    .detail-head {
      flex-direction: column;
      align-items: stretch;
    }

    .head-actions,
    .detail-actions,
    .status-actions {
      justify-content: flex-start;
      justify-items: start;
    }

    .message-shell {
      grid-template-columns: 1fr;
    }

    .list-panel {
      position: static;
      max-height: none;
    }

    .conversation-list {
      max-height: 420px;
    }
  }

  @media (max-width: 575.98px) {
    .head-actions :global(.btn),
    .reply-actions :global(.btn) {
      width: 100%;
    }

    .reply-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .message {
      max-width: 100%;
    }
  }
</style>
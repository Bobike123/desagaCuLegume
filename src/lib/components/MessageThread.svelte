<script lang="ts">
  import { browser } from '$app/environment';

  type Mode = 'user' | 'admin';
  type ConversationStatus = 'ALL' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

  type OrderItem = {
    id: string;
    orderNumber: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
  };

  type RawConversation = {
    id?: unknown;
    subject?: unknown;
    status?: unknown;
    unreadCount?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    user?: {
      fullName?: unknown;
      email?: unknown;
      phone?: unknown;
    } | null;
    lastMessage?: {
      body?: unknown;
      senderType?: unknown;
      createdAt?: unknown;
    } | null;
  };

  type ConversationUser = {
    fullName: string | null;
    email: string;
    phone: string | null;
  } | null;

  type ConversationListItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    updatedAt: string;
    order: OrderItem | null;
    kind: 'order' | 'general';
    user: ConversationUser;
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
    user: ConversationUser;
    messages: Array<{
      id: string;
      senderType: string;
      body: string;
      createdAt: string;
      isRead: boolean;
    }>;
  };

  export let mode: Mode = 'user';
  export let orders: OrderItem[] = [];
  export let expanded = true;
  export let collapsible = false;
  export let title = '';
  export let subtitle = '';

  let items: ConversationListItem[] = [];
  let current: ConversationDetail | null = null;
  let selectedId = '';
  let selectedOrderId = '';
  let reply = '';
  let generalSubject = 'Întrebare generală';
  let loading = false;
  let loadingCurrent = false;
  let reloading = false;
  let sending = false;
  let updatingStatus = false;
  let error = '';
  let q = '';
  let statusFilter: ConversationStatus = 'ALL';
  let hasLoaded = false;

  const statusFilters: Array<{ value: ConversationStatus; label: string }> = [
    { value: 'ALL', label: 'Toate' },
    { value: 'OPEN', label: 'Deschise' },
    { value: 'CLOSED', label: 'Închise' },
    { value: 'ARCHIVED', label: 'Arhivate' },
  ];

  function formatMoney(value: number, currency = 'RON') {
    return `${Number(value ?? 0).toFixed(2)} ${currency || 'RON'}`;
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: mode === 'user' ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function normalizeStatus(value: string | null | undefined) {
    return String(value ?? 'OPEN').trim().toUpperCase();
  }

  function statusLabel(value: string | null | undefined) {
    const status = normalizeStatus(value);
    const labels: Record<string, string> = {
      OPEN: 'Deschisă',
      CLOSED: 'Închisă',
      ARCHIVED: 'Arhivată',
      PLACED: 'Plasată',
      PENDING: 'În așteptare',
      PAID: 'Plătită',
      CANCELLED: 'Anulată',
      COMPLETED: 'Finalizată',
      UNFULFILLED: 'Nepregătită',
      FULFILLED: 'Livrată',
    };

    return labels[status] ?? status.replaceAll('_', ' ').toLowerCase();
  }

  function readString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : value == null ? fallback : String(value);
  }

  function readNullableString(value: unknown) {
    const normalized = readString(value).trim();
    return normalized || null;
  }

  function readUser(value: RawConversation['user']): ConversationUser {
    if (!value) return null;
    return {
      fullName: readNullableString(value.fullName),
      email: readString(value.email),
      phone: readNullableString(value.phone),
    };
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

  function customerName(item: ConversationListItem | ConversationDetail | null) {
    return item?.user?.fullName || item?.user?.email || 'Utilizator';
  }

  function conversationMatchesOrder(conversation: RawConversation, order: OrderItem) {
    const subject = readString(conversation.subject).toLowerCase();
    const orderNumber = String(order.orderNumber ?? '').toLowerCase();
    const orderId = String(order.id ?? '').toLowerCase();
    return Boolean(orderNumber && subject.includes(orderNumber)) || Boolean(orderId && subject.includes(orderId));
  }

  function mapConversation(conversation: RawConversation, order: OrderItem | null): ConversationListItem {
    const updatedAt = readString(conversation.updatedAt || conversation.createdAt || order?.createdAt || new Date().toISOString());
    const subjectFallback = order ? `Comandă ${order.orderNumber}` : 'Mesaj către DeSaga';

    return {
      id: readString(conversation.id),
      subject: readString(conversation.subject, subjectFallback),
      status: readString(conversation.status, 'OPEN'),
      unreadCount: Number(conversation.unreadCount ?? 0),
      updatedAt,
      order,
      kind: order ? 'order' : 'general',
      user: readUser(conversation.user),
      lastMessage: conversation.lastMessage
        ? {
            body: readString(conversation.lastMessage.body),
            senderType: readString(conversation.lastMessage.senderType),
            createdAt: readString(conversation.lastMessage.createdAt),
          }
        : null,
    };
  }

  function buildConversationItems(rawConversations: RawConversation[]) {
    if (mode === 'admin') {
      return rawConversations
        .map((conversation: RawConversation) => mapConversation(conversation, null))
        .filter((item: ConversationListItem) => item.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    const mapped: ConversationListItem[] = [];
    const matchedConversationIds = new Set<string>();

    for (const order of orders) {
      const matching = rawConversations.filter((conversation: RawConversation) => conversationMatchesOrder(conversation, order));
      for (const conversation of matching) {
        const item = mapConversation(conversation, order);
        if (!item.id) continue;
        matchedConversationIds.add(item.id);
        mapped.push(item);
      }
    }

    for (const conversation of rawConversations) {
      const id = readString(conversation.id);
      if (!id || matchedConversationIds.has(id)) continue;
      mapped.push(mapConversation(conversation, null));
    }

    mapped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return mapped;
  }

  async function loadOrders() {
    if (mode === 'admin') return;

    const res = await fetch('/api/orders');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
    orders = Array.isArray(data?.items) ? data.items : [];
  }

  async function loadMessages() {
    const res = await fetch('/api/messages');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');
    const rawConversations: RawConversation[] = Array.isArray(data?.items) ? data.items : [];
    items = buildConversationItems(rawConversations);
  }

  async function loadList() {
    if (loading) return;

    loading = true;
    error = '';

    try {
      if (mode === 'admin') {
        await loadMessages();
      } else {
        await loadOrders();
        await loadMessages();
      }

      if (selectedId && !items.some((item: ConversationListItem) => item.id === selectedId)) {
        selectedId = '';
        selectedOrderId = '';
        current = null;
      }

      if (!selectedId && !selectedOrderId && items.length > 0) {
        selectedId = items[0].id;
        selectedOrderId = items[0].order?.id ?? '';
      }

      if (selectedId) {
        await loadConversation(selectedId);
      } else if (mode === 'user' && selectedOrderId) {
        const selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId);
        if (selectedOrder) selectOrderWithoutConversation(selectedOrder);
      } else if (mode === 'user') {
        selectGeneralNew();
      }

      hasLoaded = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
      current = null;
    } finally {
      loading = false;
    }
  }

  async function reloadList() {
    reloading = true;
    hasLoaded = false;
    try {
      await loadList();
    } finally {
      reloading = false;
    }
  }

  async function loadConversation(id: string) {
    selectedId = id;
    loadingCurrent = true;
    error = '';

    const selected = items.find((item: ConversationListItem) => item.id === id);
    selectedOrderId = selected?.order?.id ?? '';

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

  async function selectConversation(id: string) {
    try {
      await loadConversation(id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca conversația.';
    }
  }

  async function refreshListSilent() {
    if (mode === 'admin') {
      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const rawConversations: RawConversation[] = Array.isArray(data?.items) ? data.items : [];
        items = buildConversationItems(rawConversations);
      }
      return;
    }

    const [ordersRes, messagesRes] = await Promise.all([fetch('/api/orders'), fetch('/api/messages')]);
    const ordersData = await ordersRes.json().catch(() => ({}));
    const messagesData = await messagesRes.json().catch(() => ({}));

    if (ordersRes.ok) {
      orders = Array.isArray(ordersData?.items) ? ordersData.items : [];
    }

    if (messagesRes.ok) {
      const rawConversations: RawConversation[] = Array.isArray(messagesData?.items) ? messagesData.items : [];
      items = buildConversationItems(rawConversations);
    }
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

  function selectOrderWithoutConversation(order: OrderItem) {
    selectedOrderId = order.id;
    selectedId = '';
    current = {
      id: '',
      subject: `Comandă ${order.orderNumber}`,
      status: 'OPEN',
      user: null,
      messages: [],
    };
    reply = '';
    error = '';
  }

  async function selectOrder(order: OrderItem) {
    const existing = items.find((item: ConversationListItem) => item.order?.id === order.id);
    if (existing) {
      await selectConversation(existing.id);
      return;
    }

    selectOrderWithoutConversation(order);
  }

  function selectGeneralNew() {
    selectedOrderId = '';
    selectedId = '';
    current = {
      id: '',
      subject: generalSubject,
      status: 'OPEN',
      user: null,
      messages: [],
    };
    reply = '';
    error = '';
  }

  async function createConversation() {
    if (!reply.trim() || sending) return;

    sending = true;
    error = '';

    try {
      const selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId);
      const subject = selectedOrder ? `Comandă ${selectedOrder.orderNumber}` : generalSubject.trim() || 'Întrebare generală';
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: reply }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut crea conversația.');

      reply = '';
      await refreshListSilent();
      if (data?.item?.id) await loadConversation(String(data.item.id));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut crea conversația.';
    } finally {
      sending = false;
    }
  }

  async function submitMessage() {
    if (selectedId) {
      await sendReply();
      return;
    }

    if (mode === 'user') await createConversation();
  }

  function senderLabel(senderType: string) {
    const normalized = normalizeStatus(senderType);
    if (mode === 'admin') return normalized === 'ADMIN' ? 'Admin' : 'Client';
    return normalized === 'ADMIN' ? 'Admin' : 'Tu';
  }

  function orderConversation(orderId: string) {
    return items.find((item: ConversationListItem) => item.order?.id === orderId) ?? null;
  }

  $: selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId) ?? null;
  $: generalConversations = items.filter((item: ConversationListItem) => item.kind === 'general');
  $: openCount = items.filter((item: ConversationListItem) => normalizeStatus(item.status) === 'OPEN').length;
  $: unreadCount = items.reduce((sum: number, item: ConversationListItem) => sum + Number(item.unreadCount ?? 0), 0);
  $: filteredItems = items.filter((item: ConversationListItem) => {
    if (mode !== 'admin') return true;

    const matchesStatus = statusFilter === 'ALL' || normalizeStatus(item.status) === statusFilter;
    const needle = normalizeText(q.trim());
    if (!needle) return matchesStatus;

    const haystack = normalizeText(
      `${item.subject} ${item.user?.fullName ?? ''} ${item.user?.email ?? ''} ${item.user?.phone ?? ''} ${item.lastMessage?.body ?? ''}`
    );

    return matchesStatus && haystack.includes(needle);
  });
  $: resolvedTitle = title || (mode === 'admin' ? 'Mesaje clienți' : 'Mesaje și suport');
  $: resolvedSubtitle = subtitle || (mode === 'admin' ? 'Conversații dintre utilizatori și administratori.' : 'Scrie adminului despre comenzi, stoc sau livrare.');

  $: if (browser && expanded && !hasLoaded && !loading) {
    void loadList();
  }
</script>

<div class={`message-thread message-thread--${mode}`} class:expanded>
  {#if !expanded}
    <button class="expand-btn" type="button" on:click={() => (expanded = true)}>
      <i class="bi bi-chat-dots"></i> Deschide mesaje
    </button>
  {:else}
    <div class="thread-header">
      <div>
        <h3><i class="bi bi-chat-dots"></i> {resolvedTitle}</h3>
        {#if resolvedSubtitle}
          <p>{resolvedSubtitle}</p>
        {/if}
      </div>

      <div class="thread-actions">
        {#if mode === 'admin'}
          <span class="counter-pill"><strong>{unreadCount}</strong> necitite</span>
        {/if}
        <button class="icon-btn" type="button" on:click={reloadList} disabled={reloading || loading} aria-label="Reîncarcă">
          <i class={`bi ${reloading || loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
        </button>
        {#if collapsible}
          <button class="icon-btn" type="button" on:click={() => (expanded = false)} aria-label="Închide">
            <i class="bi bi-x-lg"></i>
          </button>
        {/if}
      </div>
    </div>

    {#if error}
      <div class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-circle"></i> {error}
      </div>
    {/if}

    {#if mode === 'admin'}
      <div class="admin-tools">
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

      <div class="message-grid admin-grid">
        <aside class="list-panel" aria-label="Lista conversațiilor">
          {#if loading}
            {#each Array(5) as _}
              <div class="skeleton-card"></div>
            {/each}
          {:else if filteredItems.length === 0}
            <div class="empty-thread compact">
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
                on:click={() => selectConversation(item.id)}
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
        </aside>

        <section class="detail-panel" aria-label="Detalii conversație">
          {#if loadingCurrent}
            <div class="detail-loading">
              <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
              <span>Se încarcă conversația…</span>
            </div>
          {:else if current}
            <div class="detail-header admin-detail-header">
              <div>
                <h4>{current.subject}</h4>
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
                  <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('OPEN')} disabled={updatingStatus}>Open</button>
                  <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('CLOSED')} disabled={updatingStatus}>Closed</button>
                  <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('ARCHIVED')} disabled={updatingStatus}>Archived</button>
                </div>
              </div>
            </div>

            <div class="messages-scroll admin-messages">
              {#if current.messages.length === 0}
                <div class="empty-thread">
                  <i class="bi bi-chat"></i>
                  <strong>Conversație fără mesaje.</strong>
                  <span>Scrie primul răspuns pentru client.</span>
                </div>
              {:else}
                {#each current.messages as msg (msg.id)}
                  <div class={`msg ${normalizeStatus(msg.senderType) === 'ADMIN' ? 'msg-admin' : 'msg-user'}`}>
                    <div class="msg-meta">
                      <strong>{senderLabel(msg.senderType)}</strong>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                    <div class="msg-body">{msg.body}</div>
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
            <div class="empty-thread detail-empty">
              <i class="bi bi-chat-square-text"></i>
              <strong>Selectează o conversație.</strong>
              <span>Lista din stânga conține mesajele clienților.</span>
            </div>
          {/if}
        </section>
      </div>
    {:else}
      {#if loading}
        <div class="detail-loading">
          <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
          <span>Se încarcă mesajele…</span>
        </div>
      {:else}
        <div class="message-grid user-grid">
          <aside class="list-panel" aria-label="Lista conversațiilor">
            <button
              class:selected={!selectedOrderId && !selectedId}
              class="conv-btn new-btn"
              type="button"
              on:click={selectGeneralNew}
            >
              <span><i class="bi bi-plus-circle"></i> Mesaj nou</span>
            </button>

            {#if generalConversations.length > 0}
              <div class="list-title">Conversații generale</div>
              {#each generalConversations as item (item.id)}
                <button
                  class:selected={selectedId === item.id}
                  class="conv-btn"
                  type="button"
                  on:click={() => selectConversation(item.id)}
                >
                  <span class="conv-title">{item.subject}</span>
                  {#if item.unreadCount > 0}
                    <span class="unread-badge">{item.unreadCount}</span>
                  {/if}
                </button>
              {/each}
            {/if}

            <div class="list-title">Comenzile mele</div>
            {#if orders.length === 0}
              <div class="empty-msg">Nu ai comenzi.</div>
            {:else}
              {#each orders as order (order.id)}
                <button
                  class:selected={selectedOrderId === order.id}
                  class="conv-btn order-btn"
                  type="button"
                  on:click={() => selectOrder(order)}
                >
                  <span class="conv-title">#{order.orderNumber}</span>
                  {#if orderConversation(order.id)?.unreadCount}
                    <span class="unread-badge">{orderConversation(order.id)?.unreadCount}</span>
                  {:else}
                    <span class="badge-light">{statusLabel(order.status)}</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </aside>

          <section class="detail-panel" aria-label="Detalii conversație">
            {#if current}
              <div class="detail-header">
                <div>
                  <h4>{current.subject}</h4>
                  {#if selectedOrder}
                    <p class="muted">{selectedOrder.orderNumber} · {formatMoney(selectedOrder.total, selectedOrder.currency)}</p>
                  {:else}
                    <p class="muted">Mesaj general</p>
                  {/if}
                </div>
              </div>

              {#if !selectedId && !selectedOrder}
                <div class="form-group">
                  <label for="msg-subject">Subiect</label>
                  <input id="msg-subject" class="form-control" bind:value={generalSubject} />
                </div>
              {/if}

              <div class="messages-scroll">
                {#if current.messages.length === 0}
                  <div class="empty-thread">
                    <i class="bi bi-chat-left"></i>
                    <strong>Nu sunt mesaje încă.</strong>
                    <span>Scrie mai jos și adminul îți răspunde aici.</span>
                  </div>
                {:else}
                  {#each current.messages as msg (msg.id)}
                    <div class={`msg ${normalizeStatus(msg.senderType) === 'ADMIN' ? 'msg-admin' : 'msg-user'}`}>
                      <div class="msg-meta">
                        <strong>{senderLabel(msg.senderType)}</strong>
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                      <div class="msg-body">{msg.body}</div>
                    </div>
                  {/each}
                {/if}
              </div>

              <div class="reply-box user-reply-box">
                <label for="reply-msg">{selectedId ? 'Răspuns' : 'Mesaj'}</label>
                <textarea
                  id="reply-msg"
                  class="form-control"
                  rows="3"
                  bind:value={reply}
                  placeholder={selectedId ? 'Scrie răspuns...' : 'Scrie mesaj...'}
                  disabled={sending}
                ></textarea>
                <div class="reply-actions">
                  <span class="muted">{reply.trim().length} caractere</span>
                  <button class="btn btn-accent" type="button" on:click={submitMessage} disabled={sending || !reply.trim()}>
                    <i class={`bi ${sending ? 'bi-arrow-repeat spin' : 'bi-send'}`}></i>
                    {sending ? 'Se trimite...' : 'Trimite'}
                  </button>
                </div>
              </div>
            {:else}
              <div class="empty-thread detail-empty">
                <i class="bi bi-arrow-left"></i>
                <strong>Selectează o conversație.</strong>
                <span>Sau începe un mesaj nou.</span>
              </div>
            {/if}
          </section>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .message-thread {
    background: #fff;
    border-radius: 18px;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    box-shadow: var(--desaga-shadow-sm, 0 10px 24px rgba(0, 0, 0, 0.08));
    overflow: hidden;
  }

  .message-thread--admin {
    box-shadow: none;
  }

  .expand-btn {
    width: 100%;
    padding: 16px;
    border: 0;
    background: transparent;
    color: var(--desaga-blue, #2699d6);
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .expand-btn:hover {
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.08);
  }

  .thread-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
  }

  .thread-header h3 {
    margin: 0;
    color: var(--desaga-heading, #14212b);
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 950;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .thread-header p {
    margin: 0.35rem 0 0;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
    font-size: 0.92rem;
  }

  .thread-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .icon-btn {
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    background: #fff;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.6));
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    display: grid;
    place-items: center;
  }

  .icon-btn:hover:not(:disabled) {
    color: var(--desaga-blue, #2699d6);
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.35);
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.07);
  }

  .counter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 34px;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.1);
    border: 1px solid rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.18);
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
    font-weight: 850;
    font-size: 0.85rem;
  }

  .counter-pill strong {
    color: var(--desaga-heading, #14212b);
    font-weight: 950;
  }

  .alert {
    margin: 12px;
    padding: 12px;
    border-radius: 12px;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #7f1d1d;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .admin-tools {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
    padding: 1rem 1rem 0;
  }

  .search-box {
    position: relative;
  }

  .search-box > i {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
  }

  .search-box input {
    padding-left: 2.25rem;
    padding-right: 2.25rem;
    border-radius: var(--desaga-radius-md, 12px);
    border-color: var(--desaga-border, rgba(0, 0, 0, 0.12));
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
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    justify-content: flex-end;
  }

  .filters button {
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    background: #fff;
    border-radius: 999px;
    padding: 0.42rem 0.65rem;
    color: rgba(20, 33, 43, 0.72);
    font-weight: 850;
    font-size: 0.9rem;
  }

  .filters button.active {
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.35);
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.1);
    color: var(--desaga-blue, #2699d6);
  }

  .list-summary {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
    font-size: 0.9rem;
    font-weight: 800;
  }

  .message-grid {
    display: grid;
    grid-template-columns: minmax(250px, 340px) minmax(0, 1fr);
    gap: 0;
    border-top: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
  }

  .user-grid {
    min-height: 560px;
  }

  .admin-grid {
    min-height: 650px;
  }

  .list-panel {
    border-right: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    overflow-y: auto;
    padding: 12px;
  }

  .admin-grid .list-panel {
    max-height: 650px;
  }

  .list-title {
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    color: var(--desaga-blue, #2699d6);
    margin: 12px 0 8px;
    letter-spacing: 0.5px;
  }

  .conv-btn,
  .conversation-btn {
    width: 100%;
    text-align: left;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    background: #fff;
    border-radius: var(--desaga-radius-md, 12px);
    padding: 0.75rem;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: inherit;
  }

  .conv-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .conv-btn:hover,
  .conv-btn.selected,
  .conversation-btn:hover,
  .conversation-btn:focus,
  .conversation-btn.selected {
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.42);
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.07);
  }

  .new-btn {
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.3);
    color: var(--desaga-blue, #2699d6);
    font-weight: 900;
  }

  .conv-title {
    min-width: 0;
    flex: 1;
    font-weight: 850;
    font-size: 0.9rem;
  }

  .conversation-btn__top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: start;
  }

  .conversation-btn__top strong,
  .conversation-btn__subject {
    color: var(--desaga-heading, #14212b);
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
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
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
    background: var(--desaga-red, #dc3545);
    color: #fff;
    font-size: 0.76rem;
    font-weight: 950;
  }

  .badge-light {
    font-size: 0.72rem;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.08);
    color: rgba(0, 0, 0, 0.62);
    border-radius: 999px;
    font-weight: 850;
    white-space: nowrap;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    display: inline-block;
    background: var(--desaga-muted, #64748b);
  }

  .status-open {
    background: var(--desaga-blue, #2699d6);
  }

  .status-closed {
    background: var(--desaga-green, #198754);
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

  .empty-msg {
    padding: 12px;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.5));
    font-size: 0.85rem;
  }

  .detail-panel {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    overflow: hidden;
    min-width: 0;
  }

  .detail-header,
  .admin-detail-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .detail-header h4 {
    margin: 0;
    color: var(--desaga-heading, #14212b);
    font-size: clamp(1.05rem, 2vw, 1.35rem);
    font-weight: 950;
  }

  .customer-line {
    margin-top: 0.45rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
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

  .muted {
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
    font-size: 0.85rem;
    margin-top: 4px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label,
  .reply-box label {
    display: block;
    font-size: 0.9rem;
    font-weight: 900;
    margin-bottom: 6px;
    color: var(--desaga-heading, #14212b);
  }

  .form-group .form-control,
  .reply-box textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.15));
    border-radius: var(--desaga-radius-md, 12px);
    font-size: 0.9rem;
  }

  .messages-scroll {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 0.25rem;
  }

  .admin-messages {
    max-height: 52vh;
  }

  .msg {
    max-width: min(760px, 92%);
    padding: 0.85rem;
    border-radius: var(--desaga-radius-md, 12px);
    font-size: 0.9rem;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
  }

  .msg-user {
    background: rgba(15, 23, 42, 0.04);
    justify-self: start;
    align-self: flex-start;
  }

  .msg-admin {
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.08);
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.16);
    justify-self: end;
    align-self: flex-end;
  }

  .msg-meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
    margin-bottom: 6px;
  }

  .msg-body {
    white-space: pre-wrap;
    word-break: break-word;
    color: rgba(20, 33, 43, 0.86);
    line-height: 1.45;
  }

  .reply-box {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
  }

  .reply-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .empty-thread,
  .detail-loading {
    flex: 1;
    min-height: 180px;
    display: grid;
    place-items: center;
    align-content: center;
    text-align: center;
    gap: 0.45rem;
    padding: 1rem;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.5));
  }

  .empty-thread.compact {
    min-height: 220px;
  }

  .empty-thread i {
    font-size: 2rem;
    color: var(--desaga-blue, #2699d6);
  }

  .empty-thread strong {
    color: var(--desaga-heading, #14212b);
  }

  .detail-empty {
    min-height: 420px;
  }

  .skeleton-card {
    height: 112px;
    border-radius: var(--desaga-radius-md, 12px);
    background: linear-gradient(90deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.05));
    background-size: 200% 100%;
    animation: shimmer 1.15s linear infinite;
    margin-bottom: 0.65rem;
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
    .admin-tools {
      grid-template-columns: 1fr;
    }

    .filters {
      justify-content: flex-start;
    }

    .message-grid {
      grid-template-columns: 1fr;
    }

    .list-panel {
      border-right: 0;
      border-bottom: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
      max-height: 320px;
    }

    .detail-header,
    .admin-detail-header {
      flex-direction: column;
      align-items: stretch;
    }

    .detail-actions,
    .status-actions {
      justify-content: flex-start;
      justify-items: start;
    }
  }

  @media (max-width: 575.98px) {
    .thread-header,
    .reply-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .thread-actions {
      justify-content: flex-start;
    }

    .reply-actions :global(.btn) {
      width: 100%;
    }

    .msg {
      max-width: 100%;
    }
  }
</style>

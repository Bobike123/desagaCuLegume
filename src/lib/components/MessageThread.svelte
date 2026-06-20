<script lang="ts">
  import { browser } from '$app/environment';
  import { formatMoney, statusLabel } from '$lib/format';
  import {
    normalizeSupportTopic,
    SUPPORT_TOPIC_META,
    SUPPORT_TOPICS,
    type SupportTopic,
  } from '$lib/support-messages';
  import {
    buildConversationItems,
    customerName,
    mapConversationDetail,
    normalizeStatus,
    normalizeText,
    topicMeta,
    type ConversationDetail,
    type ConversationListItem,
    type Mode,
    type OrderItem,
    type RawConversation,
  } from '$lib/message-thread';

  type ConversationStatus = 'ALL' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
  type ConversationView = 'main' | 'archive';
  type TopicFilter = 'ALL' | SupportTopic;


  export let mode: Mode = 'user';
  export let orders: OrderItem[] = [];
  export let expanded = true;
  export let collapsible = false;
  export let title = '';
  export let subtitle = '';
  export let ready = true;
  export let ordersReady = false;

  let items: ConversationListItem[] = [];
  let current: ConversationDetail | null = null;
  let selectedId = '';
  let selectedOrderId = '';
  let reply = '';
  let generalSubject = '';
  let newTopic: SupportTopic = 'GENERAL';
  let loading = false;
  let loadingCurrent = false;
  let reloading = false;
  let sending = false;
  let updatingStatus = false;
  let error = '';
  let q = '';
  let statusFilter: ConversationStatus = 'ALL';
  let topicFilter: TopicFilter = 'ALL';
  let conversationView: ConversationView = 'main';
  let clientFilter = '';
  let hasLoaded = false;

  const FETCH_TIMEOUT_MS = 15_000;

  const statusFilters: Array<{ value: ConversationStatus; label: string }> = [
    { value: 'ALL', label: 'Toate' },
    { value: 'OPEN', label: 'Deschise' },
    { value: 'CLOSED', label: 'Închise' },
  ];

  const topicFilters: Array<{ value: TopicFilter; label: string }> = [
    { value: 'ALL', label: 'Toate' },
    ...SUPPORT_TOPICS.map((topic) => ({
      value: topic,
      label: SUPPORT_TOPIC_META[topic].shortLabel,
    })),
  ];

  const userTopicOptions = SUPPORT_TOPICS.map((topic) => ({
    value: topic,
    label: SUPPORT_TOPIC_META[topic].label,
  }));

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


  async function fetchJson(path: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(path, {
        ...options,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    } finally {
      window.clearTimeout(timeout);
    }
  }


  async function loadOrders() {
    if (mode === 'admin') return;
    if (ordersReady) return;

    const { res, data } = await fetchJson('/api/orders?limit=100');
    if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
    orders = Array.isArray(data?.items) ? data.items : [];
  }

  async function loadMessages() {
    const { res, data } = await fetchJson('/api/messages?limit=50');
    if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');
    const rawConversations: RawConversation[] = Array.isArray(data?.items) ? data.items : [];
    items = buildConversationItems(rawConversations, mode, orders);
  }

  async function loadList() {
    if (loading || !ready) return;

    loading = true;
    hasLoaded = true;
    error = '';

    try {
      if (mode === 'admin') {
        await loadMessages();
      } else {
        await loadOrders();
        await loadMessages();
      }

      const selectableItems = items.filter((item: ConversationListItem) =>
        conversationView === 'archive' ? isConversationArchived(item) : !isConversationArchived(item)
      );

      if (selectedId && !selectableItems.some((item: ConversationListItem) => item.id === selectedId)) {
        selectedId = '';
        selectedOrderId = '';
        current = null;
      }

      if (!selectedId && !selectedOrderId && selectableItems.length > 0) {
        selectedId = selectableItems[0].id;
        selectedOrderId = selectableItems[0].order?.id ?? '';
      }

      if (selectedId) {
        await loadConversation(selectedId);
      } else if (mode === 'user' && selectedOrderId) {
        const selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId);
        if (selectedOrder) selectOrderWithoutConversation(selectedOrder);
      } else if (mode === 'user' && conversationView === 'main') {
        selectGeneralNew();
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      const loadError = aborted ? 'Încărcarea mesajelor a durat prea mult. Reîncearcă.' : err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
      if (mode === 'user') {
        selectGeneralNew();
        error = loadError;
      } else {
        error = loadError;
        current = null;
      }
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
    selectedOrderId = selected?.order?.id ?? selected?.orderId ?? '';

    try {
      const { res, data } = await fetchJson(`/api/messages/${id}`);
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca conversația.');

      current = mapConversationDetail(data.item);

      await fetchJson(`/api/messages/${id}`, {
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
      const { res, data } = await fetchJson('/api/messages?limit=50');
      if (res.ok) {
        const rawConversations: RawConversation[] = Array.isArray(data?.items) ? data.items : [];
        items = buildConversationItems(rawConversations, mode, orders);
      }
      return;
    }

    const [ordersResult, messagesResult] = await Promise.all([
      ordersReady ? Promise.resolve(null) : fetchJson('/api/orders?limit=100'),
      fetchJson('/api/messages?limit=50'),
    ]);

    if (ordersResult?.res.ok) {
      orders = Array.isArray(ordersResult.data?.items) ? ordersResult.data.items : [];
    }

    if (messagesResult.res.ok) {
      const rawConversations: RawConversation[] = Array.isArray(messagesResult.data?.items) ? messagesResult.data.items : [];
      items = buildConversationItems(rawConversations, mode, orders);
    }
  }

  async function sendReply() {
    if (!selectedId || !reply.trim() || sending) return;
    if (isConversationReadOnly(current)) return;

    sending = true;
    error = '';

    try {
      const { res, data } = await fetchJson(`/api/messages/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
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
      const { res, data } = await fetchJson(`/api/messages/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
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
    newTopic = 'ORDER';
    current = {
      id: '',
      subject: `Comandă #${order.orderNumber}`,
      status: 'OPEN',
      topic: 'ORDER',
      orderId: order.id,
      order,
      user: null,
      closedAt: null,
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
    newTopic = 'GENERAL';
    current = {
      id: '',
      subject: generalSubject.trim() || topicMeta(newTopic).label,
      status: 'OPEN',
      topic: newTopic,
      orderId: null,
      order: null,
      user: null,
      closedAt: null,
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
      const topic = selectedOrder ? newTopic : normalizeSupportTopic(newTopic);
      const subject = selectedOrder ? `Comandă #${selectedOrder.orderNumber}` : generalSubject.trim();
      const { res, data } = await fetchJson('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message: reply,
          topic,
          orderId: selectedOrder?.id ?? null,
        }),
      });
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
    if (normalized === 'SYSTEM') return 'Sistem';
    if (mode === 'admin') return normalized === 'ADMIN' ? 'Admin' : 'Client';
    return normalized === 'ADMIN' ? 'Admin' : 'Tu';
  }

  function messageClass(senderType: string) {
    const normalized = normalizeStatus(senderType);
    if (normalized === 'SYSTEM') return 'msg-system';
    const isOwnMessage = mode === 'admin' ? normalized === 'ADMIN' : normalized === 'USER';
    return isOwnMessage ? 'msg-own' : 'msg-other';
  }

  function isConversationArchived(item: ConversationListItem | ConversationDetail | null) {
    return normalizeStatus(item?.status) === 'ARCHIVED';
  }

  function isConversationReadOnly(item: ConversationDetail | null) {
    const status = normalizeStatus(item?.status);
    return Boolean(item?.id) && (status === 'CLOSED' || status === 'ARCHIVED');
  }

  function readOnlyMessage(item: ConversationDetail | null) {
    if (normalizeStatus(item?.status) === 'ARCHIVED') {
      return 'Această conversație este arhivată și poate fi doar citită.';
    }
    return 'Această conversație este închisă. Nu mai poți trimite mesaje.';
  }

  function switchConversationView(view: ConversationView) {
    conversationView = view;
    selectedId = '';
    selectedOrderId = '';
    current = null;
    reply = '';
  }

  function orderConversation(orderId: string) {
    return items.find((item: ConversationListItem) => item.order?.id === orderId) ?? null;
  }

  $: selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId) ?? null;
  $: currentOrder = selectedOrder ?? current?.order ?? null;
  $: searchNeedle = normalizeText(q.trim());
  $: mainItems = items.filter((item: ConversationListItem) => !isConversationArchived(item));
  $: archivedItems = items.filter((item: ConversationListItem) => isConversationArchived(item));
  $: sourceItems = conversationView === 'archive' ? archivedItems : mainItems;
  $: generalConversations = sourceItems.filter((item: ConversationListItem) => item.kind === 'general');
  $: openCount = mainItems.filter((item: ConversationListItem) => normalizeStatus(item.status) === 'OPEN').length;
  $: archiveCount = archivedItems.length;
  $: unreadCount = items.reduce((sum: number, item: ConversationListItem) => sum + Number(item.unreadCount ?? 0), 0);

  $: clientList = (() => {
    const map = new Map<string, { email: string; fullName: string | null; count: number; unread: number }>();
    for (const item of sourceItems) {
      const email = item.user?.email;
      if (!email) continue;
      const existing = map.get(email);
      if (existing) {
        existing.count++;
        existing.unread += item.unreadCount;
      } else {
        map.set(email, { email, fullName: item.user?.fullName ?? null, count: 1, unread: item.unreadCount });
      }
    }
    return [...map.values()].sort((a, b) => b.unread - a.unread || a.email.localeCompare(b.email));
  })();

  $: filteredItems = sourceItems.filter((item: ConversationListItem) => {
    if (mode === 'admin' && clientFilter && item.user?.email !== clientFilter) return false;

    const matchesStatus =
      conversationView === 'archive' ||
      statusFilter === 'ALL' ||
      normalizeStatus(item.status) === statusFilter;
    const matchesTopic = topicFilter === 'ALL' || item.topic === topicFilter;
    if (!searchNeedle) return matchesStatus && matchesTopic;

    const haystack = normalizeText(
      `${item.subject} ${item.order?.orderNumber ?? ''} ${item.user?.fullName ?? ''} ${item.user?.email ?? ''} ${item.user?.phone ?? ''} ${statusLabel(item.status)} ${item.lastMessage?.body ?? ''}`
    );

    return matchesStatus && matchesTopic && haystack.includes(searchNeedle);
  });

  $: filteredOrders = orders.filter((order: OrderItem) => {
    if (conversationView === 'archive') return false;
    if (!searchNeedle) return true;
    return normalizeText(
      `${order.orderNumber} ${statusLabel(order.status)} ${statusLabel(order.paymentStatus)} ${statusLabel(order.fulfillmentStatus)} ${formatMoney(order.total, order.currency)}`
    ).includes(searchNeedle);
  });

  $: readOnlyCurrent = isConversationReadOnly(current);

  $: resolvedTitle = title || (mode === 'admin' ? 'Mesaje clienți' : 'Mesaje și suport');
  $: resolvedSubtitle = subtitle || (mode === 'admin' ? 'Conversații dintre utilizatori și administratori.' : 'Scrie adminului despre comenzi, stoc sau livrare.');

  $: if (browser && expanded && ready && !hasLoaded && !loading) {
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
        <div class="view-tabs" aria-label="Tip conversații">
          <button
            type="button"
            class:active={conversationView === 'main'}
            aria-pressed={conversationView === 'main'}
            on:click={() => switchConversationView('main')}
          >
            Conversații <span>{mainItems.length}</span>
          </button>
          <button
            type="button"
            class:active={conversationView === 'archive'}
            aria-pressed={conversationView === 'archive'}
            on:click={() => switchConversationView('archive')}
          >
            Arhivă <span>{archiveCount}</span>
          </button>
        </div>

        <div class="search-box">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            class="form-control"
            type="search"
            placeholder={conversationView === 'archive' ? 'Caută în arhivă…' : 'Caută client, email, subiect…'}
            bind:value={q}
          />
          {#if q.trim()}
            <button type="button" aria-label="Șterge căutarea" on:click={() => (q = '')}>
              <i class="bi bi-x-lg"></i>
            </button>
          {/if}
        </div>

        <div class="filters-row">
          {#if clientList.length > 0}
            <select
              class="client-select"
              class:has-filter={!!clientFilter}
              bind:value={clientFilter}
              on:change={() => { selectedId = ''; current = null; }}
              aria-label="Filtrează după client"
            >
              <option value="">Toți clienții ({sourceItems.length})</option>
              {#each clientList as client (client.email)}
                <option value={client.email}>{client.fullName ?? client.email} ({client.count})</option>
              {/each}
            </select>
          {/if}

          <select class="client-select" bind:value={topicFilter} aria-label="Filtrează după tip conversație">
            {#each topicFilters as filter (filter.value)}
              <option value={filter.value}>{filter.label}</option>
            {/each}
          </select>

          {#if conversationView === 'main'}
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
          {/if}
        </div>
      </div>

      <div class="list-summary">
        <span>{loading ? 'Se încarcă…' : clientFilter ? `${filteredItems.length} conversații client` : `${filteredItems.length} conversații`}</span>
        <span>{loading ? '' : conversationView === 'archive' ? `${archiveCount} arhivate` : `${openCount} deschise`}</span>
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

                <div class="conversation-btn__subject">
                  {item.order?.orderNumber ? `Comanda #${item.order.orderNumber}` : item.subject}
                </div>

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
                <h4>{current.order?.orderNumber ? `Comanda #${current.order.orderNumber}` : current.subject}</h4>
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
                  <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('OPEN')} disabled={updatingStatus}>Deschisă</button>
                  <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('CLOSED')} disabled={updatingStatus}>Închisă</button>
                  <button class="btn btn-sm btn-outline-accent" type="button" on:click={() => updateStatus('ARCHIVED')} disabled={updatingStatus}>Arhivată</button>
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
                  <div class={`msg ${messageClass(msg.senderType)}`}>
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
              {#if readOnlyCurrent}
                <div class="readonly-note" role="status">
                  <i class="bi bi-lock"></i>
                  <span>{readOnlyMessage(current)}</span>
                </div>
              {/if}
              <textarea
                id="admin-reply"
                class="form-control"
                rows="4"
                bind:value={reply}
                placeholder="Scrie un răspuns clar pentru client…"
                disabled={sending || readOnlyCurrent}
              ></textarea>
              <div class="reply-actions">
                <span class="muted">{reply.trim().length} caractere</span>
                <button class="btn btn-accent" type="button" on:click={sendReply} disabled={sending || readOnlyCurrent || !reply.trim()}>
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
        <div class="user-tools">
          <div class="view-tabs" aria-label="Tip conversații">
            <button
              type="button"
              class:active={conversationView === 'main'}
              aria-pressed={conversationView === 'main'}
              on:click={() => switchConversationView('main')}
            >
              Conversații <span>{mainItems.length}</span>
            </button>
            <button
              type="button"
              class:active={conversationView === 'archive'}
              aria-pressed={conversationView === 'archive'}
              on:click={() => switchConversationView('archive')}
            >
              Arhivă <span>{archiveCount}</span>
            </button>
          </div>

          <div class="search-box">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input
              class="form-control"
              type="search"
              placeholder={conversationView === 'archive' ? 'Caută în arhivă…' : 'Caută conversații sau comenzi…'}
              bind:value={q}
            />
            {#if q.trim()}
              <button type="button" aria-label="Șterge căutarea" on:click={() => (q = '')}>
                <i class="bi bi-x-lg"></i>
              </button>
            {/if}
          </div>
        </div>

        <div class="message-grid user-grid">
          <aside class="list-panel" aria-label="Lista conversațiilor">
            {#if conversationView === 'archive'}
              <div class="list-title">Arhivă</div>
              {#if filteredItems.length === 0}
                <div class="empty-msg">Nu există conversații arhivate pentru căutarea curentă.</div>
              {:else}
                {#each filteredItems as item (item.id)}
                  <button
                    class:selected={selectedId === item.id}
                    class="conv-btn"
                    type="button"
                    on:click={() => selectConversation(item.id)}
                  >
                    <span class="conv-title">{item.order?.orderNumber ? `#${item.order.orderNumber}` : item.subject}</span>
                    <span class="badge-light">Arhivat</span>
                  </button>
                {/each}
              {/if}
            {:else}
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
              {#if filteredOrders.length === 0}
                <div class="empty-msg">{q.trim() ? 'Nu există comenzi pentru căutarea curentă.' : 'Nu ai comenzi.'}</div>
              {:else}
                {#each filteredOrders as order (order.id)}
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
            {/if}
          </aside>

          <section class="detail-panel" aria-label="Detalii conversație">
            {#if current}
              <div class="detail-header">
                <div>
                  <h4>{current.subject}</h4>
                  {#if currentOrder}
                    <p class="muted">{currentOrder.orderNumber} · {formatMoney(currentOrder.total, currentOrder.currency)}</p>
                  {:else}
                    <p class="muted">Mesaj general</p>
                  {/if}
                </div>
                {#if readOnlyCurrent}
                  <span class={`status-pill status-${normalizeStatus(current.status).toLowerCase()}`}>
                    {statusLabel(current.status)}
                  </span>
                {/if}
              </div>

              {#if !selectedId && !selectedOrder}
                <div class="form-group">
                  <label for="msg-subject">Subiect</label>
                  <input id="msg-subject" class="form-control" bind:value={generalSubject} />
                </div>
                <div class="form-group">
                  <label for="msg-topic">Tip mesaj</label>
                  <select id="msg-topic" class="form-control" bind:value={newTopic}>
                    {#each userTopicOptions as option (option.value)}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
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
                    <div class={`msg ${messageClass(msg.senderType)}`}>
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
                {#if readOnlyCurrent}
                  <div class="readonly-note" role="status">
                    <i class="bi bi-lock"></i>
                    <span>{readOnlyMessage(current)}</span>
                  </div>
                {/if}
                <textarea
                  id="reply-msg"
                  class="form-control"
                  rows="3"
                  bind:value={reply}
                  placeholder={selectedId ? 'Scrie răspuns...' : 'Scrie mesaj...'}
                  disabled={sending || readOnlyCurrent}
                ></textarea>
                <div class="reply-actions">
                  <span class="muted">{reply.trim().length} caractere</span>
                  <button class="btn btn-accent" type="button" on:click={submitMessage} disabled={sending || readOnlyCurrent || !reply.trim()}>
                    <i class={`bi ${sending ? 'bi-arrow-repeat spin' : 'bi-send'}`}></i>
                    {sending ? 'Se trimite...' : 'Trimite'}
                  </button>
                </div>
              </div>
            {:else}
              <div class="empty-thread detail-empty">
                <i class="bi bi-arrow-left"></i>
                <strong>Selectează o conversație.</strong>
                <span>{conversationView === 'archive' ? 'Arhiva este disponibilă doar pentru citire.' : 'Sau începe un mesaj nou.'}</span>
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
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1rem 1rem 0;
  }

  .user-tools {
    display: grid;
    gap: 0.65rem;
    padding: 1rem;
    border-bottom: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
  }

  .view-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .view-tabs button {
    min-height: 36px;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.1));
    border-radius: 999px;
    padding: 0 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: #fff;
    color: rgba(20, 33, 43, 0.72);
    font-weight: 900;
    cursor: pointer;
  }

  .view-tabs button span {
    min-width: 22px;
    min-height: 22px;
    padding: 0 0.4rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.08);
    font-size: 0.78rem;
  }

  .view-tabs button.active {
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.36);
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.1);
    color: var(--desaga-blue, #2699d6);
  }

  .filters-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: center;
  }

  .client-select {
    height: 36px;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
    border-radius: 999px;
    padding: 0 0.85rem;
    font-weight: 850;
    font-size: 0.9rem;
    color: rgba(20, 33, 43, 0.72);
    background: #fff;
    cursor: pointer;
  }

  .client-select.has-filter {
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.35);
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.1);
    color: var(--desaga-blue, #2699d6);
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
  .form-group select,
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

  .msg-other {
    background: rgba(15, 23, 42, 0.04);
    align-self: flex-start;
  }

  .msg-own {
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.08);
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.16);
    align-self: flex-end;
  }

  .msg-system {
    max-width: min(640px, 94%);
    align-self: center;
    text-align: center;
    background: rgba(100, 116, 139, 0.08);
    color: rgba(20, 33, 43, 0.72);
  }

  .msg-system .msg-meta {
    justify-content: center;
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

  .readonly-note {
    margin-bottom: 0.75rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba(100, 116, 139, 0.22);
    border-radius: var(--desaga-radius-md, 12px);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(100, 116, 139, 0.08);
    color: rgba(20, 33, 43, 0.72);
    font-size: 0.9rem;
    font-weight: 850;
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

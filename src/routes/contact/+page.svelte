<script lang="ts">
  import { onMount } from 'svelte';
  import Hero from '$lib/components/Hero.svelte';
  import { auth } from '$lib/stores/auth';

  type OrderItem = {
    id: string;
    orderNumber: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
    placedAt?: string | null;
  };

  type ConversationListItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    updatedAt: string;
    order: OrderItem;
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

  let orders: OrderItem[] = [];
  let items: ConversationListItem[] = [];
  let current: ConversationDetail | null = null;
  let selectedId = '';
  let selectedOrderId = '';
  let reply = '';
  let loading = true;
  let error = '';
  let creating = false;

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function normalizeStatus(value: string | null | undefined) {
    return String(value ?? '—').replaceAll('_', ' ');
  }

  function conversationMatchesOrder(conversation: any, order: OrderItem) {
    const subject = String(conversation?.subject ?? '').toLowerCase();
    const orderNumber = String(order.orderNumber ?? '').toLowerCase();
    const orderId = String(order.id ?? '').toLowerCase();

    return Boolean(orderNumber && subject.includes(orderNumber)) || Boolean(orderId && subject.includes(orderId));
  }

  function buildConversationItems(rawConversations: any[]) {
    const mapped: ConversationListItem[] = [];

    for (const order of orders) {
      const matching = rawConversations.filter((conversation) => conversationMatchesOrder(conversation, order));

      for (const conversation of matching) {
        mapped.push({
          id: String(conversation.id),
          subject: String(conversation.subject ?? `Comandă ${order.orderNumber}`),
          status: String(conversation.status ?? 'OPEN'),
          unreadCount: Number(conversation.unreadCount ?? 0),
          updatedAt: String(conversation.updatedAt ?? conversation.createdAt ?? order.createdAt),
          order,
          lastMessage: conversation.lastMessage
            ? {
                body: String(conversation.lastMessage.body ?? ''),
                senderType: String(conversation.lastMessage.senderType ?? ''),
                createdAt: String(conversation.lastMessage.createdAt ?? ''),
              }
            : null,
        });
      }
    }

    mapped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return mapped;
  }

  async function loadOrders() {
    const res = await fetch('/api/orders');
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
    }

    orders = Array.isArray(data?.items) ? data.items : [];
  }

  async function loadList() {
    loading = true;
    error = '';

    try {
      await loadOrders();

      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');
      }

      const rawConversations = Array.isArray(data?.items) ? data.items : [];
      items = buildConversationItems(rawConversations);

      if (!selectedId && items.length > 0) {
        selectedId = items[0].id;
        selectedOrderId = items[0].order.id;
      }

      if (selectedId) {
        await loadConversation(selectedId);
      } else {
        current = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
    } finally {
      loading = false;
    }
  }

  async function loadConversation(id: string) {
    selectedId = id;

    const selected = items.find((item) => item.id === id);
    selectedOrderId = selected?.order.id ?? selectedOrderId;

    const res = await fetch(`/api/messages/${id}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error ?? 'Nu am putut încărca conversația.');
    }

    current = data.item;

    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markRead: true }),
    });

    await refreshListSilent();
  }

  async function refreshListSilent() {
    const [ordersRes, messagesRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/messages'),
    ]);

    const ordersData = await ordersRes.json().catch(() => ({}));
    const messagesData = await messagesRes.json().catch(() => ({}));

    if (ordersRes.ok) {
      orders = Array.isArray(ordersData?.items) ? ordersData.items : [];
    }

    if (messagesRes.ok) {
      const rawConversations = Array.isArray(messagesData?.items) ? messagesData.items : [];
      items = buildConversationItems(rawConversations);
    }
  }

  async function sendReply() {
    if (!selectedId || !reply.trim()) return;

    const res = await fetch(`/api/messages/${selectedId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: reply }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      error = data?.error ?? 'Nu am putut trimite răspunsul.';
      return;
    }

    reply = '';
    await loadConversation(selectedId);
  }

  function selectOrderWithoutConversation(order: OrderItem) {
    selectedOrderId = order.id;
    selectedId = '';
    current = {
      id: '',
      subject: `Comandă ${order.orderNumber}`,
      status: order.status,
      user: null,
      messages: [],
    };
    reply = '';
    error = '';
  }

  async function createConversationForOrder() {
    if (!selectedOrderId || !reply.trim()) return;

    creating = true;
    error = '';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          message: reply,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Nu am putut crea conversația.');
      }

      reply = '';
      await loadList();

      if (data?.item?.id) {
        await loadConversation(String(data.item.id));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut crea conversația.';
    } finally {
      creating = false;
    }
  }

  function orderHasConversation(order: OrderItem) {
    return items.some((item) => item.order.id === order.id);
  }

  function conversationsForOrder(order: OrderItem) {
    return items.filter((item) => item.order.id === order.id);
  }

  async function submitMessage() {
    if (selectedId) {
      await sendReply();
    } else {
      await createConversationForOrder();
    }
  }

  onMount(async () => {
    await auth.refresh();

    if ($auth.isAuthenticated && !$auth.isAdmin) {
      await loadList();
    } else {
      loading = false;
    }
  });

  $: selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
</script>

<svelte:head>
  <title>Contact - Mesaje comenzi</title>
</svelte:head>

<Hero
  title="Contact"
  subtitle="Conversații despre comenzile tale"
  backgroundImage=""
  height="300px"
/>

<div class="page">
  <div class="page__head">
    <div>
      <h1>Mesaje</h1>
      <p>Conversații despre comenzile tale.</p>
    </div>

    {#if $auth.isAuthenticated && !$auth.isAdmin}
      <button class="btn btn-outline-secondary" on:click={loadList} disabled={loading}>Reîncarcă</button>
    {/if}
  </div>

  {#if error}<div class="alert alert-danger">{error}</div>{/if}

  {#if $auth.loading || loading}
    <div class="panel">Se încarcă conversațiile…</div>
  {:else if !$auth.isAuthenticated}
    <div class="panel">
      <h2 class="h5 fw-bold">Autentificare necesară</h2>
      <p class="muted mb-3">Conversațiile despre comenzi sunt disponibile după autentificare.</p>
      <a class="btn btn-primary" href="/cos">Mergi la cont și coș</a>
    </div>
  {:else if $auth.isAdmin}
    <div class="panel">
      <h2 class="h5 fw-bold">Panou administrator</h2>
      <p class="muted mb-3">Administratorii folosesc panoul de mesaje.</p>
      <a class="btn btn-primary" href="/admin/messages">Deschide mesajele</a>
    </div>
  {:else}
    <div class="grid">
      <div class="panel listPanel">
        {#if orders.length === 0}
          <div>Nu ai comenzi încă.</div>
        {:else}
          {#each orders as order (order.id)}
            <div class="orderGroup">
              <button
                class:selected={selectedOrderId === order.id && !selectedId}
                class="conversationBtn orderOnlyBtn"
                on:click={() => selectOrderWithoutConversation(order)}
              >
                <div class="conversationBtn__top">
                  <strong>{order.orderNumber}</strong>
                  <span class="badge text-bg-light">{normalizeStatus(order.status)}</span>
                </div>
                <div class="conversationBtn__subject">
                  {formatMoney(order.total, order.currency)}
                </div>
                <div class="conversationBtn__message">
                  {formatDate(order.createdAt)}
                </div>
              </button>

              {#if orderHasConversation(order)}
                {#each conversationsForOrder(order) as item (item.id)}
                  <button
                    class:selected={selectedId === item.id}
                    class="conversationBtn"
                    on:click={() => loadConversation(item.id)}
                  >
                    <div class="conversationBtn__top">
                      <strong>{item.subject}</strong>
                      {#if item.unreadCount > 0}<span class="badge text-bg-danger">{item.unreadCount}</span>{/if}
                    </div>
                    <div class="conversationBtn__subject">{item.status}</div>
                    {#if item.lastMessage}
                      <div class="conversationBtn__message">{item.lastMessage.body}</div>
                    {:else}
                      <div class="conversationBtn__message">Fără mesaje.</div>
                    {/if}
                  </button>
                {/each}
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <div class="panel detailPanel">
        {#if current}
          <div class="detailHead">
            <div>
              <h2>{current.subject}</h2>
              {#if selectedOrder}
                <div class="muted">
                  {selectedOrder.orderNumber} · {formatMoney(selectedOrder.total, selectedOrder.currency)}
                </div>
                <div class="muted">
                  {normalizeStatus(selectedOrder.status)} · {formatDate(selectedOrder.createdAt)}
                </div>
              {/if}
            </div>

            <div class="detailActions">
              <span class="badge text-bg-light">{current.status || selectedOrder?.status || 'OPEN'}</span>
            </div>
          </div>

          <div class="messages">
            {#if current.messages.length === 0}
              <div class="muted">Nu există mesaje pentru această comandă. Scrie primul mesaj.</div>
            {:else}
              {#each current.messages as message (message.id)}
                <div class={`message ${message.senderType === 'ADMIN' ? 'message--admin' : 'message--user'}`}>
                  <div class="message__meta">
                    {message.senderType === 'ADMIN' ? 'ADMIN' : 'TU'}
                    · {new Date(message.createdAt).toLocaleString('ro-RO')}
                  </div>
                  <div>{message.body}</div>
                </div>
              {/each}
            {/if}
          </div>

          <div class="replyBox">
            <textarea
              class="form-control"
              rows="4"
              bind:value={reply}
              placeholder={selectedId ? 'Scrie răspunsul tău...' : 'Scrie mesajul despre această comandă...'}
              disabled={creating}
            ></textarea>
            <div class="replyActions">
              <button class="btn btn-primary" on:click={submitMessage} disabled={creating || !reply.trim()}>
                {#if creating}
                  Se trimite…
                {:else if selectedId}
                  Trimite răspuns
                {:else}
                  Creează conversație
                {/if}
              </button>
            </div>
          </div>
        {:else}
          <div>Selectează o comandă sau o conversație.</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__head {
    max-width: 1180px;
    margin: 0 auto 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .page__head h1 {
    margin: 0;
    font-weight: 900;
    color: var(--desaga-brown);
  }

  .page__head p {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.65);
  }

  .alert {
    max-width: 1180px;
    margin-left: auto;
    margin-right: auto;
  }

  .grid {
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 16px;
  }

  .panel {
    max-width: 1180px;
    margin-left: auto;
    margin-right: auto;
    background: white;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .grid .panel {
    max-width: none;
    margin: 0;
  }

  .listPanel {
    display: grid;
    gap: 10px;
    align-content: start;
    max-height: calc(100vh - 120px);
    overflow: auto;
  }

  .orderGroup {
    display: grid;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .orderGroup:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .conversationBtn {
    text-align: left;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    border-radius: 14px;
    padding: 12px;
  }

  .conversationBtn.selected {
    border-color: rgba(38, 153, 214, 0.45);
    background: rgba(38, 153, 214, 0.06);
  }

  .orderOnlyBtn {
    background: rgba(0, 0, 0, 0.018);
  }

  .conversationBtn__top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .conversationBtn__subject {
    margin-top: 6px;
    font-weight: 700;
  }

  .conversationBtn__message {
    margin-top: 6px;
    color: rgba(0, 0, 0, 0.65);
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
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--desaga-brown);
  }

  .detailActions {
    display: flex;
    gap: 8px;
    align-items: start;
  }

  .messages {
    display: grid;
    gap: 12px;
    max-height: 55vh;
    overflow: auto;
    padding-right: 4px;
  }

  .message {
    padding: 12px;
    border-radius: 14px;
    white-space: pre-wrap;
  }

  .message--user {
    background: rgba(0, 0, 0, 0.04);
  }

  .message--admin {
    background: rgba(38, 153, 214, 0.08);
  }

  .message__meta {
    font-size: 0.82rem;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 6px;
  }

  .replyBox {
    margin-top: 16px;
  }

  .replyActions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .muted {
    color: rgba(0, 0, 0, 0.65);
  }

  @media (max-width: 992px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
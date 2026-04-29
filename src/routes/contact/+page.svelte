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

  type RawConversation = {
    id?: unknown;
    subject?: unknown;
    status?: unknown;
    unreadCount?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    lastMessage?: {
      body?: unknown;
      senderType?: unknown;
      createdAt?: unknown;
    } | null;
  };

  type ConversationListItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    updatedAt: string;
    order: OrderItem | null;
    kind: 'order' | 'general';
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

  const phoneHref = 'tel:+40729969822';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';
  const mapSrc =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2733.2627958985477!2d23.613140411901085!3d46.759716245953896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47490c49b6ff9853%3A0x2cdb1ae569801b0b!2sStrada%20Constantin%20Br%C3%A2ncu%C8%99i%20153%2C%20Cluj-Napoca%20400645%2C%20Rom%C3%A2nia!5e0!3m2!1sro!2sdk!4v1765492717214!5m2!1sro!2sdk';

  let orders: OrderItem[] = [];
  let items: ConversationListItem[] = [];
  let current: ConversationDetail | null = null;
  let selectedId = '';
  let selectedOrderId = '';
  let reply = '';
  let generalSubject = 'Întrebare generală';
  let loading = true;
  let reloading = false;
  let sending = false;
  let error = '';

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
    return String(value ?? '—').replaceAll('_', ' ').toLowerCase();
  }

  function readString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : value == null ? fallback : String(value);
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
    const mapped: ConversationListItem[] = [];
    const matchedConversationIds = new Set<string>();

    for (const order of orders) {
      const matching = rawConversations.filter((conversation: RawConversation) => conversationMatchesOrder(conversation, order));

      for (const conversation of matching) {
        const item = mapConversation(conversation, order);
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
    const res = await fetch('/api/orders');
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
    }

    orders = Array.isArray(data?.items) ? data.items : [];
  }

  async function loadMessages() {
    const res = await fetch('/api/messages');
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');
    }

    const rawConversations: RawConversation[] = Array.isArray(data?.items) ? data.items : [];
    items = buildConversationItems(rawConversations);
  }

  async function loadList() {
    loading = true;
    error = '';

    try {
      await Promise.all([loadOrders(), loadMessages()]);

      if (!selectedId && !selectedOrderId && items.length > 0) {
        selectedId = items[0].id;
        selectedOrderId = items[0].order?.id ?? '';
      }

      if (selectedId) {
        await loadConversation(selectedId);
      } else if (selectedOrderId) {
        const selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId);
        if (selectedOrder) selectOrderWithoutConversation(selectedOrder);
      } else {
        selectGeneralNew();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
      current = null;
    } finally {
      loading = false;
    }
  }

  async function reloadList() {
    reloading = true;
    try {
      await loadList();
    } finally {
      reloading = false;
    }
  }

  async function loadConversation(id: string) {
    selectedId = id;

    const selected = items.find((item: ConversationListItem) => item.id === id);
    selectedOrderId = selected?.order?.id ?? '';

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

  async function selectConversation(id: string) {
    error = '';
    try {
      await loadConversation(id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca conversația.';
    }
  }

  async function refreshListSilent() {
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
    if (!selectedId || !reply.trim()) return;

    sending = true;
    error = '';

    try {
      const res = await fetch(`/api/messages/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Nu am putut trimite răspunsul.');
      }

      reply = '';
      await loadConversation(selectedId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut trimite răspunsul.';
    } finally {
      sending = false;
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
    if (!reply.trim()) return;

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

      if (!res.ok) {
        throw new Error(data?.error ?? 'Nu am putut crea conversația.');
      }

      reply = '';
      await refreshListSilent();

      if (data?.item?.id) {
        await loadConversation(String(data.item.id));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut crea conversația.';
    } finally {
      sending = false;
    }
  }

  function orderHasConversation(order: OrderItem) {
    return items.some((item: ConversationListItem) => item.order?.id === order.id);
  }

  function conversationsForOrder(order: OrderItem) {
    return items.filter((item: ConversationListItem) => item.order?.id === order.id);
  }

  async function submitMessage() {
    if (selectedId) {
      await sendReply();
    } else {
      await createConversation();
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

  $: selectedOrder = orders.find((order: OrderItem) => order.id === selectedOrderId) ?? null;
  $: generalConversations = items.filter((item: ConversationListItem) => item.kind === 'general');
</script>

<svelte:head>
  <title>Contact - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Contact DeSaga cu Legume: telefon, adresă, program, hartă și mesaje despre comenzi."
  />
</svelte:head>

<Hero
  title="Contact DeSaga"
  subtitle="Sună pentru stocul de azi sau trimite un mesaj despre comandă"
  backgroundImage=""
  height="300px"
/>

<section class="contact-page">
  <div class="container">
    <div class="contact-grid">
      <section class="contact-card contact-card-primary" aria-labelledby="contact-direct-title">
        <div class="card-icon"><i class="bi bi-telephone-fill"></i></div>
        <div>
          <h2 id="contact-direct-title">Contact rapid</h2>
          <p>Pentru stocul disponibil azi, comenzi rapide sau detalii despre ridicare.</p>
          <div class="action-row">
            <a class="btn btn-accent" href={phoneHref}>
              <i class="bi bi-telephone-fill"></i> Sună acum
            </a>
            <a class="btn btn-outline-accent" href="/produse">
              <i class="bi bi-basket"></i> Vezi produsele
            </a>
          </div>
        </div>
      </section>

      <section class="contact-card" aria-labelledby="location-title">
        <div class="card-icon"><i class="bi bi-geo-alt-fill"></i></div>
        <div>
          <h2 id="location-title">Rulota DeSaga</h2>
          <p>Cluj-Napoca, Str. Constantin Brâncuși nr. 153</p>
          <p class="muted mb-0">Program: L–V, 9:00–18:00</p>
        </div>
      </section>

      <section class="contact-card" aria-labelledby="social-title">
        <div class="card-icon"><i class="bi bi-chat-dots-fill"></i></div>
        <div>
          <h2 id="social-title">Urmărește noutățile</h2>
          <p>Stocul se schimbă în funcție de recoltă și cerere.</p>
          <div class="social-row">
            <a href={facebookHref} target="_blank" rel="noopener noreferrer"><i class="bi bi-facebook"></i> Facebook</a>
            <a href={instagramHref} target="_blank" rel="noopener noreferrer"><i class="bi bi-instagram"></i> Instagram</a>
          </div>
        </div>
      </section>
    </div>

    <div class="map-panel">
      <iframe
        src={mapSrc}
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Harta DeSaga cu Legume"
      ></iframe>
    </div>

    <section class="messages-shell" aria-labelledby="messages-title">
      <div class="messages-head">
        <div>
          <span class="eyebrow">Mesaje</span>
          <h2 id="messages-title">Conversații despre comenzi</h2>
          <p>Autentificarea este necesară ca mesajele să fie legate de comenzile tale.</p>
        </div>

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <button class="btn btn-outline-accent" type="button" on:click={() => void reloadList()} disabled={loading || reloading}>
            <i class="bi bi-arrow-repeat"></i>
            {reloading ? 'Se încarcă' : 'Reîncarcă'}
          </button>
        {/if}
      </div>

      {#if error}<div class="alert alert-danger">{error}</div>{/if}

      {#if $auth.loading || loading}
        <div class="panel loading-panel">
          <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
          <span>Se încarcă mesajele…</span>
        </div>
      {:else if !$auth.isAuthenticated}
        <div class="panel guest-panel">
          <div>
            <h3>Ai o întrebare despre o comandă?</h3>
            <p>Intră în cont din coș ca să vezi comenzile și conversațiile legate de ele.</p>
          </div>
          <div class="action-row">
            <a class="btn btn-accent" href="/cos"><i class="bi bi-person-circle"></i> Intră în cont</a>
            <a class="btn btn-outline-accent" href={phoneHref}><i class="bi bi-telephone"></i> Sună direct</a>
          </div>
        </div>
      {:else if $auth.isAdmin}
        <div class="panel guest-panel">
          <div>
            <h3>Mesaje administrator</h3>
            <p>Administratorii gestionează conversațiile din panoul dedicat.</p>
          </div>
          <a class="btn btn-accent" href="/admin/messages"><i class="bi bi-inbox"></i> Deschide mesajele</a>
        </div>
      {:else}
        <div class="message-grid">
          <aside class="panel list-panel" aria-label="Comenzi și conversații">
            <button
              class:selected={!selectedOrderId && !selectedId}
              class="conversation-btn new-message-btn"
              type="button"
              on:click={selectGeneralNew}
            >
              <span class="conversation-btn__top">
                <strong>Mesaj nou</strong>
                <i class="bi bi-plus-circle"></i>
              </span>
              <span class="conversation-btn__message">Întrebare generală pentru DeSaga</span>
            </button>

            {#if generalConversations.length > 0}
              <div class="list-title">Conversații generale</div>
              {#each generalConversations as item (item.id)}
                <button
                  class:selected={selectedId === item.id}
                  class="conversation-btn"
                  type="button"
                  on:click={() => void selectConversation(item.id)}
                >
                  <span class="conversation-btn__top">
                    <strong>{item.subject}</strong>
                    {#if item.unreadCount > 0}<span class="badge text-bg-danger">{item.unreadCount}</span>{/if}
                  </span>
                  <span class="conversation-btn__subject">{normalizeStatus(item.status)}</span>
                  <span class="conversation-btn__message">{item.lastMessage?.body || 'Fără mesaje.'}</span>
                </button>
              {/each}
            {/if}

            <div class="list-title">Comenzile mele</div>
            {#if orders.length === 0}
              <div class="empty-list">
                <strong>Nu ai comenzi încă.</strong>
                <span>După checkout, comenzile apar aici.</span>
                <a href="/produse">Vezi produsele</a>
              </div>
            {:else}
              {#each orders as order (order.id)}
                <div class="order-group">
                  <button
                    class:selected={selectedOrderId === order.id && !selectedId}
                    class="conversation-btn order-only-btn"
                    type="button"
                    on:click={() => selectOrderWithoutConversation(order)}
                  >
                    <span class="conversation-btn__top">
                      <strong>{order.orderNumber}</strong>
                      <span class="badge text-bg-light">{normalizeStatus(order.status)}</span>
                    </span>
                    <span class="conversation-btn__subject">{formatMoney(order.total, order.currency)}</span>
                    <span class="conversation-btn__message">{formatDate(order.createdAt)}</span>
                  </button>

                  {#if orderHasConversation(order)}
                    {#each conversationsForOrder(order) as item (item.id)}
                      <button
                        class:selected={selectedId === item.id}
                        class="conversation-btn conversation-btn-nested"
                        type="button"
                        on:click={() => void selectConversation(item.id)}
                      >
                        <span class="conversation-btn__top">
                          <strong>{item.subject}</strong>
                          {#if item.unreadCount > 0}<span class="badge text-bg-danger">{item.unreadCount}</span>{/if}
                        </span>
                        <span class="conversation-btn__message">{item.lastMessage?.body || 'Fără mesaje.'}</span>
                      </button>
                    {/each}
                  {/if}
                </div>
              {/each}
            {/if}
          </aside>

          <div class="panel detail-panel">
            {#if current}
              <div class="detail-head">
                <div>
                  <span class="eyebrow">{selectedId ? 'Conversație' : 'Mesaj nou'}</span>
                  <h3>{current.subject}</h3>
                  {#if selectedOrder}
                    <p class="muted mb-0">
                      {selectedOrder.orderNumber} · {formatMoney(selectedOrder.total, selectedOrder.currency)} · {normalizeStatus(selectedOrder.status)}
                    </p>
                  {:else}
                    <p class="muted mb-0">Mesaj general către echipa DeSaga.</p>
                  {/if}
                </div>

                <span class="status-pill">{normalizeStatus(current.status || 'OPEN')}</span>
              </div>

              {#if !selectedId && !selectedOrder}
                <label class="form-label fw-bold" for="general-subject">Subiect</label>
                <input id="general-subject" class="form-control subject-input" bind:value={generalSubject} placeholder="Subiect mesaj" />
              {/if}

              <div class="messages">
                {#if current.messages.length === 0}
                  <div class="empty-messages">
                    <i class="bi bi-chat-dots"></i>
                    <strong>Nu există mesaje încă.</strong>
                    <span>Scrie mesajul și îl trimitem către administrator.</span>
                  </div>
                {:else}
                  {#each current.messages as message (message.id)}
                    <article class={`message ${message.senderType === 'ADMIN' ? 'message-admin' : 'message-user'}`}>
                      <div class="message-meta">
                        <strong>{message.senderType === 'ADMIN' ? 'DeSaga' : 'Tu'}</strong>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                      <div>{message.body}</div>
                    </article>
                  {/each}
                {/if}
              </div>

              <div class="reply-box">
                <label class="form-label fw-bold" for="reply">Mesaj</label>
                <textarea
                  id="reply"
                  class="form-control"
                  rows="4"
                  bind:value={reply}
                  placeholder={selectedId ? 'Scrie răspunsul tău…' : 'Scrie mesajul tău…'}
                  disabled={sending}
                ></textarea>
                <div class="reply-actions">
                  <a class="btn btn-outline-accent" href={phoneHref}><i class="bi bi-telephone"></i> Sună</a>
                  <button class="btn btn-accent" type="button" on:click={() => void submitMessage()} disabled={sending || !reply.trim()}>
                    <i class="bi bi-send"></i>
                    {sending ? 'Se trimite…' : selectedId ? 'Trimite răspuns' : 'Trimite mesaj'}
                  </button>
                </div>
              </div>
            {:else}
              <div class="empty-messages detail-empty">
                <i class="bi bi-arrow-left-circle"></i>
                <strong>Selectează o comandă sau creează un mesaj nou.</strong>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </section>
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2699d6);
    --accent-rgb: 38, 153, 214;
  }

  .contact-page {
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 44%);
    padding: 2rem 0 3rem;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (min-width: 992px) {
    .contact-grid {
      grid-template-columns: 1.25fr 0.9fr 0.9fr;
    }
  }

  .contact-card,
  .panel,
  .map-panel {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 20px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.07);
  }

  .contact-card {
    display: flex;
    gap: 1rem;
    padding: 1.2rem;
  }

  .contact-card-primary {
    background: rgba(var(--accent-rgb), 0.08);
    border-color: rgba(var(--accent-rgb), 0.18);
  }

  .contact-card h2,
  .messages-head h2,
  .detail-head h3,
  .guest-panel h3 {
    margin: 0;
    font-weight: 950;
    color: #152432;
    letter-spacing: -0.02em;
  }

  .contact-card h2 {
    font-size: 1.05rem;
  }

  .contact-card p,
  .messages-head p,
  .guest-panel p {
    margin: 0.35rem 0 0;
    color: rgba(21, 36, 50, 0.68);
    line-height: 1.45;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.12);
    flex: 0 0 auto;
  }

  .action-row,
  .social-row,
  .reply-actions {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .action-row,
  .social-row {
    margin-top: 0.9rem;
  }

  .social-row a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 850;
  }

  .map-panel {
    overflow: hidden;
    margin-bottom: 1.4rem;
  }

  .map-panel iframe {
    width: 100%;
    height: 280px;
    border: 0;
    display: block;
  }

  .messages-shell {
    margin-top: 1.4rem;
  }

  .messages-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .eyebrow,
  .list-title {
    display: inline-block;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .panel {
    padding: 1rem;
  }

  .loading-panel,
  .guest-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .loading-panel {
    justify-content: center;
  }

  .message-grid {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 992px) {
    .message-grid {
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
      align-items: start;
    }
  }

  .list-panel {
    display: grid;
    gap: 0.75rem;
    align-content: start;
    max-height: 72vh;
    overflow: auto;
  }

  .order-group {
    display: grid;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  .order-group:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .conversation-btn {
    width: 100%;
    text-align: left;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: #fff;
    border-radius: 16px;
    padding: 0.85rem;
    color: inherit;
  }

  .conversation-btn:hover,
  .conversation-btn:focus,
  .conversation-btn.selected {
    border-color: rgba(var(--accent-rgb), 0.38);
    background: rgba(var(--accent-rgb), 0.07);
  }

  .new-message-btn {
    border-color: rgba(var(--accent-rgb), 0.25);
  }

  .order-only-btn {
    background: rgba(15, 23, 42, 0.025);
  }

  .conversation-btn-nested {
    margin-left: 0.7rem;
    width: calc(100% - 0.7rem);
  }

  .conversation-btn__top,
  .conversation-btn__subject,
  .conversation-btn__message {
    display: block;
  }

  .conversation-btn__top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .conversation-btn__subject {
    margin-top: 0.35rem;
    font-weight: 850;
  }

  .conversation-btn__message {
    margin-top: 0.35rem;
    color: rgba(21, 36, 50, 0.64);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .empty-list {
    display: grid;
    gap: 0.25rem;
    color: rgba(21, 36, 50, 0.68);
    padding: 0.8rem;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.025);
  }

  .empty-list a {
    color: var(--accent);
    font-weight: 850;
    text-decoration: none;
  }

  .detail-panel {
    min-height: 520px;
  }

  .detail-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .status-pill {
    display: inline-flex;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    background: rgba(var(--accent-rgb), 0.1);
    color: var(--accent);
    font-weight: 900;
    white-space: nowrap;
  }

  .subject-input {
    margin-bottom: 1rem;
  }

  .messages {
    display: grid;
    gap: 0.75rem;
    max-height: 48vh;
    min-height: 180px;
    overflow: auto;
    padding-right: 0.25rem;
  }

  .message {
    padding: 0.85rem;
    border-radius: 16px;
    white-space: pre-wrap;
  }

  .message-user {
    background: rgba(15, 23, 42, 0.045);
  }

  .message-admin {
    background: rgba(var(--accent-rgb), 0.09);
  }

  .message-meta {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: rgba(21, 36, 50, 0.62);
    margin-bottom: 0.35rem;
  }

  .empty-messages {
    min-height: 170px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.35rem;
    text-align: center;
    color: rgba(21, 36, 50, 0.62);
    border: 1px dashed rgba(15, 23, 42, 0.14);
    border-radius: 18px;
    padding: 1rem;
  }

  .empty-messages i {
    font-size: 1.6rem;
    color: var(--accent);
  }

  .detail-empty {
    min-height: 440px;
  }

  .reply-box {
    margin-top: 1rem;
  }

  .reply-actions {
    justify-content: flex-end;
    margin-top: 0.75rem;
  }

  .muted {
    color: rgba(21, 36, 50, 0.65);
  }

  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    font-weight: 850;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.2);
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    background: var(--desaga-dark-blue, #1f7fb3) !important;
    border-color: var(--desaga-dark-blue, #1f7fb3) !important;
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.45) !important;
    color: var(--accent) !important;
    font-weight: 850;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.1) !important;
    color: var(--accent) !important;
  }

  @media (max-width: 767.98px) {
    .contact-page {
      padding-top: 1.2rem;
    }

    .messages-head,
    .loading-panel,
    .guest-panel,
    .detail-head {
      align-items: stretch;
      flex-direction: column;
    }

    .list-panel {
      max-height: none;
    }

    .map-panel iframe {
      height: 230px;
    }

    .message-meta {
      display: grid;
    }
  }
</style>
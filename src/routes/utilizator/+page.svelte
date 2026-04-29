<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';

  type OrderItem = {
    id: string;
    orderNumber: string;
    customerFullName?: string;
    customerEmail?: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
    placedAt?: string | null;
  };

  type ConversationItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    createdAt?: string;
    updatedAt?: string;
    lastMessage: {
      id?: string;
      body: string;
      senderType?: string;
      createdAt: string;
    } | null;
  };

  type ConversationDetail = {
    id: string;
    subject: string;
    status: string;
    messages: Array<{
      id: string;
      senderType: string;
      body: string;
      createdAt: string;
      isRead: boolean;
    }>;
  };

  let loading = true;
  let ordersLoading = false;
  let messagesLoading = false;
  let profileSaving = false;
  let passwordSaving = false;
  let messageSending = false;
  let replying = false;
  let error = '';
  let success = '';

  let orders: OrderItem[] = [];
  let conversations: ConversationItem[] = [];
  let currentConversation: ConversationDetail | null = null;
  let selectedConversationId = '';
  let selectedOrderId = '';
  let orderMessage = '';
  let replyMessage = '';
  let profileSeedUserId = '';

  let profileForm = {
    fullName: '',
    phone: '',
    email: '',
    username: '',
  };

  let passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  function formatMoney(value: number, currency = 'RON') {
    return `${Number(value || 0).toFixed(2)} ${currency || 'RON'}`;
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return 'Dată indisponibilă';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';
    return date.toLocaleString('ro-RO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function statusLabel(value: string | null | undefined) {
    const labels: Record<string, string> = {
      PLACED: 'Plasată',
      PENDING: 'În așteptare',
      PAID: 'Plătită',
      PROCESSING: 'În pregătire',
      SHIPPED: 'Expediată',
      DELIVERED: 'Livrată',
      COMPLETED: 'Finalizată',
      CANCELLED: 'Anulată',
      REFUNDED: 'Rambursată',
      UNFULFILLED: 'Nepregătită',
      FULFILLED: 'Livrată',
      OPEN: 'Deschisă',
      CLOSED: 'Închisă',
      ARCHIVED: 'Arhivată',
    };

    return labels[String(value ?? '')] ?? String(value ?? '—').replaceAll('_', ' ');
  }

  function conversationMatchesOrder(conversation: ConversationItem, order: OrderItem) {
    const subject = conversation.subject.toLowerCase();
    return subject.includes(order.orderNumber.toLowerCase()) || subject.includes(order.id.toLowerCase());
  }

  function conversationsForOrder(order: OrderItem) {
    return conversations.filter((conversation) => conversationMatchesOrder(conversation, order));
  }

  async function loadOrders() {
    ordersLoading = true;

    try {
      const res = await fetch('/api/orders');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
      orders = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca comenzile.';
    } finally {
      ordersLoading = false;
    }
  }

  async function loadMessages() {
    messagesLoading = true;

    try {
      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');
      conversations = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
    } finally {
      messagesLoading = false;
    }
  }

  async function loadAccountData() {
    error = '';
    await Promise.all([loadOrders(), loadMessages()]);
  }

  async function saveProfile(event: Event) {
    event.preventDefault();
    error = '';
    success = '';
    profileSaving = true;

    try {
      await auth.updateProfile(profileForm);
      success = 'Profilul a fost actualizat.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut actualiza profilul.';
    } finally {
      profileSaving = false;
    }
  }

  async function changePassword(event: Event) {
    event.preventDefault();
    error = '';
    success = '';

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error = 'Confirmarea parolei nu se potrivește.';
      return;
    }

    passwordSaving = true;

    try {
      await auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      success = 'Parola a fost schimbată.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut schimba parola.';
    } finally {
      passwordSaving = false;
    }
  }

  async function loadConversation(id: string) {
    selectedConversationId = id;
    currentConversation = null;
    error = '';

    try {
      const res = await fetch(`/api/messages/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca conversația.');
      currentConversation = data.item;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca conversația.';
    }
  }

  async function sendReply() {
    if (!selectedConversationId || !replyMessage.trim()) return;
    error = '';
    replying = true;

    try {
      const res = await fetch(`/api/messages/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut trimite răspunsul.');

      replyMessage = '';
      await Promise.all([loadConversation(selectedConversationId), loadMessages()]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut trimite răspunsul.';
    } finally {
      replying = false;
    }
  }

  async function sendOrderMessage(order: OrderItem) {
    if (!orderMessage.trim()) return;
    error = '';
    success = '';
    messageSending = true;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Comandă ${order.orderNumber}`,
          message: orderMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut trimite mesajul.');

      orderMessage = '';
      success = 'Mesajul a fost trimis.';
      await loadMessages();

      if (data?.item?.id) {
        await loadConversation(String(data.item.id));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut trimite mesajul.';
    } finally {
      messageSending = false;
    }
  }

  async function logout() {
    await auth.logout();
    await goto('/cont');
  }

  onMount(async () => {
    await auth.refresh();

    if (!$auth.isAuthenticated) {
      await goto('/cont');
      return;
    }

    if ($auth.isAdmin) {
      await goto('/admin/dashboard');
      return;
    }

    await loadAccountData();
    loading = false;
  });

  $: if ($auth.user && String($auth.user.id) !== profileSeedUserId) {
    profileSeedUserId = String($auth.user.id);
    profileForm = {
      fullName: $auth.user.fullName ?? '',
      phone: $auth.user.phone ?? '',
      email: $auth.user.email ?? '',
      username: $auth.user.username ?? '',
    };
  }

  $: selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;
  $: totalSpent = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  $: unreadMessages = conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount ?? 0), 0);
</script>

<svelte:head>
  <title>Contul meu - DeSaga cu Legume</title>
  <meta name="description" content="Dashboard client DeSaga cu Legume: profil, comenzi, mesaje și schimbare parolă." />
</svelte:head>

<section class="user-page">
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Dashboard client</p>
        <h1>Contul meu</h1>
        <p class="muted m-0">Profil, comenzi și conversații legate de comenzile tale.</p>
      </div>

      <div class="head-actions">
        <a class="btn btn-outline-accent" href="/produse">
          <i class="bi bi-box"></i> Produse
        </a>
        <button class="btn btn-outline-danger" type="button" on:click={logout}>
          <i class="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>
    </div>

    {#if error}
      <div class="alert alert-danger" role="alert">{error}</div>
    {/if}
    {#if success}
      <div class="alert alert-success" role="alert">{success}</div>
    {/if}

    {#if loading || $auth.loading}
      <div class="surface loading-card">Se încarcă datele contului…</div>
    {:else}
      <div class="stats-grid">
        <div class="stat-card surface">
          <span>Comenzi</span>
          <strong>{orders.length}</strong>
        </div>
        <div class="stat-card surface">
          <span>Total comenzi</span>
          <strong>{formatMoney(totalSpent)}</strong>
        </div>
        <div class="stat-card surface">
          <span>Mesaje necitite</span>
          <strong>{unreadMessages}</strong>
        </div>
      </div>

      <div class="account-grid">
        <div class="main-column">
          <section class="surface panel">
            <div class="panel-head">
              <div>
                <h2><i class="bi bi-receipt"></i> Comenzile mele</h2>
                <p>Comenzile sunt încărcate din istoricul tău de utilizator.</p>
              </div>
              <button class="btn btn-sm btn-outline-accent" type="button" on:click={loadAccountData} disabled={ordersLoading || messagesLoading}>
                <i class="bi bi-arrow-clockwise"></i> Reîncarcă
              </button>
            </div>

            {#if ordersLoading}
              <div class="muted">Se încarcă comenzile…</div>
            {:else if orders.length === 0}
              <div class="empty-box">
                <i class="bi bi-bag"></i>
                <div>
                  <strong>Nu ai comenzi încă.</strong>
                  <p>Alege produse și finalizează comanda din coș.</p>
                  <a class="btn btn-primary btn-sm" href="/produse">Vezi produsele</a>
                </div>
              </div>
            {:else}
              <div class="orders-list">
                {#each orders as order (order.id)}
                  <article class:selected={selectedOrderId === order.id} class="order-card">
                    <button type="button" class="order-main" on:click={() => (selectedOrderId = order.id)}>
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div class="order-meta">
                        <span class="badge-soft">{statusLabel(order.status)}</span>
                        <strong>{formatMoney(order.total, order.currency)}</strong>
                      </div>
                    </button>

                    {#if selectedOrderId === order.id}
                      <div class="order-detail">
                        <div class="detail-row"><span>Plată</span><strong>{statusLabel(order.paymentStatus)}</strong></div>
                        <div class="detail-row"><span>Livrare</span><strong>{statusLabel(order.fulfillmentStatus)}</strong></div>

                        <div class="order-messages">
                          <h3>Mesaje pentru această comandă</h3>
                          {#if conversationsForOrder(order).length === 0}
                            <p class="muted">Nu există conversații pentru această comandă.</p>
                          {:else}
                            {#each conversationsForOrder(order) as conversation (conversation.id)}
                              <button class="conversation-row" type="button" on:click={() => loadConversation(conversation.id)}>
                                <span>{conversation.subject}</span>
                                <small>{conversation.lastMessage?.body ?? 'Fără mesaje'}</small>
                              </button>
                            {/each}
                          {/if}

                          <textarea class="form-control" rows="3" bind:value={orderMessage} placeholder="Scrie un mesaj despre comanda aceasta..."></textarea>
                          <div class="text-end mt-2">
                            <button class="btn btn-outline-accent btn-sm" type="button" on:click={() => sendOrderMessage(order)} disabled={!orderMessage.trim() || messageSending}>
                              {messageSending ? 'Se trimite…' : 'Trimite mesaj'}
                            </button>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </article>
                {/each}
              </div>
            {/if}
          </section>

          <section class="surface panel">
            <div class="panel-head">
              <div>
                <h2><i class="bi bi-chat-dots"></i> Conversații</h2>
                <p>Mesajele tale către admin și răspunsurile primite.</p>
              </div>
            </div>

            <div class="messages-grid">
              <div class="conversation-list">
                {#if messagesLoading}
                  <div class="muted">Se încarcă mesajele…</div>
                {:else if conversations.length === 0}
                  <div class="muted">Nu ai conversații încă.</div>
                {:else}
                  {#each conversations as conversation (conversation.id)}
                    <button class:selected={selectedConversationId === conversation.id} class="conversation-button" type="button" on:click={() => loadConversation(conversation.id)}>
                      <div>
                        <strong>{conversation.subject}</strong>
                        <span>{statusLabel(conversation.status)}</span>
                      </div>
                      {#if conversation.unreadCount > 0}
                        <span class="unread-badge">{conversation.unreadCount}</span>
                      {/if}
                      <small>{conversation.lastMessage?.body ?? 'Fără mesaje'}</small>
                    </button>
                  {/each}
                {/if}
              </div>

              <div class="conversation-detail">
                {#if currentConversation}
                  <h3>{currentConversation.subject}</h3>
                  <div class="thread">
                    {#each currentConversation.messages as message (message.id)}
                      <div class={`thread-message ${message.senderType === 'ADMIN' ? 'admin' : 'user'}`}>
                        <small>{message.senderType === 'ADMIN' ? 'Admin' : 'Tu'} · {formatDate(message.createdAt)}</small>
                        <p>{message.body}</p>
                      </div>
                    {/each}
                  </div>
                  <textarea class="form-control" rows="3" bind:value={replyMessage} placeholder="Scrie răspunsul tău..."></textarea>
                  <div class="text-end mt-2">
                    <button class="btn btn-primary btn-sm" type="button" on:click={sendReply} disabled={!replyMessage.trim() || replying}>
                      {replying ? 'Se trimite…' : 'Trimite răspuns'}
                    </button>
                  </div>
                {:else}
                  <div class="empty-box compact">
                    <i class="bi bi-chat-square-text"></i>
                    <div>Selectează o conversație pentru detalii.</div>
                  </div>
                {/if}
              </div>
            </div>
          </section>
        </div>

        <aside class="side-column">
          <section class="surface panel">
            <div class="panel-head">
              <div>
                <h2><i class="bi bi-person-gear"></i> Date personale</h2>
                <p>Aceste date pot fi folosite la checkout.</p>
              </div>
            </div>

            <form class="stack-form" on:submit={saveProfile}>
              <label>
                <span>Nume complet</span>
                <input class="form-control" bind:value={profileForm.fullName} disabled={profileSaving} />
              </label>
              <label>
                <span>Telefon</span>
                <input class="form-control" bind:value={profileForm.phone} disabled={profileSaving} />
              </label>
              <label>
                <span>Email</span>
                <input class="form-control" type="email" bind:value={profileForm.email} disabled={profileSaving} required />
              </label>
              <label>
                <span>Username</span>
                <input class="form-control" bind:value={profileForm.username} disabled={profileSaving} required />
              </label>
              <button class="btn btn-primary w-100" type="submit" disabled={profileSaving}>
                {profileSaving ? 'Se salvează…' : 'Salvează profilul'}
              </button>
            </form>
          </section>

          <section class="surface panel">
            <div class="panel-head">
              <div>
                <h2><i class="bi bi-key"></i> Schimbă parola</h2>
                <p>Parola nouă trebuie să respecte regula de securitate.</p>
              </div>
            </div>

            <form class="stack-form" on:submit={changePassword}>
              <label>
                <span>Parola curentă</span>
                <input class="form-control" type="password" autocomplete="current-password" bind:value={passwordForm.currentPassword} disabled={passwordSaving} required />
              </label>
              <label>
                <span>Parola nouă</span>
                <input class="form-control" type="password" autocomplete="new-password" bind:value={passwordForm.newPassword} disabled={passwordSaving} required />
              </label>
              <label>
                <span>Confirmă parola nouă</span>
                <input class="form-control" type="password" autocomplete="new-password" bind:value={passwordForm.confirmPassword} disabled={passwordSaving} required />
              </label>
              <button class="btn btn-outline-accent w-100" type="submit" disabled={passwordSaving}>
                {passwordSaving ? 'Se schimbă…' : 'Schimbă parola'}
              </button>
            </form>
          </section>
        </aside>
      </div>
    {/if}
  </div>
</section>

<style>
  .user-page {
    padding: clamp(1.5rem, 4vw, 3rem) 0 clamp(3rem, 6vw, 5rem);
    background:
      radial-gradient(circle at top left, rgba(var(--desaga-accent-rgb), 0.1), transparent 30rem),
      var(--desaga-cream);
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    color: var(--desaga-blue);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  h1 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-heading);
    letter-spacing: -0.035em;
  }

  .muted {
    color: var(--desaga-muted);
  }

  .head-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: flex-end;
  }

  .loading-card {
    padding: 1.25rem;
  }

  .stats-grid,
  .account-grid {
    display: grid;
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-card span {
    display: block;
    color: var(--desaga-muted);
    font-weight: 800;
  }

  .stat-card strong {
    display: block;
    margin-top: 0.35rem;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--desaga-heading);
  }

  .account-grid {
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }

  .main-column,
  .side-column {
    display: grid;
    gap: 1rem;
  }

  .panel {
    padding: 1rem;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .panel-head h2 {
    margin: 0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 1.1rem;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .panel-head p {
    margin: 0.25rem 0 0;
    color: var(--desaga-muted);
  }

  .orders-list,
  .conversation-list,
  .stack-form {
    display: grid;
    gap: 0.75rem;
  }

  .order-card,
  .conversation-button,
  .conversation-row {
    border: 1px solid var(--desaga-border);
    border-radius: var(--desaga-radius-md);
    background: #fff;
  }

  .order-card.selected,
  .conversation-button.selected {
    border-color: rgba(var(--desaga-accent-rgb), 0.36);
    box-shadow: var(--desaga-shadow-sm);
  }

  .order-main,
  .conversation-button,
  .conversation-row {
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
  }

  .order-main {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem;
  }

  .order-main strong,
  .conversation-button strong {
    display: block;
    color: var(--desaga-heading);
  }

  .order-main span,
  .conversation-button span,
  .conversation-button small,
  .conversation-row small {
    color: var(--desaga-muted);
  }

  .order-meta {
    display: grid;
    gap: 0.4rem;
    justify-items: end;
  }

  .order-detail {
    padding: 0 0.9rem 0.9rem;
    border-top: 1px solid var(--desaga-border);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 0.75rem;
  }

  .order-messages {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--desaga-border);
  }

  .order-messages h3,
  .conversation-detail h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .conversation-row {
    display: grid;
    gap: 0.15rem;
    padding: 0.65rem;
    margin-bottom: 0.5rem;
  }

  .messages-grid {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 1rem;
  }

  .conversation-button {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.35rem 0.6rem;
    padding: 0.75rem;
  }

  .conversation-button small {
    grid-column: 1 / -1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .unread-badge {
    min-width: 1.45rem;
    height: 1.45rem;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: var(--desaga-red);
    color: #fff;
    font-size: 0.78rem;
    font-weight: 950;
  }

  .conversation-detail {
    min-width: 0;
  }

  .thread {
    display: grid;
    gap: 0.65rem;
    max-height: 360px;
    overflow: auto;
    margin-bottom: 0.75rem;
    padding-right: 0.25rem;
  }

  .thread-message {
    width: min(92%, 620px);
    padding: 0.75rem;
    border-radius: var(--desaga-radius-md);
    background: rgba(15, 23, 42, 0.045);
    white-space: pre-wrap;
  }

  .thread-message.user {
    margin-left: auto;
    background: rgba(var(--desaga-accent-rgb), 0.1);
  }

  .thread-message small {
    display: block;
    margin-bottom: 0.35rem;
    color: var(--desaga-muted);
    font-weight: 800;
  }

  .thread-message p {
    margin: 0;
  }

  .empty-box {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    padding: 1rem;
    border-radius: var(--desaga-radius-md);
    background: rgba(15, 23, 42, 0.035);
    border: 1px dashed var(--desaga-border-strong);
  }

  .empty-box.compact {
    align-items: center;
  }

  .empty-box i {
    color: var(--desaga-blue);
    font-size: 1.35rem;
  }

  .empty-box p {
    margin: 0.25rem 0 0.65rem;
    color: var(--desaga-muted);
  }

  label span {
    display: block;
    margin-bottom: 0.35rem;
    font-weight: 850;
    color: rgba(20, 33, 43, 0.78);
  }

  @media (max-width: 1199.98px) {
    .account-grid {
      grid-template-columns: 1fr;
    }

    .side-column {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 991.98px) {
    .page-head,
    .panel-head,
    .order-main {
      flex-direction: column;
    }

    .head-actions,
    .order-meta {
      justify-content: flex-start;
      justify-items: start;
    }

    .messages-grid,
    .side-column,
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
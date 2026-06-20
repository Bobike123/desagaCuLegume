<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import MessageThread from '$lib/components/MessageThread.svelte';
  import { formatMoney, formatDate, statusLabel } from '$lib/format';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';

  type OrderItemProduct = {
    productId: string;
    sku?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    currency: string;
  };

  type OrderItem = {
    id: string;
    orderNumber: string;
    customerFullName?: string;
    customerEmail?: string;
    total: number;
    subtotalAmount?: number;
    shippingAmount?: number;
    currency: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    deliveryMethod?: 'pickup' | 'delivery';
    items?: OrderItemProduct[];
    createdAt: string;
    placedAt?: string | null;
  };

  let loading = true;
  let ordersLoading = false;
  let detailsLoading = false;
  let profileSaving = false;
  let passwordSaving = false;
  let deleteSaving = false;
  let error = '';
  let success = '';
  const DELETE_CONFIRMATION = 'STERGE CONTUL';

  let orders: OrderItem[] = [];
  let selectedOrderId = '';
  let selectedOrderDetails: OrderItem | null = null;
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

  let deleteForm = {
    currentPassword: '',
    confirmation: '',
  };

  async function loadOrderDetails(orderId: string) {
    if (!orderId) return;
    detailsLoading = true;
    error = '';
    selectedOrderDetails = null;

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca detaliile comenzii.');
      selectedOrderDetails = data?.item ?? null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca detaliile comenzii.';
    } finally {
      detailsLoading = false;
    }
  }

  function selectOrder(orderId: string) {
    if (selectedOrderId === orderId) {
      selectedOrderId = '';
      selectedOrderDetails = null;
    } else {
      selectedOrderId = orderId;
      void loadOrderDetails(orderId);
    }
  }

  async function loadOrders() {
    ordersLoading = true;
    error = '';

    try {
      const res = await fetch('/api/orders?limit=100');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
      orders = Array.isArray(data?.items) ? data.items : [];

      if (!selectedOrderId && orders.length > 0) {
        selectedOrderId = orders[0].id;
      }

      if (selectedOrderId && !orders.some((order) => order.id === selectedOrderId)) {
        selectedOrderId = orders[0]?.id ?? '';
      }

      if (selectedOrderId) {
        await loadOrderDetails(selectedOrderId);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca comenzile.';
    } finally {
      ordersLoading = false;
    }
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

  async function deleteAccount(event: Event) {
    event.preventDefault();
    error = '';
    success = '';

    if (deleteForm.confirmation.trim().toUpperCase() !== DELETE_CONFIRMATION) {
      error = `Pentru confirmare, scrie exact ${DELETE_CONFIRMATION}.`;
      return;
    }

    const confirmed = window.confirm(
      'Ești sigur că vrei să ștergi contul? Această acțiune îți va închide accesul la cont.'
    );

    if (!confirmed) return;

    deleteSaving = true;

    try {
      await auth.deleteAccount({
        currentPassword: deleteForm.currentPassword,
        confirmation: deleteForm.confirmation,
      });
      cart.clear();
      await goto('/cont');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut șterge contul.';
    } finally {
      deleteSaving = false;
    }
  }

  async function logout() {
    await auth.logout();
    await goto('/cont');
  }

  onMount(async () => {
    await auth.refresh();
    await loadOrders();
    loading = false;
  });

  // Seed form only on first load or when the signed-in account changes.
  // Checking profileSeedUserId prevents auth-store refreshes (after save/session check) from overwriting in-progress edits.
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
  $: lastOrder = orders[0] ?? null;
</script>

<svelte:head>
  <title>Contul meu - DeSaga cu Legume</title>
  <meta name="description" content="Panou client DeSaga cu Legume: profil, comenzi, mesaje și schimbare parolă." />
</svelte:head>

<section class="user-page">
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Panou client</p>
        <h1>Contul meu</h1>
        <p class="muted m-0">Profil, comenzi și conversații legate de comenzile tale.</p>
      </div>

      <div class="head-actions">
        <a class="btn btn-outline-accent" href="/produse">
          <i class="bi bi-box"></i> Produse
        </a>
        <button class="btn btn-outline-danger" type="button" on:click={logout}>
          <i class="bi bi-box-arrow-right"></i> Deconectare
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
          <span>Ultima comandă</span>
          <strong>{lastOrder ? lastOrder.orderNumber : '—'}</strong>
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
              <button class="btn btn-sm btn-outline-accent" type="button" on:click={loadOrders} disabled={ordersLoading}>
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
                  <article class="order-card" class:expanded={selectedOrderId === order.id}>
                    <button 
                      type="button" 
                      class="order-card-header" 
                      on:click={() => selectOrder(order.id)}
                    >
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div class="order-meta">
                        <strong>{formatMoney(order.total, order.currency)}</strong>
                        <i class="bi bi-chevron-down"></i>
                      </div>
                    </button>

                    {#if selectedOrderId === order.id && selectedOrderDetails}
                      <div class="order-card-details" transition:slide={{ duration: 300 }}>
                        {#if detailsLoading}
                          <div class="muted">Se încarcă detaliile…</div>
                        {:else}
                          <div class="order-summary-grid">
                            <div class="summary-row"><span>Comandă</span><strong>#{selectedOrderDetails.orderNumber}</strong></div>
                            <div class="summary-row"><span>Data comenzii</span><strong>{formatDate(selectedOrderDetails.createdAt)}</strong></div>
                            <div class="summary-row"><span>Plată</span><strong>{statusLabel(selectedOrderDetails.paymentStatus)}</strong></div>
                            <div class="summary-row"><span>Livrare</span><strong>{statusLabel(selectedOrderDetails.fulfillmentStatus)}</strong></div>
                            <div class="summary-row"><span>Metodă</span><strong>{selectedOrderDetails.deliveryMethod === 'delivery' ? 'Livrare' : 'Ridicare'}</strong></div>
                            <div class="summary-row"><span>Total</span><strong>{formatMoney(selectedOrderDetails.total, selectedOrderDetails.currency)}</strong></div>
                          </div>

                          <div class="order-items-panel">
                            <div class="items-head">
                              <h3>Produse comandate</h3>
                              <p>{selectedOrderDetails.items?.length ?? 0} produse</p>
                            </div>

                            {#if selectedOrderDetails.items?.length}
                              <div class="order-items-table">
                                <div class="item-row item-header">
                                  <span>Produs</span>
                                  <span>Cantitate</span>
                                  <span>Preț / buc</span>
                                  <span>Total</span>
                                </div>
                                {#each selectedOrderDetails.items as item (item.productId)}
                                  <div class="item-row">
                                    <span>{item.productName}</span>
                                    <span>{item.quantity}</span>
                                    <span>{formatMoney(item.unitPrice, item.currency)}</span>
                                    <span>{formatMoney(item.lineTotal, item.currency)}</span>
                                  </div>
                                {/each}
                              </div>
                            {:else}
                              <div class="muted">Detaliile produselor nu sunt disponibile.</div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </article>
                {/each}
              </div>
            {/if}
          </section>

          <MessageThread
            mode="user"
            orders={orders}
            ready={!loading && !$auth.loading}
            ordersReady={true}
            title="Conversații"
            subtitle="Mesajele tale către admin și răspunsurile primite."
          />
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
                <span>Nume</span>
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

          <section class="surface panel danger-panel">
            <div class="panel-head">
              <div>
                <h2><i class="bi bi-exclamation-triangle"></i> Ștergere cont</h2>
                <p>
                  Îți poți închide contul de client. Profilul și accesul la cont vor fi dezactivate,
                  iar datele care trebuie păstrate legal, precum comenzile sau documentele contabile,
                  pot rămâne stocate pe durata prevăzută de lege.
                </p>
              </div>
            </div>

            <form class="stack-form" on:submit={deleteAccount}>
              <label>
                <span>Parola curentă</span>
                <input
                  class="form-control"
                  type="password"
                  autocomplete="current-password"
                  bind:value={deleteForm.currentPassword}
                  disabled={deleteSaving}
                  required
                />
              </label>
              <label>
                <span>Confirmare</span>
                <input
                  class="form-control"
                  bind:value={deleteForm.confirmation}
                  disabled={deleteSaving}
                  placeholder={DELETE_CONFIRMATION}
                  required
                />
                <small>Scrie exact <strong>{DELETE_CONFIRMATION}</strong> pentru a continua.</small>
              </label>
              <button class="btn btn-outline-danger w-100" type="submit" disabled={deleteSaving}>
                {deleteSaving ? 'Se șterge contul…' : 'Șterge contul'}
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

  .danger-panel {
    border-color: rgba(220, 53, 69, 0.22);
    background:
      linear-gradient(180deg, rgba(255, 245, 245, 0.9), #fff),
      #fff;
  }

  .danger-panel .panel-head h2 {
    color: #842029;
  }

  .orders-list,
  .stack-form {
    display: grid;
    gap: 0.75rem;
  }

  .order-card {
    border: 1px solid var(--desaga-border);
    border-radius: var(--desaga-radius-md);
    background: #fff;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .order-card.expanded {
    box-shadow: var(--desaga-shadow-sm);
  }

  .order-card-header {
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .order-card-header:hover {
    background: rgba(var(--desaga-accent-rgb), 0.02);
  }

  .order-card.expanded .order-card-header {
    background: rgba(var(--desaga-accent-rgb), 0.05);
    border-bottom: 1px solid var(--desaga-border);
  }

  .order-card-header strong {
    display: block;
    color: var(--desaga-heading);
  }

  .order-card-header span {
    color: var(--desaga-muted);
  }

  .order-card-header i {
    transition: transform 0.3s ease;
    color: var(--desaga-muted);
  }

  .order-card.expanded .order-card-header i {
    transform: rotate(180deg);
  }

  .order-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .order-card-details {
    padding: 1rem;
    border-top: 1px solid var(--desaga-border);
    background: rgba(var(--desaga-accent-rgb), 0.015);
  }

  .items-head {
    margin-bottom: 0.75rem;
  }

  .items-head h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 850;
    color: var(--desaga-heading);
  }

  .items-head p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: var(--desaga-muted);
  }

  .order-items-panel {
    margin-top: 1rem;
    display: grid;
    gap: 0.75rem;
  }

  .order-items-table {
    display: grid;
    gap: 0.5rem;
    border: 1px solid var(--desaga-border);
    border-radius: var(--desaga-radius-md);
    padding: 0.75rem;
    background: #fff;
  }

  .item-row {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) 0.8fr 0.9fr 0.9fr;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--desaga-border);
  }

  .item-row:last-child {
    border-bottom: 0;
  }

  .item-header {
    font-weight: 850;
    color: var(--desaga-muted);
  }

  .item-row span {
    word-break: break-word;
  }

  .order-summary-grid {
    display: grid;
    gap: 0.75rem;
    border: 1px solid var(--desaga-border);
    border-radius: var(--desaga-radius-lg);
    padding: 1rem;
    background: #fff;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.7rem 0;
    border-bottom: 1px solid var(--desaga-border);
  }

  .summary-row:last-child {
    border-bottom: 0;
  }

  .summary-row span {
    color: var(--desaga-muted);
    font-weight: 700;
  }

  .summary-row strong {
    color: var(--desaga-heading);
    text-align: right;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translate(-50%, -40%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%);
      opacity: 1;
    }
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

  label small {
    display: block;
    margin-top: 0.35rem;
    color: var(--desaga-muted);
    line-height: 1.35;
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
    .panel-head {
      flex-direction: column;
    }

    .head-actions {
      justify-content: flex-start;
    }

    .side-column,
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .item-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .item-row span::before {
      content: attr(data-label);
      display: block;
      font-weight: 850;
      font-size: 0.85rem;
      color: var(--desaga-muted);
      margin-bottom: 0.25rem;
    }
  }

  @media (max-width: 567.98px) {
    .order-card-details {
      padding: 0.75rem;
    }

    .order-items-table {
      padding: 0.5rem;
    }
  }
</style>

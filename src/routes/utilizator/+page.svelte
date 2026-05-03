<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import MessageThread from '$lib/components/MessageThread.svelte';
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

  let loading = true;
  let ordersLoading = false;
  let profileSaving = false;
  let passwordSaving = false;
  let error = '';
  let success = '';

  let orders: OrderItem[] = [];
  let selectedOrderId = '';
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
    };

    const normalized = String(value ?? '').trim().toUpperCase();
    return labels[normalized] ?? String(value ?? '—').replaceAll('_', ' ');
  }

  async function loadOrders() {
    ordersLoading = true;
    error = '';

    try {
      const res = await fetch('/api/orders');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
      orders = Array.isArray(data?.items) ? data.items : [];

      if (!selectedOrderId && orders.length > 0) {
        selectedOrderId = orders[0].id;
      }

      if (selectedOrderId && !orders.some((order) => order.id === selectedOrderId)) {
        selectedOrderId = orders[0]?.id ?? '';
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

    await loadOrders();
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
  $: lastOrder = orders[0] ?? null;
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
                        {#if order.placedAt}
                          <div class="detail-row"><span>Plasată</span><strong>{formatDate(order.placedAt)}</strong></div>
                        {/if}
                        <div class="order-help-note">
                          <i class="bi bi-chat-dots"></i>
                          <span>Mesajele pentru comenzi sunt în panoul de conversații de mai jos.</span>
                        </div>
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
  .stack-form {
    display: grid;
    gap: 0.75rem;
  }

  .order-card {
    border: 1px solid var(--desaga-border);
    border-radius: var(--desaga-radius-md);
    background: #fff;
  }

  .order-card.selected {
    border-color: rgba(var(--desaga-accent-rgb), 0.36);
    box-shadow: var(--desaga-shadow-sm);
  }

  .order-main {
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem;
  }

  .order-main strong {
    display: block;
    color: var(--desaga-heading);
  }

  .order-main span {
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

  .order-help-note {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-top: 0.9rem;
    padding: 0.75rem;
    border-radius: var(--desaga-radius-md);
    background: rgba(var(--desaga-accent-rgb), 0.08);
    color: var(--desaga-muted);
    font-weight: 800;
  }

  .order-help-note i {
    color: var(--desaga-blue);
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

    .side-column,
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

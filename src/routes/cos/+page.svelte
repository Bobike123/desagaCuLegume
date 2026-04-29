<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';

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

  type ConversationItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    lastMessage: { body: string; createdAt: string } | null;
  };

  let authMode: 'login' | 'register' = 'login';
  let authError = '';
  let checkoutError = '';
  let checkoutSuccess = '';
  let supportError = '';
  let loadingOrders = false;
  let loadingMessages = false;
  let syncingCart = false;
  let serverSynced = false;
  let loadedDataForUserId = '';

  let loginForm = {
    identity: '',
    password: '',
  };

  let registerForm = {
    fullName: '',
    phone: '',
    username: '',
    email: '',
    password: '',
  };

  let checkoutForm = {
    fullName: '',
    phone: '',
    deliveryMethod: 'pickup',
    paymentMethod: 'CASH_ON_DELIVERY',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateRegion: 'Cluj',
    postalCode: '',
    countryCode: 'RO',
    customerMessage: '',
  };

  let supportSubject = 'Întrebare comandă';
  let supportMessage = '';
  let orders: OrderItem[] = [];
  let conversations: ConversationItem[] = [];

  function formatMoney(value: number) {
    return `${value.toFixed(2)} RON`;
  }

  function setQty(productId: string, quantity: number) {
    cart.setQuantity(productId, quantity);
    serverSynced = false;
  }

  function remove(productId: string) {
    cart.remove(productId);
    serverSynced = false;
  }

  async function submitLogin(event: Event) {
    event.preventDefault();
    authError = '';
    try {
      await auth.login({ identity: loginForm.identity, password: loginForm.password });
      serverSynced = false;
      await syncServerCart();
      await Promise.all([loadOrders(), loadMessages()]);
    } catch (err) {
      authError = err instanceof Error ? err.message : 'Autentificarea a eșuat.';
    }
  }

  async function submitRegister(event: Event) {
    event.preventDefault();
    authError = '';
    try {
      await auth.register(registerForm);
      checkoutForm.fullName = registerForm.fullName;
      checkoutForm.phone = registerForm.phone;
      serverSynced = false;
      await syncServerCart();
      await Promise.all([loadOrders(), loadMessages()]);
    } catch (err) {
      authError = err instanceof Error ? err.message : 'Înregistrarea a eșuat.';
    }
  }

  async function syncServerCart() {
    if (!$auth.isAuthenticated || $auth.isAdmin || !$cart.hydrated || syncingCart || serverSynced) return;

    syncingCart = true;
    try {
      if ($cart.items.length > 0) {
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: $cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? 'Nu am putut sincroniza coșul.');
      } else {
        const res = await fetch('/api/cart');
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.items) && data.items.length > 0) {
          cart.replace(
            data.items.map((item: any) => ({
              productId: String(item.productId),
              name: item.name,
              price: Number(item.price ?? 0),
              quantity: Number(item.quantity ?? 0),
              image_url: item.image_url ?? '',
              category: 'de-sezon',
              in_stock: true,
            }))
          );
        }
      }
      serverSynced = true;
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : 'Nu am putut sincroniza coșul.';
    } finally {
      syncingCart = false;
    }
  }

  async function loadOrders() {
    if (!$auth.isAuthenticated || $auth.isAdmin) {
      orders = [];
      return;
    }
    loadingOrders = true;
    try {
      const res = await fetch('/api/orders');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca comenzile.');
      orders = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : 'Nu am putut încărca comenzile.';
    } finally {
      loadingOrders = false;
    }
  }

  async function loadMessages() {
    if (!$auth.isAuthenticated || $auth.isAdmin) {
      conversations = [];
      return;
    }
    loadingMessages = true;
    try {
      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca conversațiile.');
      conversations = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      supportError = err instanceof Error ? err.message : 'Nu am putut încărca conversațiile.';
    } finally {
      loadingMessages = false;
    }
  }

  async function submitSupport() {
    if (!$auth.isAuthenticated || $auth.isAdmin || !supportMessage.trim()) return;
    supportError = '';

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: supportSubject, message: supportMessage }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      supportError = data?.error ?? 'Nu am putut trimite mesajul.';
      return;
    }

    supportMessage = '';
    await loadMessages();
  }

  async function submitCheckout(event: Event) {
    event.preventDefault();
    checkoutError = '';
    checkoutSuccess = '';

    if (!$auth.isAuthenticated) {
      checkoutError = 'Autentifică-te sau creează un cont înainte de checkout.';
      return;
    }

    if ($auth.isAdmin) {
      checkoutError = 'Administratorii nu pot plasa comenzi.';
      return;
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...checkoutForm,
        items: $cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      checkoutError = data?.error ?? 'Checkout-ul a eșuat.';
      return;
    }

    checkoutSuccess = `Comanda ${data.order.orderNumber} a fost creată.`;
    cart.clear();
    serverSynced = false;
    checkoutForm.customerMessage = '';
    await Promise.all([loadOrders(), loadMessages()]);
  }

  $: subtotal = $cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $: shippingFee = checkoutForm.deliveryMethod === 'delivery' ? (subtotal >= 150 ? 0 : subtotal > 0 ? 20 : 0) : 0;
  $: total = subtotal + shippingFee;

  $: if ($auth.user) {
    checkoutForm.fullName = checkoutForm.fullName || $auth.user.fullName || '';
    checkoutForm.phone = checkoutForm.phone || $auth.user.phone || '';
  }

  $: if ($auth.isAuthenticated && !$auth.isAdmin && $cart.hydrated && !serverSynced) {
    void syncServerCart();
  }

  $: if ($auth.isAuthenticated && !$auth.isAdmin && String($auth.user?.id ?? '') !== loadedDataForUserId) {
    loadedDataForUserId = String($auth.user?.id ?? '');
    void Promise.all([loadOrders(), loadMessages()]);
  }

  onMount(() => {
    if ($auth.isAuthenticated && !$auth.isAdmin) {
      loadedDataForUserId = String($auth.user?.id ?? '');
      void Promise.all([loadOrders(), loadMessages()]);
    }
  });
</script>

<svelte:head>
  <title>Coș - DeSaga cu Legume</title>
</svelte:head>

<section class="py-4 pb-5">
  <div class="container">
    <div class="page-head">
      <div>
        <h1 class="h3 fw-bold m-0"><i class="bi bi-cart3"></i> Coș</h1>
        <div class="muted mt-1">Coș local sincronizat în baza de date după autentificare și folosit la checkout.</div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <a href="/produse" class="btn btn-outline-accent">
          <i class="bi bi-arrow-left"></i> Continuă cumpărăturile
        </a>
        <button class="btn btn-outline-accent" type="button" on:click={() => { cart.clear(); serverSynced = false; }} disabled={$cart.items.length === 0}>
          <i class="bi bi-trash3"></i> Golește coșul
        </button>
      </div>
    </div>

    {#if authError}<div class="alert alert-danger">{authError}</div>{/if}
    {#if checkoutError}<div class="alert alert-danger">{checkoutError}</div>{/if}
    {#if checkoutSuccess}<div class="alert alert-success">{checkoutSuccess}</div>{/if}
    {#if supportError}<div class="alert alert-danger">{supportError}</div>{/if}

    <div class="row g-4 align-items-stretch">
      <div class="col-lg-8">
        <div class="panel">
          <div class="panel-head">
            <h2 class="h5 fw-bold m-0"><i class="bi bi-basket"></i> Produse</h2>
            <span class="badge-soft">{$cart.items.length} poziții</span>
          </div>

          {#if $cart.items.length === 0}
            <div class="empty-state">
              <div class="empty-title">Coșul este gol</div>
              <div class="empty-sub">Adaugă produse din listă.</div>
              <a href="/produse" class="btn btn-accent mt-3"><i class="bi bi-box"></i> Vezi produsele</a>
            </div>
          {:else}
            <div class="cart-list" role="list">
              {#each $cart.items as item (item.productId)}
                <div class="cart-row" role="listitem">
                  <div class="cart-main">
                    <div class="thumb">
                      {#if item.image_url}
                        <img src={item.image_url} alt={item.name} />
                      {:else}
                        <i class="bi bi-bag"></i>
                      {/if}
                    </div>
                    <div class="cart-info">
                      <div class="cart-title">{item.name}</div>
                      <div class="cart-sub">{formatMoney(item.price)} / buc</div>
                      <div class="cart-actions">
                        <div class="qty">
                          <button class="qty-btn" type="button" aria-label="Scade cantitatea" on:click={() => setQty(item.productId, item.quantity - 1)}><i class="bi bi-dash"></i></button>
                          <input class="qty-input" inputmode="numeric" value={item.quantity} on:input={(e) => setQty(item.productId, Number((e.target as HTMLInputElement).value))} />
                          <button class="qty-btn" type="button" aria-label="Crește cantitatea" on:click={() => setQty(item.productId, item.quantity + 1)}><i class="bi bi-plus"></i></button>
                        </div>
                        <button class="link-danger" type="button" on:click={() => remove(item.productId)}><i class="bi bi-x-lg"></i> Elimină</button>
                      </div>
                    </div>
                  </div>
                  <div class="cart-price">
                    <div class="price">{formatMoney(item.price * item.quantity)}</div>
                    <div class="muted small">Total linie</div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        {#if !$auth.isAuthenticated}
          <div class="panel panel-soft mt-4">
            <div class="panel-head">
              <h2 class="h5 fw-bold m-0"><i class="bi bi-person-lock"></i> Autentificare client</h2>
            </div>

            <div class="authTabs">
              <button class:active={authMode === 'login'} on:click={() => (authMode = 'login')}>Login</button>
              <button class:active={authMode === 'register'} on:click={() => (authMode = 'register')}>Înregistrare</button>
            </div>

            {#if authMode === 'login'}
              <form class="authGrid" on:submit={submitLogin}>
                <input class="form-control" placeholder="Email sau username" bind:value={loginForm.identity} required />
                <input class="form-control" type="password" placeholder="Parolă" bind:value={loginForm.password} required />
                <button class="btn btn-primary" type="submit">Autentificare</button>
              </form>
            {:else}
              <form class="authGrid" on:submit={submitRegister}>
                <input class="form-control" placeholder="Nume complet" bind:value={registerForm.fullName} required />
                <input class="form-control" placeholder="Telefon" bind:value={registerForm.phone} required />
                <input class="form-control" placeholder="Username" bind:value={registerForm.username} />
                <input class="form-control" type="email" placeholder="Email" bind:value={registerForm.email} required />
                <input class="form-control" type="password" placeholder="Parolă" bind:value={registerForm.password} required />
                <button class="btn btn-primary" type="submit">Creează cont</button>
              </form>
            {/if}
          </div>
        {/if}

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <div class="panel mt-4">
            <div class="panel-head">
              <h2 class="h5 fw-bold m-0"><i class="bi bi-chat-dots"></i> Suport</h2>
              <span class="badge-soft">mesaje utilizator-admin</span>
            </div>

            <div class="supportGrid">
              <div>
                <input class="form-control mb-2" bind:value={supportSubject} placeholder="Subiect" />
                <textarea class="form-control" rows="4" bind:value={supportMessage} placeholder="Scrie un mesaj pentru admin..."></textarea>
                <div class="text-end mt-2">
                  <button class="btn btn-outline-accent" type="button" on:click={submitSupport}>Trimite mesaj</button>
                </div>
              </div>
              <div>
                <h3 class="h6 fw-bold">Conversațiile mele</h3>
                {#if loadingMessages}
                  <div class="muted">Se încarcă conversațiile…</div>
                {:else if conversations.length === 0}
                  <div class="muted">Nu ai conversații încă.</div>
                {:else}
                  <div class="conversationList">
                    {#each conversations as conversation (conversation.id)}
                      <div class="conversationCard">
                        <div class="fw-bold">{conversation.subject}</div>
                        <div class="muted small">{conversation.status}</div>
                        {#if conversation.lastMessage}
                          <div class="small mt-1">{conversation.lastMessage.body}</div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="col-lg-4">
        <div class="panel sticky-summary">
          <div class="panel-head">
            <h2 class="h5 fw-bold m-0"><i class="bi bi-receipt"></i> Sumar</h2>
            {#if syncingCart}<span class="badge-soft">sync…</span>{/if}
          </div>

          <div class="summary-row"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <div class="summary-row"><span>Livrare</span><strong>{formatMoney(shippingFee)}</strong></div>
          <div class="summary-row summary-row--total"><span>Total</span><strong>{formatMoney(total)}</strong></div>

          {#if $auth.isAdmin}
            <div class="alert alert-warning mt-3 mb-0">Administratorii nu pot plasa comenzi.</div>
          {:else if $cart.items.length > 0}
            <form class="checkoutForm mt-3" on:submit={submitCheckout}>
              <input class="form-control" placeholder="Nume complet" bind:value={checkoutForm.fullName} required />
              <input class="form-control" placeholder="Telefon" bind:value={checkoutForm.phone} required />
              <select class="form-select" bind:value={checkoutForm.deliveryMethod}>
                <option value="pickup">Ridicare</option>
                <option value="delivery">Livrare</option>
              </select>
              <select class="form-select" bind:value={checkoutForm.paymentMethod}>
                <option value="CASH_ON_DELIVERY">Plată la livrare / ridicare</option>
                <option value="CARD">Card</option>
              </select>

              {#if checkoutForm.deliveryMethod === 'delivery'}
                <input class="form-control" placeholder="Adresa" bind:value={checkoutForm.addressLine1} required />
                <input class="form-control" placeholder="Detalii adresă" bind:value={checkoutForm.addressLine2} />
                <input class="form-control" placeholder="Oraș" bind:value={checkoutForm.city} required />
                <input class="form-control" placeholder="Județ" bind:value={checkoutForm.stateRegion} />
                <input class="form-control" placeholder="Cod poștal" bind:value={checkoutForm.postalCode} required />
              {/if}

              <textarea class="form-control" rows="3" bind:value={checkoutForm.customerMessage} placeholder="Observații pentru comandă sau mesaj pentru admin"></textarea>
              <button class="btn btn-accent w-100" type="submit" disabled={$cart.items.length === 0}>Finalizează comanda</button>
            </form>
          {/if}
        </div>

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <div class="panel mt-4">
            <div class="panel-head">
              <h2 class="h5 fw-bold m-0"><i class="bi bi-clock-history"></i> Comenzile mele</h2>
            </div>
            {#if loadingOrders}
              <div class="muted">Se încarcă comenzile…</div>
            {:else if orders.length === 0}
              <div class="muted">Nu ai comenzi încă.</div>
            {:else}
              <div class="orderList">
                {#each orders as order (order.id)}
                  <div class="orderCard">
                    <div class="fw-bold">{order.orderNumber}</div>
                    <div class="small muted">{new Date(order.createdAt).toLocaleString('ro-RO')}</div>
                    <div class="mt-2">Total: {order.total.toFixed(2)} {order.currency}</div>
                    <div class="small mt-1">Status: {order.status} · Plată: {order.paymentStatus} · Livrare: {order.fulfillmentStatus}</div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
    padding: 16px;
  }

  .panel-soft {
    background: rgba(36, 146, 204, 0.06);
    border-color: rgba(36, 146, 204, 0.18);
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .badge-soft {
    display: inline-flex;
    align-items: center;
    font-size: 0.78rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(36, 146, 204, 0.14);
    border: 1px solid rgba(36, 146, 204, 0.25);
    color: #2492cc;
    white-space: nowrap;
  }

  .cart-list {
    display: grid;
    gap: 12px;
  }

  .cart-row {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.02);
  }

  .cart-main {
    display: flex;
    gap: 12px;
    min-width: 0;
  }

  .thumb {
    width: 72px;
    height: 72px;
    border-radius: 14px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.05);
    display: grid;
    place-items: center;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cart-info {
    min-width: 0;
  }

  .cart-title {
    font-weight: 900;
  }

  .cart-sub, .muted {
    color: rgba(0, 0, 0, 0.65);
  }

  .cart-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
  }

  .qty {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(36, 146, 204, 0.35);
  }

  .qty-btn {
    border: 0;
    background: rgba(36, 146, 204, 0.1);
    width: 34px;
    height: 34px;
  }

  .qty-input {
    width: 58px;
    border: 0;
    text-align: center;
    height: 34px;
  }

  .link-danger {
    border: 0;
    background: transparent;
    color: #dc3545;
  }

  .cart-price {
    text-align: right;
    min-width: 120px;
  }

  .price {
    font-weight: 900;
    font-size: 1.05rem;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
  }

  .summary-row--total {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    margin-top: 6px;
    padding-top: 12px;
    font-size: 1.05rem;
  }

  .checkoutForm,
  .authGrid {
    display: grid;
    gap: 10px;
  }

  .authTabs {
    display: inline-flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .authTabs button {
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: #fff;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 700;
  }

  .authTabs button.active {
    background: rgba(36, 146, 204, 0.1);
    border-color: rgba(36, 146, 204, 0.35);
    color: #2492cc;
  }

  .supportGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .conversationList,
  .orderList {
    display: grid;
    gap: 10px;
  }

  .conversationCard,
  .orderCard {
    padding: 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.03);
  }

  .sticky-summary {
    position: sticky;
    top: 100px;
  }

  .empty-state {
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.02);
    padding: 18px;
  }

  .empty-title {
    font-weight: 900;
    font-size: 1.05rem;
  }

  .empty-sub {
    opacity: 0.75;
    margin-top: 4px;
  }
</style>


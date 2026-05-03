
<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';
  import MessageThread from '$lib/components/MessageThread.svelte';

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


  type ServerCartItem = {
    productId: string | number;
    name?: string;
    price?: number | string;
    quantity?: number | string;
    image_url?: string | null;
  };

  const SUPPORT_PHONE = '+40 729 969 822';
  const SUPPORT_PHONE_HREF = 'tel:+40729969822';
  const FREE_DELIVERY_THRESHOLD = 150;
  const DELIVERY_FEE = 20;

  let authMode: 'login' | 'register' = 'login';
  let authError = '';
  let checkoutError = '';
  let checkoutSuccess = '';
  let loadingOrders = false;
  let syncingCart = false;
  let serverSynced = false;
  let localCartChanged = false;
  let loadedDataForUserId = '';
  let authSubmitting = false;
  let checkoutSubmitting = false;
  let clearingCart = false;

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
    city: 'Cluj-Napoca',
    stateRegion: 'Cluj',
    postalCode: '',
    countryCode: 'RO',
    customerMessage: '',
  };

  let orders: OrderItem[] = [];

  function formatMoney(value: number) {
    return `${Number(value || 0).toFixed(2)} RON`;
  }

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';
    return date.toLocaleString('ro-RO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function statusLabel(value: string) {
    const labels: Record<string, string> = {
      PLACED: 'Plasată',
      PENDING: 'În așteptare',
      PAID: 'Plătită',
      CANCELLED: 'Anulată',
      COMPLETED: 'Finalizată',
      UNFULFILLED: 'Nepregătită',
      FULFILLED: 'Livrată',
      OPEN: 'Deschisă',
      CLOSED: 'Închisă',
    };

    return labels[value] ?? value;
  }

  function markLocalCartChanged() {
    localCartChanged = true;
    serverSynced = false;
  }

  function setQty(productId: string, quantity: number) {
    cart.setQuantity(productId, quantity);
    markLocalCartChanged();
  }

  function remove(productId: string) {
    cart.remove(productId);
    markLocalCartChanged();
  }

  async function clearCart() {
    checkoutError = '';
    checkoutSuccess = '';
    clearingCart = true;

    try {
      cart.clear();

      if ($auth.isAuthenticated && !$auth.isAdmin) {
        const res = await fetch('/api/cart', { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? 'Nu am putut goli coșul salvat.');
      }

      localCartChanged = false;
      serverSynced = true;
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : 'Nu am putut goli coșul.';
      localCartChanged = true;
      serverSynced = false;
    } finally {
      clearingCart = false;
    }
  }

  async function submitLogin(event: Event) {
    event.preventDefault();
    authError = '';
    authSubmitting = true;

    try {
      await auth.login({ identity: loginForm.identity, password: loginForm.password });
      serverSynced = false;
      await syncServerCart();
      await loadOrders();
    } catch (err) {
      authError = err instanceof Error ? err.message : 'Autentificarea a eșuat.';
    } finally {
      authSubmitting = false;
    }
  }

  async function submitRegister(event: Event) {
    event.preventDefault();
    authError = '';
    authSubmitting = true;

    try {
      await auth.register(registerForm);
      checkoutForm.fullName = registerForm.fullName;
      checkoutForm.phone = registerForm.phone;
      serverSynced = false;
      localCartChanged = true;
      await syncServerCart();
      await loadOrders();
    } catch (err) {
      authError = err instanceof Error ? err.message : 'Înregistrarea a eșuat.';
    } finally {
      authSubmitting = false;
    }
  }

  async function syncServerCart() {
    if (!$auth.isAuthenticated || $auth.isAdmin || !$cart.hydrated || syncingCart || serverSynced) return;

    syncingCart = true;
    try {
      if (localCartChanged || $cart.items.length > 0) {
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: $cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? 'Nu am putut sincroniza coșul.');
        localCartChanged = false;
      } else {
        const res = await fetch('/api/cart');
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.items) && data.items.length > 0) {
          cart.replace(
            data.items.map((item: ServerCartItem) => ({
              productId: String(item.productId),
              name: item.name ?? 'Produs',
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

  async function submitCheckout(event: Event) {
    event.preventDefault();
    checkoutError = '';
    checkoutSuccess = '';

    if ($cart.items.length === 0) {
      checkoutError = 'Coșul este gol.';
      return;
    }

    if (!$auth.isAuthenticated) {
      authMode = 'register';
      checkoutError = 'Creează un cont sau autentifică-te pentru finalizarea comenzii.';
      return;
    }

    if ($auth.isAdmin) {
      checkoutError = 'Administratorii nu pot plasa comenzi.';
      return;
    }

    checkoutSubmitting = true;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkoutForm,
          items: $cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Checkout-ul a eșuat.');

      checkoutSuccess = `Comanda ${data.order.orderNumber} a fost creată. Vei fi contactat pentru confirmare.`;
      cart.clear();
      localCartChanged = false;
      serverSynced = true;
      checkoutForm.customerMessage = '';
      await loadOrders();
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : 'Checkout-ul a eșuat.';
    } finally {
      checkoutSubmitting = false;
    }
  }

  $: itemCount = $cart.items.reduce((sum, item) => sum + item.quantity, 0);
  $: subtotal = $cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $: shippingFee = checkoutForm.deliveryMethod === 'delivery' ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : subtotal > 0 ? DELIVERY_FEE : 0) : 0;
  $: remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  $: total = subtotal + shippingFee;
  $: hasItems = $cart.items.length > 0;
  $: checkoutDisabled = !hasItems || checkoutSubmitting || syncingCart || !$auth.isAuthenticated || $auth.isAdmin;

  $: if ($auth.user) {
    checkoutForm.fullName = checkoutForm.fullName || $auth.user.fullName || '';
    checkoutForm.phone = checkoutForm.phone || $auth.user.phone || '';
  }

  $: if ($auth.isAuthenticated && !$auth.isAdmin && $cart.hydrated && !serverSynced) {
    void syncServerCart();
  }

  $: if ($auth.isAuthenticated && !$auth.isAdmin && String($auth.user?.id ?? '') !== loadedDataForUserId) {
    loadedDataForUserId = String($auth.user?.id ?? '');
    void loadOrders();
  }

  onMount(() => {
    if ($auth.isAuthenticated && !$auth.isAdmin) {
      loadedDataForUserId = String($auth.user?.id ?? '');
      void loadOrders();
    }
  });
</script>

<svelte:head>
  <title>Coș - DeSaga cu Legume</title>
</svelte:head>

<section class="cart-page py-4 pb-5">
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow m-0">Comandă DeSaga</p>
        <h1 class="h3 fw-bold m-0"><i class="bi bi-cart3"></i> Coșul tău</h1>
        <div class="muted mt-1">
          Verificăm stocul la finalizare. Pentru întrebări rapide: <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a>.
        </div>
      </div>
      <div class="head-actions">
        <div class="head-pill"><strong>{itemCount}</strong><span>produse</span></div>
        <div class="head-pill"><strong>{formatMoney(total)}</strong><span>estimat</span></div>
        <a href="/produse" class="btn btn-outline-accent">
          <i class="bi bi-arrow-left"></i> Continuă cumpărăturile
        </a>
        <button class="btn btn-outline-danger" type="button" on:click={clearCart} disabled={!hasItems || clearingCart}>
          <i class="bi bi-trash3"></i> {clearingCart ? 'Se golește…' : 'Golește coșul'}
        </button>
      </div>
    </div>

    {#if authError}<div class="alert alert-danger" role="alert">{authError}</div>{/if}
    {#if checkoutError}<div class="alert alert-danger" role="alert">{checkoutError}</div>{/if}
    {#if checkoutSuccess}<div class="alert alert-success" role="alert">{checkoutSuccess}</div>{/if}

    <div class="checkout-steps" aria-label="Pași checkout">
      <div class:done={hasItems} class="step">
        <span>1</span>
        <strong>Produse</strong>
      </div>
      <div class:done={$auth.isAuthenticated && !$auth.isAdmin} class="step">
        <span>2</span>
        <strong>Date client</strong>
      </div>
      <div class:done={checkoutSuccess} class="step">
        <span>3</span>
        <strong>Confirmare</strong>
      </div>
    </div>

    <div class="row g-4 align-items-start">
      <div class="col-lg-8">
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2 class="h5 fw-bold m-0"><i class="bi bi-basket"></i> Produse selectate</h2>
              {#if hasItems}
                <div class="muted small mt-1">{itemCount} produse în coș</div>
              {/if}
            </div>
            {#if syncingCart}
              <span class="badge-soft"><i class="bi bi-arrow-repeat"></i> Se salvează</span>
            {:else if serverSynced && $auth.isAuthenticated && !$auth.isAdmin}
              <span class="badge-soft"><i class="bi bi-check2-circle"></i> Salvat</span>
            {/if}
          </div>

          {#if !hasItems}
            <div class="empty-state">
              <div class="empty-icon"><i class="bi bi-basket"></i></div>
              <div>
                <div class="empty-title">Coșul este gol</div>
                <div class="empty-sub">
                  Alege produse disponibile azi sau sună pentru stocul actual. Produsele din coș pot fi finalizate cu ridicare sau livrare.
                </div>
                <div class="empty-actions">
                  <a href="/produse" class="btn btn-accent"><i class="bi bi-box"></i> Vezi produsele</a>
                  <a href={SUPPORT_PHONE_HREF} class="btn btn-outline-accent"><i class="bi bi-telephone"></i> Sună acum</a>
                </div>
              </div>
            </div>
          {:else}
            <div class="cart-list" role="list">
              {#each $cart.items as item (item.productId)}
                <div class="cart-row" role="listitem">
                  <div class="cart-main">
                    <a class="thumb" href={`/produse/${item.productId}`} aria-label={`Vezi ${item.name}`}>
                      {#if item.image_url}
                        <img src={item.image_url} alt={item.name} />
                      {:else}
                        <i class="bi bi-bag"></i>
                      {/if}
                    </a>
                    <div class="cart-info">
                      <a class="cart-title" href={`/produse/${item.productId}`}>{item.name}</a>
                      <div class="cart-sub">{formatMoney(item.price)} / buc</div>
                      <div class="cart-actions">
                        <div class="qty" aria-label={`Cantitate pentru ${item.name}`}>
                          <button class="qty-btn" type="button" aria-label="Scade cantitatea" on:click={() => setQty(item.productId, item.quantity - 1)}>
                            <i class="bi bi-dash"></i>
                          </button>
                          <input
                            class="qty-input"
                            inputmode="numeric"
                            min="0"
                            max="999"
                            aria-label="Cantitate"
                            value={item.quantity}
                            on:input={(e) => setQty(item.productId, Number((e.target as HTMLInputElement).value))}
                          />
                          <button class="qty-btn" type="button" aria-label="Crește cantitatea" on:click={() => setQty(item.productId, item.quantity + 1)}>
                            <i class="bi bi-plus"></i>
                          </button>
                        </div>
                        <button class="remove-btn" type="button" on:click={() => remove(item.productId)}>
                          <i class="bi bi-x-lg"></i> Elimină
                        </button>
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

        {#if hasItems && !$auth.isAuthenticated}
          <div class="panel panel-soft mt-4" id="auth-panel">
            <div class="panel-head">
              <div>
                <h2 class="h5 fw-bold m-0"><i class="bi bi-person-lock"></i> Date client</h2>
                <div class="muted small mt-1">Contul păstrează coșul, comenzile și conversația cu adminul.</div>
              </div>
            </div>

            <div class="authTabs" role="tablist" aria-label="Autentificare sau înregistrare">
              <button type="button" class:active={authMode === 'login'} on:click={() => (authMode = 'login')}>Am cont</button>
              <button type="button" class:active={authMode === 'register'} on:click={() => (authMode = 'register')}>Creez cont</button>
            </div>

            {#if authMode === 'login'}
              <form class="authGrid" on:submit={submitLogin}>
                <label>
                  <span>Email sau username</span>
                  <input class="form-control" autocomplete="username" bind:value={loginForm.identity} required />
                </label>
                <label>
                  <span>Parolă</span>
                  <input class="form-control" type="password" autocomplete="current-password" bind:value={loginForm.password} required />
                </label>
                <button class="btn btn-primary" type="submit" disabled={authSubmitting}>
                  {authSubmitting ? 'Se autentifică…' : 'Autentificare'}
                </button>
              </form>
            {:else}
              <form class="authGrid" on:submit={submitRegister}>
                <label>
                  <span>Nume complet</span>
                  <input class="form-control" autocomplete="name" bind:value={registerForm.fullName} required />
                </label>
                <label>
                  <span>Telefon</span>
                  <input class="form-control" autocomplete="tel" bind:value={registerForm.phone} required />
                </label>
                <label>
                  <span>Username</span>
                  <input class="form-control" autocomplete="username" bind:value={registerForm.username} />
                </label>
                <label>
                  <span>Email</span>
                  <input class="form-control" type="email" autocomplete="email" bind:value={registerForm.email} required />
                </label>
                <label>
                  <span>Parolă</span>
                  <input class="form-control" type="password" autocomplete="new-password" bind:value={registerForm.password} required />
                </label>
                <button class="btn btn-primary" type="submit" disabled={authSubmitting}>
                  {authSubmitting ? 'Se creează contul…' : 'Creează cont'}
                </button>
              </form>
            {/if}
          </div>
        {/if}

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <div class="panel panel-messages mt-4">
            <MessageThread
              mode="user"
              expanded={true}
              collapsible={false}
              {orders}
              title="Mesaje cu adminul"
              subtitle="Alege o comandă sau începe un mesaj general. Răspunsurile apar în același fir."
            />
          </div>
        {/if}
      </div>

      <div class="col-lg-4">
        <div class="panel summary-panel">
          <div class="panel-head">
            <div>
              <h2 class="h5 fw-bold m-0"><i class="bi bi-receipt"></i> Sumar comandă</h2>
              <div class="muted small mt-1">Prețurile sunt recalculate pe server la finalizare.</div>
            </div>
          </div>

          <div class="summary-row"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <div class="summary-row">
            <span>{checkoutForm.deliveryMethod === 'delivery' ? 'Livrare' : 'Ridicare'}</span>
            <strong>{formatMoney(shippingFee)}</strong>
          </div>
          <div class="summary-row summary-row--total"><span>Total estimat</span><strong>{formatMoney(total)}</strong></div>

          {#if checkoutForm.deliveryMethod === 'delivery' && subtotal > 0 && remainingForFreeDelivery > 0}
            <div class="delivery-hint">
              Adaugă produse de {formatMoney(remainingForFreeDelivery)} pentru livrare gratuită.
            </div>
          {:else if checkoutForm.deliveryMethod === 'delivery' && subtotal >= FREE_DELIVERY_THRESHOLD}
            <div class="delivery-hint success">Livrare gratuită aplicată.</div>
          {/if}

          {#if $auth.isAdmin}
            <div class="alert alert-warning mt-3 mb-0">Administratorii nu pot plasa comenzi.</div>
          {:else if hasItems}
            <form class="checkoutForm mt-3" on:submit={submitCheckout}>
              <label>
                <span>Nume complet</span>
                <input class="form-control" autocomplete="name" bind:value={checkoutForm.fullName} required />
              </label>
              <label>
                <span>Telefon</span>
                <input class="form-control" autocomplete="tel" bind:value={checkoutForm.phone} required />
              </label>
              <label>
                <span>Metodă primire</span>
                <select class="form-select" bind:value={checkoutForm.deliveryMethod}>
                  <option value="pickup">Ridicare de la rulota DeSaga</option>
                  <option value="delivery">Livrare în Cluj-Napoca</option>
                </select>
              </label>
              <input type="hidden" bind:value={checkoutForm.paymentMethod} />

              {#if checkoutForm.deliveryMethod === 'pickup'}
                <div class="pickup-box">
                  <strong>Ridicare:</strong> Str. Constantin Brâncuși nr. 153, Cluj-Napoca. Program L–V, 9:00–18:00.
                </div>
              {:else}
                <label>
                  <span>Adresa</span>
                  <input class="form-control" autocomplete="street-address" bind:value={checkoutForm.addressLine1} required />
                </label>
                <label>
                  <span>Detalii adresă</span>
                  <input class="form-control" placeholder="Bloc, scară, etaj, reper" bind:value={checkoutForm.addressLine2} />
                </label>
                <label>
                  <span>Oraș</span>
                  <input class="form-control" autocomplete="address-level2" bind:value={checkoutForm.city} required />
                </label>
                <label>
                  <span>Județ</span>
                  <input class="form-control" autocomplete="address-level1" bind:value={checkoutForm.stateRegion} />
                </label>
                <label>
                  <span>Cod poștal</span>
                  <input class="form-control" autocomplete="postal-code" bind:value={checkoutForm.postalCode} required />
                </label>
              {/if}

              <label>
                <span>Observații</span>
                <textarea class="form-control" rows="3" bind:value={checkoutForm.customerMessage} placeholder="Interval preferat, produse alternative, mesaj pentru admin"></textarea>
              </label>

              {#if !$auth.isAuthenticated}
                <div class="checkout-note">
                  Autentificarea este necesară pentru finalizare. Datele comenzii rămân în coș după login sau înregistrare.
                </div>
              {/if}

              <button class="btn btn-accent w-100" type="submit" disabled={checkoutDisabled}>
                {#if checkoutSubmitting}
                  Se finalizează…
                {:else if !$auth.isAuthenticated}
                  Autentifică-te pentru finalizare
                {:else}
                  Finalizează comanda
                {/if}
              </button>

              <a class="phone-fallback" href={SUPPORT_PHONE_HREF}>
                <i class="bi bi-telephone"></i> Comandă telefonic: {SUPPORT_PHONE}
              </a>
            </form>
          {:else}
            <div class="summary-empty">
              <div class="fw-bold">Adaugă produse pentru checkout.</div>
              <a href="/produse" class="btn btn-outline-accent btn-sm mt-2">Vezi stocul</a>
            </div>
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
                    <div class="orderTop">
                      <div class="fw-bold">{order.orderNumber}</div>
                      <span>{statusLabel(order.status)}</span>
                    </div>
                    <div class="small muted">{formatDate(order.createdAt)}</div>
                    <div class="mt-2">Total: {order.total.toFixed(2)} {order.currency}</div>
                    <div class="small mt-1 muted">
                      Plată: {statusLabel(order.paymentStatus)} · Livrare: {statusLabel(order.fulfillmentStatus)}
                    </div>
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
  .cart-page {
    background: linear-gradient(180deg, rgba(36, 146, 204, 0.05), rgba(255, 255, 255, 0));
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .eyebrow {
    color: var(--desaga-blue);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .head-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
    padding: 16px;
  }



  .head-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 38px;
    padding: 0.4rem 0.7rem;
    border-radius: 999px;
    border: 1px solid rgba(36, 146, 204, 0.18);
    background: rgba(36, 146, 204, 0.08);
    color: rgba(0, 0, 0, 0.66);
    font-size: 0.86rem;
    font-weight: 850;
  }

  .head-pill strong {
    color: var(--desaga-heading);
    font-weight: 950;
  }

  .panel-messages {
    padding: 0;
    overflow: hidden;
  }

  .summary-panel {
    position: sticky;
    top: 1rem;
  }

  .panel-soft {
    background: rgba(36, 146, 204, 0.06);
    border-color: rgba(36, 146, 204, 0.18);
  }

  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .muted,
  .cart-sub {
    color: rgba(0, 0, 0, 0.65);
  }

  .muted a {
    color: var(--desaga-blue);
    font-weight: 800;
    text-decoration: none;
  }

  .badge-soft {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    background: rgba(36, 146, 204, 0.14);
    border: 1px solid rgba(36, 146, 204, 0.25);
    color: #2492cc;
    white-space: nowrap;
    font-weight: 800;
  }

  .checkout-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    background: rgba(255, 255, 255, 0.78);
    color: rgba(0, 0, 0, 0.62);
  }

  .step span {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
    font-weight: 900;
  }

  .step.done {
    color: var(--desaga-blue);
    border-color: rgba(36, 146, 204, 0.24);
    background: rgba(36, 146, 204, 0.08);
  }

  .step.done span {
    color: #fff;
    background: var(--desaga-blue);
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
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .cart-main {
    display: flex;
    gap: 12px;
    min-width: 0;
  }

  .thumb {
    width: 78px;
    height: 78px;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.05);
    display: grid;
    place-items: center;
    color: rgba(0, 0, 0, 0.45);
    flex: 0 0 auto;
    text-decoration: none;
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
    display: inline-block;
    font-weight: 900;
    color: inherit;
    text-decoration: none;
  }

  .cart-title:hover {
    color: var(--desaga-blue);
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
    background: #fff;
  }

  .qty-btn {
    border: 0;
    background: rgba(36, 146, 204, 0.1);
    width: 36px;
    height: 36px;
    color: var(--desaga-blue);
    font-weight: 900;
  }

  .qty-input {
    width: 56px;
    border: 0;
    text-align: center;
    height: 36px;
    font-weight: 900;
  }

  .remove-btn {
    border: 0;
    background: transparent;
    color: #dc3545;
    font-weight: 800;
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
    font-size: 1.08rem;
  }

  .delivery-hint,
  .checkout-note,
  .pickup-box,
  .summary-empty {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(36, 146, 204, 0.08);
    border: 1px solid rgba(36, 146, 204, 0.16);
    color: rgba(0, 0, 0, 0.72);
    font-size: 0.9rem;
  }

  .delivery-hint.success {
    background: rgba(25, 135, 84, 0.08);
    border-color: rgba(25, 135, 84, 0.18);
  }

  .checkoutForm,
  .authGrid {
    display: grid;
    gap: 10px;
  }

  .checkoutForm label,
  .authGrid label {
    display: grid;
    gap: 5px;
    font-size: 0.9rem;
    font-weight: 800;
  }

  .field-label {
    display: inline-block;
    margin-bottom: 5px;
    font-size: 0.9rem;
    font-weight: 800;
  }

  .authTabs {
    display: inline-flex;
    gap: 8px;
    margin-bottom: 12px;
    padding: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .authTabs button {
    border: 0;
    background: transparent;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 800;
  }

  .authTabs button.active {
    background: rgba(36, 146, 204, 0.14);
    color: #2492cc;
  }

  .orderList {
    display: grid;
    gap: 10px;
  }

  .orderCard {
    padding: 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .orderTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .orderTop span {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(36, 146, 204, 0.1);
    color: var(--desaga-blue);
    font-size: 0.75rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .phone-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--desaga-blue);
    font-weight: 900;
    text-decoration: none;
    margin-top: 2px;
  }



  .empty-state {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.02);
    padding: 18px;
  }

  .empty-icon {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: rgba(36, 146, 204, 0.12);
    color: var(--desaga-blue);
    flex: 0 0 auto;
    font-size: 1.25rem;
  }

  .empty-title {
    font-weight: 900;
    font-size: 1.08rem;
  }

  .empty-sub {
    opacity: 0.78;
    margin-top: 4px;
  }

  .empty-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  @media (max-width: 991.98px) {}

  @media (max-width: 767.98px) {
    .checkout-steps {
      grid-template-columns: 1fr;
    }

    .cart-row,
    .empty-state {
      flex-direction: column;
    }

    .cart-price {
      width: 100%;
      text-align: left;
      min-width: 0;
    }

    .head-actions {
      width: 100%;
    }

    .head-actions .btn,
    .head-pill {
      flex: 1 1 auto;
      justify-content: center;
    }

    .summary-panel {
      position: static;
    }
  }
</style>

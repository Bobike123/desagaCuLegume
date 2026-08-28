
<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_CATEGORY_SLUG } from '$lib/categories';
  import { computeCartSummary, DEFAULT_SHIPPING_RULES, type ShippingRules } from '$lib/cart-summary';
  import { apiFetch } from '$lib/api-client';
  import { formatMoney } from '$lib/format';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';
  import CartItemsList from '$lib/components/cart/CartItemsList.svelte';
  import OrderHistory from '$lib/components/cart/OrderHistory.svelte';
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
    images?: Array<{ url?: string | null; image_url?: string | null } | string> | null;
    measure_unit?: string | null;
    promotion_label?: string | null;
    category?: string | null;
    in_stock?: boolean | null;
  };

  const SUPPORT_PHONE = '+40 729 969 822';
  const SUPPORT_PHONE_HREF = 'tel:+40729969822';

  let checkoutError = '';
  let checkoutSuccess = '';
  let loadingOrders = false;
  let syncingCart = false;
  let serverSynced = false;
  let localCartChanged = false;
  let loadedDataForUserId = '';
  let checkoutSubmitting = false;
  let clearingCart = false;
  let checkoutAttemptKey = '';

  let checkoutForm = {
    fullName: '',
    phone: '',
    email: '',
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

  function markLocalCartChanged() {
    localCartChanged = true;
    serverSynced = false;
    checkoutAttemptKey = '';
  }

  function getCheckoutAttemptKey() {
    checkoutAttemptKey ||= crypto.randomUUID();
    return checkoutAttemptKey;
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
              images: item.images ?? [],
              category: item.category ?? DEFAULT_CATEGORY_SLUG,
              measure_unit: item.measure_unit ?? 'PER_KG',
              promotion_label: item.promotion_label ?? 'NONE',
              in_stock: item.in_stock ?? true,
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
      const res = await fetch('/api/orders?limit=100');
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

    if ($auth.isAdmin) {
      checkoutError = 'Administratorii nu pot plasa comenzi.';
      return;
    }

    checkoutSubmitting = true;

    try {
      const idempotencyKey = getCheckoutAttemptKey();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          ...checkoutForm,
          idempotencyKey,
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
      checkoutAttemptKey = '';
      await loadOrders();
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : 'Checkout-ul a eșuat.';
    } finally {
      checkoutSubmitting = false;
    }
  }

  let shippingRules: ShippingRules = { ...DEFAULT_SHIPPING_RULES };

  async function loadShippingRules() {
    try {
      const data = await apiFetch<{ shipping?: Partial<ShippingRules> }>('/api/config');
      shippingRules = {
        freeDeliveryThreshold: Number(data?.shipping?.freeDeliveryThreshold ?? DEFAULT_SHIPPING_RULES.freeDeliveryThreshold),
        deliveryFee: Number(data?.shipping?.deliveryFee ?? DEFAULT_SHIPPING_RULES.deliveryFee),
      };
    } catch {
      shippingRules = { ...DEFAULT_SHIPPING_RULES };
    }
  }

  $: ({ itemCount, subtotal, shippingFee, remainingForFreeDelivery, total } = computeCartSummary(
    $cart.items,
    checkoutForm.deliveryMethod,
    shippingRules
  ));
  $: hasItems = $cart.items.length > 0;
  $: checkoutDisabled = !hasItems || checkoutSubmitting || syncingCart || $auth.loading || $auth.isAdmin;

  $: if ($auth.user) {
    checkoutForm.fullName = checkoutForm.fullName || $auth.user.fullName || '';
    checkoutForm.phone = checkoutForm.phone || $auth.user.phone || '';
    checkoutForm.email = checkoutForm.email || $auth.user.email || '';
  }

  $: if ($auth.isAuthenticated && !$auth.isAdmin && $cart.hydrated && !serverSynced) {
    void syncServerCart();
  }

  $: if ($auth.isAuthenticated && !$auth.isAdmin && String($auth.user?.id ?? '') !== loadedDataForUserId) {
    loadedDataForUserId = String($auth.user?.id ?? '');
    void loadOrders();
  }

  onMount(() => {
    void loadShippingRules();
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

    {#if checkoutError}<div class="alert alert-danger" role="alert">{checkoutError}</div>{/if}
    {#if checkoutSuccess}<div class="alert alert-success" role="alert">{checkoutSuccess}</div>{/if}

    <div class="checkout-steps" aria-label="Pași checkout">
      <div class:done={hasItems} class="step">
        <span>1</span>
        <strong>Produse</strong>
      </div>
      <div class:done={Boolean(checkoutForm.fullName.trim() && checkoutForm.phone.trim())} class="step">
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
            <CartItemsList items={$cart.items} onQuantityChange={setQty} onRemove={remove} />
          {/if}
        </div>

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <div class="panel panel-messages mt-4">
            <MessageThread
              mode="user"
              expanded={true}
              collapsible={false}
              {orders}
              ready={$auth.isAuthenticated && !$auth.isAdmin && !loadingOrders}
              ordersReady={true}
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
          {:else if checkoutForm.deliveryMethod === 'delivery' && subtotal >= shippingRules.freeDeliveryThreshold}
            <div class="delivery-hint success">Livrare gratuită aplicată.</div>
          {/if}

          {#if $auth.isAdmin}
            <div class="alert alert-warning mt-3 mb-0">Administratorii nu pot plasa comenzi.</div>
          {:else if hasItems}
            <form class="checkoutForm mt-3" on:submit={submitCheckout}>
              <label>
                <span>Nume</span>
                <input class="form-control" autocomplete="name" bind:value={checkoutForm.fullName} required />
              </label>
              <label>
                <span>Telefon</span>
                <input class="form-control" autocomplete="tel" bind:value={checkoutForm.phone} required />
              </label>
              <label>
                <span>Email <small>(opțional)</small></span>
                <input class="form-control" type="email" autocomplete="email" bind:value={checkoutForm.email} />
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
                  Poți finaliza fără cont. Comanda nu va fi legată de un utilizator și va fi prelucrată normal.
                </div>
              {/if}

              <button class="btn btn-accent w-100" type="submit" disabled={checkoutDisabled}>
                {#if checkoutSubmitting}
                  Se finalizează…
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
            <OrderHistory {orders} loading={loadingOrders} />
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .cart-page {
    background: var(--paper);
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
    font-weight: 700;
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
    border-radius: var(--radius);
    border: 1px solid var(--line);
    padding: 16px;
  }



  .head-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 38px;
    padding: 0.4rem 0.7rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(181, 42, 47, 0.18);
    background: rgba(28, 26, 23, 0.04);
    color: rgba(0, 0, 0, 0.66);
    font-size: 0.86rem;
    font-weight: 600;
  }

  .head-pill strong {
    color: var(--desaga-heading);
    font-weight: 700;
  }

  .panel-messages {
    padding: 0;
    overflow: hidden;
  }

  .summary-panel {
    position: sticky;
    top: 1rem;
  }

  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .muted {
    color: rgba(0, 0, 0, 0.65);
  }

  .muted a {
    color: var(--desaga-blue);
    font-weight: 600;
    text-decoration: none;
  }

  .badge-soft {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    padding: 0.28rem 0.6rem;
    border-radius: var(--radius-sm);
    background: rgba(181, 42, 47, 0.14);
    border: 1px solid rgba(181, 42, 47, 0.25);
    color: var(--tomato-ink);
    white-space: nowrap;
    font-weight: 600;
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
    border-radius: var(--radius);
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.78);
    color: rgba(0, 0, 0, 0.62);
  }

  .step span {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-lg);
    background: rgba(0, 0, 0, 0.08);
    font-weight: 700;
  }

  .step.done {
    color: var(--desaga-blue);
    border-color: rgba(181, 42, 47, 0.24);
    background: rgba(28, 26, 23, 0.04);
  }

  .step.done span {
    color: #fff;
    background: var(--desaga-blue);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
  }

  .summary-row--total {
    border-top: 1px solid var(--line);
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
    border-radius: var(--radius);
    background: rgba(28, 26, 23, 0.04);
    border: 1px solid rgba(181, 42, 47, 0.16);
    color: rgba(0, 0, 0, 0.72);
    font-size: 0.9rem;
  }

  .delivery-hint.success {
    background: rgba(25, 135, 84, 0.08);
    border-color: rgba(25, 135, 84, 0.18);
  }

  .checkoutForm {
    display: grid;
    gap: 10px;
  }

  .checkoutForm label {
    display: grid;
    gap: 5px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .phone-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--desaga-blue);
    font-weight: 700;
    text-decoration: none;
    margin-top: 2px;
  }



  .empty-state {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    border-radius: var(--radius);
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.02);
    padding: 18px;
  }

  .empty-icon {
    width: 46px;
    height: 46px;
    border-radius: var(--radius);
    display: grid;
    place-items: center;
    background: rgba(28, 26, 23, 0.04);
    color: var(--desaga-blue);
    flex: 0 0 auto;
    font-size: 1.25rem;
  }

  .empty-title {
    font-weight: 700;
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

    .empty-state {
      flex-direction: column;
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

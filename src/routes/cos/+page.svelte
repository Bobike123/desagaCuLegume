<!-- FILE: src/routes/cos/+page.svelte -->
<script lang="ts">
    // UI ONLY (no store, no API)
    type CartItem = {
        id: string;
        name: string;
        unit: string; // e.g. "kg", "buc"
        price: number; // RON
        qty: number;
        note?: string;
    };

    let items: CartItem[] = [
        { id: "1", name: "Roșii", unit: "kg", price: 18, qty: 1 },
        { id: "2", name: "Castraveți", unit: "kg", price: 12, qty: 2 },
        { id: "3", name: "Salată verde", unit: "buc", price: 6, qty: 1 },
    ];

    let method: "pickup" | "delivery" = "pickup";

    // WIP rules (replace later)
    const rules = {
        freeDeliveryMin: 150, // RON (placeholder)
        minimumOrderDelivery: 60, // RON (placeholder)
        stampCard: true,
        deliveryPricingHint:
            "Costul livrării se calculează în funcție de valoarea comenzii. (în lucru)",
    };

    let customer = {
        name: "",
        phone: "",
        address: "",
        details: "",
    };

    const clampQty = (n: number) =>
        Math.max(0, Math.min(999, Math.floor(n || 0)));

    function inc(id: string) {
        items = items.map((it) =>
            it.id === id ? { ...it, qty: clampQty(it.qty + 1) } : it,
        );
    }
    function dec(id: string) {
        items = items.map((it) =>
            it.id === id ? { ...it, qty: clampQty(it.qty - 1) } : it,
        );
    }
    function setQty(id: string, v: string) {
        const n = clampQty(Number(v));
        items = items.map((it) => (it.id === id ? { ...it, qty: n } : it));
    }
    function remove(id: string) {
        items = items.filter((it) => it.id !== id);
    }
    function clear() {
        items = [];
    }

    $: lineTotal = (it: CartItem) => it.price * it.qty;
    $: subtotal = items.reduce((s, it) => s + lineTotal(it), 0);

    // Delivery fee UI only
    $: deliveryFee =
        method === "delivery"
            ? subtotal >= rules.freeDeliveryMin
                ? 0
                : subtotal >= 120
                  ? 15
                  : subtotal > 0
                    ? 25
                    : 0
            : 0;

    $: total = subtotal + deliveryFee;

    $: deliveryBlocked =
        method === "delivery" &&
        subtotal > 0 &&
        subtotal < rules.minimumOrderDelivery;

    function formatRON(n: number) {
        return `${n.toFixed(2)} RON`;
    }
</script>

<svelte:head>
    <title>Coș - DeSaga cu Legume</title>
</svelte:head>

<section class="pt-4 pb-5">
    <div class="container">
        <div class="page-head">
            <div>
                <h1 class="h3 fw-bold m-0"><i class="bi bi-cart3"></i> Coș</h1>
                <div class="muted mt-1">
                    UI demo. Conectarea la produse/comenzi urmează.
                </div>
            </div>

            <div class="d-flex gap-2 flex-wrap">
                <a href="/produse" class="btn btn-outline-accent">
                    <i class="bi bi-arrow-left"></i> Continuă cumpărăturile
                </a>
                <button
                    class="btn btn-outline-accent"
                    type="button"
                    on:click={clear}
                    disabled={items.length === 0}
                >
                    <i class="bi bi-trash3"></i> Golește coșul
                </button>
            </div>
        </div>

        <div class="row g-4 align-items-stretch">
            <!-- Left: items -->
            <div class="col-lg-8">
                <div class="panel">
                    <div class="panel-head">
                        <h2 class="h5 fw-bold m-0">
                            <i class="bi bi-basket"></i> Produse
                        </h2>
                        <span class="badge-soft">{items.length} poziții</span>
                    </div>

                    {#if items.length === 0}
                        <div class="empty-state">
                            <div class="empty-title">Coșul este gol</div>
                            <div class="empty-sub">
                                Adaugă produse din listă.
                            </div>
                            <a href="/produse" class="btn btn-accent mt-3">
                                <i class="bi bi-box"></i> Vezi produsele
                            </a>
                        </div>
                    {:else}
                        <div class="cart-list" role="list">
                            {#each items as it (it.id)}
                                <div class="cart-row" role="listitem">
                                    <div class="cart-main">
                                        <div class="thumb" aria-hidden="true">
                                            <i class="bi bi-bag"></i>
                                        </div>

                                        <div class="cart-info">
                                            <div class="cart-title">
                                                {it.name}
                                            </div>
                                            <div class="cart-sub">
                                                {formatRON(it.price)} / {it.unit}
                                            </div>

                                            <div class="cart-actions">
                                                <div class="qty">
                                                    <button
                                                        class="qty-btn"
                                                        type="button"
                                                        aria-label="Minus"
                                                        on:click={() =>
                                                            dec(it.id)}
                                                    >
                                                        <i class="bi bi-dash"
                                                        ></i>
                                                    </button>

                                                    <input
                                                        class="qty-input"
                                                        inputmode="numeric"
                                                        value={it.qty}
                                                        on:input={(e) =>
                                                            setQty(
                                                                it.id,
                                                                (
                                                                    e.target as HTMLInputElement
                                                                ).value,
                                                            )}
                                                        aria-label="Cantitate"
                                                    />

                                                    <button
                                                        class="qty-btn"
                                                        type="button"
                                                        aria-label="Plus"
                                                        on:click={() =>
                                                            inc(it.id)}
                                                    >
                                                        <i class="bi bi-plus"
                                                        ></i>
                                                    </button>
                                                </div>

                                                <button
                                                    class="link-danger"
                                                    type="button"
                                                    on:click={() =>
                                                        remove(it.id)}
                                                >
                                                    <i class="bi bi-x-lg"></i> Elimină
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="cart-price">
                                        <div class="price">
                                            {formatRON(lineTotal(it))}
                                        </div>
                                        <div class="muted small">
                                            Total linie
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Method + rules -->
                <div class="panel panel-soft mt-4">
                    <div class="panel-head">
                        <h2 class="h5 fw-bold m-0">
                            <i class="bi bi-truck"></i> Metodă
                        </h2>
                        <span class="badge-soft">în lucru</span>
                    </div>

                    <div
                        class="method-grid"
                        role="radiogroup"
                        aria-label="Metodă livrare"
                    >
                        <button
                            type="button"
                            class={"method " +
                                (method === "pickup" ? "active" : "")}
                            on:click={() => (method = "pickup")}
                            aria-pressed={method === "pickup"}
                        >
                            <div class="method-icon">
                                <i class="bi bi-shop-window"></i>
                            </div>
                            <div class="method-text">
                                <div class="method-title">Pick-up rulota</div>
                                <div class="method-sub">
                                    Ridicare din rulota DeSaga. {#if rules.stampCard}Cartonaș
                                        cu ștampile (premii în lucru).{/if}
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            class={"method " +
                                (method === "delivery" ? "active" : "")}
                            on:click={() => (method = "delivery")}
                            aria-pressed={method === "delivery"}
                        >
                            <div class="method-icon">
                                <i class="bi bi-truck"></i>
                            </div>
                            <div class="method-text">
                                <div class="method-title">Livrare</div>
                                <div class="method-sub">
                                    {rules.deliveryPricingHint}
                                </div>
                            </div>
                        </button>
                    </div>

                    <div class="rule-strip mt-3">
                        <div class="rule-row">
                            <i class="bi bi-gift"></i>
                            <div class="rule-text">
                                <div class="rule-title">Livrare gratuită</div>
                                <div class="rule-sub">
                                    Prag minim: <strong
                                        >{rules.freeDeliveryMin} RON</strong
                                    >
                                </div>
                            </div>
                        </div>

                        <div class="rule-row">
                            <i class="bi bi-bag"></i>
                            <div class="rule-text">
                                <div class="rule-title">
                                    Comandă minimă (livrare)
                                </div>
                                <div class="rule-sub">
                                    <strong
                                        >{rules.minimumOrderDelivery} RON</strong
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    {#if deliveryBlocked}
                        <div class="alert-soft mt-3" role="alert">
                            <div class="alert-icon">
                                <i class="bi bi-exclamation-triangle"></i>
                            </div>
                            <div>
                                Comanda este sub minimul pentru livrare. Alege
                                pick-up sau adaugă produse.
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Customer details -->
                <div class="panel mt-4">
                    <div class="panel-head">
                        <h2 class="h5 fw-bold m-0">
                            <i class="bi bi-person-lines-fill"></i> Date pentru comandă
                        </h2>
                    </div>

                    <div class="form-grid">
                        <label class="field">
                            <span class="label">Nume</span>
                            <input
                                class="input"
                                placeholder="Nume și prenume"
                                bind:value={customer.name}
                            />
                        </label>

                        <label class="field">
                            <span class="label">Telefon</span>
                            <input
                                class="input"
                                placeholder="07xx xxx xxx"
                                bind:value={customer.phone}
                            />
                        </label>

                        <label class="field span-2">
                            <span class="label"
                                >Adresă (doar pentru livrare)</span
                            >
                            <input
                                class="input"
                                placeholder="Stradă, număr, bloc, scara, ap."
                                bind:value={customer.address}
                            />
                        </label>

                        <label class="field span-2">
                            <span class="label">Detalii</span>
                            <textarea
                                class="input"
                                rows="3"
                                placeholder="Observații (interval, interfon, etc.)"
                                bind:value={customer.details}
                            ></textarea>
                        </label>
                    </div>

                    <div class="muted small mt-2">
                        UI only. Validarea și trimiterea comenzii urmează.
                    </div>
                </div>
            </div>

            <!-- Right: summary -->
            <div class="col-lg-4">
                <div class="panel sticky">
                    <div class="panel-head">
                        <h2 class="h5 fw-bold m-0">
                            <i class="bi bi-receipt"></i> Rezumat
                        </h2>
                    </div>

                    <div class="sum">
                        <div class="sum-row">
                            <div class="muted">Subtotal</div>
                            <div class="fw-bold">{formatRON(subtotal)}</div>
                        </div>

                        <div class="sum-row">
                            <div class="muted">Metodă</div>
                            <div class="fw-bold">
                                {method === "pickup" ? "Pick-up" : "Livrare"}
                            </div>
                        </div>

                        <div class="sum-row">
                            <div class="muted">Cost livrare</div>
                            <div class="fw-bold">{formatRON(deliveryFee)}</div>
                        </div>

                        <div class="divider"></div>

                        <div class="sum-row total">
                            <div>Total</div>
                            <div>{formatRON(total)}</div>
                        </div>

                        <button
                            class="btn btn-accent w-100 mt-3"
                            type="button"
                            disabled={items.length === 0 || deliveryBlocked}
                        >
                            <i class="bi bi-check2-circle"></i> Plasează comanda
                        </button>

                        <div class="muted small mt-2">
                            Buton demonstrativ. Checkout-ul urmează.
                        </div>
                    </div>
                </div>

                <div class="panel panel-soft mt-4">
                    <div class="panel-head">
                        <h2 class="h6 fw-bold m-0">
                            <i class="bi bi-info-circle"></i> Info
                        </h2>
                    </div>

                    <div class="info-list">
                        <div class="info-row">
                            <i class="bi bi-clock"></i>
                            <div>
                                <div class="fw-bold">Program</div>
                                <div class="muted small">L–V: 9:00 – 18:00</div>
                            </div>
                        </div>

                        <div class="info-row">
                            <i class="bi bi-geo-alt"></i>
                            <div>
                                <div class="fw-bold">Pick-up</div>
                                <div class="muted small">
                                    Cluj-Napoca, Str. Constantin Brâncuși nr.
                                    153
                                </div>
                            </div>
                        </div>

                        <a
                            class="btn btn-outline-accent w-100 mt-2"
                            href="/contact"
                        >
                            <i class="bi bi-chat-dots"></i> Contact
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    :global(:root) {
        --accent: var(--desaga-blue, #2492cc);
        --accent-rgb: 36, 146, 204;
    }

    .page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .muted {
        opacity: 0.75;
    }

    .badge-soft {
        display: inline-flex;
        align-items: center;
        font-size: 0.78rem;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        background: rgba(var(--accent-rgb), 0.14);
        border: 1px solid rgba(var(--accent-rgb), 0.25);
        color: var(--accent);
        white-space: nowrap;
    }

    .panel {
        background: #fff;
        border-radius: 18px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
        padding: 16px;
        height: 100%;
    }

    .panel-soft {
        background: rgba(var(--accent-rgb), 0.06);
        border-color: rgba(var(--accent-rgb), 0.18);
    }

    .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
    }

    .cart-list {
        display: grid;
        gap: 10px;
    }

    .cart-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(0, 0, 0, 0.02);
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .cart-main {
        display: flex;
        gap: 12px;
        min-width: 0;
        flex: 1;
    }

    .thumb {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: rgba(var(--accent-rgb), 0.14);
        color: var(--accent);
        flex: 0 0 auto;
    }

    .cart-info {
        min-width: 0;
    }

    .cart-title {
        font-weight: 900;
        line-height: 1.2;
    }

    .cart-sub {
        font-size: 0.92rem;
        opacity: 0.75;
        margin-top: 2px;
    }

    .cart-actions {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 10px;
    }

    .qty {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: #fff;
        overflow: hidden;
    }

    .qty-btn {
        width: 36px;
        height: 34px;
        border: 0;
        background: transparent;
        display: grid;
        place-items: center;
    }

    .qty-input {
        width: 56px;
        height: 34px;
        border: 0;
        text-align: center;
        outline: none;
    }

    .link-danger {
        border: 0;
        background: transparent;
        color: #b42318;
        font-weight: 700;
        display: inline-flex;
        gap: 6px;
        align-items: center;
        padding: 0;
    }

    .cart-price {
        text-align: right;
        flex: 0 0 auto;
    }

    .price {
        font-weight: 900;
    }

    .method-grid {
        display: grid;
        gap: 10px;
    }

    .method {
        width: 100%;
        text-align: left;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(255, 255, 255, 0.7);
    }

    .method.active {
        border-color: rgba(var(--accent-rgb), 0.45);
        box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.18);
    }

    .method-icon {
        width: 40px;
        height: 40px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: rgba(var(--accent-rgb), 0.14);
        color: var(--accent);
        flex: 0 0 auto;
    }

    .method-title {
        font-weight: 900;
        line-height: 1.2;
    }

    .method-sub {
        font-size: 0.92rem;
        opacity: 0.78;
        margin-top: 2px;
    }

    .rule-strip {
        display: grid;
        gap: 10px;
    }

    .rule-row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 10px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .rule-row i {
        color: var(--accent);
        margin-top: 2px;
    }

    .rule-title {
        font-weight: 900;
        line-height: 1.2;
    }

    .rule-sub {
        font-size: 0.92rem;
        opacity: 0.8;
        margin-top: 2px;
    }

    .alert-soft {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 12px;
        border-radius: 14px;
        background: rgba(180, 35, 24, 0.06);
        border: 1px solid rgba(180, 35, 24, 0.18);
        color: #7a271a;
    }

    .alert-icon {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(180, 35, 24, 0.12);
        flex: 0 0 auto;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .field {
        display: grid;
        gap: 6px;
    }

    .span-2 {
        grid-column: span 2;
    }

    .label {
        font-weight: 800;
        font-size: 0.92rem;
        opacity: 0.88;
    }

    .input {
        border-radius: 14px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        padding: 10px 12px;
        outline: none;
        background: #fff;
    }

    .input:focus {
        border-color: rgba(var(--accent-rgb), 0.55);
        box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.12);
    }

    .sum {
        display: grid;
        gap: 10px;
    }

    .sum-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
    }

    .divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.06);
        margin: 4px 0;
    }

    .total {
        font-weight: 900;
        font-size: 1.1rem;
    }

    .sticky {
        position: sticky;
        top: 92px;
    }

    .info-list {
        display: grid;
        gap: 10px;
    }

    .info-row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 10px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .info-row i {
        color: var(--accent);
        margin-top: 2px;
    }

    :global(.btn-accent) {
        background: var(--accent) !important;
        border-color: var(--accent) !important;
        color: #fff !important;
        box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.22);
    }

    :global(.btn-accent:hover),
    :global(.btn-accent:focus) {
        filter: brightness(0.95);
        box-shadow: 0 12px 26px rgba(var(--accent-rgb), 0.28);
    }

    :global(.btn-outline-accent) {
        border-color: rgba(var(--accent-rgb), 0.55) !important;
        color: var(--accent) !important;
    }

    :global(.btn-outline-accent:hover),
    :global(.btn-outline-accent:focus) {
        background: rgba(var(--accent-rgb), 0.12) !important;
        border-color: rgba(var(--accent-rgb), 0.75) !important;
        color: var(--accent) !important;
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

    @media (max-width: 576px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        .span-2 {
            grid-column: auto;
        }
        .cart-row {
            flex-direction: column;
            align-items: stretch;
        }
        .cart-price {
            text-align: left;
        }
        .sticky {
            position: static;
        }
    }
</style>

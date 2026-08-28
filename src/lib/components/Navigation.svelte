<script lang="ts">
  import Fluture from '$lib/IconList.svelte';
  // Served from the editable static images folder - see static/images/README.md.
  const logoUrl = '/images/shared/logo.png';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { cartCount } from '$lib/stores/cart';
  import { auth } from '$lib/stores/auth';
  import { PRODUCT_CATEGORIES } from '$lib/categories';

  const phoneHref = 'tel:+40729969822';
  const addressHref = '/contact';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';
  const flutureHref = 'https://tinutulflutureluialbastru.ro/';

  const productLinks = [
    { href: '/produse', label: 'Toate produsele', icon: 'bi-grid-3x3-gap' },
    ...PRODUCT_CATEGORIES.map((category) => ({
      href: `/produse/${category.slug}`,
      label: category.name,
      icon: category.icon,
    })),
  ];

  // The mobile drawer is driven entirely by this boolean + CSS - no Bootstrap
  // JS. The previous version called window.bootstrap.Offcanvas, but Bootstrap's
  // bundle is imported asynchronously in the parent layout's onMount, and child
  // components mount before parents, so window.bootstrap was never ready when
  // this ran - the hamburger silently did nothing on mobile (the only place the
  // drawer is used).
  let isOpen = false;

  // Open/close is a single boolean; the enter/exit animation is driven entirely
  // by CSS (.products-dropdown vs .products-dropdown.open). The only timer is the
  // hover-out grace delay, so the menu doesn't snap shut when the pointer briefly
  // leaves the trigger before reaching the panel.
  let productsMenuOpen = false;
  let productsMenuCloseTimer: ReturnType<typeof setTimeout> | null = null;

  function clearProductsMenuCloseTimer() {
    if (productsMenuCloseTimer) {
      clearTimeout(productsMenuCloseTimer);
      productsMenuCloseTimer = null;
    }
  }

  function openProductsMenu() {
    clearProductsMenuCloseTimer();
    productsMenuOpen = true;
  }

  function scheduleProductsMenuClose() {
    clearProductsMenuCloseTimer();
    productsMenuCloseTimer = setTimeout(() => {
      productsMenuOpen = false;
      productsMenuCloseTimer = null;
    }, 200);
  }

  function closeProductsMenuNow() {
    clearProductsMenuCloseTimer();
    productsMenuOpen = false;
  }

  function openMenu() {
    isOpen = true;
  }

  function closeMenu() {
    isOpen = false;
  }

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) closeMenu();
  }

  // Lock body scroll while the drawer is open (Bootstrap used to do this).
  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  onDestroy(() => {
    clearProductsMenuCloseTimer();
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });

  function normalize(path: string) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  function isActivePath(currentPath: string, path: string) {
    return currentPath === normalize(path);
  }

  function navActive(currentPath: string, path: string) {
    return isActivePath(currentPath, path) ? 'active' : '';
  }

  function isActivePrefix(currentPath: string, prefix: string) {
    const normalizedPrefix = normalize(prefix);
    return currentPath === normalizedPrefix || currentPath.startsWith(`${normalizedPrefix}/`);
  }

  function navActiveStarts(currentPath: string, prefix: string) {
    return isActivePrefix(currentPath, prefix) ? 'active' : '';
  }

  $: currentPath = normalize($page.url.pathname);

  // Close the drawer on any navigation (link taps already call closeMenu, but
  // this also covers back/forward and programmatic navigation).
  let lastNavPath: string | null = null;
  $: if (currentPath !== lastNavPath) {
    lastNavPath = currentPath;
    isOpen = false;
  }

  $: isCustomerAuthenticated = $auth.isAuthenticated && !$auth.isAdmin;
  $: accountHref = $auth.isAdmin ? '/admin/dashboard' : isCustomerAuthenticated ? '/utilizator' : '/cont';
  $: accountLabel = $auth.isAdmin
    ? 'Admin'
    : isCustomerAuthenticated
      ? ($auth.user?.fullName?.split(' ')[0] || $auth.user?.username || 'Contul meu')
      : 'Cont';
  $: accountIcon = $auth.isAdmin ? 'bi-speedometer2' : isCustomerAuthenticated ? 'bi-person-circle' : 'bi-box-arrow-in-right';

  async function handleLogout() {
    await auth.logout();
    closeMenu();

    if ($page.url.pathname.startsWith('/utilizator')) {
      await goto('/cont');
    }
  }
</script>

<nav class="topbar" aria-label="Informații rapide">
  <div class="container topbar-wrap">
    <div class="topbar-info">
      <a class="topbar-link topbar-location" href={addressHref}>
        <i class="bi bi-geo-alt-fill"></i>
        <span>Cluj-Napoca, Str. Constantin Brâncuși nr. 153</span>
      </a>
      <a class="topbar-link" href="/contact">
        <i class="bi bi-clock-fill"></i>
        <span>L–V: 9:00–18:00</span>
      </a>
      <a class="topbar-link topbar-phone" href={phoneHref}>
        <i class="bi bi-telephone-fill"></i>
        <span>+40 729 969 822</span>
      </a>
    </div>

    <div class="topbar-social" aria-label="Social media">
      <a class="social-link" href={facebookHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <i class="bi bi-facebook"></i>
      </a>
      <a class="social-link" href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <i class="bi bi-instagram"></i>
      </a>
      <a class="social-link social-fluture" href={flutureHref} target="_blank" rel="noopener noreferrer" aria-label="Ținutul Fluturelui Albastru">
        <Fluture size={14} />
        <span>Ținutul Fluturelui Albastru</span>
      </a>
    </div>
  </div>
</nav>

<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top mainnav" aria-label="Navigare principală">
  <div class="container mainnav-wrap">
    <a class="navbar-brand brand" href="/" aria-label="DeSaga cu Legume - Acasă">
      <img src={logoUrl} alt="" height="38" class="brand-logo" />
      <span class="brand-text">
        <span class="brand-name">
          <span class="brand-line">DeSaga cu</span>
          <span class="brand-line">Legume</span>
        </span>
        <span class="brand-subtitle">fermă locală</span>
      </span>
    </a>

    <div class="desktop-nav d-none d-lg-flex ms-auto align-items-center">
      <ul class="navbar-nav align-items-lg-center">
        <li class="nav-item">
          <a class={`nav-link ${navActive(currentPath, '/')}`} href="/" aria-current={isActivePath(currentPath, '/') ? 'page' : undefined}>Acasă</a>
        </li>

        <li
          class="nav-item dropdown desktop-dropdown"
          on:mouseenter={openProductsMenu}
          on:mouseleave={scheduleProductsMenuClose}
          on:focusin={openProductsMenu}
          on:focusout={scheduleProductsMenuClose}
        >
          <a
            class={`nav-link dropdown-toggle ${navActiveStarts(currentPath, '/produse')}`}
            href="/produse"
            aria-current={isActivePrefix(currentPath, '/produse') ? 'page' : undefined}
            aria-expanded={productsMenuOpen}
          >
            Produse
          </a>

          <ul
            class="dropdown-menu products-dropdown"
            class:open={productsMenuOpen}
            on:mouseenter={openProductsMenu}
            on:mouseleave={scheduleProductsMenuClose}
          >
            {#each productLinks as item}
              <li>
                <a
                  class={`dropdown-item ${navActive(currentPath, item.href)}`}
                  href={item.href}
                  on:click={closeProductsMenuNow}
                >
                  {#if item.icon}<i class={'bi ' + item.icon} aria-hidden="true"></i>{/if}
                  <span>{item.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </li>

        <li class="nav-item">
          <a class={`nav-link ${navActive(currentPath, '/horeca')}`} href="/horeca" aria-current={isActivePath(currentPath, '/horeca') ? 'page' : undefined}>HORECA</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive(currentPath, '/despre-noi')}`} href="/despre-noi" aria-current={isActivePath(currentPath, '/despre-noi') ? 'page' : undefined}>Despre noi</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive(currentPath, '/evenimente')}`} href="/evenimente" aria-current={isActivePath(currentPath, '/evenimente') ? 'page' : undefined}>Evenimente</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive(currentPath, '/contact')}`} href="/contact" aria-current={isActivePath(currentPath, '/contact') ? 'page' : undefined}>Contact</a>
        </li>
      </ul>

      <div class="nav-actions">
        <a class="call-action" href={phoneHref}>
          <i class="bi bi-telephone-fill"></i>
          <span>Sună</span>
        </a>

        <a class={`cart-action ${navActive(currentPath, '/cos')}`} href="/cos" aria-label={$cartCount > 0 ? `Coș, ${$cartCount} produse` : 'Coș'}>
          <i class="bi bi-basket"></i>
          <span>Coș</span>
          {#if $cartCount > 0}
            <span class="cart-badge">{$cartCount}</span>
          {/if}
        </a>

        <a class={`account-action ${navActive(currentPath, accountHref)}`} href={accountHref} aria-label={$auth.isAuthenticated ? 'Contul meu' : 'Intră în cont'}>
          <i class={'bi ' + accountIcon}></i>
          <span>{accountLabel}</span>
        </a>

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <button class="admin-link" type="button" on:click={handleLogout} aria-label="Deconectare">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        {/if}
      </div>
    </div>

    <div class="mobile-actions d-lg-none">
      <a class="mobile-call" href={phoneHref} aria-label="Sună DeSaga">
        <i class="bi bi-telephone-fill"></i>
      </a>
      <a class={`mobile-account ${navActive(currentPath, accountHref)}`} href={accountHref} aria-label={$auth.isAuthenticated ? 'Contul meu' : 'Intră în cont'}>
        <i class={'bi ' + accountIcon}></i>
      </a>
      <button
        type="button"
        class="navbar-toggler burger"
        aria-label="Deschide meniul"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        on:click={toggleMenu}
      >
        <span class="burger__bars" aria-hidden="true">
          <span class="burger__bar"></span>
          <span class="burger__bar"></span>
          <span class="burger__bar"></span>
        </span>
      </button>
    </div>
  </div>
</nav>

<svelte:window on:keydown={handleKeydown} />

<button
  type="button"
  class="mobile-backdrop"
  class:show={isOpen}
  tabindex="-1"
  aria-hidden="true"
  on:click={closeMenu}
></button>

<div
  id="mobile-navigation"
  class="mobile-offcanvas"
  class:show={isOpen}
  aria-label="Navigare mobilă"
  aria-hidden={!isOpen}
  inert={!isOpen || undefined}
>
  <div class="offcanvas-header">
    <a class="mobile-brand" href="/" on:click={closeMenu}>
      <img src={logoUrl} alt="" height="34" />
      <span class="mobile-brand__text">
        <strong>DeSaga</strong>
        <small>fermă locală</small>
      </span>
    </a>

    <button class="close-menu" type="button" on:click={closeMenu} aria-label="Închide meniul">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>

  <div class="offcanvas-body">
    <div class="mobile-contact-card">
      <a href={phoneHref}>
        <i class="bi bi-telephone-fill"></i>
        <span>+40 729 969 822</span>
      </a>
      <a href="/contact">
        <i class="bi bi-geo-alt-fill"></i>
        <span>Str. Constantin Brâncuși nr. 153</span>
      </a>
    </div>

    <nav class="mobile-nav" aria-label="Navigare mobilă">
      <a class={`mobile-link ${navActive(currentPath, '/')}`} href="/" on:click={closeMenu}>
        <span><i class="bi bi-house"></i> Acasă</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link mobile-link-primary ${navActive(currentPath, '/produse')}`} href="/produse" on:click={closeMenu}>
        <span><i class="bi bi-grid-3x3-gap"></i> Toate produsele</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <div class="mobile-section">
        <div class={`mobile-section__title ${navActiveStarts(currentPath, '/produse')}`}>
          Categorii produse
        </div>
        {#each productLinks.slice(1) as item}
          <a class={`mobile-sublink ${navActive(currentPath, item.href)}`} href={item.href} on:click={closeMenu}>
            <span>{#if item.icon}<i class={'bi ' + item.icon} aria-hidden="true"></i>{/if} {item.label}</span>
            <i class="bi bi-chevron-right"></i>
          </a>
        {/each}
      </div>

      <a class={`mobile-link ${navActive(currentPath, '/horeca')}`} href="/horeca" on:click={closeMenu}>
        <span><i class="bi bi-shop"></i> HORECA</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive(currentPath, '/despre-noi')}`} href="/despre-noi" on:click={closeMenu}>
        <span><i class="bi bi-info-circle"></i> Despre noi</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive(currentPath, '/evenimente')}`} href="/evenimente" on:click={closeMenu}>
        <span><i class="bi bi-calendar-event"></i> Evenimente</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive(currentPath, '/contact')}`} href="/contact" on:click={closeMenu}>
        <span><i class="bi bi-chat-dots"></i> Contact</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive(currentPath, accountHref)}`} href={accountHref} on:click={closeMenu}>
        <span><i class={'bi ' + accountIcon}></i> {accountLabel}</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive(currentPath, '/cos')}`} href="/cos" on:click={closeMenu}>
        <span><i class="bi bi-basket"></i> Coș</span>
        {#if $cartCount > 0}
          <span class="cart-badge">{$cartCount}</span>
        {:else}
          <i class="bi bi-chevron-right"></i>
        {/if}
      </a>

      <div class="mobile-admin">
        {#if $auth.isAdmin}
          <a class="admin-mobile-link" href="/admin/dashboard" on:click={closeMenu}>
            <i class="bi bi-speedometer2"></i> Panou admin
          </a>
        {:else if $auth.isAuthenticated}
          <button class="admin-mobile-link" type="button" on:click={handleLogout}>
            <i class="bi bi-box-arrow-right"></i> Deconectare
          </button>
        {:else}
          <a class="admin-mobile-link" href="/admin/login" on:click={closeMenu}>
            <i class="bi bi-lock"></i> Administrare
          </a>
        {/if}
      </div>
    </nav>
  </div>
</div>

<style>
  /* ---- Utility bar (desktop only) --------------------------------------
     Practical details, set quietly. It is not a coloured banner competing
     with the brand. */
  .topbar {
    background: var(--paper-2);
    border-bottom: 1px solid var(--line);
    font-size: var(--text-xs);
  }

  .topbar-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: 34px;
  }

  .topbar-info,
  .topbar-social {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    min-width: 0;
  }

  .topbar-link,
  .social-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--ink-2);
    text-decoration: none;
    white-space: nowrap;
  }

  .topbar-link i,
  .social-link i {
    color: var(--tomato-ink);
  }

  .topbar-link:hover,
  .social-link:hover,
  .topbar-link:focus-visible,
  .social-link:focus-visible {
    color: var(--tomato-deep);
    text-decoration: underline;
  }

  .social-fluture {
    padding-left: var(--space-4);
    border-left: 1px solid var(--line-strong);
  }

  /* ---- Main bar --------------------------------------------------------- */
  .mainnav {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    padding: 0;
    box-shadow: none;
  }

  .mainnav-wrap {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: var(--space-3);
    min-height: 68px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0;
    text-decoration: none;
    min-width: 0;
  }

  .brand-logo {
    width: auto;
    outline: none;
    flex: 0 0 auto;
  }

  .brand-text {
    display: grid;
    min-width: 0;
  }

  .brand-name {
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--ink);
  }

  .brand-line + .brand-line::before {
    content: ' ';
  }

  .brand-subtitle {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--tomato-ink);
  }

  .desktop-nav {
    gap: var(--space-4);
  }

  .navbar-nav {
    gap: 0;
  }

  /* Active state is a tomato rule under the label, like a tab on a market
     board. It reads instantly and needs no pill or filled background. */
  .nav-link {
    position: relative;
    padding: 0.5rem 0.7rem;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-weight: 600;
    white-space: nowrap;
  }

  .nav-link:hover,
  .nav-link:focus-visible {
    color: var(--ink);
  }

  .nav-link.active {
    color: var(--ink);
  }

  .nav-link.active::after {
    content: '';
    position: absolute;
    left: 0.7rem;
    right: 0.7rem;
    bottom: -2px;
    height: 2px;
    background: var(--tomato);
  }

  .dropdown-toggle::after {
    margin-left: 0.35rem;
    vertical-align: 0.12em;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .call-action,
  .cart-action,
  .account-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 40px;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    color: var(--ink);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition-property: background-color, border-color, color;
    transition-duration: var(--motion-fast);
    transition-timing-function: var(--ease);
  }

  /* Calling is how this business actually confirms stock, so the phone is
     the one solid button in the header. */
  .call-action {
    background: var(--tomato-ink);
    border-color: var(--tomato-ink);
    color: #fff;
  }

  .call-action:hover,
  .call-action:focus-visible {
    background: var(--tomato-deep);
    border-color: var(--tomato-deep);
    color: #fff;
  }

  .cart-action:hover,
  .account-action:hover,
  .cart-action:focus-visible,
  .account-action:focus-visible {
    border-color: var(--tomato-ink);
    color: var(--tomato-deep);
    background: var(--tomato-wash);
  }

  .cart-action.active,
  .account-action.active {
    border-color: var(--tomato-ink);
    color: var(--tomato-deep);
  }

  .cart-action {
    position: relative;
  }

  /* The only pill on the site: a numeric count badge. */
  .cart-badge {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: var(--radius-full);
    background: var(--tomato-ink);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .admin-link {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }

  .admin-link:hover,
  .admin-link:focus-visible {
    border-color: var(--tomato-ink);
    color: var(--tomato-deep);
  }

  /* ---- Products dropdown ------------------------------------------------ */
  .products-dropdown {
    display: block;
    margin-top: 0;
    padding: var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow-pop);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition-property: opacity, transform, visibility;
    transition-duration: var(--motion);
    transition-timing-function: var(--ease);
  }

  .products-dropdown.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 40px;
    padding: 0.4rem 0.6rem;
    border-radius: var(--radius-sm);
    color: var(--ink);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .dropdown-item i {
    color: var(--ink-3);
  }

  .dropdown-item:hover,
  .dropdown-item:focus-visible {
    background: var(--tomato-wash);
    color: var(--tomato-deep);
  }

  .dropdown-item.active {
    color: var(--tomato-deep);
    background: var(--tomato-wash);
  }

  /* ---- Mobile header controls ------------------------------------------ */
  .mobile-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .mobile-call,
  .mobile-account,
  .burger {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font-size: 1.05rem;
    text-decoration: none;
    cursor: pointer;
  }

  .mobile-call {
    background: var(--tomato-ink);
    border-color: var(--tomato-ink);
    color: #fff;
  }

  .mobile-account.active {
    border-color: var(--tomato-ink);
    color: var(--tomato-deep);
  }

  .burger:focus-visible,
  .mobile-call:focus-visible,
  .mobile-account:focus-visible {
    outline: 2px solid var(--tomato-ink);
    outline-offset: 2px;
  }

  .burger__bars {
    display: grid;
    gap: 4px;
    width: 18px;
  }

  .burger__bar {
    height: 2px;
    background: var(--ink);
    border-radius: 1px;
  }

  /* ---- Mobile drawer ---------------------------------------------------- */
  .mobile-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1040;
    border: 0;
    padding: 0;
    background: rgba(28, 26, 23, 0.42);
    opacity: 0;
    visibility: hidden;
    transition-property: opacity, visibility;
    transition-duration: var(--motion);
    transition-timing-function: var(--ease);
  }

  .mobile-backdrop.show {
    opacity: 1;
    visibility: visible;
  }

  /* top/bottom:0 rather than height:100vh, so the Android URL bar cannot
     clip the end of the drawer. */
  .mobile-offcanvas {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 1045;
    display: flex;
    flex-direction: column;
    width: min(340px, 88vw);
    background: var(--paper);
    border-left: 1px solid var(--line);
    transform: translateX(100%);
    visibility: hidden;
    overscroll-behavior: contain;
    transition-property: transform, visibility;
    transition-duration: var(--motion);
    transition-timing-function: var(--ease);
  }

  .mobile-offcanvas.show {
    transform: translateX(0);
    visibility: visible;
  }

  .offcanvas-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    padding-top: max(var(--space-3), env(safe-area-inset-top));
    border-bottom: 1px solid var(--line);
    background: var(--surface);
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    min-width: 0;
  }

  .mobile-brand img {
    outline: none;
    flex: 0 0 auto;
  }

  .mobile-brand__text {
    display: grid;
    min-width: 0;
  }

  .mobile-brand__text strong {
    font-family: var(--font-display);
    font-size: var(--text-base);
    color: var(--ink);
    line-height: 1.1;
  }

  .mobile-brand__text small {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--tomato-ink);
  }

  .close-menu {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }

  .offcanvas-body {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: var(--space-4);
    padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  }

  .mobile-contact-card {
    display: grid;
    margin-bottom: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }

  .mobile-contact-card a {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    color: var(--ink);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;
  }

  .mobile-contact-card a + a {
    border-top: 1px solid var(--line);
  }

  .mobile-contact-card i {
    color: var(--tomato-ink);
    flex: 0 0 auto;
  }

  .mobile-nav {
    display: grid;
  }

  .mobile-link,
  .mobile-sublink {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-height: 48px;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    font-size: var(--text-base);
    font-weight: 600;
    text-decoration: none;
  }

  .mobile-link span,
  .mobile-sublink span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .mobile-link i:first-child,
  .mobile-sublink i:first-child {
    color: var(--ink-3);
    width: 1.25rem;
    text-align: center;
    flex: 0 0 auto;
  }

  .mobile-link .bi-chevron-right,
  .mobile-sublink .bi-chevron-right {
    color: var(--line-strong);
    font-size: 0.75rem;
    flex: 0 0 auto;
  }

  .mobile-link.active,
  .mobile-sublink.active {
    color: var(--tomato-deep);
  }

  .mobile-link.active i:first-child,
  .mobile-sublink.active i:first-child {
    color: var(--tomato-ink);
  }

  .mobile-link:active,
  .mobile-sublink:active {
    background: var(--tomato-wash);
  }

  .mobile-section {
    padding-left: var(--space-4);
    border-left: 2px solid var(--line);
    margin-block: var(--space-2);
  }

  .mobile-section__title {
    padding: var(--space-2) 0;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-3);
  }

  .mobile-sublink {
    min-height: 44px;
    font-size: var(--text-sm);
  }

  .mobile-sublink:last-child {
    border-bottom: 0;
  }

  .mobile-admin {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }

  .admin-mobile-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: 44px;
    padding: var(--space-2) 0;
    border: 0;
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .admin-mobile-link:hover,
  .admin-mobile-link:focus-visible {
    color: var(--tomato-deep);
  }

  /* ---- Responsive ------------------------------------------------------- */
  @media (max-width: 1199.98px) {
    .brand-subtitle {
      display: none;
    }

    .nav-link {
      padding-inline: 0.5rem;
    }

    .nav-link.active::after {
      left: 0.5rem;
      right: 0.5rem;
    }

    .call-action span,
    .account-action span {
      display: none;
    }

    .call-action,
    .account-action {
      width: 40px;
      padding: 0;
    }
  }

  @media (max-width: 991.98px) {
    .topbar {
      display: none;
    }

    .mainnav-wrap {
      min-height: 60px;
    }

    /* Stack the wordmark onto two lines below the desktop breakpoint. On one
       line it is wide enough to push the header controls onto a second row at
       320px. */
    .brand-name {
      display: grid;
      font-size: 0.9375rem;
      line-height: 1.05;
    }

    .brand-line + .brand-line::before {
      content: none;
    }
  }

  @media (max-width: 400px) {
    .brand-name {
      font-size: 0.875rem;
    }

    .brand-logo {
      height: 30px;
    }

    .mobile-actions {
      gap: 6px;
    }

    .mobile-call,
    .mobile-account,
    .burger {
      width: 42px;
      height: 42px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .products-dropdown,
    .mobile-offcanvas,
    .mobile-backdrop {
      transition: none;
    }
  }
</style>

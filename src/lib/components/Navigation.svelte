<script lang="ts">
  import Fluture from '$lib/IconList.svelte';
  // Served from the editable static images folder — see static/images/README.md.
  const logoUrl = '/images/shared/logo.png';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { cartCount } from '$lib/stores/cart';
  import { auth } from '$lib/stores/auth';

  const phoneHref = 'tel:+40729969822';
  const addressHref = '/contact';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';
  const flutureHref = 'https://tinutulflutureluialbastru.ro/';

  const productLinks = [
    { href: '/produse', label: 'Toate produsele', icon: 'bi-grid-3x3-gap' },
    { href: '/produse/de-sezon', label: 'De sezon', icon: 'bi-brightness-high' },
    { href: '/produse/la-borcan', label: 'La borcan', icon: 'bi-archive' },
  ];

  // The mobile drawer is driven entirely by this boolean + CSS — no Bootstrap
  // JS. The previous version called window.bootstrap.Offcanvas, but Bootstrap's
  // bundle is imported asynchronously in the parent layout's onMount, and child
  // components mount before parents, so window.bootstrap was never ready when
  // this ran — the hamburger silently did nothing on mobile (the only place the
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
        <span class="brand-name">DeSaga cu Legume</span>
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
                  <i class={'bi ' + item.icon}></i>
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
      <a class={`mobile-cart ${navActive(currentPath, '/cos')}`} href="/cos" aria-label={$cartCount > 0 ? `Coș, ${$cartCount} produse` : 'Coș'}>
        <i class="bi bi-basket"></i>
        {#if $cartCount > 0}
          <span class="cart-badge">{$cartCount}</span>
        {/if}
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
            <span><i class={'bi ' + item.icon}></i> {item.label}</span>
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
  .topbar {
    background: var(--desaga-blue);
    color: #fff;
    font-size: 0.86rem;
  }

  .topbar-wrap {
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .topbar-info,
  .topbar-social {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .topbar-link,
  .social-link {
    color: #fff;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    line-height: 1.2;
    opacity: 0.95;
  }

  .topbar-link:hover,
  .topbar-link:focus,
  .social-link:hover,
  .social-link:focus {
    color: #fff;
    opacity: 1;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .topbar-location span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .social-fluture span {
    white-space: nowrap;
  }

  .mainnav {
    box-shadow: var(--desaga-shadow-sm);
    z-index: 1020;
  }

  .mainnav-wrap {
    min-width: 0;
    min-height: 72px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    text-decoration: none;
  }

  .brand-logo {
    flex: 0 0 auto;
    object-fit: contain;
  }

  .brand-text {
    display: grid;
    line-height: 1.1;
    min-width: 0;
  }

  .brand-name {
    font-weight: 950;
    font-size: 1.08rem;
    color: var(--desaga-heading);
    white-space: nowrap;
  }

  .brand-subtitle {
    color: var(--desaga-muted);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .desktop-nav {
    gap: 18px;
  }

  .navbar-nav {
    gap: 2px;
  }

  .nav-link {
    border-radius: 999px;
    color: rgba(20, 33, 43, 0.76) !important;
    font-weight: 850;
    padding: 0.54rem 0.82rem !important;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .nav-link:hover,
  .nav-link:focus {
    background: rgba(var(--desaga-accent-rgb), 0.08);
    color: var(--desaga-blue) !important;
  }

  .nav-link.active {
    color: var(--desaga-blue) !important;
    background: rgba(var(--desaga-accent-rgb), 0.11);
  }

  .desktop-dropdown {
    position: relative;
  }

  .desktop-dropdown::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    height: 14px;
  }

  .products-dropdown {
    display: block;
    margin-top: 10px;
    border: 1px solid var(--desaga-border);
    border-radius: 18px;
    padding: 0.55rem;
    min-width: 230px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(14px);
    box-shadow:
      0 18px 45px rgba(15, 23, 42, 0.14),
      0 4px 14px rgba(15, 23, 42, 0.08);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(10px) scale(0.98);
    transform-origin: top center;
    clip-path: inset(0 0 100% 0 round 18px);

    /* Exit animation — applied when the .open class is removed. */
    transition:
      opacity 160ms ease,
      transform 220ms cubic-bezier(0.7, 0, 0.84, 0),
      clip-path 220ms cubic-bezier(0.7, 0, 0.84, 0),
      visibility 0s linear 220ms;
  }

  .products-dropdown.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0) scale(1);
    clip-path: inset(0 0 0 0 round 18px);

    /* Enter animation — applied when the .open class is added. */
    transition:
      opacity 180ms ease,
      transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
      clip-path 260ms cubic-bezier(0.16, 1, 0.3, 1),
      visibility 0s linear 0s;
  }

  .products-dropdown .dropdown-item {
    opacity: 0;
    transform: translateY(-4px);
  }

  .products-dropdown.open .dropdown-item {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 180ms ease,
      transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .products-dropdown.open li:nth-child(1) .dropdown-item {
    transition-delay: 40ms;
  }

  .products-dropdown.open li:nth-child(2) .dropdown-item {
    transition-delay: 75ms;
  }

  .products-dropdown.open li:nth-child(3) .dropdown-item {
    transition-delay: 110ms;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 12px;
    padding: 0.62rem 0.72rem;
    font-weight: 800;
    color: rgba(20, 33, 43, 0.78);
  }

  .dropdown-item:hover,
  .dropdown-item:focus,
  .dropdown-item.active {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.1);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    padding-left: 10px;
    margin-left: 10px;
    border-left: 1px solid var(--desaga-border);
  }

  .call-action,
  .cart-action,
  .account-action,
  .admin-link,
  .mobile-call,
  .mobile-cart,
  .mobile-account {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
  }

  .call-action {
    gap: 8px;
    min-height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--desaga-blue);
    color: #fff;
    font-weight: 900;
    box-shadow: 0 10px 22px rgba(var(--desaga-accent-rgb), 0.22);
  }

  .call-action:hover,
  .call-action:focus {
    color: #fff;
    background: var(--desaga-dark-blue);
  }

  .cart-action,
  .account-action {
    position: relative;
    gap: 8px;
    min-height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    color: rgba(20, 33, 43, 0.78);
    background: rgba(15, 23, 42, 0.05);
    font-weight: 900;
  }

  .cart-action:hover,
  .cart-action:focus,
  .cart-action.active,
  .account-action:hover,
  .account-action:focus,
  .account-action.active {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.11);
  }

  .admin-link {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    color: rgba(20, 33, 43, 0.58);
    background: rgba(15, 23, 42, 0.04);
  }

  button.admin-link {
    cursor: pointer;
  }

  .admin-link:hover,
  .admin-link:focus {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.1);
  }

  .cart-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--desaga-blue);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 950;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .cart-action .cart-badge,
  .mobile-cart .cart-badge {
    position: absolute;
    right: -5px;
    top: -5px;
  }

  .mobile-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-call,
  .mobile-cart,
  .mobile-account,
  .burger {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }

  .mobile-call {
    color: #fff;
    background: var(--desaga-blue);
  }

  .mobile-cart,
  .mobile-account {
    position: relative;
    color: rgba(20, 33, 43, 0.76);
    background: rgba(15, 23, 42, 0.05);
  }

  .mobile-cart.active,
  .mobile-account.active {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.11);
  }

  .burger {
    border: 0;
    padding: 8px;
    background: rgba(15, 23, 42, 0.05);
    transition:
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  .burger:hover,
  .burger:focus,
  .burger[aria-expanded='true'] {
    background: var(--desaga-blue);
  }

  .burger:focus {
    box-shadow: var(--desaga-focus-ring);
  }

  .burger__bars {
    width: 24px;
    height: 18px;
    display: grid;
    align-content: space-between;
  }

  .burger__bar {
    height: 2px;
    width: 100%;
    background: rgba(20, 33, 43, 0.8);
    border-radius: 999px;
    transform-origin: center;
    transition:
      transform 220ms ease,
      opacity 180ms ease;
  }

  .burger:hover .burger__bar,
  .burger:focus .burger__bar,
  .burger[aria-expanded='true'] .burger__bar {
    background: #fff;
  }

  .burger[aria-expanded='true'] .burger__bar:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }

  .burger[aria-expanded='true'] .burger__bar:nth-child(2) {
    opacity: 0;
    transform: scaleX(0.6);
  }

  .burger[aria-expanded='true'] .burger__bar:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }

  /* Self-contained slide-in drawer (no Bootstrap offcanvas JS/CSS). Uses
     top/bottom:0 instead of height:100vh so the Android URL bar can't clip it. */
  .mobile-offcanvas {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1050;
    width: min(92vw, 390px);
    max-width: 100%;
    display: flex;
    flex-direction: column;
    background: var(--desaga-surface);
    border-left: 1px solid var(--desaga-border);
    box-shadow: -14px 0 44px rgba(15, 23, 42, 0.18);
    transform: translateX(100%);
    visibility: hidden;
    transition: transform 0.28s ease-in-out, visibility 0.28s ease-in-out;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-offcanvas.show {
    transform: translateX(0);
    visibility: visible;
  }

  .mobile-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1040;
    margin: 0;
    padding: 0;
    border: 0;
    background: rgba(15, 23, 42, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.28s ease-in-out, visibility 0.28s ease-in-out;
  }

  .mobile-backdrop.show {
    opacity: 1;
    visibility: visible;
  }

  @media (prefers-reduced-motion: reduce) {
    .mobile-offcanvas,
    .mobile-backdrop {
      transition: none;
    }
  }

  /* The drawer only exists below the lg breakpoint; keep it out of the way on
     desktop where the inline navbar is used. */
  @media (min-width: 992px) {
    .mobile-offcanvas,
    .mobile-backdrop {
      display: none;
    }
  }

  .offcanvas-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 1rem;
    border-bottom: 1px solid var(--desaga-border);
    background:
      linear-gradient(180deg, rgba(var(--desaga-accent-rgb), 0.08), rgba(255, 255, 255, 0));
  }

  .offcanvas-body {
    flex: 1 1 auto;
    padding: 1rem;
    overflow-y: auto;
  }

  .mobile-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--desaga-heading);
    font-weight: 950;
    text-decoration: none;
  }

  .mobile-brand img {
    flex: 0 0 auto;
  }

  .mobile-brand__text {
    display: grid;
    line-height: 1.05;
  }

  .mobile-brand__text strong {
    font-weight: 950;
  }

  .mobile-brand__text small {
    color: var(--desaga-muted);
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .close-menu {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: rgba(20, 33, 43, 0.72);
    background: rgba(15, 23, 42, 0.05);
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .close-menu:hover,
  .close-menu:focus {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.12);
  }

  .mobile-contact-card {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 18px;
    background: rgba(var(--desaga-accent-rgb), 0.08);
    border: 1px solid rgba(38, 153, 214, 0.16);
    margin-bottom: 14px;
  }

  .mobile-contact-card a {
    color: rgba(20, 33, 43, 0.82);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 800;
  }

  .mobile-contact-card i {
    color: var(--desaga-blue);
  }

  .mobile-nav {
    display: grid;
    gap: 8px;
  }

  .mobile-link,
  .mobile-sublink {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    gap: 12px;
    border-radius: 15px;
    color: rgba(20, 33, 43, 0.85);
    font-weight: 900;
  }

  .mobile-link > span,
  .mobile-sublink > span {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .mobile-link > span > i,
  .mobile-sublink > span > i {
    width: 20px;
    text-align: center;
    flex: 0 0 auto;
  }

  .mobile-link {
    padding: 13px 14px;
    background: rgba(15, 23, 42, 0.025);
    border: 1px solid rgba(15, 23, 42, 0.075);
  }

  .mobile-link-primary {
    background: var(--desaga-blue);
    color: #fff;
    border-color: var(--desaga-blue);
  }

  .mobile-link.active:not(.mobile-link-primary),
  .mobile-sublink.active {
    border-color: rgba(var(--desaga-accent-rgb), 0.32);
    background: rgba(38, 153, 214, 0.09);
    color: var(--desaga-blue);
  }

  .mobile-section {
    padding: 11px;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.02);
    border: 1px solid rgba(15, 23, 42, 0.075);
  }

  .mobile-section__title {
    font-weight: 950;
    color: rgba(20, 33, 43, 0.68);
    margin-bottom: 8px;
    padding: 0 2px;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .mobile-sublink {
    padding: 10px;
  }

  .mobile-sublink:hover,
  .mobile-sublink:focus {
    background: rgba(var(--desaga-accent-rgb), 0.08);
    color: var(--desaga-blue);
  }

  .mobile-admin {
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--desaga-border);
  }

  .admin-mobile-link {
    width: 100%;
    border: 0;
    background: transparent;
    color: rgba(20, 33, 43, 0.58);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 2px;
    font-weight: 800;
  }

  @media (prefers-reduced-motion: reduce) {
    .products-dropdown,
    .products-dropdown.opening,
    .products-dropdown.open,
    .products-dropdown.closing,
    .products-dropdown .dropdown-item {
      transition: none !important;
      transform: none !important;
      clip-path: none !important;
    }
  }

  @media (max-width: 1199.98px) {
    .brand-subtitle {
      display: none;
    }

    .nav-link {
      padding-inline: 0.62rem !important;
    }

    .call-action span {
      display: none;
    }

    .call-action {
      width: 42px;
      padding: 0;
    }
  }

  @media (max-width: 991.98px) {
    .topbar {
      display: none;
    }

    .mainnav-wrap {
      min-height: 64px;
    }

    .brand-name {
      max-width: 42vw;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (max-width: 420px) {
    .brand-name {
      max-width: 34vw;
      font-size: 0.98rem;
    }

    .brand-logo {
      height: 32px;
    }

    .mobile-call,
    .mobile-cart,
    .mobile-account,
    .burger {
      width: 39px;
      height: 39px;
      border-radius: 13px;
    }
  }
</style>

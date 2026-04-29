<script lang="ts">
  import Fluture from '$lib/IconList.svelte';
  import logoUrl from '$lib/assets/logo.png';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import { cartCount } from '$lib/stores/cart';
  import { auth } from '$lib/stores/auth';

  const phoneHref = 'tel:+40729969822';
  const addressHref = '/contact';
  const facebookHref = 'https://www.facebook.com/desagaculegume/';
  const instagramHref = 'https://www.instagram.com/desaga_cu_legume/';
  const flutureHref = 'https://tinutulflutureluialbastru.ro/';

  const productLinks = [
    { href: '/produse', label: 'Toate produsele', icon: '' },
    { href: '/produse/de-sezon', label: 'De sezon', icon: '' },
    { href: '/produse/la-borcan', label: 'La borcan', icon: '' },
    { href: '/produse/colaboratori', label: 'Colaboratori', icon: '' },
  ];

  let offcanvasEl: HTMLElement | null = null;
  let offcanvasInstance: any = null;
  let isOpen = false;

  function openMenu() {
    offcanvasInstance?.show();
  }

  function closeMenu() {
    offcanvasInstance?.hide();
  }

  function toggleMenu() {
    isOpen ? closeMenu() : openMenu();
  }

  function handleShown() {
    isOpen = true;
  }

  function handleHidden() {
    isOpen = false;
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    if (!offcanvasEl) return;

    const bootstrap = (window as any).bootstrap;
    if (!bootstrap?.Offcanvas) return;

    offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl, {
      backdrop: true,
      scroll: false,
    });

    offcanvasEl.addEventListener('shown.bs.offcanvas', handleShown);
    offcanvasEl.addEventListener('hidden.bs.offcanvas', handleHidden);
  });

  onDestroy(() => {
    if (!offcanvasEl) return;
    offcanvasEl.removeEventListener('shown.bs.offcanvas', handleShown);
    offcanvasEl.removeEventListener('hidden.bs.offcanvas', handleHidden);
    offcanvasInstance?.dispose?.();
  });

  function normalize(path: string) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  function isActive(path: string) {
    return normalize($page.url.pathname) === normalize(path);
  }

  function navActive(path: string) {
    return isActive(path) ? 'active' : '';
  }

  function navActiveStarts(prefix: string) {
    return normalize($page.url.pathname).startsWith(normalize(prefix)) ? 'active' : '';
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
          <a class={`nav-link ${navActive('/')}`} href="/" aria-current={isActive('/') ? 'page' : undefined}>Acasă</a>
        </li>

        <li class="nav-item dropdown desktop-dropdown">
          <a class={`nav-link dropdown-toggle ${navActiveStarts('/produse')}`} href="/produse" aria-current={navActiveStarts('/produse') ? 'page' : undefined}>
            Produse
          </a>
          <ul class="dropdown-menu">
            {#each productLinks as item}
              <li>
                <a class={`dropdown-item ${navActive(item.href)}`} href={item.href}>
                  <i class={'bi ' + item.icon}></i>
                  <span>{item.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </li>

        <li class="nav-item">
          <a class={`nav-link ${navActive('/horeca')}`} href="/horeca" aria-current={isActive('/horeca') ? 'page' : undefined}>HORECA</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive('/despre-noi')}`} href="/despre-noi" aria-current={isActive('/despre-noi') ? 'page' : undefined}>Despre noi</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive('/evenimente')}`} href="/evenimente" aria-current={isActive('/evenimente') ? 'page' : undefined}>Evenimente</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive('/contact')}`} href="/contact" aria-current={isActive('/contact') ? 'page' : undefined}>Contact</a>
        </li>
      </ul>

      <div class="nav-actions">
        <a class="call-action" href={phoneHref}>
          <i class="bi bi-telephone-fill"></i>
          <span>Sună</span>
        </a>

        <a class={`cart-action ${navActive('/cos')}`} href="/cos" aria-label={$cartCount > 0 ? `Coș, ${$cartCount} produse` : 'Coș'}>
          <i class="bi bi-basket"></i>
          <span>Coș</span>
          {#if $cartCount > 0}
            <span class="cart-badge">{$cartCount}</span>
          {/if}
        </a>

        <a class={`account-action ${navActive(accountHref)}`} href={accountHref} aria-label={$auth.isAuthenticated ? 'Contul meu' : 'Intră în cont'}>
          <i class={'bi ' + accountIcon}></i>
          <span>{accountLabel}</span>
        </a>

        {#if $auth.isAuthenticated && !$auth.isAdmin}
          <button class="admin-link" type="button" on:click={handleLogout} aria-label="Logout">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        {/if}
      </div>
    </div>

    <div class="mobile-actions d-lg-none">
      <a class="mobile-call" href={phoneHref} aria-label="Sună DeSaga">
        <i class="bi bi-telephone-fill"></i>
      </a>
      <a class={`mobile-cart ${navActive('/cos')}`} href="/cos" aria-label={$cartCount > 0 ? `Coș, ${$cartCount} produse` : 'Coș'}>
        <i class="bi bi-basket"></i>
        {#if $cartCount > 0}
          <span class="cart-badge">{$cartCount}</span>
        {/if}
      </a>
      <a class={`mobile-account ${navActive(accountHref)}`} href={accountHref} aria-label={$auth.isAuthenticated ? 'Contul meu' : 'Intră în cont'}>
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

<div
  id="mobile-navigation"
  class="offcanvas offcanvas-end mobile-offcanvas"
  tabindex="-1"
  bind:this={offcanvasEl}
  aria-label="Navigare mobilă"
>
  <div class="offcanvas-header">
    <a class="mobile-brand" href="/" on:click={closeMenu}>
      <img src={logoUrl} alt="" height="34" />
      <span>DeSaga</span>
    </a>

    <button class="btn btn-link close-menu" type="button" on:click={closeMenu} aria-label="Închide meniul">
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
      <a class={`mobile-link ${navActive('/')}`} href="/" on:click={closeMenu}>
        <span><i class="bi bi-house"></i> Acasă</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link mobile-link-primary ${navActive('/produse')}`} href="/produse" on:click={closeMenu}>
        <span><i class="bi "></i> Toate produsele</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <div class="mobile-section">
        <div class={`mobile-section__title ${navActiveStarts('/produse')}`}>
          Categorii produse
        </div>
        {#each productLinks.slice(1) as item}
          <a class={`mobile-sublink ${navActive(item.href)}`} href={item.href} on:click={closeMenu}>
            <span><i class={'bi ' + item.icon}></i> {item.label}</span>
            <i class="bi bi-chevron-right"></i>
          </a>
        {/each}
      </div>

      <a class={`mobile-link ${navActive('/horeca')}`} href="/horeca" on:click={closeMenu}>
        <span><i class="bi "></i> HORECA</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive('/despre-noi')}`} href="/despre-noi" on:click={closeMenu}>
        <span><i class="bi bi-info-circle"></i> Despre noi</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive('/evenimente')}`} href="/evenimente" on:click={closeMenu}>
        <span><i class="bi bi-calendar-event"></i> Evenimente</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive('/contact')}`} href="/contact" on:click={closeMenu}>
        <span><i class="bi bi-chat-dots"></i> Contact</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive(accountHref)}`} href={accountHref} on:click={closeMenu}>
        <span><i class={'bi ' + accountIcon}></i> {accountLabel}</span>
        <i class="bi bi-chevron-right"></i>
      </a>

      <a class={`mobile-link ${navActive('/cos')}`} href="/cos" on:click={closeMenu}>
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
            <i class="bi bi-speedometer2"></i> Dashboard admin
          </a>
        {:else if $auth.isAuthenticated}
          <button class="admin-mobile-link" type="button" on:click={handleLogout}>
            <i class="bi bi-box-arrow-right"></i> Logout
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

  .desktop-dropdown:hover > .dropdown-menu,
  .desktop-dropdown:focus-within > .dropdown-menu {
    display: block;
  }

  .dropdown-menu {
    margin-top: 8px;
    border: 1px solid var(--desaga-border);
    border-radius: 16px;
    padding: 8px;
    min-width: 220px;
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.13);
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

  .mobile-offcanvas {
    width: min(92vw, 390px);
  }

  .offcanvas-header {
    border-bottom: 1px solid var(--desaga-border);
  }

  .mobile-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--desaga-heading);
    font-weight: 950;
    text-decoration: none;
  }

  .close-menu {
    color: rgba(20, 33, 43, 0.72);
    text-decoration: none;
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
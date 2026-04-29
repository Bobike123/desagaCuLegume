<script lang="ts">
  import Fluture from '$lib/IconList.svelte';
  import logoUrl from '$lib/assets/logo.png';
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import { cartCount } from '$lib/stores/cart';
  import { auth } from '$lib/stores/auth';

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

  function navActive(path: string) {
    return $page.url.pathname === path ? 'active' : '';
  }

  function navActiveStarts(prefix: string) {
    return $page.url.pathname.startsWith(prefix) ? 'active' : '';
  }

  async function handleLogout() {
    await auth.logout();
  }
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
  />
  <script
    src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
    crossorigin="anonymous"
  ></script>
</svelte:head>

<nav class="navbar navbar-dark topbar">
  <div class="container topbar-wrap d-flex justify-content-between gap-3 flex-wrap">
    <ul class="topbar-list text-white small d-flex flex-wrap gap-3 m-0 p-0">
      <li class="topbar-item">
        <a class="text-white d-inline-flex align-items-center gap-2 text-decoration-none" href="/contact/">
          <i class="bi bi-geo-alt-fill"></i>
          <span>Cluj-Napoca, Str. Constantin Brâncuși nr. 153</span>
        </a>
      </li>
      <li class="topbar-item">
        <a class="text-white d-inline-flex align-items-center gap-2 text-decoration-none" href="/contact/">
          <i class="bi bi-clock-fill"></i>
          <span>Orar: L-V 9:00 - 18:00</span>
        </a>
      </li>
      <li class="topbar-item">
        <a class="text-white d-inline-flex align-items-center gap-2 text-decoration-none" href="tel:+40729969822">
          <i class="bi bi-telephone-fill"></i>
          <span>+40 729 969 822</span>
        </a>
      </li>
    </ul>

    <ul class="topbar-list topbar-social text-white small d-flex flex-wrap gap-3 m-0 p-0 align-items-center">
      <li class="topbar-item">
        <a class="text-white d-inline-flex align-items-center gap-2 text-decoration-none" href="https://www.facebook.com/desagaculegume/" target="_blank" rel="nofollow" aria-label="Facebook">
          <i class="bi bi-facebook"></i>
        </a>
      </li>
      <li class="topbar-item">
        <a class="text-white d-inline-flex align-items-center gap-2 text-decoration-none" href="https://www.instagram.com/desaga_cu_legume/" target="_blank" rel="nofollow" aria-label="Instagram">
          <i class="bi bi-instagram"></i>
        </a>
      </li>
      <li class="topbar-item">
        <a class="text-white d-inline-flex align-items-center gap-2 text-decoration-none" href="https://tinutulflutureluialbastru.ro/" target="_blank" rel="nofollow" aria-label="Ținutul Fluturelui Albastru">
          <span class="topbar-fluture" aria-hidden="true">
            <Fluture size={14} />
          </span>
          <span class="topbar-fluture-text">Sunt din Ținutul Fluturelui Albastru</span>
        </a>
      </li>
    </ul>
  </div>
</nav>

<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top mainnav">
  <div class="container">
    <a class="navbar-brand fw-bold fs-4 d-flex align-items-center" href="/">
      <img src={logoUrl} alt="DeSaga Logo" height="32" class="me-2" />
      DeSaga cu Legume
    </a>

    <div class="d-none d-lg-flex ms-auto align-items-center">
      <ul class="navbar-nav align-items-lg-center">
        <li class="nav-item">
          <a class={`nav-link ${navActive('/')}`} href="/">Acasă</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive('/despre-noi')}`} href="/despre-noi">Despre Noi</a>
        </li>
        <li class="nav-item dropdown desktop-dropdown">
          <a class={`nav-link dropdown-toggle ${navActiveStarts('/produse')}`} href="/produse">Produse</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/produse">Toate produsele</a></li>
            <li><a class="dropdown-item" href="/produse/de-sezon">De Sezon</a></li>
            <li><a class="dropdown-item" href="/produse/la-borcan">La Borcan</a></li>
            <li><a class="dropdown-item" href="/produse/colaboratori">Colaboratori</a></li>
            <li><a class="dropdown-item" href="/produse/horeca">HORECA</a></li>
          </ul>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive('/evenimente')}`} href="/evenimente">Evenimente</a>
        </li>
        <li class="nav-item">
          <a class={`nav-link ${navActive('/contact')}`} href="/contact">Contact</a>
        </li>
        <li class="nav-item ms-lg-2">
          <a class={`cart-link ${navActive('/cos')}`} href="/cos" aria-label="Coș">
            <i class="bi bi-basket"></i>
            {#if $cartCount > 0}
              <span class="cart-badge">{$cartCount}</span>
            {/if}
          </a>
        </li>
        <li class="nav-item ms-lg-2">
          {#if $auth.isAdmin}
            <a class="btn btn-admin btn-sm text-white" href="/admin/dashboard">
              <i class="bi bi-speedometer2"></i> Admin
            </a>
          {:else if $auth.isAuthenticated}
            <button class="btn btn-outline-accent btn-sm" type="button" on:click={handleLogout}>
              <i class="bi bi-person-circle"></i> Logout
            </button>
          {:else}
            <a class="btn btn-admin btn-sm text-white" href="/admin/login">
              <i class="bi bi-lock"></i> Login
            </a>
          {/if}
        </li>
      </ul>
    </div>

    <button type="button" class="navbar-toggler d-lg-none burger" aria-label="Open menu" aria-expanded={isOpen} on:click={toggleMenu}>
      <span class="burger__bars" aria-hidden="true">
        <span class="burger__bar"></span>
        <span class="burger__bar"></span>
        <span class="burger__bar"></span>
      </span>
    </button>
  </div>
</nav>

<div class="offcanvas offcanvas-end mobile-offcanvas" tabindex="-1" bind:this={offcanvasEl} aria-label="Mobile navigation">
  <div class="offcanvas-header bg-white text-dark">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-link p-0 text-dark" on:click={closeMenu} aria-label="Close menu">
        <i class="bi bi-x-lg fs-5"></i>
      </button>
      <h5 class="offcanvas-title m-0">DeSaga</h5>
    </div>
  </div>

  <div class="offcanvas-body">
    <nav class="mobile-nav">
      <a class={`mobile-link ${navActive('/')}`} href="/" on:click={closeMenu}><span>Acasă</span><i class="bi bi-chevron-right"></i></a>
      <a class={`mobile-link ${navActive('/despre-noi')}`} href="/despre-noi" on:click={closeMenu}><span>Despre Noi</span><i class="bi bi-chevron-right"></i></a>
      <div class="mobile-section">
        <div class={`mobile-section__title ${navActiveStarts('/produse')}`}><span>Produse</span></div>
        <a class="mobile-sublink" href="/produse" on:click={closeMenu}>Toate produsele</a>
        <a class="mobile-sublink" href="/produse/de-sezon" on:click={closeMenu}>De Sezon</a>
        <a class="mobile-sublink" href="/produse/la-borcan" on:click={closeMenu}>La Borcan</a>
        <a class="mobile-sublink" href="/produse/colaboratori" on:click={closeMenu}>Colaboratori</a>
        <a class="mobile-sublink" href="/produse/horeca" on:click={closeMenu}>HORECA</a>
      </div>
      <a class={`mobile-link ${navActive('/evenimente')}`} href="/evenimente" on:click={closeMenu}><span>Evenimente</span><i class="bi bi-chevron-right"></i></a>
      <a class={`mobile-link ${navActive('/contact')}`} href="/contact" on:click={closeMenu}><span>Contact</span><i class="bi bi-chevron-right"></i></a>
      <a class={`mobile-link ${navActive('/cos')}`} href="/cos" on:click={closeMenu}>
        <span><i class="bi bi-basket"></i> Coș</span>
        {#if $cartCount > 0}<span class="cart-badge">{$cartCount}</span>{/if}
      </a>
      <div class="mt-3">
        {#if $auth.isAdmin}
          <a class="btn btn-admin w-100 text-white" href="/admin/dashboard" on:click={closeMenu}>
            <i class="bi bi-speedometer2"></i> Admin
          </a>
        {:else}
          <a class="btn btn-admin w-100 text-white" href="/admin/login" on:click={closeMenu}>
            <i class="bi bi-lock"></i> Admin
          </a>
        {/if}
      </div>
    </nav>
  </div>
</div>

<style>
  .topbar-list {
    list-style: none;
  }

  .topbar-item {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .topbar-fluture {
    display: inline-flex;
    align-items: center;
    line-height: 0;
  }

  .topbar-fluture-text {
    display: none;
    white-space: nowrap;
    line-height: 1.25;
  }

  @media (min-width: 768px) {
    .topbar-fluture-text {
      display: inline;
    }
  }

  .topbar {
    background-color: var(--desaga-blue);
  }

  .cart-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    text-decoration: none;
    color: rgba(0, 0, 0, 0.75);
    background: rgba(0, 0, 0, 0.04);
  }

  .cart-link.active {
    color: var(--desaga-blue);
    background: rgba(38, 153, 214, 0.12);
  }

  .cart-badge {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--desaga-blue);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .cart-link .cart-badge {
    position: absolute;
    right: -4px;
    top: -4px;
  }

  .nav-link.active {
    color: var(--desaga-blue) !important;
    border-bottom: 2px solid var(--desaga-blue);
  }

  .desktop-dropdown:hover > .dropdown-menu {
    display: block;
  }

  .btn-admin {
    background-color: var(--desaga-blue);
    border-color: var(--desaga-blue);
  }

  .btn-admin:hover,
  .btn-admin:focus {
    background-color: var(--desaga-dark-blue);
    border-color: var(--desaga-dark-blue);
  }

  .mainnav .container {
    min-width: 0;
  }

  .burger {
    border: 0;
    padding: 8px;
    border-radius: 12px;
  }

  .burger:focus {
    box-shadow: 0 0 0 0.2rem rgba(38, 153, 214, 0.25);
  }

  .burger__bars {
    width: 26px;
    height: 18px;
    display: grid;
    align-content: space-between;
  }

  .burger__bar {
    height: 2px;
    width: 100%;
    background: rgba(0, 0, 0, 0.75);
    border-radius: 999px;
    transform-origin: center;
    transition: transform 220ms ease, opacity 180ms ease;
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
    width: min(92vw, 360px);
  }

  .mobile-nav {
    display: grid;
    gap: 6px;
  }

  .mobile-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    padding: 12px;
    border-radius: 14px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 800;
    background: rgba(0, 0, 0, 0.015);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .mobile-link.active {
    border-color: rgba(38, 153, 214, 0.35);
    background: rgba(38, 153, 214, 0.08);
    color: var(--desaga-blue);
  }

  .mobile-section {
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.012);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .mobile-section__title {
    font-weight: 900;
    color: rgba(0, 0, 0, 0.82);
    margin-bottom: 8px;
  }

  .mobile-section__title.active {
    color: var(--desaga-blue);
  }

  .mobile-sublink {
    display: block;
    text-decoration: none;
    padding: 10px;
    border-radius: 12px;
    color: rgba(0, 0, 0, 0.75);
    font-weight: 700;
  }

  .mobile-sublink:hover {
    background: rgba(38, 153, 214, 0.08);
  }

  @media (max-width: 991.98px) {
    .topbar .container {
      padding-top: 10px;
      padding-bottom: 10px;
      gap: 10px !important;
      flex-direction: column;
      align-items: stretch !important;
    }

    .topbar .container > ul {
      padding: 8px 10px !important;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      justify-content: flex-start !important;
      gap: 10px !important;
    }

    .topbar .container li,
    .topbar .container a {
      width: 100%;
    }

    .topbar .container a {
      display: flex !important;
      align-items: flex-start;
      line-height: 1.25;
      white-space: normal;
    }

    .topbar .topbar-social {
      justify-content: center !important;
      gap: 14px !important;
      padding: 6px 10px !important;
    }

    .topbar .topbar-social li,
    .topbar .topbar-social a {
      width: auto !important;
    }

    .topbar .topbar-social a {
      align-items: center !important;
      justify-content: center !important;
      padding: 6px 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.1);
    }

    .topbar .topbar-social .topbar-fluture-text {
      display: none !important;
    }
  }
</style>

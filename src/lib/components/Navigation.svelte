<!-- src/lib/components/Nav.svelte (or wherever this file lives) -->
<script lang="ts">
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";

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
        if (typeof window === "undefined") return;
        if (!offcanvasEl) return;

        const bootstrap = (window as any).bootstrap;
        if (!bootstrap?.Offcanvas) return;

        offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(
            offcanvasEl,
            {
                backdrop: true,
                scroll: false,
            },
        );

        offcanvasEl.addEventListener("shown.bs.offcanvas", handleShown);
        offcanvasEl.addEventListener("hidden.bs.offcanvas", handleHidden);
    });

    onDestroy(() => {
        if (!offcanvasEl) return;
        offcanvasEl.removeEventListener("shown.bs.offcanvas", handleShown);
        offcanvasEl.removeEventListener("hidden.bs.offcanvas", handleHidden);
        offcanvasInstance?.dispose?.();
    });

    function navActive(path: string) {
        return $page.url.pathname === path ? "active" : "";
    }

    function navActiveStarts(prefix: string) {
        return $page.url.pathname.startsWith(prefix) ? "active" : "";
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

<!-- Top info bar -->
<nav class="navbar navbar-dark topbar" style="background-color: #066423;">
    <div class="container d-flex justify-content-between gap-3 flex-wrap">
        <div class="text-white small d-flex flex-wrap gap-3">
            <span class="d-inline-flex align-items-center gap-2">
                <i class="bi bi-geo-alt-fill"></i>
                Cluj-Napoca, Str. Constantin Brâncuși nr. 153
            </span>
            <span class="d-inline-flex align-items-center gap-2">
                <i class="bi bi-clock-fill"></i>
                Orar: L-V 9:00 - 18:00
            </span>
        </div>

        <div class="text-white small d-flex flex-wrap gap-3 align-items-center">
            <span class="d-inline-flex align-items-center gap-2">
                <i class="bi bi-telephone-fill"></i>
                +40 729 969 822
            </span>

            <!-- svelte-ignore a11y_invalid_attribute -->
            <a
                class="text-white d-inline-flex align-items-center gap-2"
                href="https://facebook.com/desagaculegume"
            >
                <i class="bi bi-facebook"></i> Facebook
            </a>

            <!-- svelte-ignore a11y_invalid_attribute -->
            <a
                class="text-white d-inline-flex align-items-center gap-2"
                href="https://www.instagram.com/desaga_cu_legume/"
            >
                <i class="bi bi-instagram"></i> Instagram
            </a>
        </div>
    </div>
</nav>

<!-- Main navbar -->
<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top mainnav">
    <div class="container">
        <a class="navbar-brand fw-bold fs-4 d-flex align-items-center" href="/">
            <img
                src="/src/assets/logo.png"
                alt="DeSaga Logo"
                height="32"
                class="me-2"
            />
            DeSaga cu Legume
        </a>

        <!-- Desktop nav (always visible at lg+) -->
        <div class="d-none d-lg-flex ms-auto align-items-center">
            <ul class="navbar-nav align-items-lg-center">
                <li class="nav-item">
                    <a class="nav-link {navActive('/')}" href="/">Acasă</a>
                </li>
                <li class="nav-item">
                    <a
                        class="nav-link {navActive('/despre-noi')}"
                        href="/despre-noi">Despre Noi</a
                    >
                </li>

                <li class="nav-item dropdown desktop-dropdown">
                    <a
                        class="nav-link dropdown-toggle {navActiveStarts(
                            '/produse',
                        )}"
                        href="/produse">Produse</a
                    >
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="/produse"
                                >Toate produsele</a
                            >
                        </li>
                        <li>
                            <a class="dropdown-item" href="/produse/de-sezon"
                                >De Sezon</a
                            >
                        </li>
                        <li>
                            <a class="dropdown-item" href="/produse/la-borcan"
                                >La Borcan</a
                            >
                        </li>
                        <li>
                            <a
                                class="dropdown-item"
                                href="/produse/colaboratori">Colaboratori</a
                            >
                        </li>
                        <li>
                            <a class="dropdown-item" href="/produse/horeca"
                                >HORECA</a
                            >
                        </li>
                    </ul>
                </li>

                <li class="nav-item">
                    <a class="nav-link {navActive('/noutati')}" href="/noutati"
                        >Noutăți</a
                    >
                </li>
                <li class="nav-item">
                    <a
                        class="nav-link {navActive('/evenimente')}"
                        href="/evenimente">Evenimente</a
                    >
                </li>
                <li class="nav-item">
                    <a class="nav-link {navActive('/contact')}" href="/contact"
                        >Contact</a
                    >
                </li>

                <li class="nav-item ms-lg-2">
                    <a
                        class="btn btn-admin btn-sm text-white"
                        href="/admin/login"
                    >
                        <i class="bi bi-lock"></i> Admin
                    </a>
                </li>
            </ul>
        </div>

        <!-- Mobile burger (always visible below lg) -->
        <button
            type="button"
            class="navbar-toggler d-lg-none burger"
            aria-label="Open menu"
            aria-expanded={isOpen}
            on:click={toggleMenu}
        >
            <span class="burger__bars" aria-hidden="true">
                <span class="burger__bar"></span>
                <span class="burger__bar"></span>
                <span class="burger__bar"></span>
            </span>
        </button>
    </div>
</nav>

<!-- Offcanvas (mobile menu content must live here; never rely on the desktop collapse) -->
<div
    class="offcanvas offcanvas-end mobile-offcanvas"
    tabindex="-1"
    bind:this={offcanvasEl}
    aria-label="Mobile navigation"
>
    <div class="offcanvas-header bg-white text-dark">
        <div class="d-flex align-items-center gap-2">
            <button
                class="btn btn-link p-0 text-dark"
                on:click={closeMenu}
                aria-label="Close menu"
            >
                <i class="bi bi-x-lg fs-5"></i>
            </button>
            <h5 class="offcanvas-title m-0">DeSaga</h5>
        </div>
    </div>

    <div class="offcanvas-body">
        <nav class="mobile-nav">
            <a
                class="mobile-link {navActive('/')}"
                href="/"
                on:click={closeMenu}
            >
                <span>Acasă</span>
                <i class="bi bi-chevron-right"></i>
            </a>

            <a
                class="mobile-link {navActive('/despre-noi')}"
                href="/despre-noi"
                on:click={closeMenu}
            >
                <span>Despre Noi</span>
                <i class="bi bi-chevron-right"></i>
            </a>

            <div class="mobile-section">
                <div
                    class="mobile-section__title {navActiveStarts('/produse')}"
                >
                    <span>Produse</span>
                </div>

                <a class="mobile-sublink" href="/produse" on:click={closeMenu}
                    >Toate produsele</a
                >
                <a
                    class="mobile-sublink"
                    href="/produse/de-sezon"
                    on:click={closeMenu}>De Sezon</a
                >
                <a
                    class="mobile-sublink"
                    href="/produse/la-borcan"
                    on:click={closeMenu}>La Borcan</a
                >
                <a
                    class="mobile-sublink"
                    href="/produse/colaboratori"
                    on:click={closeMenu}>Colaboratori</a
                >
                <a
                    class="mobile-sublink"
                    href="/produse/horeca"
                    on:click={closeMenu}>HORECA</a
                >
            </div>

            <a
                class="mobile-link {navActive('/noutati')}"
                href="/noutati"
                on:click={closeMenu}
            >
                <span>Noutăți</span>
                <i class="bi bi-chevron-right"></i>
            </a>

            <a
                class="mobile-link {navActive('/evenimente')}"
                href="/evenimente"
                on:click={closeMenu}
            >
                <span>Evenimente</span>
                <i class="bi bi-chevron-right"></i>
            </a>

            <a
                class="mobile-link {navActive('/contact')}"
                href="/contact"
                on:click={closeMenu}
            >
                <span>Contact</span>
                <i class="bi bi-chevron-right"></i>
            </a>

            <div class="mt-3">
                <a
                    class="btn btn-admin w-100 text-white"
                    href="/admin/login"
                    on:click={closeMenu}
                >
                    <i class="bi bi-lock"></i> Admin
                </a>
            </div>
        </nav>
    </div>
</div>

<style>
    /* Mobile polish for the green top info bar */
    @media (max-width: 991.98px) {
        .topbar .container {
            padding-top: 10px;
            padding-bottom: 10px;
            gap: 10px !important;
        }

        /* Stack the two groups (left info + right info) */
        .topbar .container {
            flex-direction: column;
            align-items: stretch !important;
        }

        .topbar .container > div {
            justify-content: flex-start !important;
            gap: 10px !important;
        }

        /* Make each item full-width so it wraps nicely */
        .topbar .container span,
        .topbar .container a {
            display: flex !important;
            align-items: flex-start;
            width: 100%;
            line-height: 1.25;
            white-space: normal;
        }

        /* Reduce icon/text spacing slightly */
        .topbar .container .gap-2 {
            gap: 8px !important;
        }

        /* Optional: subtle separators between items inside each group */
        .topbar .container > div {
            padding: 8px 10px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.06);
        }
    }

    /* Extra-small: make socials compact (icon-only) */
    @media (max-width: 420px) {
        .topbar a {
            justify-content: flex-start;
        }

        .topbar a i {
            font-size: 1.05rem;
        }

        /* hide "Facebook/Instagram" text but keep accessible name from link context */
        .topbar a {
            gap: 10px !important;
        }
        .topbar a:not(:has(img)) {
            font-size: 0; /* collapses text */
        }
        .topbar a i {
            font-size: 1.1rem; /* restore icon size */
        }
    }

    /* Active underline for desktop */
    .nav-link.active {
        color: #066423 !important;
        border-bottom: 2px solid #066423;
    }

    .desktop-dropdown:hover > .dropdown-menu {
        display: block;
    }

    .btn-admin {
        background-color: #066423;
        border-color: #066423;
    }

    .btn-admin:hover,
    .btn-admin:focus {
        background-color: #054f1b;
        border-color: #054f1b;
    }

    .btn-admin:active {
        background-color: #043d15;
        border-color: #043d15;
    }

    .form-control:focus,
    .form-select:focus {
        border-color: var(--desaga-green);
        box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
    }

    /* Fix: prevent mobile collapse logic from hiding nav items.
	   Desktop uses d-none d-lg-flex; mobile uses offcanvas only. */
    .mainnav .container {
        min-width: 0;
    }

    /* Burger animation */
    .burger {
        border: 0;
        padding: 8px;
        border-radius: 12px;
    }

    .burger:focus {
        box-shadow: 0 0 0 0.2rem rgba(6, 100, 35, 0.18);
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
        transition:
            transform 220ms ease,
            opacity 180ms ease;
    }

    /* Animate into X when aria-expanded=true */
    .burger[aria-expanded="true"] .burger__bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }

    .burger[aria-expanded="true"] .burger__bar:nth-child(2) {
        opacity: 0;
        transform: scaleX(0.6);
    }

    .burger[aria-expanded="true"] .burger__bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }

    /* Mobile offcanvas styling */
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
        padding: 12px 12px;
        border-radius: 14px;
        color: rgba(0, 0, 0, 0.85);
        font-weight: 800;
        background: rgba(0, 0, 0, 0.015);
        border: 1px solid rgba(0, 0, 0, 0.06);
    }

    .mobile-link.active {
        border-color: rgba(6, 100, 35, 0.35);
        background: rgba(6, 100, 35, 0.06);
        color: #066423;
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
        color: #066423;
    }

    .mobile-sublink {
        display: block;
        text-decoration: none;
        padding: 10px 10px;
        border-radius: 12px;
        color: rgba(0, 0, 0, 0.75);
        font-weight: 700;
    }

    .mobile-sublink:hover {
        background: rgba(0, 0, 0, 0.03);
    }

    /* Topbar wrapping safety */
    .topbar .container > * {
        min-width: 0;
    }
</style>

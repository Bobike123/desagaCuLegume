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

        // Bootstrap must be loaded globally
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
<nav class="navbar navbar-dark" style="background-color: #066423;">
    <div class="container d-flex justify-content-between">
        <div class="text-white small">
            <span>
                <i class="bi bi-geo-alt-fill"></i>
                Cluj-Napoca, Str. Constantin Brâncuși nr. 153
            </span>
            <span class="ms-3">
                <i class="bi bi-clock-fill"></i>
                Orar: L-V 9:00 - 18:00
            </span>
        </div>
        <div class="text-white small">
            <span><i class="bi bi-telephone-fill"></i> +40 729 969 822</span>
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a class="text-white ms-3" href="#"
                ><i class="bi bi-facebook"></i> Facebook</a
            >
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a class="text-white ms-2" href="#"
                ><i class="bi bi-instagram"></i> Instagram</a
            >
        </div>
    </div>
</nav>

<!-- Main navbar -->
<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top">
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

        <!-- Desktop -->
        <div class="collapse navbar-collapse d-none d-lg-flex">
            <ul class="navbar-nav ms-auto align-items-lg-center">
                <li class="nav-item">
                    <a
                        class="nav-link {$page.url.pathname === '/'
                            ? 'active'
                            : ''}"
                        href="/">Acasă</a
                    >
                </li>
                <li class="nav-item">
                    <a
                        class="nav-link {$page.url.pathname === '/despre-noi'
                            ? 'active'
                            : ''}"
                        href="/despre-noi">Despre Noi</a
                    >
                </li>

                <li class="nav-item dropdown desktop-dropdown">
                    <a
                        class="nav-link dropdown-toggle {$page.url.pathname.startsWith(
                            '/produse',
                        )
                            ? 'active'
                            : ''}"
                        href="/produse"
                    >
                        Produse
                    </a>
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
                    <a
                        class="nav-link {$page.url.pathname === '/noutati'
                            ? 'active'
                            : ''}"
                        href="/noutati">Noutăți</a
                    >
                </li>
                <li class="nav-item">
                    <a
                        class="nav-link {$page.url.pathname === '/evenimente'
                            ? 'active'
                            : ''}"
                        href="/evenimente">Evenimente</a
                    >
                </li>
                <li class="nav-item">
                    <a
                        class="nav-link {$page.url.pathname === '/contact'
                            ? 'active'
                            : ''}"
                        href="/contact">Contact</a
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

        <!-- Mobile -->
        <button
            class="btn d-lg-none burger-btn"
            aria-label="Open menu"
            aria-expanded={isOpen}
            on:click={toggleMenu}
        >
            <span class="navbar-toggler-icon"></span>
        </button>
    </div>
</nav>

<!-- Offcanvas -->
<div
    class="offcanvas offcanvas-end"
    tabindex="-1"
    bind:this={offcanvasEl}
    aria-label="Mobile navigation"
>
    <div class="offcanvas-header bg-white text-dark">
        <div class="d-flex align-items-center gap-2">
            {#if isOpen}
                <button
                    class="btn btn-link p-0"
                    on:click={closeMenu}
                    aria-label="Back"
                >
                    <i class="bi bi-arrow-left fs-4"></i>
                </button>
            {/if}
            <h5 class="offcanvas-title m-0">DeSaga</h5>
        </div>

        <button class="btn-close" on:click={closeMenu} aria-label="Close"
        ></button>
    </div>

    <div class="offcanvas-body">
        <!-- Mobile links identical logic, omitted here for brevity -->
    </div>
</div>

<style>
    .nav-link.active {
        color: #066423 !important;
        border-bottom: 2px solid #066423;
    }

    .desktop-dropdown:hover > .dropdown-menu {
        display: block;
    }
    .btn-admin {
        background-color: #066423; /* DeSaga green */
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
</style>

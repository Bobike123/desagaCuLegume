<script>
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    
    let dropdownElement;

    onMount(() => {
        // Initialize Bootstrap dropdown if available
        if (typeof window !== "undefined" && window.bootstrap) {
            const dropdowns = document.querySelectorAll(
                '[data-bs-toggle="dropdown"]',
            );
            dropdowns.forEach((dropdown) => {
                new window.bootstrap.Dropdown(dropdown);
            });
        }
    });
</script>

<svelte:head>
    <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        crossorigin="anonymous"
    ></script>
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-dark bg-brown sticky-top">
    <div class="container">
        <a class="navbar-brand fw-bold fs-4" href="/">
            <i class="bi bi-leaf"></i> DeSaga cu Legume
        </a>

        <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#navbarOffcanvas"
            aria-controls="navbarOffcanvas"
            aria-expanded="false"
            aria-label="Toggle navigation menu"
        >
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="offcanvas offcanvas-end" tabindex="-1" id="navbarOffcanvas">
            <div class="offcanvas-header bg-brown text-white">
                <h5 class="offcanvas-title">DeSaga</h5>
                <button
                    type="button"
                    class="btn-close btn-close-white"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close menu"
                ></button>
            </div>

            <div class="offcanvas-body">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname === '/'
                                ? 'active'
                                : ''}"
                            href="/"
                        >
                            Acasă
                        </a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname ===
                            '/despre-noi'
                                ? 'active'
                                : ''}"
                            href="/despre-noi"
                        >
                            Despre Noi
                        </a>
                    </li>
                    <li class="nav-item dropdown" bind:this={dropdownElement}>
                        <a
                            class="nav-link dropdown-toggle {$page.url.pathname.startsWith(
                                '/produse',
                            )
                                ? 'active'
                                : ''}"
                            href="/produse"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
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
                                <a
                                    class="dropdown-item"
                                    href="/produse/de-sezon">De Sezon</a
                                >
                            </li>
                            <li>
                                <a
                                    class="dropdown-item"
                                    href="/produse/la-borcan">La Borcan</a
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
                            href="/noutati"
                        >
                            Noutăți
                        </a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname ===
                            '/evenimente'
                                ? 'active'
                                : ''}"
                            href="/evenimente"
                        >
                            Evenimente
                        </a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname === '/contact'
                                ? 'active'
                                : ''}"
                            href="/contact"
                        >
                            Contact
                        </a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link btn btn-primary btn-sm text-white"
                            href="/admin/login"
                        >
                            <i class="bi bi-lock"></i> Admin
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</nav>

<style>
    .bg-brown {
        background-color: var(--desaga-brown) !important;
    }

    .navbar-brand {
        color: white !important;
        font-weight: bold;
    }

    .nav-link {
        color: white !important;
        transition: all 0.3s ease;
    }

    .nav-link:hover {
        color: var(--desaga-green) !important;
    }

    .nav-link.active {
        color: var(--desaga-green) !important;
        border-bottom: 2px solid var(--desaga-green);
    }

    .dropdown-menu {
        background-color: var(--desaga-brown);
        border: none;
    }

    .dropdown-item {
        color: white;
        transition: all 0.3s ease;
    }

    .dropdown-item:hover {
        background-color: rgba(118, 236, 30, 0.2);
        color: var(--desaga-green);
    }

    /* Mobile styles - black text in offcanvas */
    .offcanvas-body .nav-link {
        color: #333 !important;
    }

    .offcanvas-body .dropdown-item {
        color: #333 !important;
    }

    .offcanvas-body .nav-link:hover,
    .offcanvas-body .dropdown-item:hover {
        color: var(--desaga-green) !important;
    }

    .offcanvas-body .nav-link.active {
        color: var(--desaga-green) !important;
    }

    /* Desktop styles */
    @media (min-width: 992px) {
        .nav-link {
            color: white !important;
        }

        .dropdown-item {
            color: white !important;
        }

        .dropdown-item:hover {
            color: var(--desaga-green) !important;
        }
    }
</style>

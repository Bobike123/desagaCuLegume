<script>
    import { page } from "$app/stores";
    import { onMount } from "svelte";


    let dropdownElement;


    onMount(() => {
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
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        crossorigin="anonymous"
    ></script>
</svelte:head>


<!-- Green info top bar -->
<nav class="navbar navbar-dark" style="background-color: #066423;">
    <div class="container d-flex justify-content-between">
        <div class="text-white small">
            <span><i class="bi bi-geo-alt-fill"></i> Cluj-Napoca, Str. Constantin Brâncuși nr. 153</span>
            <span class="ms-3"><i class="bi bi-clock-fill"></i> Orar: L-V 9:00 - 18:00</span>
        </div>
        <div class="text-white small">
            <span><i class="bi bi-telephone-fill"></i> +40 729 969 822</span>
            <a class="text-white ms-3" href="#"><i class="bi bi-facebook"></i> Facebook</a>
            <a class="text-white ms-2" href="#"><i class="bi bi-instagram"></i> Instagram</a>
        </div>
    </div>
</nav>


<!-- Main navigation -->
<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top">
    <div class="container">
        <a class="navbar-brand fw-bold fs-4" href="/">
            <img src="/src/assets/logo.png" alt="DeSaga Logo" height="32" class="me-2"> DeSaga cu Legume
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
            <div class="offcanvas-header bg-white text-dark">
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
                            class="nav-link {$page.url.pathname === '/' ? 'active' : ''}"
                            href="/"
                        >
                            Acasă
                        </a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname === '/despre-noi' ? 'active' : ''}"
                            href="/despre-noi"
                        >
                            Despre Noi
                        </a>
                    </li>
                    <li class="nav-item dropdown" bind:this={dropdownElement}>
                        <a
                            class="nav-link dropdown-toggle {$page.url.pathname.startsWith('/produse') ? 'active' : ''}"
                            href="/produse"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            Produse
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/produse">Toate produsele</a></li>
                            <li><a class="dropdown-item" href="/produse/de-sezon">De Sezon</a></li>
                            <li><a class="dropdown-item" href="/produse/la-borcan">La Borcan</a></li>
                            <li><a class="dropdown-item" href="/produse/colaboratori">Colaboratori</a></li>
                            <li><a class="dropdown-item" href="/produse/horeca">HORECA</a></li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname === '/noutati' ? 'active' : ''}"
                            href="/noutati">Noutăți</a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname === '/evenimente' ? 'active' : ''}"
                            href="/evenimente">Evenimente</a>
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link {$page.url.pathname === '/contact' ? 'active' : ''}"
                            href="/contact">Contact</a>
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
    .nav-link {
        transition: all 0.3s ease;
    }


    .nav-link {
        color: #333 !important;
    }

    .nav-link:hover {
        color: #066423 !important;
    }


    .nav-link.active {
        color: #066423 !important;
        border-bottom: 2px solid #066423;
    }


    .dropdown-menu {
        background-color: #ffffff;
        border: none;
    }


    .dropdown-item {
        color: #066423;
        transition: all 0.3s ease;
    }


    .dropdown-item:hover {
        background-color: rgba(6, 100, 35, 0.1);
        color: #066423;
    }


    .offcanvas-body .nav-link,
    .offcanvas-body .dropdown-item {
        color: #333 !important;
    }


    .offcanvas-body .nav-link:hover,
    .offcanvas-body .dropdown-item:hover {
        color: #066423 !important;
    }


    .offcanvas-body .nav-link.active {
        color: #066423 !important;
    }
</style>

<script>
    let openMenu = false;
    let openLocation = false;
</script>

<footer class="footer">
    <div class="footer-main text-white py-5">
        <div class="container">
            <div class="row g-4">
                <!-- Brand -->
                <div class="col-md-4">
                    <h5 class="fw-bold mb-3">
                        <i class="bi bi-leaf"></i> DeSaga cu Legume
                    </h5>
                    <p class="small mb-2">
                        Legume proaspete de la fermele locale, direct la masa
                        ta.
                    </p>
                    <div class="d-flex gap-2 mt-2 footer-social">
                        <a
                            href="https://facebook.com/desagaculegume"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-white fs-5"
                            aria-label="Facebook"
                        >
                            <i class="fa fa-facebook"></i>
                        </a>
                        <a
                            href="https://www.instagram.com/desaga_cu_legume/"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-white fs-5"
                            aria-label="Instagram"
                        >
                            <i class="fa fa-instagram"></i>
                        </a>
                    </div>
                </div>

                <!-- Menu -->
                <div class="col-md-4 footer-group">
                    <button
                        type="button"
                        class="footer-title"
                        on:click={() => (openMenu = !openMenu)}
                        aria-expanded={openMenu}
                    >
                        <span class="fw-bold">Meniu</span>
                        <i
                            class="fa fa-angle-down footer-caret"
                            class:rotated={openMenu}
                            aria-hidden="true"
                        ></i>
                    </button>

                    <div class="footer-panel" class:open={openMenu}>
                        <ul class="list-unstyled mb-0">
                            <li><a href="/">Acasă</a></li>
                            <li><a href="/despre-noi">Despre Noi</a></li>
                            <li><a href="/produse">Produse</a></li>
                            <li><a href="/contact">Contact</a></li>
                            <li><a href="/horeca">HoReCA</a></li>
                            <li><a href="/cos">Coș</a></li>
                        </ul>
                    </div>
                </div>

                <!-- Location -->
                <div class="col-md-4 footer-group">
                    <button
                        type="button"
                        class="footer-title"
                        on:click={() => (openLocation = !openLocation)}
                        aria-expanded={openLocation}
                    >
                        <span class="fw-bold">Locația Noastră</span>
                        <i
                            class="fa fa-angle-down footer-caret"
                            class:rotated={openLocation}
                            aria-hidden="true"
                        ></i>
                    </button>

                    <div class="footer-panel" class:open={openLocation}>
                        <p class="small mb-2">
                            Cluj-Napoca, Str. Constantin Brancusi nr. 153<br />
                            Orar: L-V: 9:00 - 18:00<br />
                            Tel: 0729 969 822
                        </p>

                        <iframe
                            class="footer-map"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2733.2627958985477!2d23.613140411901085!3d46.759716245953896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47490c49b6ff9853%3A0x2cdb1ae569801b0b!2sStrada%20Constantin%20Br%C3%A2ncu%C8%99i%20153%2C%20Cluj-Napoca%20400645%2C%20Rom%C3%A2nia!5e0!3m2!1sro!2sdk!4v1765492717214!5m2!1sro!2sdk"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            title="Harta locatie"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer-bottom text-white text-center py-2">
        <p class="small mb-0">
            &copy; 2024 DeSaga cu Legume. Toate drepturile rezervate.
        </p>
        <p class="small mb-0">
            Realizat cu <i class="bi bi-heart text-danger"></i> pentru comunitatea
            locală keep it greeen
        </p>
    </div>
</footer>

<style>
    .footer-main {
        background-color: #334155;
    }

    .footer-bottom {
        background-color: var(--desaga-dark-blue);
    }

    .footer p {
        line-height: 1.5;
    }

    /* links hover animation */
    .footer a {
        color: #fff;
        text-decoration: none;
        position: relative;
        display: inline-block;
        transition:
            color 0.2s ease,
            transform 0.2s ease;
    }

    .footer a::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -2px;
        width: 100%;
        height: 2px;
        background-color: #a8e6a3;
        transform: scaleX(0);
        transform-origin: right;
        transition: transform 0.25s ease;
    }

    .footer a:hover::after,
    .footer a:focus-visible::after {
        transform: scaleX(1);
        transform-origin: left;
    }

    .footer a:hover {
        color: #a8e6a3;
        transform: translateX(3px);
    }

    .footer-social {
        justify-content: flex-start;
    }

    .footer-title {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: transparent;
        border: 0;
        color: #fff;
        padding: 0;
        margin-bottom: 0.75rem;
        text-align: left;
    }

    /* caret hidden on desktop */
    .footer-caret {
        display: none;
    }

    .footer-panel {
        display: block;
    }

    .footer-map {
        width: 60%;
        height: 150px;
        border: 0;
        border-radius: 8px;
    }

    /* mobile */
    @media (max-width: 767.98px) {
        .footer-main {
            text-align: center;
        }

        .footer-social {
            justify-content: center;
        }

        .footer-group {
            text-align: left;
        }

        /* show caret only on mobile */
        .footer-caret {
            display: inline-block;
            transition: transform 0.25s ease;
        }

        /* closed = down, open = up */
        .footer-caret.rotated {
            transform: rotate(180deg);
        }

        .footer-panel {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.25s ease;
        }

        .footer-panel.open {
            max-height: 600px;
        }

        .footer-map {
            width: 100%;
            height: 180px;
            margin-top: 0.75rem;
        }
    }
</style>

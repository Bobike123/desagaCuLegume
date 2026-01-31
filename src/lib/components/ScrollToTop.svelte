<script lang="ts">
    import { onMount } from "svelte";

    let visible: boolean = false;

    function onScroll(): void {
        visible = window.scrollY > 300;
    }

    function animateScrollToTop(duration: number = 650): void {
        const startY: number =
            window.scrollY || document.documentElement.scrollTop || 0;
        const start: number = performance.now();

        const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

        const step = (now: number): void => {
            const progress: number = Math.min(1, (now - start) / duration);
            const eased: number = easeOutCubic(progress);

            window.scrollTo(0, Math.round(startY * (1 - eased)));

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    function scrollToTop(): void {
        animateScrollToTop(650);
    }

    onMount(() => {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    });
</script>

<div class="scrolltop" class:visible>
    <button
        type="button"
        class="scrolltop-btn"
        aria-label="Scroll to top"
        on:click={scrollToTop}
    >
        <i class="bi bi-arrow-up-short" aria-hidden="true"></i>
    </button>
</div>

<style>
    .scrolltop {
        position: fixed;
        right: 1rem;
        bottom: 1.25rem;
        z-index: 9999;

        opacity: 0;
        visibility: hidden;
        transform: translateY(14px) scale(0.98);
        pointer-events: none;

        transition:
            opacity 0.25s ease,
            transform 0.25s ease,
            visibility 0.25s ease;
    }

    .scrolltop.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        pointer-events: auto;
    }

    .scrolltop-btn {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;

        border: none;
        cursor: pointer;
        border-radius: 9999px;

        background: #334155;
        color: #fff;

        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);
        transition:
            transform 0.18s ease,
            background-color 0.18s ease,
            box-shadow 0.18s ease;
    }

    .scrolltop-btn:hover {
        background-color: #2b3a4f;
        transform: translateY(-3px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
    }

    .scrolltop-btn:active {
        transform: translateY(-1px) scale(0.98);
    }

    .scrolltop-btn i {
        font-size: 1.9rem;
        line-height: 1;
    }

    @media (max-width: 767.98px) {
        .scrolltop-btn {
            width: 50px;
            height: 50px;
        }
        .scrolltop-btn i {
            font-size: 2.1rem;
        }
    }
</style>

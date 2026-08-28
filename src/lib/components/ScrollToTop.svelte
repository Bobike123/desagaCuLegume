<script lang="ts">
    let visible = false;

    const SHOW_AFTER = 300;
    const SCROLL_DURATION = 650;

    let animationFrame: number | null = null;
    let scrollTicking = false;

    function getScrollTop(): number {
        return window.scrollY || document.documentElement.scrollTop || 0;
    }

    function onScroll(): void {
        if (scrollTicking) return;

        scrollTicking = true;

        requestAnimationFrame(() => {
            visible = getScrollTop() > SHOW_AFTER;
            scrollTicking = false;
        });
    }

    function prefersReducedMotion(): boolean {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function cancelScrollAnimation(): void {
        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

function animateScrollToTop(duration = SCROLL_DURATION): void {
    cancelScrollAnimation();

    const startY = getScrollTop();

    if (startY <= 0) return;

    if (prefersReducedMotion()) {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
    }

    const start = performance.now();

    const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);

    const step = (now: number): void => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = easeOutQuad(progress);

        window.scrollTo({
            top: Math.round(startY * (1 - eased)),
            behavior: "auto"
        });

        if (progress < 1) {
            animationFrame = requestAnimationFrame(step);
        } else {
            animationFrame = null;
        }
    };

    animationFrame = requestAnimationFrame(step);
}
</script>

<svelte:window onscroll={onScroll} />

<div
    class="scrolltop"
    class:visible
    aria-hidden={!visible}
>
    <button
        type="button"
        class="scrolltop-btn"
        aria-label="Înapoi sus"
        title="Înapoi sus"
        tabindex={visible ? 0 : -1}
        onclick={() => animateScrollToTop()}
    >
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
        </svg>
    </button>
</div>

<style>
    .scrolltop {
        position: fixed;
        right: max(1rem, env(safe-area-inset-right));
        bottom: max(1.25rem, env(safe-area-inset-bottom));
        z-index: 1020;

        opacity: 0;
        visibility: hidden;
        transform: translateY(0.875rem) scale(0.98);
        pointer-events: none;

        transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            visibility 0.2s ease;
    }

    /* Sit above the mobile tab bar while the burger nav is active. */
    @media (max-width: 991.98px) {
        .scrolltop {
            bottom: calc(70px + env(safe-area-inset-bottom, 0px));
        }
    }

    .scrolltop.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        pointer-events: auto;
    }

    .scrolltop-btn {
        width: 3rem;
        height: 3rem;
        display: grid;
        place-items: center;

        border: 0;
        border-radius: var(--radius-lg);
        cursor: pointer;

        color: #fff;
        background: var(--ink);

        box-shadow: var(--shadow-pop);

        transition:
            transform 0.18s ease,
            background-color 0.18s ease,
            box-shadow 0.18s ease;
    }

    .scrolltop-btn:hover {
        background: #000;
        transform: translateY(-0.1875rem);
        box-shadow: var(--shadow-pop);
    }

    .scrolltop-btn:active {
        transform: translateY(-0.0625rem) scale(0.98);
    }

    .scrolltop-btn:focus-visible {
        outline: 3px solid var(--paper-2);
        outline-offset: 4px;
    }

    .scrolltop-btn svg {
        display: block;
    }

    @media (max-width: 767.98px) {
        .scrolltop-btn {
            width: 3.25rem;
            height: 3.25rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .scrolltop,
        .scrolltop-btn {
            transition: none;
        }
    }
</style>

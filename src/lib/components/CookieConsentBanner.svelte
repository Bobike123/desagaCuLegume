<script lang="ts">
  import { onMount } from 'svelte';

  type CookiePreferences = {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
    savedAt: string;
  };

  const STORAGE_KEY = 'desaga_cookie_preferences';
  const BANNER_GUTTER = 16;

  let visible = false;
  let manageOpen = false;
  let analytics = false;
  let marketing = false;
  let bannerStyle = '';

  function updateBannerViewport() {
    const viewport = window.visualViewport;
    if (!viewport) {
      bannerStyle = '';
      return;
    }

    const width = Math.max(0, Math.min(960, viewport.width - BANNER_GUTTER * 2));
    const left = viewport.offsetLeft + Math.max(BANNER_GUTTER, (viewport.width - width) / 2);
    // Below the lg breakpoint the fixed mobile tab bar occupies the bottom edge.
    const tabBarOffset = window.innerWidth < 992 ? 62 : 0;
    const bottom = Math.max(
      BANNER_GUTTER + tabBarOffset,
      window.innerHeight - viewport.offsetTop - viewport.height + BANNER_GUTTER + tabBarOffset,
    );

    bannerStyle = `left: ${left}px; right: auto; bottom: ${bottom}px; width: ${width}px;`;
  }

  function savePreferences(preferences: CookiePreferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new CustomEvent('desaga:cookie-consent', { detail: preferences }));
    visible = false;
    manageOpen = false;
  }

  function acceptAll() {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      savedAt: new Date().toISOString(),
    });
  }

  function rejectOptional() {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      savedAt: new Date().toISOString(),
    });
  }

  function saveCustom() {
    savePreferences({
      necessary: true,
      analytics,
      marketing,
      savedAt: new Date().toISOString(),
    });
  }

  onMount(() => {
    updateBannerViewport();
    window.addEventListener('resize', updateBannerViewport);
    window.visualViewport?.addEventListener('resize', updateBannerViewport);
    window.visualViewport?.addEventListener('scroll', updateBannerViewport);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        visible = true;
        requestAnimationFrame(updateBannerViewport);
      } else {
        const parsed = JSON.parse(stored) as Partial<CookiePreferences>;
        analytics = Boolean(parsed.analytics);
        marketing = Boolean(parsed.marketing);
      }
    } catch {
      visible = true;
      requestAnimationFrame(updateBannerViewport);
    }

    return () => {
      window.removeEventListener('resize', updateBannerViewport);
      window.visualViewport?.removeEventListener('resize', updateBannerViewport);
      window.visualViewport?.removeEventListener('scroll', updateBannerViewport);
    };
  });
</script>

{#if visible}
  <section class="cookie-banner" style={bannerStyle} aria-label="Consimțământ cookie">
    <div class="cookie-copy">
      <strong>Folosim cookie-uri?</strong>
      <p>
        Da, folosim cookie-uri necesare pentru autentificare, coș și securitate.
        Cu acordul tău putem folosi și cookie-uri de analiză sau marketing.
      </p>
      <a href="/politica-cookies">Politica de cookie-uri</a>
    </div>

    {#if manageOpen}
      <div class="cookie-preferences">
        <label class="cookie-choice disabled">
          <input type="checkbox" checked disabled />
          <span>
            <strong>Necesare</strong>
            <small>Login, sesiune, coș și securitate.</small>
          </span>
        </label>

        <label class="cookie-choice">
          <input type="checkbox" bind:checked={analytics} />
          <span>
            <strong>Analiză</strong>
            <small>Ne ajută să îmbunătățim website-ul.</small>
          </span>
        </label>

        <label class="cookie-choice">
          <input type="checkbox" bind:checked={marketing} />
          <span>
            <strong>Marketing</strong>
            <small>Comunicări și măsurare campanii, doar cu acord.</small>
          </span>
        </label>
      </div>
    {/if}

    <div class="cookie-actions">
      {#if manageOpen}
        <button type="button" class="btn btn-accent" on:click={saveCustom}>Salvează preferințele</button>
      {:else}
        <button type="button" class="btn btn-accent" on:click={acceptAll}>Da, accept</button>
        <button type="button" class="btn btn-outline-accent" on:click={rejectOptional}>Nu, resping</button>
      {/if}

      <button type="button" class="cookie-link-button" on:click={() => (manageOpen = !manageOpen)}>
        {manageOpen ? 'Înapoi' : 'Gestionează'}
      </button>
    </div>
  </section>
{/if}

<style>
  .cookie-banner {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    z-index: 1060;
    display: grid;
    gap: 1rem;
    max-width: 960px;
    margin: 0 auto;
    padding: 1rem;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 18px;
    box-shadow: 0 18px 46px rgba(15, 23, 42, 0.18);
  }

  /* CSS fallback when visualViewport is unavailable: clear the mobile tab bar. */
  @media (max-width: 991.98px) {
    .cookie-banner {
      bottom: calc(1rem + 62px + env(safe-area-inset-bottom, 0px));
    }
  }

  @media (min-width: 768px) {
    .cookie-banner {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .cookie-preferences {
      grid-column: 1 / -1;
    }
  }

  .cookie-copy strong {
    display: block;
    color: var(--desaga-heading);
    font-weight: 950;
    margin-bottom: 0.25rem;
  }

  .cookie-copy p {
    margin: 0;
    color: rgba(20, 33, 43, 0.72);
    line-height: 1.45;
  }

  .cookie-copy a {
    display: inline-flex;
    margin-top: 0.45rem;
    font-weight: 850;
    text-decoration: none;
  }

  .cookie-copy a:hover,
  .cookie-copy a:focus {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .cookie-actions {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  @media (min-width: 768px) {
    .cookie-actions {
      justify-content: flex-end;
      min-width: 300px;
    }
  }

  .cookie-link-button {
    border: 0;
    background: transparent;
    color: var(--desaga-blue);
    font-weight: 900;
    padding: 0.35rem 0.25rem;
  }

  .cookie-link-button:hover,
  .cookie-link-button:focus {
    color: var(--desaga-dark-blue);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .cookie-preferences {
    display: grid;
    gap: 0.65rem;
    padding-top: 0.2rem;
  }

  @media (min-width: 768px) {
    .cookie-preferences {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .cookie-choice {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.8rem;
    border-radius: 14px;
    background: rgba(var(--desaga-accent-rgb), 0.06);
    border: 1px solid rgba(var(--desaga-accent-rgb), 0.14);
  }

  .cookie-choice input {
    margin-top: 0.2rem;
  }

  .cookie-choice strong,
  .cookie-choice small {
    display: block;
  }

  .cookie-choice strong {
    color: var(--desaga-heading);
  }

  .cookie-choice small {
    color: rgba(20, 33, 43, 0.66);
    line-height: 1.35;
  }

  .cookie-choice.disabled {
    opacity: 0.78;
  }
</style>

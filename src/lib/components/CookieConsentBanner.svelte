<script lang="ts">
  import { onMount } from 'svelte';

  type CookiePreferences = {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
    savedAt: string;
  };

  const STORAGE_KEY = 'desaga_cookie_preferences';

  let visible = false;
  let manageOpen = false;
  let analytics = false;
  let marketing = false;
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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        visible = true;
      } else {
        const parsed = JSON.parse(stored) as Partial<CookiePreferences>;
        analytics = Boolean(parsed.analytics);
        marketing = Boolean(parsed.marketing);
      }
    } catch {
      visible = true;
    }
  });
</script>

{#if visible}
  <section class="cookie-banner" aria-label="Consimțământ cookie">
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
  /* Anchored to the bottom edge rather than floating mid-screen. The previous
     version sat over the middle of the page and covered the first products on
     every route. It clears the mobile tab bar via its own inset. */
  .cookie-banner {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1035;
    display: grid;
    gap: var(--space-3);
    max-height: 85dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--space-4);
    padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
    background: var(--surface);
    border-top: 2px solid var(--tomato);
    box-shadow: var(--shadow-pop);
  }

  @media (max-width: 991.98px) {
    .cookie-banner {
      bottom: calc(60px + env(safe-area-inset-bottom, 0px));
      padding-bottom: var(--space-4);
    }
  }

  .cookie-copy strong {
    display: block;
    font-family: var(--font-display);
    font-size: var(--text-md);
    color: var(--ink);
  }

  .cookie-copy p {
    margin: var(--space-1) 0 var(--space-1);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    color: var(--ink-2);
    max-width: 68ch;
  }

  .cookie-copy a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .cookie-preferences {
    display: grid;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }

  .cookie-choice {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    min-height: 44px;
    padding: var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper);
    cursor: pointer;
  }

  .cookie-choice.disabled {
    opacity: 0.72;
    cursor: default;
  }

  .cookie-choice input {
    width: 18px;
    height: 18px;
    margin-top: 3px;
    flex: 0 0 auto;
    accent-color: var(--tomato-ink);
  }

  .cookie-choice span {
    display: grid;
    min-width: 0;
  }

  .cookie-choice strong {
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .cookie-choice small {
    font-size: var(--text-xs);
    color: var(--ink-2);
  }

  .cookie-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .cookie-link-button {
    min-height: 44px;
    padding: 0 var(--space-2);
    border: 0;
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .cookie-link-button:hover,
  .cookie-link-button:focus-visible {
    color: var(--tomato-deep);
  }

  @media (min-width: 768px) {
    .cookie-banner {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: var(--space-5);
      padding-inline: clamp(var(--space-4), 5vw, var(--space-7));
    }

    .cookie-preferences {
      grid-column: 1 / -1;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .cookie-actions {
      justify-content: flex-end;
    }
  }
</style>

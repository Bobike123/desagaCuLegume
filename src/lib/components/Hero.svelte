<script lang="ts">
  // Prop API is unchanged - seven pages call this component. Only the
  // composition changed: instead of laying white text over a photo behind a
  // heavy green scrim (unreadable, and the scrim fought the red brand), the
  // copy now sits on paper beside the photo. The photograph gets to be a
  // photograph, and the text gets real contrast instead of a text-shadow.
  export let title = 'DeSaga cu Legume';
  export let subtitle = 'Local, Gustos, Sănătos';
  export let backgroundImage = '';
  /** Minimum height of the photo panel on desktop. */
  export let height = '400px';
  export let eyebrow = '';
  export let primaryHref = '';
  export let primaryLabel = '';
  export let secondaryHref = '';
  export let secondaryLabel = '';
  /** Icon for the secondary action. Defaults to the phone, which is what
      most pages use it for. */
  export let secondaryIcon = 'bi-telephone';
  export let facts: ReadonlyArray<{ icon: string; label: string; href?: string }> = [];

  $: hasMedia = Boolean(backgroundImage);
</script>

<section class="hero" class:hero--plain={!hasMedia} style={`--media-min-height: ${height};`}>
  <div class="container hero-grid">
    <div class="hero-copy">
      {#if eyebrow}
        <p class="hero-eyebrow">{eyebrow}</p>
      {/if}

      <h1 class="hero-title">{title}</h1>
      <p class="hero-sub">{subtitle}</p>

      {#if (primaryHref && primaryLabel) || (secondaryHref && secondaryLabel)}
        <div class="hero-actions">
          {#if primaryHref && primaryLabel}
            <a class="btn btn-accent" href={primaryHref}>{primaryLabel}</a>
          {/if}

          {#if secondaryHref && secondaryLabel}
            <a class="btn btn-outline-accent" href={secondaryHref}>
              <i class={'bi ' + secondaryIcon} aria-hidden="true"></i>
              {secondaryLabel}
            </a>
          {/if}
        </div>
      {/if}
    </div>

    {#if hasMedia}
      <div class="hero-media">
        <img src={backgroundImage} alt="" loading="eager" fetchpriority="high" decoding="async" />
      </div>
    {/if}
  </div>

  {#if facts.length > 0}
    <!-- Practical details read like a market board: hairline-divided rows,
         not frosted-glass pills floating over a photo. -->
    <div class="hero-facts">
      <div class="container hero-facts-inner">
        {#each facts as fact}
          <svelte:element
            this={fact.href ? 'a' : 'span'}
            class="hero-fact"
            href={fact.href}
          >
            <i class={'bi ' + fact.icon} aria-hidden="true"></i>
            <span>{fact.label}</span>
          </svelte:element>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .hero {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
  }

  .hero-grid {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-6);
  }

  .hero-copy {
    min-width: 0;
    align-self: center;
  }

  /* The short tomato rule is the one recurring graphic mark on the site. It
     echoes the vine stroke running through the logo. */
  .hero-copy::before {
    content: '';
    display: block;
    width: 30px;
    height: 2px;
    margin-bottom: var(--space-4);
    background: var(--tomato);
  }

  .hero-eyebrow {
    margin: 0 0 var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--tomato-ink);
  }

  .hero-title {
    margin: 0;
    font-size: var(--text-hero);
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: var(--ink);
  }

  .hero-sub {
    max-width: 46ch;
    margin: var(--space-3) 0 0;
    font-size: var(--text-lg);
    line-height: var(--leading-normal);
    color: var(--ink-2);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-5);
  }

  .hero-media {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--paper-2);
  }

  .hero-media img {
    display: block;
    width: 100%;
    height: 100%;
    /* Fixed ratio on phones so the photo never eats the fold and never
       causes layout shift while it loads. */
    aspect-ratio: 16 / 10;
    object-fit: cover;
    outline: none;
  }

  .hero-facts {
    border-top: 1px solid var(--line);
    background: var(--paper);
  }

  .hero-facts-inner {
    display: grid;
    gap: 0;
  }

  .hero-fact {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding-block: var(--space-2);
    color: var(--ink-2);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .hero-fact + .hero-fact {
    border-top: 1px solid var(--line);
  }

  .hero-fact i {
    color: var(--tomato-ink);
    flex: 0 0 auto;
  }

  a.hero-fact:hover,
  a.hero-fact:focus-visible {
    color: var(--tomato-deep);
  }

  /* Plain variant (no photograph): the copy simply sits on paper. No
     gradient stand-in for a missing image. */
  .hero--plain {
    background: var(--paper-2);
  }

  /* Between phone and the two-column breakpoint the 16:10 photo ate most of
     the fold, so it becomes a banner strip instead. */
  @media (min-width: 640px) and (max-width: 899.98px) {
    .hero-media img {
      aspect-ratio: 21 / 9;
    }
  }

  @media (min-width: 768px) {
    .hero-facts-inner {
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      align-items: center;
    }

    .hero-fact {
      padding-inline: var(--space-4);
    }

    .hero-fact:first-child {
      padding-inline-start: 0;
    }

    .hero-fact + .hero-fact {
      border-top: 0;
      border-left: 1px solid var(--line);
    }
  }

  @media (min-width: 900px) {
    .hero-grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
      gap: var(--space-7);
      align-items: stretch;
      padding-block: var(--space-7);
    }

    /* The media box owns the height and the image fills it absolutely.
       With height:100% on the image alone its intrinsic 3:2 ratio won, so a
       hero asking for 320px rendered ~430px and left the short copy column
       stranded in dead space. */
    .hero-media {
      min-height: var(--media-min-height, 400px);
    }

    .hero-media img {
      position: absolute;
      inset: 0;
      aspect-ratio: auto;
      width: 100%;
      height: 100%;
    }
  }

  @media (min-width: 1280px) {
    .hero-grid {
      gap: var(--space-8);
    }
  }
</style>

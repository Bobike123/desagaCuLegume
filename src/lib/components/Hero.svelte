<script lang="ts">
  export let title = 'DeSaga cu Legume';
  export let subtitle = 'Local • Gustos • Sănătos';
  export let backgroundImage = '';
  export let height = '400px';
  export let eyebrow = '';
  export let primaryHref = '';
  export let primaryLabel = '';
  export let secondaryHref = '';
  export let secondaryLabel = '';
  export let facts: ReadonlyArray<{ icon: string; label: string; href?: string }> = [];

  $: backgroundStyle = backgroundImage
    ? `background-image: url("${backgroundImage}");`
    : '';
</script>

<section
  class:hero--plain={!backgroundImage}
  class="hero"
  style={`--hero-min-height: ${height}; ${backgroundStyle}`}
  aria-label={title}
>
  <div class="hero-overlay" aria-hidden="true"></div>

  <div class="container hero-inner">
    <div class="hero-copy">
      {#if eyebrow}
        <div class="hero-eyebrow">{eyebrow}</div>
      {/if}

      <h1>{title}</h1>
      <p>{subtitle}</p>

      {#if primaryHref || secondaryHref}
        <div class="hero-actions">
          {#if primaryHref && primaryLabel}
            <a class="btn btn-light btn-lg hero-primary" href={primaryHref}>
              {primaryLabel} <i class="bi bi-arrow-right"></i>
            </a>
          {/if}

          {#if secondaryHref && secondaryLabel}
            <a class="btn btn-outline-light btn-lg hero-secondary" href={secondaryHref}>
              <i class="bi bi-telephone"></i> {secondaryLabel}
            </a>
          {/if}
        </div>
      {/if}

      {#if facts.length > 0}
        <div class="hero-facts" aria-label="Informații rapide">
          {#each facts as fact}
            {#if fact.href}
              <a class="hero-fact" href={fact.href}>
                <i class={'bi ' + fact.icon}></i>
                <span>{fact.label}</span>
              </a>
            {:else}
              <span class="hero-fact">
                <i class={'bi ' + fact.icon}></i>
                <span>{fact.label}</span>
              </span>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    min-height: var(--hero-min-height, 400px);
    background-size: cover;
    background-position: center;
    background-color: var(--desaga-green, #1f6f45);
  }

  .hero--plain {
    background:
      radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.16), transparent 28rem),
      linear-gradient(135deg, var(--desaga-green, #1f6f45), var(--desaga-dark-green, #17452d));
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        90deg,
        rgba(7, 52, 31, 0.92),
        rgba(7, 52, 31, 0.64),
        rgba(7, 52, 31, 0.2)
      ),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.22), transparent 32%);
  }

  .hero--plain .hero-overlay {
    background:
      linear-gradient(90deg, rgba(7, 52, 31, 0.72), rgba(7, 52, 31, 0.38)),
      radial-gradient(circle at 18% 80%, rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.2), transparent 28rem);
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    padding-top: clamp(2.4rem, 6vw, 4rem);
    padding-bottom: clamp(2.4rem, 6vw, 4rem);
  }

  .hero-copy {
    max-width: 760px;
    color: #fff;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    margin-bottom: 0.9rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.24);
    font-weight: 900;
    letter-spacing: 0.02em;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 6vw, 4.4rem);
    line-height: 0.96;
    font-weight: 950;
    letter-spacing: -0.045em;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.26);
  }

  p {
    max-width: 620px;
    margin: 1rem 0 0;
    font-size: clamp(1.05rem, 2vw, 1.35rem);
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.22);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .hero-primary,
  .hero-secondary {
    border-radius: 999px;
    font-weight: 900;
    padding-inline: 1.15rem;
  }

  .hero-primary {
    color: var(--desaga-dark-green, #17452d);
  }

  .hero-secondary {
    border-color: rgba(255, 255, 255, 0.78);
  }

  .hero-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 1.4rem;
  }

  .hero-fact {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.7rem;
    border-radius: 999px;
    color: #fff;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.13);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    font-weight: 800;
    font-size: 0.92rem;
  }

  a.hero-fact:hover,
  a.hero-fact:focus {
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
  }

  /* Compact hero on phones so the page content starts sooner. */
  @media (max-width: 575.98px) {
    .hero {
      min-height: 0;
    }

    .hero-inner {
      padding-top: 1.6rem;
      padding-bottom: 1.6rem;
    }

    h1 {
      font-size: clamp(1.9rem, 8vw, 2.2rem);
    }

    p {
      margin-top: 0.75rem;
      font-size: 1rem;
    }

    .hero-eyebrow {
      margin-bottom: 0.65rem;
      font-size: 0.8rem;
    }

    .hero-actions {
      margin-top: 1rem;
      gap: 0.5rem;
    }

    .hero-actions a {
      width: 100%;
      justify-content: center;
    }

    .hero-facts {
      margin-top: 0.9rem;
      gap: 0.4rem;
    }

    .hero-fact {
      padding: 0.34rem 0.55rem;
      font-size: 0.78rem;
    }
  }
</style>
<script lang="ts">
  import { legalDocuments } from '$lib/legalDocuments';
</script>

<svelte:head>
  <title>Legal și conformitate - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Pachetul legal DeSaga cu Legume: confidențialitate, cookie-uri, termeni, livrare, retururi, companie și calitate produse."
  />
</svelte:head>

<section class="legal-index-page">
  <div class="container">
    <div class="legal-head">
      <span class="eyebrow">Legal și conformitate</span>
      <h1>Documente pentru clienți și comenzi</h1>
      <p>
        Politicile aplicabile conturilor, comenzilor, produselor proaspete,
        livrării, ridicării și prelucrării datelor personale.
      </p>
    </div>

    <div class="legal-grid">
      {#each legalDocuments as item}
        <a class="legal-card" href={item.href}>
          <span class="legal-card__icon"><i class="bi bi-file-earmark-text"></i></span>
          <span class="legal-card__body">
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </span>
          <i class="bi bi-arrow-right"></i>
        </a>
      {/each}
    </div>
  </div>
</section>

<style>
  .legal-index-page {
    min-height: 72vh;
    background:
      radial-gradient(circle at top left, rgba(var(--desaga-accent-rgb), 0.14), transparent 28rem),
      linear-gradient(180deg, #ffffff 0%, var(--desaga-cream) 100%);
    padding: clamp(2.6rem, 6vw, 4.8rem) 0;
  }

  .legal-head {
    max-width: 820px;
    margin-bottom: 1.4rem;
  }

  .eyebrow {
    display: inline-flex;
    color: var(--desaga-blue);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.6rem;
  }

  .legal-head h1 {
    margin: 0;
    color: var(--desaga-heading);
    font-weight: 950;
    line-height: 1.05;
    font-size: clamp(2rem, 5vw, 3.4rem);
  }

  .legal-head p {
    margin: 0.8rem 0 0;
    color: rgba(20, 33, 43, 0.72);
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .legal-grid {
    display: grid;
    gap: 0.9rem;
  }

  @media (min-width: 768px) {
    .legal-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .legal-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.9rem;
    align-items: center;
    padding: 1rem;
    color: inherit;
    text-decoration: none;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 20px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.07);
    transition:
      transform 0.2s ease,
      border-color 0.2s ease;
  }

  .legal-card:hover,
  .legal-card:focus {
    transform: translateY(-2px);
    border-color: rgba(var(--desaga-accent-rgb), 0.28);
    color: inherit;
  }

  .legal-card__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.1);
  }

  .legal-card__body {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
  }

  .legal-card strong {
    color: var(--desaga-heading);
    font-size: 1rem;
    line-height: 1.25;
  }

  .legal-card span span {
    color: rgba(20, 33, 43, 0.68);
    line-height: 1.45;
  }

  .legal-card > .bi-arrow-right {
    color: var(--desaga-blue);
  }
</style>

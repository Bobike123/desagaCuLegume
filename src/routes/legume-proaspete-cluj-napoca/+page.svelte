<script lang="ts">
  import { STORE_INFO } from '$lib/seo/site';
  import {
    CLUJ_NEIGHBORHOODS,
    VEGETABLE_CATEGORIES,
    VEGETABLE_STORE_DESCRIPTION,
    VEGETABLE_STORE_FAQ,
    VEGETABLE_STORE_PAGE_URL,
    VEGETABLE_STORE_TITLE,
    getVegetableStoreSchema,
  } from '$lib/seo/vegetable-store';

  const schema = JSON.stringify(getVegetableStoreSchema()).replace(/</g, '\\u003c');
  const schemaTag = `<script type="application/ld+json">${schema}<` + '/script>';
</script>

<svelte:head>
  <title>{VEGETABLE_STORE_TITLE}</title>
  <meta name="description" content={VEGETABLE_STORE_DESCRIPTION} />
  <link rel="canonical" href={VEGETABLE_STORE_PAGE_URL} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={VEGETABLE_STORE_TITLE} />
  <meta property="og:description" content={VEGETABLE_STORE_DESCRIPTION} />
  <meta property="og:url" content={VEGETABLE_STORE_PAGE_URL} />
  <meta property="og:site_name" content={STORE_INFO.name} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={VEGETABLE_STORE_TITLE} />
  <meta name="twitter:description" content={VEGETABLE_STORE_DESCRIPTION} />
  {@html schemaTag}
</svelte:head>

<section class="hero">
  <div class="container heroGrid">
    <div>
      <p class="eyebrow">DeSaga cu Legume</p>
      <h1>Legume proaspete în Cluj-Napoca</h1>
      <p class="lead">
        DeSaga cu Legume aduce legume proaspete, produse de sezon și opțiuni locale atunci când sunt disponibile
        în Cluj-Napoca. Comandă online pentru ridicare sau cere confirmare pentru livrare.
      </p>
      <div class="actions">
        <a class="btn primary" href="/produse"><i class="bi bi-basket"></i> Vezi legumele</a>
        <a class="btn secondary" href={STORE_INFO.phoneHref}><i class="bi bi-telephone"></i> Sună pentru stocul de azi</a>
      </div>
    </div>
    <aside class="storeInfo" aria-label="Informații magazin">
      <div>
        <span>Locație</span>
        <strong>{STORE_INFO.address.streetAddress}, Cluj-Napoca</strong>
      </div>
      <div>
        <span>Program</span>
        <strong>L–V: 9:00–18:00</strong>
      </div>
      <div>
        <span>Telefon</span>
        <a href={STORE_INFO.phoneHref}>{STORE_INFO.phone}</a>
      </div>
    </aside>
  </div>
</section>

<section class="section">
  <div class="container twoCol">
    <div>
      <p class="eyebrow">Legume proaspete</p>
      <h2>Legume pentru mesele de zi cu zi</h2>
      <p>
        Catalogul este gândit pentru bucătăriile de acasă și afacerile locale din Cluj-Napoca.
        Disponibilitatea se schimbă în funcție de sezon, aprovizionare, recoltă și stocul curent.
      </p>
    </div>
    <div class="categoryGrid" aria-label="Categorii de produse">
      {#each VEGETABLE_CATEGORIES as category}
        <a href="/produse" class="category">{category}</a>
      {/each}
    </div>
  </div>
</section>

<section class="section soft">
  <div class="container twoCol">
    <div>
      <p class="eyebrow">Zone acoperite</p>
      <h2>Ridicare și cereri de livrare în Cluj-Napoca</h2>
      <p>
        Ridicarea este disponibilă la locația DeSaga de pe Strada Constantin Brâncuși 153.
        Cererile de livrare în Cluj-Napoca sunt confirmate în funcție de traseu și disponibilitate.
      </p>
    </div>
    <div class="neighborhoods">
      {#each CLUJ_NEIGHBORHOODS as neighborhood}
        <span>{neighborhood}</span>
      {/each}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sectionHead">
      <p class="eyebrow">Întrebări frecvente</p>
      <h2>Întrebări despre comenzi de legume în Cluj-Napoca</h2>
    </div>
    <div class="faqGrid">
      {#each VEGETABLE_STORE_FAQ as item}
        <article>
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .hero {
    padding: clamp(3rem, 8vw, 6rem) 0 2.4rem;
    background:
      linear-gradient(135deg, rgba(39, 79, 42, 0.94), rgba(25, 44, 27, 0.92)),
      url('/images/legume-proaspete-cluj-napoca/hero-produse-locale.jpg') center/cover;
    color: #fffdf7;
  }

  .heroGrid,
  .twoCol {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.55fr);
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: center;
  }

  .eyebrow {
    margin: 0 0 0.7rem;
    color: #bdf48a;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.78rem;
    font-weight: 950;
  }

  h1,
  h2,
  h3 {
    margin: 0;
    font-weight: 950;
    letter-spacing: 0;
  }

  h1 {
    max-width: 820px;
    font-size: clamp(2.4rem, 7vw, 5.4rem);
    line-height: 0.94;
  }

  h2 {
    color: #1d241b;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1;
  }

  h3 {
    color: #1d241b;
    font-size: 1.1rem;
  }

  .lead {
    max-width: 720px;
    margin: 1.2rem 0 0;
    color: rgba(255, 253, 247, 0.82);
    font-size: clamp(1rem, 2vw, 1.18rem);
    line-height: 1.6;
  }

  .actions {
    margin-top: 1.4rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .btn {
    min-height: 48px;
    border-radius: 999px;
    padding: 0.75rem 1.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    font-weight: 950;
    text-decoration: none;
  }

  .btn.primary {
    background: #8bd450;
    color: #172015;
  }

  .btn.secondary {
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #fffdf7;
    background: rgba(255, 255, 255, 0.12);
  }

  .storeInfo {
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 8px;
    padding: 1.2rem;
    display: grid;
    gap: 0.9rem;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);
  }

  .storeInfo div {
    display: grid;
    gap: 0.25rem;
  }

  .storeInfo span {
    color: rgba(255, 253, 247, 0.68);
    font-weight: 900;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .storeInfo strong,
  .storeInfo a {
    color: #fffdf7;
    font-weight: 900;
    text-decoration: none;
  }

  .section {
    padding: clamp(2.6rem, 6vw, 4.5rem) 0;
  }

  .section.soft {
    background: #f6f1e7;
  }

  .section .eyebrow {
    color: #274f2a;
  }

  .section p {
    margin: 1rem 0 0;
    color: #5f6959;
    line-height: 1.65;
  }

  .categoryGrid,
  .neighborhoods,
  .faqGrid {
    display: grid;
    gap: 0.8rem;
  }

  .categoryGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category,
  .neighborhoods span,
  .faqGrid article {
    border: 1px solid rgba(31, 42, 28, 0.12);
    border-radius: 8px;
    background: #fffdf7;
  }

  .category {
    min-height: 58px;
    padding: 0.9rem 1rem;
    display: flex;
    align-items: center;
    color: #1d241b;
    font-weight: 950;
    text-decoration: none;
    text-transform: capitalize;
  }

  .neighborhoods {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .neighborhoods span {
    padding: 0.8rem 1rem;
    color: #1d241b;
    font-weight: 900;
  }

  .sectionHead {
    max-width: 780px;
    margin-bottom: 1.3rem;
  }

  .faqGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .faqGrid article {
    padding: 1rem;
  }

  .faqGrid article p {
    margin-top: 0.55rem;
  }

  @media (max-width: 991.98px) {
    .heroGrid,
    .twoCol,
    .faqGrid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .actions,
    .btn {
      width: 100%;
    }

    .categoryGrid,
    .neighborhoods {
      grid-template-columns: 1fr;
    }
  }
</style>

<script context="module" lang="ts">
  export type LegalTable = {
    headers: string[];
    rows: string[][];
  };

  export type LegalSection = {
    title: string;
    paragraphs?: string[];
    bullets?: string[];
    table?: LegalTable;
    callout?: string;
  };

  export type LegalDocumentData = {
    title: string;
    eyebrow: string;
    intro: string;
    updated: string;
    metaDescription: string;
    sections: LegalSection[];
  };
</script>

<script lang="ts">
  export let document: LegalDocumentData;
</script>

<svelte:head>
  <title>{document.title} - DeSaga cu Legume</title>
  <meta name="description" content={document.metaDescription} />
</svelte:head>

<section class="legal-hero">
  <div class="container">
    <div class="legal-hero__content">
      <span class="legal-eyebrow">{document.eyebrow}</span>
      <h1>{document.title}</h1>
      <p>{document.intro}</p>
      <span class="legal-updated">{document.updated}</span>
    </div>
  </div>
</section>

<section class="legal-page">
  <div class="container">
    <div class="legal-layout">
      <aside class="legal-index" aria-label="Cuprins document">
        <div class="legal-index__title">Cuprins</div>
        <nav>
          {#each document.sections as section, index}
            <a href={`#sectiune-${index + 1}`}>{index + 1}. {section.title}</a>
          {/each}
        </nav>
      </aside>

      <article class="legal-document">
        {#each document.sections as section, index}
          <section id={`sectiune-${index + 1}`} class="legal-section">
            <h2>{index + 1}. {section.title}</h2>

            {#if section.paragraphs}
              {#each section.paragraphs as paragraph}
                <p>{paragraph}</p>
              {/each}
            {/if}

            {#if section.bullets}
              <ul>
                {#each section.bullets as bullet}
                  <li>{bullet}</li>
                {/each}
              </ul>
            {/if}

            {#if section.table}
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      {#each section.table.headers as header}
                        <th>{header}</th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each section.table.rows as row}
                      <tr>
                        {#each row as cell}
                          <td>{cell}</td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}

            {#if section.callout}
              <div class="legal-callout">
                <i class="bi bi-info-circle"></i>
                <span>{section.callout}</span>
              </div>
            {/if}
          </section>
        {/each}
      </article>
    </div>
  </div>
</section>

<style>
  .legal-hero {
    background: var(--paper);
    border-bottom: 1px solid rgba(var(--desaga-accent-rgb), 0.16);
    padding: clamp(2.6rem, 6vw, 4.6rem) 0;
  }

  .legal-hero__content {
    max-width: 850px;
  }

  .legal-eyebrow,
  .legal-updated,
  .legal-index__title {
    color: var(--desaga-blue);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.76rem;
  }

  .legal-hero h1 {
    margin: 0.55rem 0 0.75rem;
    color: var(--desaga-heading);
    font-weight: 700;
    line-height: 1.05;
    font-size: clamp(2rem, 5vw, 3.5rem);
  }

  .legal-hero p {
    margin: 0 0 1rem;
    max-width: 760px;
    color: rgba(20, 33, 43, 0.74);
    font-size: 1.06rem;
    line-height: 1.65;
  }

  .legal-updated {
    display: inline-flex;
    padding: 0.42rem 0.7rem;
    border-radius: var(--radius-sm);
    background: rgba(var(--desaga-accent-rgb), 0.1);
    border: 1px solid rgba(var(--desaga-accent-rgb), 0.18);
  }

  .legal-page {
    background: var(--paper);
    padding: clamp(2rem, 5vw, 3.8rem) 0;
  }

  .legal-layout {
    display: grid;
    gap: 1.2rem;
  }

  @media (min-width: 992px) {
    .legal-layout {
      grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
      align-items: start;
    }
  }

  .legal-index,
  .legal-document {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-lg);
    box-shadow: none;
  }

  .legal-index {
    padding: 1rem;
  }

  @media (min-width: 992px) {
    .legal-index {
      position: sticky;
      top: 96px;
    }
  }

  .legal-index nav {
    display: grid;
    gap: 0.42rem;
    margin-top: 0.8rem;
  }

  .legal-index a {
    color: rgba(20, 33, 43, 0.76);
    text-decoration: none;
    font-weight: 750;
    line-height: 1.35;
    padding: 0.42rem 0.5rem;
    border-radius: var(--radius);
  }

  .legal-index a:hover,
  .legal-index a:focus {
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.08);
  }

  .legal-document {
    padding: clamp(1.15rem, 3vw, 2rem);
  }

  .legal-section {
    scroll-margin-top: 110px;
    padding-bottom: 1.4rem;
    margin-bottom: 1.4rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  .legal-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: 0;
  }

  .legal-section h2 {
    margin: 0 0 0.85rem;
    color: var(--desaga-heading);
    font-weight: 700;
    font-size: clamp(1.25rem, 2.2vw, 1.65rem);
  }

  .legal-section p,
  .legal-section li {
    color: rgba(20, 33, 43, 0.78);
    line-height: 1.68;
  }

  .legal-section p {
    margin: 0 0 0.85rem;
  }

  .legal-section ul {
    margin: 0.2rem 0 0.9rem;
    padding-left: 1.15rem;
  }

  .legal-section li + li {
    margin-top: 0.4rem;
  }

  .table-responsive {
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius);
  }

  table {
    width: 100%;
    min-width: 620px;
    border-collapse: collapse;
    font-size: 0.94rem;
  }

  th,
  td {
    padding: 0.82rem 0.9rem;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  th {
    color: var(--desaga-heading);
    background: rgba(var(--desaga-accent-rgb), 0.08);
    font-weight: 700;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  .legal-callout {
    display: flex;
    gap: 0.7rem;
    align-items: flex-start;
    margin-top: 1rem;
    padding: 0.9rem 1rem;
    border-radius: var(--radius);
    color: var(--desaga-heading);
    background: rgba(var(--desaga-green-rgb), 0.08);
    border: 1px solid rgba(var(--desaga-green-rgb), 0.18);
    line-height: 1.55;
  }

  .legal-callout i {
    color: var(--desaga-green);
    margin-top: 0.15rem;
  }
</style>

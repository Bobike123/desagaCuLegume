<svelte:head>
  <title>Decoy securitate - DeSaga cu Legume</title>
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <meta name="description" content="Conținut decoy fictiv pentru monitorizare defensivă." />
</svelte:head>

<section class="decoy">
  <div class="container">
    <div class="panel">
      <p class="eyebrow">Decoy securitate</p>
      <h1>Conținut decoy fictiv</h1>
      <p class="lead">
        Acesta este conținut fictiv. Nu există date reale despre clienți sau business aici.
      </p>

      <div class="records" aria-label="Înregistrări fictive">
        <div><span>utilizator</span><strong>admin_legume@example.invalid</strong></div>
        <div><span>parolă</span><strong>PAROLA_FICTIVA</strong></div>
        <div><span>order_id</span><strong>FAKE-VEG-0001</strong></div>
        <div><span>produs</span><strong>999kg castraveți invizibili</strong></div>
      </div>
    </div>
  </div>
</section>

<style>
  .decoy {
    min-height: 70vh;
    display: grid;
    place-items: center;
    padding: clamp(2rem, 7vw, 5rem) 0;
    background: var(--paper);
  }

  .panel {
    max-width: 760px;
    border: 1px solid rgba(31, 42, 28, 0.14);
    border-radius: 8px;
    padding: clamp(1.5rem, 4vw, 2.4rem);
    background: var(--paper);
    box-shadow: 0 22px 60px rgba(35, 51, 30, 0.1);
  }

  .eyebrow {
    margin: 0 0 0.6rem;
    color: var(--tomato-ink);
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  h1 {
    margin: 0;
    color: var(--ink);
    font-size: clamp(2rem, 6vw, 3.6rem);
    line-height: 0.98;
    font-weight: 700;
  }

  .lead {
    margin: 1rem 0 0;
    color: var(--ink-2);
    font-size: 1.05rem;
    font-weight: 600;
  }

  .records {
    margin-top: 1.4rem;
    display: grid;
    gap: 0.8rem;
  }

  .records div {
    border: 1px solid rgba(31, 42, 28, 0.1);
    border-radius: 8px;
    padding: 0.9rem 1rem;
    display: grid;
    gap: 0.25rem;
    background: #fff;
  }

  .records span {
    color: var(--ink-2);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .records strong {
    color: var(--ink);
    overflow-wrap: anywhere;
  }
</style>

<!-- FILE: src/routes/despre-noi/+page.svelte -->
<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";

  const stats = [
    { value: "2500", label: "m² de solarii", icon: "bi-house-heart" },
    { value: "10+", label: "ani experiență", icon: "bi-award" },
    { value: "100%", label: "produse locale", icon: "bi-geo-alt" },
    { value: "20+", label: "colaboratori", icon: "bi-people" },
  ] as const;

  const principles = [
    {
      title: "Local",
      text: "Sprijinim producători locali și păstrăm un lanț scurt, corect.",
      icon: "bi-geo-alt-fill",
    },
    {
      title: "Gustos",
      text: "Gustul vine din ingrediente bune, nu din artificii.",
      icon: "bi-emoji-smile",
    },
    {
      title: "Sănătos",
      text: "Respectăm ritmul naturii și lucrăm responsabil.",
      icon: "bi-shield-check",
    },
    {
      title: "Sustenabil",
      text: "Alegem soluții care protejează solul și resursele.",
      icon: "bi-recycle",
    },
  ] as const;

  const timeline = [
    {
      year: "2016",
      title: "Primul pas",
      text: "Am început schimbarea în 2016 când în timpul liber și în weekend dădeam o mână de ajutor la Ferma de legume a unei rude la Jucu. A fost suficient un sezon agricol să ne dăm seama că asta ne dorim.",
    },
    {
      year: "2017–2018",
      title: "Găsirea liniștii",
      text: "Ne-am găsit liniștea în mijlocul naturii: munca fizică ne golea mintea de stresul zilnic și ne încărca bateriile. Soare, păsărele, zumzetul albinuțelor… și împlinirea de fiecare dată când punem pe masă o salată crescută de noi, din stadiul de sămânță.",
    },
    {
      year: "2019",
      title: "Decizia mare",
      text: "În scurt timp am știut că asta e ceea ce trebuie să facem, am lăsat în urmă un job stabil ce ne aducea un venit constant, lunar și am preluat în mod oficial Ferma de la Jucu. Am botezat-o Desaga cu legume, am investit în ea TOTUL. Timpul, banii, toate resursele noastre.",
    },
    {
      year: "Astăzi",
      title: "Misiunea Noastra",
      text: "Să pui suflet în ceea ce faci, inclusiv în formarea și păstrarea unei mici comunități, îți dă un sentiment de împlinire care te ajută să treci peste greutăți mai ușor. Și împreună.",
    },
  ] as const;

  const quickInfo = [
    {
      icon: "bi-geo-alt-fill",
      text: "Cluj-Napoca, Str. Constantin Brâncuși nr. 153",
    },
    { icon: "bi-clock-fill", text: "L–V: 9:00 – 18:00" },
    { icon: "bi-telephone-fill", text: "+40 729 969 822" },
  ] as const;
</script>

<svelte:head>
  <title>Despre Noi - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Despre Noi"
  subtitle="Haideți să ne cunoaștem"
  backgroundImage=""
  height="320px"
/>

<!-- Top: concise intro + sidebar -->
<section class="py-5">
  <div class="container">
    <div class="row g-4 align-items-stretch">
      <!-- Left: intro + principles (compact) -->
      <div class="col-lg-7">
        <div class="panel">
          <div
            class="panel-head d-flex align-items-center justify-content-between gap-2 flex-wrap"
          >
            <h2 class="h4 fw-bold m-0">
              <i class="bi bi-leaf"></i> Povestea noastră
            </h2>

            <div class="d-flex gap-2 flex-wrap">
              <a href="/produse" class="btn btn-accent btn-sm">
                <i class="bi bi-box"></i> Produse
              </a>
              <a href="/contact" class="btn btn-outline-accent btn-sm">
                <i class="bi bi-chat-dots"></i> Contact
              </a>
            </div>
          </div>

          <p class="lead mb-4">
            Doi orășeni cu drag de natură care au ales un ritm mai simplu: muncă
            în aer liber, legume curate, comunitate.
          </p>

          <div class="section-head">
            <h3 class="h6 fw-bold m-0 text-muted">
              <i class="bi bi-compass"></i> Principii
            </h3>
          </div>

          <div class="row g-3 align-items-stretch">
            {#each principles as p (p.title)}
              <div class="col-12 col-md-6 d-flex">
                <div class="mini-card w-100">
                  <div class="mini-icon">
                    <i class={"bi " + p.icon}></i>
                  </div>
                  <div class="mini-title">{p.title}</div>
                  <div class="mini-text">{p.text}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Right: image + quick info + single line value prop -->
      <div class="col-lg-5">
        <div class="panel panel-soft h-100">
          <div class="media-card">
            <img src="" alt="Solarii DeSaga" class="media-img" />
          </div>

          <div class="mt-3 small-note">
            {#each quickInfo as item (item.text)}
              <div class="note-row">
                <i class={"bi " + item.icon}></i>
                <span>{item.text}</span>
              </div>
            {/each}
          </div>

          <div class="mt-4 tip">
            <div class="tip-icon"><i class="bi bi-info-circle"></i></div>
            <div class="tip-text">
              Din fermă direct la tine: local, gustos, sănătos, sustenabil.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Timeline + Facts (fixed layout) -->
<section class="py-5 bg-soft">
  <div class="container">
    <div class="row g-4 align-items-stretch">
      <!-- Timeline: half width -->
      <div class="col-12 col-lg-9">
        <div class="panel h-100">
          <div class="section-head">
            <h2 class="h4 fw-bold m-0">
              <i class="bi bi-signpost-2"></i> Timeline
            </h2>
          </div>

          <div class="timeline">
            {#each timeline as step (step.year)}
              <div class="tl-item">
                <div class="tl-dot" aria-hidden="true"></div>
                <div class="tl-card">
                  <div class="tl-top">
                    <span class="tl-year">{step.year}</span>
                    <span class="tl-title">{step.title}</span>
                  </div>
                  <p class="tl-text">{step.text}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Facts: half width -->
      <div class="col-12 col-lg-3">
        <div class="panel h-100">
          <div class="section-head">
            <h2 class="h4 fw-bold m-0">
              <i class="bi bi-info-circle"></i> Facts
            </h2>
          </div>

          <div class="facts-grid">
            {#each stats as s (s.label)}
              <div class="fact-tile">
                <div class="fact-tile-icon">
                  <i class={"bi " + s.icon}></i>
                </div>

                <div class="fact-tile-body">
                  <div class="fact-tile-value">{s.value}</div>
                  <div class="fact-tile-label">{s.label}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2492cc);
    --accent-rgb: 36, 146, 204;
  }

  .bg-soft {
    background: rgba(var(--accent-rgb), 0.06);
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 1rem;
  }

  /* Panels */
  .panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
    padding: 16px;
    height: 100%;
  }

  .panel-soft {
    background: rgba(var(--accent-rgb), 0.06);
    border-color: rgba(var(--accent-rgb), 0.18);
  }

  .panel-head {
    margin-bottom: 10px;
  }

  /* =======================
   FACTS (STACKED + SLIM)
   ======================= */

  .facts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  /* force vertical stacking at all breakpoints */
  @media (min-width: 576px) {
    .facts-grid {
      grid-template-columns: 1fr;
    }
  }

  .fact-tile {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;

    gap: 6px;
    padding: 10px 12px;
    border-radius: 14px;

    background: rgba(var(--accent-rgb), 0.06);
    border: 1px solid rgba(var(--accent-rgb), 0.16);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);

    min-height: 0;
  }

  .fact-tile-icon {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
  }

  .fact-tile-body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .fact-tile-value {
    font-weight: 1000;
    font-size: 1.25rem;
    line-height: 1.05;
    color: rgba(0, 0, 0, 0.88);
    letter-spacing: -0.02em;
  }

  .fact-tile-label {
    font-weight: 800;
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.62);
    line-height: 1.15;
  }

  /* Image block */
  .media-card {
    border-radius: 16px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .media-img {
    width: 100%;
    height: 240px;
    object-fit: cover;
    display: block;
  }

  .small-note {
    display: grid;
    gap: 8px;
    padding: 10px 2px 0;
  }

  .note-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.72);
  }

  .note-row i {
    color: var(--accent);
    margin-top: 2px;
  }

  .tip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(var(--accent-rgb), 0.18);
  }

  .tip-icon {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    flex: 0 0 auto;
  }

  .tip-text {
    font-weight: 700;
    color: rgba(0, 0, 0, 0.72);
    line-height: 1.35;
  }

  /* Timeline */
  .timeline {
    display: grid;
    gap: 12px;
  }

  .tl-item {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 10px;
    align-items: start;
    position: relative;
  }

  .tl-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    margin-top: 12px;
    background: var(--accent);
    box-shadow: 0 0 0 6px rgba(var(--accent-rgb), 0.12);
    position: relative;
    justify-self: center;
    z-index: 1;
  }

  .tl-dot::before {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: -24px;
    bottom: -24px;
    width: 2px;
    background: rgba(var(--accent-rgb), 0.22);
    z-index: -1;
  }

  .timeline .tl-item:first-child .tl-dot::before {
    top: 50%;
  }

  .timeline .tl-item:last-child .tl-dot::before {
    bottom: 50%;
  }

  .tl-card {
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    padding: 12px 14px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
  }

  .tl-top {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
  }

  .tl-year {
    font-weight: 900;
    color: var(--accent);
  }

  .tl-title {
    font-weight: 900;
    color: rgba(0, 0, 0, 0.84);
  }

  .tl-text {
    margin: 0;
    color: rgba(0, 0, 0, 0.7);
    line-height: 1.45;
  }

  /* Principles mini cards */
  .mini-card {
    height: 100%;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
  }

  .mini-icon {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(var(--accent-rgb), 0.14);
    color: var(--accent);
    margin-bottom: 10px;
    flex: 0 0 auto;
  }

  .mini-title {
    font-weight: 900;
    margin-bottom: 4px;
    flex: 0 0 auto;
  }

  .mini-text {
    color: rgba(0, 0, 0, 0.7);
    line-height: 1.4;
    font-size: 0.95rem;
    flex: 1 1 auto;
  }

  /* Buttons */
  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.22);
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    filter: brightness(0.95);
    box-shadow: 0 12px 26px rgba(var(--accent-rgb), 0.28);
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.55) !important;
    color: var(--accent) !important;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.12) !important;
    border-color: rgba(var(--accent-rgb), 0.75) !important;
    color: var(--accent) !important;
  }

  /* Mobile */
  @media (max-width: 576px) {
    .media-img {
      height: 200px;
    }
  }
</style>

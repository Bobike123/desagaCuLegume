<script>
  import Hero from '$lib/components/Hero.svelte';
</script>

<svelte:head>
  <title>Despre Noi - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Despre Noi"
  subtitle="Haideți să ne cunoaștem"
  backgroundImage="/images/ferma.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="card border-0 shadow-sm">
          <img src="/images/ferma-solarii.jpg" alt="Solarii DeSaga" class="card-img-top" />

          <div class="card-body p-5">
            <h2 class="h2 text-brown fw-bold mb-4">
              <i class="bi bi-leaf"></i> Povestea Noastră
            </h2>

            <p class="lead">
              Doi orășeni cu drag de natură care după mai bine de 15 ani de muncă au vrut să fugă
              de viața agitată și stresul unui job de birou.
            </p>

            <h3 class="h4 text-brown fw-bold mt-5 mb-3">Cum a început totul</h3>
            <p>
              Am început schimbarea în 2016 când în timpul liber și în weekend dădeam o mână de
              ajutor la Ferma de legume a unei rude la Jucu. A fost suficient un sezon agricol
              să ne dăm seama că asta ne dorim.
            </p>

            <h3 class="h4 text-brown fw-bold mt-5 mb-3">Gasirea linistii</h3>
            <p>
              Ne-am găsit liniștea în mijlocul naturii, unde munca fizică ne golea mintea de
              stresul zilnic și ne încărca bateriile cu energie pozitivă. Soare, păsărele,
              zumzetul albinuțelor…. dar mai ales împlinirea ce o simțim de fiecare dată când
              punem pe masă o salată de legume crescute de noi din stadiul de sămânță!
            </p>

            <h3 class="h4 text-brown fw-bold mt-5 mb-3">Decizia mare</h3>
            <p>
              În scurt timp am știut că asta e ceea ce trebuie să facem, am lăsat în urmă un job
              stabil ce ne aducea un venit constant, lunar și am preluat în mod oficial Ferma de
              la Jucu. Am botezat-o Desaga cu legume, am investit în ea TOTUL. Timpul, banii,
              toate resursele noastre.
            </p>

            <h3 class="h4 text-brown fw-bold mt-5 mb-3">Misiunea noastră</h3>
            <p>
              Să pui suflet în ceea ce faci, inclusiv în formarea și păstrarea unei mici
              comunități îți dă un sentiment de împlinire ce te ajută să treci peste greutăți
              mult mai ușor. Și împreună.
            </p>

            <div class="alert alert-info mt-5" role="alert">
              <h5 class="alert-heading">
                <i class="bi bi-info-circle"></i> Principiile noastre
              </h5>
              <ul class="mb-0">
                <li><strong>Local:</strong> Sprijin pentru producători locali</li>
                <li><strong>Gustos:</strong> Produse autentic românești</li>
                <li><strong>Sănătos:</strong> Fără chimicale agresive, doar natură</li>
                <li><strong>Sustenabil:</strong> Respectul pentru ritmul naturii</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="py-5 bg-light">
  <div class="container">
    <h2 class="h2 text-center text-brown fw-bold mb-5">
      <i class="bi bi-info-circle"></i> Facts despre DeSaga
    </h2>

    <div class="row g-4">
      <div class="col-md-3 col-sm-6">
        <div class="text-center">
          <h3 class="h2 text-green fw-bold">2500</h3>
          <p class="text-brown fw-bold">m² de Solarii</p>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="text-center">
          <h3 class="h2 text-green fw-bold">10+</h3>
          <p class="text-brown fw-bold">Ani Experiență</p>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="text-center">
          <h3 class="h2 text-green fw-bold">100%</h3>
          <p class="text-brown fw-bold">Produse Locale</p>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="text-center">
          <h3 class="h2 text-green fw-bold">20+</h3>
          <p class="text-brown fw-bold">Colaboratori</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .text-green {
    color: var(--desaga-green) !important;
  }

  .bg-light {
    background-color: var(--desaga-cream) !important;
  }
</style>

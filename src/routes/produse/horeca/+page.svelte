<script>
  import Hero from '$lib/components/Hero.svelte';
</script>

<svelte:head>
  <title>HORECA - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="OFERTA HORECA"
  subtitle="Legume și fructe pentru restaurante și magazine"
  backgroundImage="/images/horeca-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="card border-0 shadow-sm">
          <img src="/images/horeca-farfurie.jpg" alt="HORECA DeSaga" class="card-img-top" />

          <div class="card-body p-5">
            <h2 class="h2 text-brown fw-bold mb-4">
              <i class="bi bi-cup"></i> Pentru restaurante și magazine
            </h2>

            <p class="lead">
              Dacă vrei să folosești în restaurantul tău legumele și fructele noastre proaspete
              și procesate sau ai și tu o mică Băcănie și vrei să ai pe raft produsele marca
              DeSaga nu ezita să ne contactezi.
            </p>

            <h3 class="h4 text-brown fw-bold mt-5 mb-4">Ce oferim:</h3>

            <div class="row mb-4">
              <div class="col-md-6">
                <ul class="list-unstyled">
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Legume de sezon</span> - proaspete zilnic
                  </li>
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Fructe de sezon</span> - calitate garantată
                  </li>
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Produse la borcan</span> - rețete tradiționale
                  </li>
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Sosuri și conserve</span> - hecurescuri
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <ul class="list-unstyled">
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Brânzeturi și lactate</span> - de colaboratori
                  </li>
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Alimente locale</span> - 100% românești
                  </li>
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Oferte personalizate</span> - în funcție de nevoie
                  </li>
                  <li class="mb-3">
                    <i class="bi bi-check2-circle text-green fw-bold"></i>
                    <span class="fw-bold">Preturi speciale</span> - pentru comenzi mari
                  </li>
                </ul>
              </div>
            </div>

            <h3 class="h4 text-brown fw-bold mt-5 mb-4">De ce să alegi DeSaga?</h3>

            <div class="alert alert-success" role="alert">
              <p class="mb-0">
                ✅ <strong>Calitate garantată:</strong> Toate produsele provin din surse verificate
                și de încredere.
              </p>
              <p class="mb-0 mt-2">
                ✅ <strong>Preturi competitive:</strong> Beneficiezi de prețuri speciale pentru
                comenzi în volum.
              </p>
              <p class="mb-0 mt-2">
                ✅ <strong>Livrare regulată:</strong> Putem asigura livrări zilnice sau
                programate.
              </p>
              <p class="mb-0 mt-2">
                ✅ <strong>Suport personal:</strong> O relație directă cu producătorii pentru
                orice nevoie specială.
              </p>
            </div>

            <h3 class="h4 text-brown fw-bold mt-5 mb-4">Cum procedezi?</h3>

            <ol class="list-group list-group-numbered">
              <li class="list-group-item">
                <span class="fw-bold">Completează formularul</span> cu datele tale și nécessitats
              </li>
              <li class="list-group-item">
                <span class="fw-bold">Primești o ofertă personalizată</span> în maxim 24h
              </li>
              <li class="list-group-item">
                <span class="fw-bold">Confirmi și plasezi comanda</span> când e convenabil
              </li>
              <li class="list-group-item">
                <span class="fw-bold">Primești livrarea</span> la adresa specificată
              </li>
            </ol>

            <div class="d-grid gap-2 mt-5">
              <a href="/contact" class="btn btn-primary btn-lg">
                <i class="bi bi-envelope"></i> Cere o ofertă personalizată
              </a>
              <a href="/produse" class="btn btn-outline-primary btn-lg">
                <i class="bi bi-arrow-left"></i> Vezi toate produsele
              </a>
            </div>
          </div>
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
</style>

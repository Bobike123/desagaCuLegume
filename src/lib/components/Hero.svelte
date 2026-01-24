<script>
  export let title = "DeSaga cu Legume";
  export let subtitle = "Local • Gustos • Sănătos";
  export let backgroundImage = "";
  export let height = "400px";
</script>

<section
  class="hero d-flex align-items-center justify-content-center text-center"
  style="background-image: url({backgroundImage}); background-size: cover; background-position: center; height: {height}; position: relative;"
>
  <div
    style="position: absolute; inset: 0; background-color: rgba(6,100,35,0.3);"
  ></div>

  <div class="container position-relative z-index-1" style="z-index: 1;">
    <h1 class="display-3 fw-bold text-white mb-3">{title}</h1>
    <p class="fs-4 text-white">{subtitle}</p>
  </div>
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
  }

  .hero h1 {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .hero p {
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  }
</style>

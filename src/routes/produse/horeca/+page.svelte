<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    void goto('/horeca', { replaceState: true });
  });
</script>

<svelte:head>
  <title>HORECA - DeSaga cu Legume</title>
  <meta http-equiv="refresh" content="0; url=/horeca" />
</svelte:head>

<section class="py-5">
  <div class="container text-center">
    <h1 class="h4 fw-bold">Pagina HORECA s-a mutat</h1>
    <p class="text-muted mb-3">Oferta HORECA nu mai este categorie de produse.</p>
    <a class="btn btn-primary" href="/horeca">Mergi la HORECA</a>
  </div>
</section>
<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';
  import '$lib/styles/global.css';

  onMount(() => {
    cart.hydrate();
    void auth.initAuth();
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DeSaga cu Legume - Din Fermă direct la Rulota DeSaga</title>
  <meta
    name="description"
    content="DeSaga cu Legume - Legume și fructe proaspete de sezon, produse la borcan și colaboratori. Local, Gustos, Sănătos."
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
    crossorigin="anonymous"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    crossorigin="anonymous"
  />
  <script
    defer
    src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
    crossorigin="anonymous"
  ></script>
</svelte:head>

<Navigation />

<main class="min-vh-100 bg-white">
  <slot />
  <ScrollToTop />
</main>

<Footer />

<style>
  :global(body) {
    background-color: #ffffff;
    color: var(--desaga-text);
  }

  main {
    min-height: calc(100vh - 200px);
  }
</style>
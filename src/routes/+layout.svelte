<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
  import CookieConsentBanner from '$lib/components/CookieConsentBanner.svelte';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';
  import 'bootstrap/dist/css/bootstrap.min.css';
  import 'bootstrap-icons/font/bootstrap-icons.css';
  import '$lib/styles/global.css';

  onMount(() => {
    void import('bootstrap/dist/js/bootstrap.bundle.min.js');
    cart.hydrate();
    void auth.initAuth();
  });

  $: isAdminRoute = $page.url.pathname.startsWith('/admin');
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DeSaga cu Legume - Din Fermă direct la Rulota DeSaga</title>
  <meta
    name="description"
    content="DeSaga cu Legume - Legume și fructe proaspete de sezon și produse la borcan. Local, Gustos, Sănătos."
  />
</svelte:head>

{#if !isAdminRoute}
  <Navigation />
{/if}

<main class="min-vh-100 bg-white">
  <slot />
  <ScrollToTop />
  <CookieConsentBanner />
</main>

{#if !isAdminRoute}
  <Footer />
{/if}

<style>
  :global(body) {
    background-color: #ffffff;
    color: var(--desaga-text);
  }

  main {
    min-height: calc(100vh - 200px);
  }
</style>

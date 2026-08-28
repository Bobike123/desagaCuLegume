<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Navigation from '$lib/components/Navigation.svelte';
  import MobileTabBar from '$lib/components/MobileTabBar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
  import CookieConsentBanner from '$lib/components/CookieConsentBanner.svelte';
  import { auth } from '$lib/stores/auth';
  import { cart } from '$lib/stores/cart';
  import 'bootstrap/dist/css/bootstrap.min.css';
  import 'bootstrap-icons/font/bootstrap-icons.css';
  import '$lib/styles/global.css';

  onMount(() => {
    // Bootstrap's JS bundle is intentionally NOT loaded: the only consumer was
    // the mobile nav drawer, which is now a self-contained Svelte + CSS drawer
    // (see Navigation.svelte). Everything else uses Bootstrap CSS only.
    cart.hydrate();
    void auth.initAuth();
  });

  $: isAdminRoute = $page.url.pathname.startsWith('/admin');
</script>

<svelte:head>
  <!-- charset and viewport live in app.html; re-declaring the viewport here
       shipped a second tag without viewport-fit=cover, which silently zeroed
       every env(safe-area-inset-*) the mobile tab bar depends on. -->
  <title>DeSaga cu Legume - Din Fermă direct la Rulota DeSaga</title>
  <meta
    name="description"
    content="DeSaga cu Legume - Legume și fructe proaspete de sezon și produse la borcan. Local, Gustos, Sănătos."
  />
</svelte:head>

{#if !isAdminRoute}
  <Navigation />
{/if}

<main class="app-main">
  <slot />
  <ScrollToTop />
  <CookieConsentBanner />
</main>

{#if !isAdminRoute}
  <Footer />
  <MobileTabBar />
{/if}

<style>
  /* dvh, not vh: mobile browser chrome makes 100vh taller than the visible
     area, which pushed the footer below the fold on every phone. */
  main.app-main {
    min-height: calc(100dvh - 200px);
    background: var(--paper);
  }
</style>

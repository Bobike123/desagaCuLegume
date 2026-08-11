<script lang="ts">
  import { page } from '$app/stores';
  import MaintenancePage from '$lib/components/MaintenancePage.svelte';
  import 'bootstrap/dist/css/bootstrap.min.css';
  import 'bootstrap-icons/font/bootstrap-icons.css';
  import '$lib/styles/global.css';

  $: currentPath = $page.url.pathname.replace(/\/+$/, '') || '/';
  $: isAdminLogin = currentPath === '/admin/login';
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Site în mentenanță | DeSaga cu Legume</title>
  <meta
    name="description"
    content="Site-ul DeSaga cu Legume este momentan în mentenanță. Revenim în curând."
  />
</svelte:head>

<!--
  The route <slot /> is rendered only for /admin/login. Every other page is
  replaced by the maintenance screen for the lifetime of this branch.
-->
{#if isAdminLogin}
  <slot />
{:else}
  <MaintenancePage />
{/if}

<style>
  :global(html) {
    background: #f5f8f3;
  }

  :global(body) {
    background: #f5f8f3;
    color: var(--desaga-text);
  }
</style>

<script>
	import Navigation from "$lib/components/Navigation.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import ScrollToTop from "$lib/components/ScrollToTop.svelte";
	import { auth } from "$lib/stores/auth";
	import "$lib/styles/global.css";
	import { onMount } from "svelte";

	onMount(() => {
		auth.initAuth();
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
		href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
	/>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
	/>
	<script
		src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
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

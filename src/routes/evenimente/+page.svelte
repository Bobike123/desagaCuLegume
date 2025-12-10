<script>
  import Hero from '$lib/components/Hero.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import { onMount } from 'svelte';

  let events = [];
  let loading = true;
  let filteredEvents = [];
  let selectedType = 'all';

  onMount(async () => {
    try {
      const res = await fetch('/api/evenimente');
      if (res.ok) {
        events = await res.json();
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      loading = false;
    }
  });

  $: filteredEvents =
    selectedType === 'all' ? events : events.filter((e) => e.event_type === selectedType);
</script>

<svelte:head>
  <title>Evenimente - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Evenimente"
  subtitle="Alătură-te nouă la piețe, festivaluri și ateliere"
  backgroundImage="/images/evenimente-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <h2 class="h1 text-center text-brown fw-bold mb-5">
      <i class="bi bi-calendar-event"></i> Evenimente și activități
    </h2>

    <!-- Type Filter -->
    <div class="row mb-5">
      <div class="col-12">
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          <button
            class={`btn ${selectedType === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            on:click={() => (selectedType = 'all')}
          >
            <i class="bi bi-list-ul"></i> Toate
          </button>
          <button
            class={`btn ${selectedType === 'piata' ? 'btn-primary' : 'btn-outline-primary'}`}
            on:click={() => (selectedType = 'piata')}
          >
            <i class="bi bi-shop"></i> Piață
          </button>
          <button
            class={`btn ${selectedType === 'festival' ? 'btn-primary' : 'btn-outline-primary'}`}
            on:click={() => (selectedType = 'festival')}
          >
            <i class="bi bi-party-popper"></i> Festival
          </button>
          <button
            class={`btn ${selectedType === 'atelier' ? 'btn-primary' : 'btn-outline-primary'}`}
            on:click={() => (selectedType = 'atelier')}
          >
            <i class="bi bi-palette"></i> Atelier
          </button>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Se încarcă...</span>
        </div>
      </div>
    {:else if filteredEvents.length > 0}
      <div class="row g-4">
        {#each filteredEvents as event (event.id)}
          <div class="col-md-6 col-lg-4">
            <EventCard {event} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="alert alert-info text-center" role="alert">
        <h4 class="alert-heading">
          <i class="bi bi-info-circle"></i> Niciun eveniment disponibil
        </h4>
        <p>Revino mai târziu pentru noi evenimente și activități!</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }
</style>

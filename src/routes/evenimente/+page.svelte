<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import type { Event } from "$lib/stores/events";

  export let data;

  let currentPage = 1;
  const itemsPerPage = 6;

  $: totalPages = Math.ceil(data.events.length / itemsPerPage);
  $: paginatedEvents = data.events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
</script>

<svelte:head>
  <title>Evenimente - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Evenimente"
  subtitle="Descoperă activitățile din comunitatea DeSaga"
  backgroundImage=""
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <h2 class="h1 text-center text-brown fw-bold mb-5">
      <i class="bi bi-calendar-event"></i> Evenimente
    </h2>

    {#if data.events.length > 0}
      <div class="row g-4 mb-5">
        {#each paginatedEvents as event (event.id)}
          <div class="col-md-6 col-lg-4">
            <a href={`/evenimente/${event.id}`} class="text-decoration-none">
              <div class="card h-100 shadow-sm">
                {#if event.image_url}
                  <img
                    src={event.image_url}
                    class="card-img-top"
                    alt={event.title}
                  />
                {/if}
                <div class="card-body">
                  <h5 class="card-title text-brown fw-bold">{event.title}</h5>
                  <p class="card-text text-secondary">
                    {new Date(event.date).toLocaleDateString("ro-RO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p class="card-text small">{event.location}</p>
                </div>
              </div>
            </a>
          </div>
        {/each}
      </div>

      {#if totalPages > 1}
        <nav aria-label="Page navigation" class="d-flex justify-content-center">
          <ul class="pagination">
            <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
              <button
                class="page-link"
                on:click={() => currentPage > 1 && currentPage--}
              >
                Anterior
              </button>
            </li>

            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
              <li class="page-item {currentPage === page ? 'active' : ''}">
                <button class="page-link" on:click={() => (currentPage = page)}>
                  {page}
                </button>
              </li>
            {/each}

            <li
              class="page-item {currentPage === totalPages ? 'disabled' : ''}"
            >
              <button
                class="page-link"
                on:click={() => currentPage < totalPages && currentPage++}
              >
                Următoare
              </button>
            </li>
          </ul>
        </nav>
      {/if}
    {:else}
      <div class="alert alert-info text-center" role="alert">
        <h4 class="alert-heading">
          <i class="bi bi-info-circle"></i> Nu sunt evenimente disponibile
        </h4>
      </div>
    {/if}
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }
</style>

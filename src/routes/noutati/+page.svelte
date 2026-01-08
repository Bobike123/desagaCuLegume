<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import NoutateCard from "$lib/components/NoutateCard.svelte";

  export let data;

  let currentPage = 1;
  const itemsPerPage = 6;

  $: totalPages = Math.ceil(data.noutati.length / itemsPerPage);
  $: paginatedNoutati = data.noutati.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
</script>

<svelte:head>
  <title>Noutăți și Evenimente - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Noutăți și Momente"
  subtitle="Urmărește ultimele știri din DeSaga"
  backgroundImage=""
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <h2 class="h1 text-center text-brown fw-bold mb-5">
      <i class="bi bi-newspaper"></i> Ultimele noutăți din DeSaga
    </h2>

    {#if data.noutati.length > 0}
      <div class="row g-4 mb-5">
        {#each paginatedNoutati as item (item.id)}
          <div class="col-md-6 col-lg-4">
            <NoutateCard noutate={item} />
          </div>
        {/each}
      </div>

      <!-- Pagination -->
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
          <i class="bi bi-info-circle"></i> Nu sunt noutăți disponibile
        </h4>
        <p>Revino mai târziu pentru ultimele știri din DeSaga!</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .pagination .page-link {
    color: var(--desaga-brown);
    border-color: var(--desaga-border);
  }

  .pagination .page-link:hover {
    background-color: var(--desaga-green);
    color: white;
    border-color: var(--desaga-green);
  }

  .pagination .page-item.active .page-link {
    background-color: var(--desaga-green);
    border-color: var(--desaga-green);
  }
</style>

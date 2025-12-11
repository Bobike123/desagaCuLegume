<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getAllEvents, type Event } from "$lib/stores/events";

  let currentEvent: Event | null = null;
  let relatedEvents: Event[] = [];

  const formatDate = (d: string | Date): string =>
    new Date(d).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  onMount(async () => {
    const list: Event[] = await getAllEvents();

    const found = list.find((x) => x.id === $page.params.id);
    if (!found) return;

    currentEvent = {
      ...found,
      date: new Date(found.date),
      created_at: found.created_at ? new Date(found.created_at) : new Date(),
    };

    relatedEvents = list
      .filter((x) => x.id !== found.id)
      .slice(0, 3)
      .map((x) => ({
        ...x,
        date: new Date(x.date),
        created_at: x.created_at ? new Date(x.created_at) : new Date(),
      }));
  });
</script>

<svelte:head>
  <title>{currentEvent?.title || "Eveniment"} - DeSaga cu Legume</title>
</svelte:head>

<div class="container py-5">
  {#if currentEvent}
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="/">Acasă</a></li>
        <li class="breadcrumb-item"><a href="/evenimente">Evenimente</a></li>
        <li class="breadcrumb-item active" aria-current="page">
          {currentEvent.title}
        </li>
      </ol>
    </nav>

    <article class="row">
      <div class="col-lg-8">
        <header class="mb-4">
          <h1 class="h1 text-brown fw-bold mb-3">{currentEvent.title}</h1>

          <div class="d-flex flex-wrap gap-3 mb-4 text-secondary">
            <span
              ><i class="bi bi-calendar"></i>
              {formatDate(currentEvent.date)}</span
            >
            <span><i class="bi bi-geo-alt"></i> {currentEvent.location}</span>
          </div>

          {#if currentEvent.image_url}
            <img
              src={currentEvent.image_url}
              alt={currentEvent.title}
              class="img-fluid rounded shadow mb-4"
            />
          {/if}
        </header>

        <div class="content mb-5">
          <p class="lead text-secondary mb-4">{currentEvent.description}</p>
        </div>

        <div class="d-flex gap-2 mb-5">
          <a href="/evenimente" class="btn btn-outline-primary">
            <i class="bi bi-arrow-left"></i> Înapoi la evenimente
          </a>
        </div>
      </div>

      <div class="col-lg-4">
        {#if relatedEvents.length > 0}
          <h5 class="text-brown fw-bold mb-3">
            <i class="bi bi-arrow-left-right"></i> Evenimente similare
          </h5>

          {#each relatedEvents as item (item.id)}
            <a href={`/evenimente/${item.id}`} class="text-decoration-none">
              <div class="card mb-3 shadow-sm">
                {#if item.image_url}
                  <img
                    src={item.image_url}
                    class="card-img-top"
                    alt={item.title}
                  />
                {/if}
                <div class="card-body">
                  <h6 class="fw-bold text-brown">{item.title}</h6>
                  <p class="small text-secondary">{formatDate(item.date)}</p>
                </div>
              </div>
            </a>
          {/each}
        {/if}
      </div>
    </article>
  {:else}
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">
        <i class="bi bi-exclamation-triangle"></i> Eveniment negăsit
      </h4>

      <p>
        Evenimentul nu există.
        <a href="/evenimente">Înapoi la evenimente</a>
      </p>
    </div>
  {/if}
</div>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }
</style>

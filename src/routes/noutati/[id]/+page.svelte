<script lang="ts">
  import { page } from "$app/stores";
  import NoutateCard from "$lib/components/NoutateCard.svelte";
  import { noutati, fetchNoutati, type Noutate } from "$lib/stores/noutati";
  import { onMount } from "svelte";

  let currentNoutate: Noutate | null = null;
  let relatedNoutati: Noutate[] = [];

  const formatDate = (date: string | Date): string =>
    new Date(date).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  onMount(async () => {
    await fetchNoutati();

    // Ensure created_at is always a Date object locally
    const n = $noutati.find((n) => n.id === $page.params.id);
    if (n) {
      currentNoutate = { ...n, created_at: new Date(n.created_at) };
      relatedNoutati = $noutati
        .filter((r) => r.id !== currentNoutate?.id)
        .slice(0, 3)
        .map((r) => ({ ...r, created_at: new Date(r.created_at) }));
    }
  });
</script>

<svelte:head>
  <title>{currentNoutate?.title || "Noutate"} - DeSaga cu Legume</title>
</svelte:head>

<div class="container py-5">
  {#if currentNoutate}
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <a href="/">Acasă</a>
        </li>
        <li class="breadcrumb-item">
          <a href="/noutati">Noutăți</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {currentNoutate.title}
        </li>
      </ol>
    </nav>

    <article class="row">
      <div class="col-lg-8">
        <header class="mb-4">
          <h1 class="h1 text-brown fw-bold mb-3">{currentNoutate.title}</h1>

          <div class="d-flex flex-wrap gap-3 mb-4 text-secondary">
            <span>
              <i class="bi bi-calendar"></i>
              {formatDate(currentNoutate.created_at)}
            </span>
            {#if currentNoutate.author_id}
              <span>
                <i class="bi bi-person"></i> Admin DeSaga
              </span>
            {/if}
          </div>

          {#if currentNoutate.image_url}
            <img
              src={currentNoutate.image_url}
              alt={currentNoutate.title}
              class="img-fluid rounded shadow mb-4"
            />
          {/if}
        </header>

        <div class="content mb-5">
          {#if currentNoutate.excerpt}
            <p class="lead text-secondary mb-4">{currentNoutate.excerpt}</p>
          {/if}

          <div class="text-dark lh-lg">
            {currentNoutate.content}
          </div>
        </div>

        <div class="d-flex gap-2 mb-5">
          <a href="/noutati" class="btn btn-outline-primary">
            <i class="bi bi-arrow-left"></i> Înapoi la noutăți
          </a>
        </div>

        <!-- Share Section -->
        <div class="card bg-light border-0 p-4">
          <h5 class="card-title text-brown fw-bold mb-3">
            <i class="bi bi-share"></i> Împarte această noutate
          </h5>
          <div class="d-flex gap-2">
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=window.location.href"
              target="_blank"
              class="btn btn-sm btn-primary"
            >
              <i class="bi bi-facebook"></i> Facebook
            </a>
            <a href="#" class="btn btn-sm btn-info">
              <i class="bi bi-twitter"></i> Twitter
            </a>
            <button
              class="btn btn-sm btn-secondary"
              on:click={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copiat!");
              }}
            >
              <i class="bi bi-link-45deg"></i> Copiază linkul
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="col-lg-4">
        <aside>
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title text-brown fw-bold mb-3">
                <i class="bi bi-info-circle"></i> Despre articol
              </h5>
              <p class="card-text text-secondary">
                Articol publicat pe {formatDate(currentNoutate.created_at)}
              </p>
              <p class="card-text small">
                Rămâi conectat cu ultimele noutăți din DeSaga cu Legume prin
                abonare la newsletter-ul nostru.
              </p>
              <a href="/contact" class="btn btn-primary btn-sm w-100">
                <i class="bi bi-envelope"></i> Contact
              </a>
            </div>
          </div>

          {#if relatedNoutati.length > 0}
            <h5 class="text-brown fw-bold mb-3">
              <i class="bi bi-arrow-left-right"></i> Noutăți similare
            </h5>

            {#each relatedNoutati as item (item.id)}
              <NoutateCard noutate={item} />
            {/each}
          {/if}
        </aside>
      </div>
    </article>
  {:else}
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">
        <i class="bi bi-exclamation-triangle"></i> Noutate nu găsită
      </h4>
      <p>
        Articolul pe care îl cauți nu există. <a href="/noutati"
          >Înapoi la noutăți</a
        >
      </p>
    </div>
  {/if}
</div>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .content {
    font-size: 1.1rem;
    line-height: 1.8;
  }

  .breadcrumb {
    background-color: var(--desaga-cream);
  }
</style>

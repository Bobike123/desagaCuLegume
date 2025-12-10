<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let event = null;
  let loading = true;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'piata':
        return '🏪 Piață';
      case 'festival':
        return '🎉 Festival';
      case 'atelier':
        return '🎨 Atelier';
      default:
        return type;
    }
  };

  onMount(async () => {
    try {
      const res = await fetch(`/api/evenimente/${$page.params.id}`);
      if (res.ok) {
        event = await res.json();
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>{event?.title || 'Eveniment'} - DeSaga cu Legume</title>
</svelte:head>

<div class="container py-5">
  {#if loading}
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Se încarcă...</span>
      </div>
    </div>
  {:else if event}
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <a href="/">Acasă</a>
        </li>
        <li class="breadcrumb-item">
          <a href="/evenimente">Evenimente</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {event.title}
        </li>
      </ol>
    </nav>

    <article class="row">
      <div class="col-lg-8">
        <header class="mb-4">
          <h1 class="h1 text-brown fw-bold mb-3">{event.title}</h1>

          {#if event.image_url}
            <img
              src={event.image_url}
              alt={event.title}
              class="img-fluid rounded shadow mb-4"
            />
          {/if}

          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <p class="text-dark mb-2">
                <i class="bi bi-calendar-event text-green fw-bold"></i>
                <span class="fw-bold">Data și ora:</span>
              </p>
              <p class="text-secondary">{formatDate(event.date)}</p>
            </div>

            <div class="col-md-6">
              <p class="text-dark mb-2">
                <i class="bi bi-geo-alt text-green fw-bold"></i>
                <span class="fw-bold">Locație:</span>
              </p>
              <p class="text-secondary">{event.location}</p>
            </div>
          </div>

          <div class="mb-4">
            <span class="badge bg-brown px-3 py-2 fs-6">
              {getEventTypeLabel(event.event_type)}
            </span>
          </div>
        </header>

        <div class="content mb-5">
          <p class="lead text-secondary">{event.description}</p>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex gap-2 mb-5 flex-wrap">
          <button class="btn btn-primary btn-lg" on:click={() => {}}>
            <i class="bi bi-calendar-check"></i> Adaugă în calendar
          </button>
          <a href="/contact" class="btn btn-outline-primary btn-lg">
            <i class="bi bi-envelope"></i> Întrebare
          </a>
          <a href="/evenimente" class="btn btn-outline-secondary btn-lg">
            <i class="bi bi-arrow-left"></i> Alte evenimente
          </a>
        </div>

        <!-- Share Section -->
        <div class="card bg-light border-0 p-4">
          <h5 class="card-title text-brown fw-bold mb-3">
            <i class="bi bi-share"></i> Împărtășește evenimentul
          </h5>
          <div class="d-flex gap-2">
            <a href="#" class="btn btn-sm btn-primary">
              <i class="bi bi-facebook"></i> Facebook
            </a>
            <a href="#" class="btn btn-sm btn-info">
              <i class="bi bi-twitter"></i> Twitter
            </a>
            <button
              class="btn btn-sm btn-secondary"
              on:click={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copiat!');
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
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-brown fw-bold mb-3">
                <i class="bi bi-info-circle"></i> Detalii eveniment
              </h5>

              <p class="card-text">
                <strong>Tip:</strong> {getEventTypeLabel(event.event_type)}
              </p>

              <p class="card-text">
                <strong>Data:</strong><br />
                {formatDate(event.date)}
              </p>

              <p class="card-text">
                <strong>Locație:</strong><br />
                {event.location}
              </p>

              <a href="/contact" class="btn btn-primary btn-sm w-100">
                <i class="bi bi-envelope"></i> Contact pentru detalii
              </a>
            </div>
          </div>
        </aside>
      </div>
    </article>
  {:else}
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">
        <i class="bi bi-exclamation-triangle"></i> Eveniment nu găsit
      </h4>
      <p>
        Evenimentul pe care îl cauți nu există. <a href="/evenimente">Înapoi la evenimente</a>
      </p>
    </div>
  {/if}
</div>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .text-green {
    color: var(--desaga-green) !important;
  }

  .bg-brown {
    background-color: var(--desaga-brown) !important;
  }

  .breadcrumb {
    background-color: var(--desaga-cream);
  }
</style>

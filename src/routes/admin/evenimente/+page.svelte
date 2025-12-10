<script lang="ts">
  import { onMount } from "svelte";

  interface Event {
    id: string;
    title: string;
    event_type: string;
    date: string;
    location: string;
  }

  let events: Event[] = [];
  let loading = true;
  let error = "";
  let searchQuery = "";

  onMount(async () => {
    try {
      const res = await fetch("/api/evenimente");
      if (res.ok) {
        events = await res.json();
      }
    } catch (err) {
      error = "Eroare la încărcarea evenimentelor";
      console.error(err);
    } finally {
      loading = false;
    }
  });

  $: filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function deleteEvent(id: string) {
    if (!confirm("Ești sigur?")) return;

    try {
      const res = await fetch(`/api/evenimente/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        events = events.filter((e) => e.id !== id);
      }
    } catch (err) {
      error = "Eroare la ștergere";
      console.error(err);
    }
  }
</script>

<svelte:head>
  <title>Gestionare Evenimente - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <div class="d-flex justify-content-between align-items-center">
      <h1 class="h2 text-brown fw-bold m-0">
        <i class="bi bi-calendar-event"></i> Gestionare Evenimente
      </h1>
      <a href="/admin/evenimente/new" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> Eveniment nou
      </a>
    </div>
  </div>
</div>

{#if error}
  <div class="alert alert-danger" role="alert">
    <i class="bi bi-exclamation-triangle"></i>
    {error}
  </div>
{/if}

<div class="row mb-4">
  <div class="col-12">
    <input
      type="text"
      class="form-control"
      placeholder="Caută evenimente..."
      bind:value={searchQuery}
    />
  </div>
</div>

{#if loading}
  <div class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Se încarcă...</span>
    </div>
  </div>
{:else if filteredEvents.length > 0}
  <div class="card border-0 shadow-sm">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="bg-brown text-white">
          <tr>
            <th>Titlu</th>
            <th>Tip</th>
            <th>Data</th>
            <th>Locație</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredEvents as event (event.id)}
            <tr>
              <td class="fw-bold">{event.title}</td>
              <td>
                <span class="badge bg-success">{event.event_type}</span>
              </td>
              <td>{new Date(event.date).toLocaleDateString("ro-RO")}</td>
              <td>{event.location}</td>
              <td>
                <a
                  href="/admin/evenimente/{event.id}"
                  class="btn btn-sm btn-primary me-2"
                >
                  <i class="bi bi-pencil"></i> Edit
                </a>
                <button
                  class="btn btn-sm btn-danger"
                  on:click={() => deleteEvent(event.id)}
                >
                  <i class="bi bi-trash"></i> Șterge
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{:else}
  <div class="alert alert-info">
    <i class="bi bi-info-circle"></i> Nu sunt evenimente disponibile
  </div>
{/if}

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .bg-brown {
    background-color: var(--desaga-brown) !important;
  }
</style>

<script lang="ts">
  import { onMount } from "svelte";

  interface Noutate {
    id: string;
    title: string;
    published: boolean;
    created_at: string;
  }

  let noutati: Noutate[] = [];
  let loading = true;
  let error = "";
  let searchQuery = "";
  let filterPublished: "all" | "published" | "draft" = "all";

  onMount(async () => {
    try {
      const res = await fetch("/api/noutati?admin=true");
      if (res.ok) {
        noutati = (await res.json()) as Noutate[];
      }
    } catch (err: unknown) {
      error = "Eroare la încărcarea noutăților";
      console.error(err);
    } finally {
      loading = false;
    }
  });

  $: filteredNoutati = noutati.filter((n) => {
    const matchesSearch = n.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterPublished === "all" ||
      (filterPublished === "published" && n.published) ||
      (filterPublished === "draft" && !n.published);
    return matchesSearch && matchesFilter;
  });

  async function togglePublish(id: string, published: boolean) {
    try {
      const res = await fetch(`/api/noutati/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });

      if (res.ok) {
        noutati = noutati.map((n) =>
          n.id === id ? { ...n, published: !published } : n,
        );
      }
    } catch (err: unknown) {
      error = "Eroare la actualizare";
      console.error(err);
    }
  }

  async function deleteNoutate(id: string) {
    if (!confirm("Ești sigur?")) return;

    try {
      const res = await fetch(`/api/noutati/${id}`, { method: "DELETE" });

      if (res.ok) {
        noutati = noutati.filter((n) => n.id !== id);
      }
    } catch (err: unknown) {
      error = "Eroare la ștergere";
      console.error(err);
    }
  }
</script>

<svelte:head>
  <title>Gestionare Noutăți - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <div class="d-flex justify-content-between align-items-center">
      <h1 class="h2 text-brown fw-bold m-0">
        <i class="bi bi-newspaper"></i> Gestionare Noutăți
      </h1>
      <a href="/admin/noutati/new" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> Noutate nouă
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

<div class="row g-3 mb-4">
  <div class="col-md-6">
    <input
      type="text"
      class="form-control"
      placeholder="Caută noutăți..."
      bind:value={searchQuery}
    />
  </div>
  <div class="col-md-6">
    <select class="form-select" bind:value={filterPublished}>
      <option value="all">Toate</option>
      <option value="published">Publicate</option>
      <option value="draft">Draft</option>
    </select>
  </div>
</div>

{#if loading}
  <div class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Se încarcă...</span>
    </div>
  </div>
{:else if filteredNoutati.length > 0}
  <div class="card border-0 shadow-sm">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="bg-brown text-white">
          <tr>
            <th>Titlu</th>
            <th>Status</th>
            <th>Data</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredNoutati as item (item.id)}
            <tr>
              <td class="fw-bold">{item.title}</td>
              <td>
                <span
                  class={`badge ${item.published ? "bg-success" : "bg-warning"}`}
                >
                  {item.published ? "Public" : "Draft"}
                </span>
              </td>
              <td>{new Date(item.created_at).toLocaleDateString("ro-RO")}</td>
              <td>
                <a
                  href="/admin/noutati/{item.id}"
                  class="btn btn-sm btn-primary me-2"
                >
                  <i class="bi bi-pencil"></i> Edit
                </a>
                <button
                  class="btn btn-sm btn-warning me-2"
                  on:click={() => togglePublish(item.id, item.published)}
                >
                  {item.published ? "🔒 Unpublish" : "🔓 Publish"}
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  on:click={() => deleteNoutate(item.id)}
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
    <i class="bi bi-info-circle"></i> Nu sunt noutăți disponibile
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

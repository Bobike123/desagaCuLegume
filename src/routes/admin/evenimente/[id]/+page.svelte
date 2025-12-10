<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import {
    events,
    type Event as EventType,
    fetchEventById,
    updateEvent,
    deleteEvent,
  } from "$lib/stores/events";

  let event: EventType | null = null;
  let formData: EventType = {
    id: "",
    title: "",
    description: "",
    date: "",
    location: "",
    event_type: "festival",
    image_url: "",
  };

  let submitting = false;
  let deletingFlag = false;
  let error = "";
  let imageFile: File | null = null;
  let imagePreview = "";
  let loading = true;

  onMount(async () => {
    const id = $page.params.id;
    if (!id) {
      error = "ID eveniment invalid";
      loading = false;
      return;
    }

    const data = await fetchEventById(id);
    if (data) {
      event = data;
      formData = { ...data };
      imagePreview = data.image_url;
    } else {
      error = "Eveniment nu găsit";
    }
    loading = false;
  });

  function handleImageChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    imageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    error = "";

    const id = $page.params.id;
    if (!id) {
      error = "ID eveniment invalid";
      submitting = false;
      return;
    }

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const formDataObj = new FormData();
        formDataObj.append("file", imageFile);

        const uploadRes = await fetch("/api/products/upload", {
          method: "POST",
          body: formDataObj,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        }
      }

      const updated = await updateEvent(id, {
        ...formData,
        image_url: imageUrl,
      });
      if (updated) {
        goto("/admin/evenimente");
      } else {
        error = "Eroare la actualizare";
      }
    } catch (err: unknown) {
      error = (err as Error).message || "Eroare necunoscută";
      console.error(err);
    } finally {
      submitting = false;
    }
  }

  async function handleDelete() {
    const id = $page.params.id;
    if (!id) {
      error = "ID eveniment invalid";
      return;
    }

    if (!confirm("Ești sigur?")) return;

    deletingFlag = true;
    try {
      const success = await deleteEvent(id);
      if (success) goto("/admin/evenimente");
      else error = "Eroare la ștergere";
    } catch (err: unknown) {
      error = "Eroare la ștergere";
      console.error(err);
    } finally {
      deletingFlag = false;
    }
  }
</script>

<svelte:head>
  <title>Editare Eveniment - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <div class="d-flex justify-content-between align-items-center">
      <h1 class="h2 text-brown fw-bold m-0">
        <i class="bi bi-pencil"></i> Editare Eveniment
      </h1>
      <button
        class="btn btn-danger"
        on:click={handleDelete}
        disabled={loading || deletingFlag}
      >
        <i class="bi bi-trash"></i> Șterge
      </button>
    </div>
  </div>
</div>

{#if error}
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    <i class="bi bi-exclamation-triangle"></i>
    {error}
    <button
      type="button"
      class="btn-close"
      data-bs-dismiss="alert"
      aria-label="Close"
    ></button>
  </div>
{/if}

{#if loading}
  <div class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Se încarcă...</span>
    </div>
  </div>
{:else if event}
  <div class="row">
    <div class="col-lg-8">
      <div class="card border-0 shadow-sm">
        <div class="card-body p-4">
          <form on:submit={handleSubmit}>
            <div class="mb-3">
              <label for="title" class="form-label text-brown fw-bold"
                >Titlu *</label
              >
              <input
                type="text"
                class="form-control"
                id="title"
                bind:value={formData.title}
                required
                disabled={submitting}
              />
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="date" class="form-label text-brown fw-bold"
                  >Data și ora *</label
                >
                <input
                  type="datetime-local"
                  class="form-control"
                  id="date"
                  bind:value={formData.date}
                  required
                  disabled={submitting}
                />
              </div>
              <div class="col-md-6 mb-3">
                <label for="type" class="form-label text-brown fw-bold"
                  >Tip Eveniment *</label
                >
                <select
                  class="form-select"
                  id="type"
                  bind:value={formData.event_type}
                  required
                  disabled={submitting}
                >
                  <option value="piata">Piață</option>
                  <option value="festival">Festival</option>
                  <option value="atelier">Atelier</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label for="location" class="form-label text-brown fw-bold"
                >Locație *</label
              >
              <input
                type="text"
                class="form-control"
                id="location"
                bind:value={formData.location}
                required
                disabled={submitting}
              />
            </div>

            <div class="mb-3">
              <label for="description" class="form-label text-brown fw-bold"
                >Descriere *</label
              >
              <textarea
                class="form-control"
                id="description"
                rows="5"
                bind:value={formData.description}
                required
                disabled={submitting}
              ></textarea>
            </div>

            <div class="mb-3">
              <label for="image" class="form-label text-brown fw-bold"
                >Imagine</label
              >
              <input
                type="file"
                class="form-control"
                id="image"
                accept="image/*"
                on:change={handleImageChange}
                disabled={submitting}
              />
              {#if imagePreview}
                <div class="mt-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    class="img-fluid rounded"
                    style="max-height: 200px;"
                  />
                </div>
              {/if}
            </div>

            <div class="d-grid gap-2">
              <button
                type="submit"
                class="btn btn-primary btn-lg"
                disabled={submitting}
              >
                {#if submitting}
                  <span
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Se salvează...
                {:else}
                  <i class="bi bi-check-circle"></i> Salvează Modificări
                {/if}
              </button>
              <a href="/admin/evenimente" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Anulează
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="alert alert-danger">
    <i class="bi bi-exclamation-triangle"></i> Eveniment nu găsit
  </div>
{/if}

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .form-control:focus,
  .form-select:focus {
    border-color: var(--desaga-green);
    box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
  }
</style>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  type FormDataShape = {
    name: string;
    description: string;
    category: string;
    price: number;
    image_url: string;
  };

  let formData: FormDataShape = {
    name: "",
    description: "",
    category: "de-sezon",
    price: 0,
    image_url: "",
  };

  let submitting = false;
  let error = "";
  let imageFile: File | null = null;
  let imagePreview: string = "";

  function handleImageChange(e: Event) {
    const input = e.target as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) return;

    imageFile = input.files[0];

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === "string") imagePreview = result;
    };
    reader.readAsDataURL(imageFile);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    submitting = true;
    error = "";

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const formDataObj = new FormData();
        formDataObj.append("file", imageFile);

        const uploadRes = await fetch("/api/products/upload", {
          method: "POST",
          body: formDataObj,
        });

        if (!uploadRes.ok) throw new Error("Eroare la încărcarea imaginii");

        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
          in_stock: true,
        }),
      });

      if (res.ok) goto("/admin/produse");
      else error = "Eroare la crearea produsului";
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Eroare necunoscută";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Produs Nou - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <h1 class="h2 text-brown fw-bold">
      <i class="bi bi-plus-circle"></i> Produs Nou
    </h1>
  </div>
</div>

{#if error}
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    <i class="bi bi-exclamation-triangle"></i>
    {error}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
{/if}

<div class="row">
  <div class="col-lg-8">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <form on:submit={handleSubmit}>
          <div class="mb-3">
            <label for="name" class="form-label text-brown fw-bold"
              >Nume Produs *</label
            >
            <input
              type="text"
              class="form-control"
              id="name"
              bind:value={formData.name}
              required
              disabled={submitting}
            />
          </div>

          <div class="mb-3">
            <label for="category" class="form-label text-brown fw-bold"
              >Categorie *</label
            >
            <select
              class="form-select"
              id="category"
              bind:value={formData.category}
              required
              disabled={submitting}
            >
              <option value="de-sezon">De Sezon</option>
              <option value="la-borcan">La Borcan</option>
              <option value="colaboratori">Colaboratori</option>
              <option value="horeca">HORECA</option>
            </select>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="price" class="form-label text-brown fw-bold"
                >Preț (RON)</label
              >
              <input
                type="number"
                class="form-control"
                id="price"
                bind:value={formData.price}
                step="0.01"
                min="0"
                disabled={submitting}
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="description" class="form-label text-brown fw-bold"
              >Descriere</label
            >
            <textarea
              class="form-control"
              id="description"
              rows="4"
              bind:value={formData.description}
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
                <i class="bi bi-check-circle"></i> Crează Produs
              {/if}
            </button>
            <a href="/admin/produse" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left"></i> Anulează
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="col-lg-4">
    <div class="card border-0 shadow-sm bg-light">
      <div class="card-body">
        <h5 class="card-title text-brown fw-bold mb-3">
          <i class="bi bi-info-circle"></i> Ajutor
        </h5>
        <ul class="list-unstyled small">
          <li class="mb-2">
            <strong>Nume:</strong> Numele produsului (ex: Roșii Cherry)
          </li>
          <li class="mb-2">
            <strong>Categorie:</strong> Alege din lista existentă
          </li>
          <li class="mb-2">
            <strong>Preț:</strong> Preț în RON (opțional)
          </li>
          <li class="mb-2">
            <strong>Descriere:</strong> Detalii despre produs
          </li>
          <li class="mb-2">
            <strong>Imagine:</strong> JPG, PNG (max 5MB)
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

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

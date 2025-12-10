<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  type Product = {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    image_url: string;
    in_stock: boolean;
    created_at: string;
    updated_at: string;
  };

  let product: Product | null = null;

  let formData: Product = {
    id: "",
    name: "",
    description: "",
    category: "de-sezon",
    price: 0,
    image_url: "",
    in_stock: true,
    created_at: "",
    updated_at: "",
  };

  let submitting: boolean = false;
  let deleting: boolean = false;
  let error: string = "";
  let imageFile: File | null = null;
  let imagePreview: string = "";
  let loading: boolean = true;

  onMount(async () => {
    try {
      const res = await fetch(`/api/products/${$page.params.id}`);
      if (!res.ok) {
        error = "Produs nu găsit";
        return;
      }

      const data: Product = await res.json();
      product = data;
      formData = { ...data };
      imagePreview = data.image_url;
    } catch {
      error = "Eroare la încărcarea produsului";
    } finally {
      loading = false;
    }
  });

  function handleImageChange(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target || !target.files || target.files.length === 0) return;

    const file = target.files[0];
    imageFile = file;

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const result = ev.target?.result;
      if (typeof result === "string") imagePreview = result;
    };
    reader.readAsDataURL(file);
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

      const res = await fetch(`/api/products/${$page.params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image_url: imageUrl }),
      });

      if (!res.ok) {
        error = "Eroare la actualizarea produsului";
        return;
      }

      goto("/admin/produse");
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Eroare necunoscută";
    } finally {
      submitting = false;
    }
  }

  async function handleDelete() {
    if (!confirm("Ești sigur că vrei să ștergi acest produs?")) return;

    deleting = true;

    try {
      const res = await fetch(`/api/products/${$page.params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        error = "Eroare la ștergerea produsului";
        return;
      }

      goto("/admin/produse");
    } catch {
      error = "Eroare la ștergerea produsului";
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Editare Produs - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <div class="d-flex justify-content-between align-items-center">
      <h1 class="h2 text-brown fw-bold m-0">
        <i class="bi bi-pencil"></i> Editare Produs
      </h1>
      <button
        class="btn btn-danger"
        on:click={handleDelete}
        disabled={loading || deleting}
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
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
{/if}

{#if loading}
  <div class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Se încarcă...</span>
    </div>
  </div>
{:else if product}
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
              <div class="col-md-6 mb-3">
                <label for="inStock" class="form-label text-brown fw-bold"
                  >Status</label
                >
                <select
                  class="form-select"
                  id="inStock"
                  bind:value={formData.in_stock}
                  disabled={submitting}
                >
                  <option value={true}>În stoc</option>
                  <option value={false}>Indisponibil</option>
                </select>
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
                  <i class="bi bi-check-circle"></i> Salvează Modificări
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
      <div class="card border-0 shadow-sm bg-light mb-3">
        <div class="card-body">
          <h5 class="card-title text-brown fw-bold mb-3">
            <i class="bi bi-info-circle"></i> Info
          </h5>
          <p class="small text-secondary mb-2">
            <strong>Creat:</strong>
            {new Date(product.created_at).toLocaleDateString("ro-RO")}
          </p>
          <p class="small text-secondary">
            <strong>Actualizat:</strong>
            {new Date(product.updated_at).toLocaleDateString("ro-RO")}
          </p>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="alert alert-danger">
    <i class="bi bi-exclamation-triangle"></i> Produs nu găsit
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

<script lang="ts">
  import { goto } from "$app/navigation";

  type NoutateForm = {
    title: string;
    excerpt: string;
    content: string;
    image_url: string;
  };

  let formData: NoutateForm = {
    title: "",
    excerpt: "",
    content: "",
    image_url: "",
  };

  let submitting: boolean = false;
  let error: string = "";
  let imageFile: File | null = null;
  let imagePreview: string = "";

  function handleImageChange(e: Event) {
    const input = e.target as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    imageFile = file;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
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

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        }
      }

      const res = await fetch("/api/noutati", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
          published: false,
        }),
      });

      if (res.ok) goto("/admin/noutati");
      else error = "Eroare la crearea noutății";
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Eroare necunoscută";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Noutate Nouă - Admin DeSaga</title>
</svelte:head>

<div class="row mb-4">
  <div class="col-12">
    <h1 class="h2 text-brown fw-bold">
      <i class="bi bi-plus-circle"></i> Noutate Nouă
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

          <div class="mb-3">
            <label for="excerpt" class="form-label text-brown fw-bold"
              >Scurt Rezumat</label
            >
            <textarea
              class="form-control"
              id="excerpt"
              rows="2"
              bind:value={formData.excerpt}
              disabled={submitting}
            ></textarea>
          </div>

          <div class="mb-3">
            <label for="content" class="form-label text-brown fw-bold"
              >Conținut *</label
            >
            <textarea
              class="form-control"
              id="content"
              rows="8"
              bind:value={formData.content}
              required
              disabled={submitting}
            ></textarea>
            <small class="text-muted">
              Suportă text simplu. Pentru formatare, folosește markdown.
            </small>
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
                <i class="bi bi-check-circle"></i> Crează Noutate
              {/if}
            </button>
            <a href="/admin/noutati" class="btn btn-outline-secondary">
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
          <i class="bi bi-info-circle"></i> Tips
        </h5>
        <ul class="list-unstyled small">
          <li class="mb-2">Titlul trebuie să fie relevant și atractiv</li>
          <li class="mb-2">Rezumatul apare pe pagina de listare</li>
          <li class="mb-2">Conținutul apare pe pagina de detalii</li>
          <li class="mb-2">Imaginea va fi thumbnail în lista</li>
          <li class="mb-2">Noutatea nu va fi publicată automat</li>
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

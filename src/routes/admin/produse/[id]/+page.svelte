<!-- src/routes/admin/produse/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  type Product = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    price: number | null;
    image_url: string | null;
    in_stock: boolean | null;
  };

  let item: Product | null = null;

  let formData = {
    name: "",
    description: "",
    category: "",
    price: 0,
    image_url: "",
    in_stock: true,
  };

  let submitting = false;
  let loading = true;
  let imageFile: File | null = null;
  let imagePreview = "";
  let error = "";
  let toast = "";
  let toastType: "success" | "danger" | "info" = "info";

  function showToast(msg: string, type: typeof toastType = "info") {
    toast = msg;
    toastType = type;
    setTimeout(() => (toast = ""), 2500);
  }

  const id = $page.params.id;

  function handleImageChange(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    imageFile = file;

    if (!file) {
      imagePreview = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const v = e.target?.result;
      imagePreview = typeof v === "string" ? v : "";
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string> {
    if (!imageFile) return formData.image_url;

    const fd = new FormData();
    fd.append("file", imageFile);

    const uploadRes = await fetch("/api/products/upload", {
      method: "POST",
      body: fd,
    });
    if (!uploadRes.ok) {
      const j = await uploadRes.json().catch(() => ({}));
      throw new Error(j?.error ?? "Eroare la upload imagine");
    }

    const j = await uploadRes.json();
    return j.url as string;
  }

  onMount(async () => {
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/products/${id}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "Nu pot încărca produsul");

      item = j.item as Product;

      formData = {
        name: item.name ?? "",
        description: item.description ?? "",
        category: item.category ?? "",
        price: Number(item.price ?? 0),
        image_url: item.image_url ?? "",
        in_stock: Boolean(item.in_stock ?? false),
      };

      imagePreview = "";
    } catch (e) {
      error = e instanceof Error ? e.message : "Eroare la încărcare";
    } finally {
      loading = false;
    }
  });

  async function save(e: Event) {
    e.preventDefault();
    submitting = true;
    error = "";

    try {
      const imageUrl = await uploadImage();

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image_url: imageUrl || null }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "Eroare la salvare");

      showToast("Produs salvat", "success");
      setTimeout(() => goto("/admin/produse"), 600);
    } catch (e) {
      error = e instanceof Error ? e.message : "Eroare necunoscută";
      showToast(error, "danger");
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Editare Produs - Admin DeSaga</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true"
          ><i class="bi bi-pencil"></i></span
        >
        Editare produs
      </h1>
      <p class="page__subtitle">Actualizează datele și salvează.</p>
    </div>

    <div class="page__actions">
      <a href="/admin/produse" class="btn btn-outline-secondary page__btn">
        <i class="bi bi-arrow-left"></i>
        <span>Înapoi</span>
      </a>
    </div>
  </header>

  {#if toast}
    <div
      class={`alert alert-${toastType} d-flex align-items-center gap-2 shadow-sm mb-3`}
      role="alert"
    >
      <i class="bi bi-info-circle"></i>
      <div>{toast}</div>
    </div>
  {/if}

  {#if error}
    <div
      class="alert alert-danger d-flex align-items-center gap-2 shadow-sm mb-3"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle"></i>
      <div>{error}</div>
    </div>
  {/if}

  {#if loading}
    <div class="card border-0 shadow-sm">
      <div class="card-body py-5 text-center">
        <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
        <div class="mt-3 text-muted">Se încarcă produsul…</div>
      </div>
    </div>
  {:else if item}
    <form on:submit={save} class="grid">
      <section class="panel">
        <div class="panel__head">
          <h2 class="panel__title">
            <i class="bi bi-sliders"></i>
            Detalii produs
          </h2>
          <span class="panel__hint">Nume + descriere + preț</span>
        </div>

        <div class="panel__body">
          <div class="field">
            <label class="field__label">Nume *</label>
            <input
              class="form-control field__control"
              bind:value={formData.name}
              required
              disabled={submitting}
            />
          </div>

          <div class="field">
            <label class="field__label">Descriere *</label>
            <textarea
              class="form-control field__control"
              rows="7"
              bind:value={formData.description}
              required
              disabled={submitting}
            ></textarea>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <div class="field">
                <label class="field__label">Categorie *</label>
                <input
                  class="form-control field__control"
                  bind:value={formData.category}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div class="col-md-6">
              <div class="field">
                <label class="field__label">Preț (lei) *</label>
                <input
                  type="number"
                  class="form-control field__control"
                  min="0"
                  step="0.01"
                  bind:value={formData.price}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div class="cardlike cardlike--flat">
            <div class="cardlike__body">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  bind:checked={formData.in_stock}
                  id="in_stock"
                  disabled={submitting}
                />
                <label class="form-check-label fw-bold" for="in_stock">
                  {formData.in_stock ? "În stoc" : "Stoc epuizat"}
                </label>
              </div>
              <div class="small text-muted mt-2">
                Apare ca disponibil / indisponibil pe site.
              </div>
            </div>
          </div>
        </div>

        <div class="panel__foot">
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
              Se salvează…
            {:else}
              <i class="bi bi-check-circle"></i>
              Salvează
            {/if}
          </button>
        </div>
      </section>

      <aside class="side">
        <div class="cardlike">
          <div class="cardlike__head">
            <div class="cardlike__title">
              <i class="bi bi-image"></i>
              Imagine
            </div>
            <div class="cardlike__sub">Upload sau URL</div>
          </div>

          <div class="cardlike__body">
            <input
              type="file"
              class="form-control"
              accept="image/*"
              on:change={handleImageChange}
              disabled={submitting}
            />

            {#if imagePreview}
              <div class="preview">
                <img src={imagePreview} alt="Preview" class="preview__img" />
              </div>
            {:else if formData.image_url}
              <div class="preview">
                <img
                  src={formData.image_url}
                  alt="Curent"
                  class="preview__img"
                />
              </div>
            {:else}
              <div class="preview preview--empty">
                <div class="preview__empty">
                  <i class="bi bi-card-image"></i>
                  <div>Fără imagine</div>
                </div>
              </div>
            {/if}

            <div class="mt-3">
              <label class="field__label">Image URL</label>
              <input
                class="form-control"
                bind:value={formData.image_url}
                disabled={submitting}
                placeholder="https://..."
              />
              <div class="small text-muted mt-2">
                Dacă uploadezi, URL-ul se înlocuiește la salvare.
              </div>
            </div>
          </div>
        </div>

        <div class="cardlike">
          <div class="cardlike__head">
            <div class="cardlike__title">
              <i class="bi bi-info-circle"></i>
              Info
            </div>
            <div class="cardlike__sub">API</div>
          </div>
          <div class="cardlike__body">
            <div class="small text-muted">
              Editarea pornește cu datele încărcate din <code
                >/api/products/{id}</code
              >.
            </div>
          </div>
        </div>
      </aside>
    </form>
  {:else}
    <div class="empty">
      <div class="empty__icon"><i class="bi bi-info-circle"></i></div>
      <div class="empty__text">
        <div class="fw-bold">Produs inexistent</div>
        <div class="text-muted">Nu s-a găsit produsul cerut.</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    padding: 10px 0 22px;
  }

  .page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin: 6px 0 14px;
  }
  .page__title {
    margin: 0;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--desaga-brown);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.6rem;
    line-height: 1.2;
  }
  .page__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
  }
  .page__subtitle {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.55);
  }
  .page__actions {
    display: flex;
    gap: 10px;
  }
  .page__btn {
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 14px;
    align-items: start;
  }

  .panel {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
  .panel__head {
    padding: 14px 14px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.015);
  }
  .panel__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 900;
    color: var(--desaga-brown);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .panel__hint {
    color: rgba(0, 0, 0, 0.55);
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  .panel__body {
    padding: 14px;
  }
  .panel__foot {
    padding: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    justify-content: flex-end;
    background: #fff;
  }

  .field {
    margin-bottom: 12px;
  }
  .field__label {
    display: block;
    font-weight: 800;
    color: rgba(0, 0, 0, 0.78);
    margin-bottom: 6px;
  }

  .cardlike {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 14px;
  }
  .cardlike--flat {
    box-shadow: none;
  }
  .cardlike__head {
    padding: 12px 12px 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(0, 0, 0, 0.015);
  }
  .cardlike__title {
    font-weight: 900;
    color: var(--desaga-brown);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cardlike__sub {
    margin-top: 4px;
    color: rgba(0, 0, 0, 0.55);
    font-size: 0.9rem;
  }
  .cardlike__body {
    padding: 12px;
  }

  .preview {
    margin-top: 12px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.02);
  }
  .preview__img {
    width: 100%;
    display: block;
    max-height: 240px;
    object-fit: cover;
  }
  .preview--empty {
    display: grid;
    place-items: center;
    padding: 22px 12px;
  }
  .preview__empty {
    color: rgba(0, 0, 0, 0.55);
    display: grid;
    gap: 6px;
    justify-items: center;
  }

  .empty {
    border: 1px dashed rgba(0, 0, 0, 0.18);
    border-radius: 16px;
    padding: 18px 14px;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.015);
  }
  .empty__icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.55);
    flex: 0 0 auto;
  }

  .form-control:focus,
  .form-select:focus,
  textarea:focus {
    border-color: var(--desaga-green);
    box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
  }

  @media (max-width: 992px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .panel__hint {
      display: none;
    }
  }
</style>

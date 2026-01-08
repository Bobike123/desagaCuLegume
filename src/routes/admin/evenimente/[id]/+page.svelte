<!-- src/routes/admin/evenimente/[id]/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";

  type EventItem = {
    id: string;
    title: string | null;
    description: string | null;
    date: string | null;
    location: string | null;
    event_type: string | null;
    image_url: string | null;
    published: boolean | null;
  };

  export let data: { item: EventItem };

  const item = data.item;

  function toDatetimeLocal(value: string | null) {
    if (!value) return "";
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  let formData = {
    title: item.title ?? "",
    description: item.description ?? "",
    date: toDatetimeLocal(item.date),
    location: item.location ?? "",
    event_type: item.event_type ?? "festival",
    image_url: item.image_url ?? "",
    published: Boolean(item.published),
  };

  let submitting = false;
  let error = "";
  let success = "";
  let imageFile: File | null = null;
  let imagePreview = formData.image_url;

  function handleImageChange(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") imagePreview = result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: Event) {
    e.preventDefault();
    submitting = true;
    error = "";
    success = "";

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);

        const uploadRes = await fetch("/api/products/upload", {
          method: "POST",
          body: fd,
        });

        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          error = uploadJson?.error ?? "Eroare la upload imagine";
          return;
        }
        imageUrl = uploadJson.url ?? imageUrl;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        location: formData.location,
        event_type: formData.event_type,
        image_url: imageUrl || null,
        published: formData.published,
      };

      const res = await fetch(`/api/evenimente/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = json?.error ?? "Eroare la salvare";
        return;
      }

      formData.image_url = json?.item?.image_url ?? imageUrl;
      success = "Salvat în baza de date";
      setTimeout(() => (success = ""), 2500);
    } catch (err) {
      console.error(err);
      error = "Eroare la salvare";
    } finally {
      submitting = false;
    }
  }

  async function handleDelete() {
    if (!confirm("Ștergi acest eveniment?")) return;

    submitting = true;
    error = "";
    success = "";

    try {
      const res = await fetch(`/api/evenimente/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = json?.error ?? "Eroare la ștergere";
        return;
      }
      await goto("/admin/evenimente");
    } catch (err) {
      console.error(err);
      error = "Eroare la ștergere";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Editare Eveniment - Admin DeSaga</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true"
          ><i class="bi bi-pencil-square"></i></span
        >
        Editare eveniment
      </h1>
      <p class="page__subtitle">
        ID: <code>{item.id}</code>
      </p>
    </div>

    <div class="page__actions">
      <a href="/admin/evenimente" class="btn btn-outline-secondary page__back">
        <i class="bi bi-arrow-left"></i>
        <span>Înapoi</span>
      </a>

      <button
        class="btn btn-outline-danger"
        disabled={submitting}
        on:click={handleDelete}
      >
        <i class="bi bi-trash"></i>
        Șterge
      </button>
    </div>
  </header>

  {#if success}
    <div
      class="alert alert-success d-flex align-items-center gap-2 shadow-sm mb-3"
      role="alert"
    >
      <i class="bi bi-check-circle"></i>
      <div>{success}</div>
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

  <div class="layout">
    <section class="panel">
      <div class="panel__head">
        <h2 class="panel__title">
          <i class="bi bi-sliders"></i>
          Modifică datele
        </h2>
        <span class="panel__hint"
          >Salvarea face PATCH pe /api/evenimente/:id</span
        >
      </div>

      <div class="panel__body">
        <form on:submit={handleSave}>
          <div class="grid">
            <div class="grid__main">
              <div class="field">
                <label class="field__label">Titlu *</label>
                <input
                  class="form-control field__control"
                  bind:value={formData.title}
                  required
                  disabled={submitting}
                />
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <div class="field">
                    <label class="field__label">Data și ora *</label>
                    <input
                      type="datetime-local"
                      class="form-control field__control"
                      bind:value={formData.date}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="field">
                    <label class="field__label">Tip eveniment *</label>
                    <select
                      class="form-select field__control"
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
              </div>

              <div class="field">
                <label class="field__label">Locație *</label>
                <input
                  class="form-control field__control"
                  bind:value={formData.location}
                  required
                  disabled={submitting}
                />
              </div>

              <div class="field">
                <label class="field__label">Descriere *</label>
                <textarea
                  class="form-control field__control"
                  rows="8"
                  bind:value={formData.description}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <aside class="grid__side">
              <div class="cardlike">
                <div class="cardlike__head">
                  <div class="cardlike__title">
                    <i class="bi bi-image"></i>
                    Imagine
                  </div>
                  <div class="cardlike__sub">URL sau upload.</div>
                </div>

                <div class="cardlike__body">
                  <div class="field mb-2">
                    <label class="field__label">Image URL</label>
                    <input
                      class="form-control"
                      placeholder="https://..."
                      bind:value={formData.image_url}
                      disabled={submitting}
                      on:input={() => (imagePreview = formData.image_url)}
                    />
                  </div>

                  <div class="field mb-0">
                    <label class="field__label">Upload</label>
                    <input
                      type="file"
                      class="form-control"
                      accept="image/*"
                      on:change={handleImageChange}
                      disabled={submitting}
                    />
                  </div>

                  {#if imagePreview}
                    <div class="preview">
                      <img
                        src={imagePreview}
                        alt="Preview"
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
                </div>
              </div>

              <div class="cardlike">
                <div class="cardlike__head">
                  <div class="cardlike__title">
                    <i class="bi bi-megaphone"></i>
                    Status
                  </div>
                  <div class="cardlike__sub">Draft vs Public.</div>
                </div>

                <div class="cardlike__body">
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      bind:checked={formData.published}
                      disabled={submitting}
                      id="publishedEditSwitch"
                    />
                    <label
                      class="form-check-label fw-bold"
                      for="publishedEditSwitch"
                    >
                      {formData.published ? "Public" : "Draft"}
                    </label>
                  </div>

                  <div class="small text-muted mt-2">
                    Draft: nu apare public. Public: apare pe /evenimente.
                  </div>
                </div>
              </div>

              <div class="cardlike cardlike--flat">
                <div class="cardlike__body">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
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
                      <i class="bi bi-check-circle"></i>
                      Salvează
                    {/if}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </section>
  </div>
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
    margin: 6px 0 12px;
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
  .page__back {
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .layout {
    margin-top: 10px;
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

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 14px;
    align-items: start;
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
    max-height: 260px;
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

  .form-control:focus,
  .form-select:focus {
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

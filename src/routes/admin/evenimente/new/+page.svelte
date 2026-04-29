<!-- src/routes/admin/evenimente/new/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import AdminNav from "$lib/components/AdminNav.svelte";

  export let form: {
    success?: boolean;
    error?: string;
    createdId?: string;
  };

  let imagePreview = "";

  function previewImage(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }
</script>

<svelte:head>
  <title>Eveniment nou · Admin</title>
</svelte:head>

<AdminNav />

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true"
          ><i class="bi bi-calendar-plus"></i></span
        >
        Creează eveniment
      </h1>
      <p class="page__subtitle">Completează datele și salvează.</p>
    </div>

    <div class="page__actions">
      <a href="/admin/evenimente" class="btn btn-outline-secondary page__back">
        <i class="bi bi-arrow-left"></i>
        <span>Înapoi</span>
      </a>
    </div>
  </header>

  {#if form?.success}
    <div
      class="alert alert-success d-flex align-items-start gap-2 shadow-sm mb-4"
      role="alert"
    >
      <i class="bi bi-check-circle fs-5"></i>
      <div class="w-100">
        <div class="fw-bold mb-1">Eveniment creat cu succes</div>
        <div class="text-muted mb-3">
          Evenimentul a fost salvat în baza de date.
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a href="/admin/evenimente" class="btn btn-success">
            Vezi evenimentele
          </a>
          <a href="/admin/evenimente/new" class="btn btn-outline-secondary">
            Creează alt eveniment
          </a>
          {#if form.createdId}
            <a
              href={`/admin/evenimente/${form.createdId}`}
              class="btn btn-outline-primary"
            >
              Deschide evenimentul
            </a>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if form?.error}
    <div
      class="alert alert-danger d-flex align-items-center gap-2 shadow-sm mb-4"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle"></i>
      <div>{form.error}</div>
    </div>
  {/if}

  <form method="POST" use:enhance class="shell">
    <section class="panel">
      <div class="panel__head">
        <h2 class="panel__title">
          <i class="bi bi-pencil-square"></i>
          Detalii eveniment
        </h2>
        <span class="panel__hint">Câmpurile marcate cu * sunt obligatorii</span>
      </div>

      <div class="panel__body">
        <div class="grid">
          <div class="grid__main">
            <div class="field">
              <label class="field__label" for="event-title">Titlu *</label>
              <input
                id="event-title"
                name="title"
                class="form-control form-control-lg field__control"
                required
                autocomplete="off"
              />
            </div>

            <div class="field">
              <label class="field__label" for="event-description">Descriere *</label>
              <textarea
                id="event-description"
                name="description"
                rows="8"
                class="form-control field__control"
                required
              ></textarea>
              <div class="field__help">
                Text scurt, clar. Include program, reguli, ce găsește lumea
                acolo.
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <div class="field">
                  <label class="field__label" for="event-date">Data *</label>
                  <input
                    id="event-date"
                    type="datetime-local"
                    name="date"
                    class="form-control field__control"
                    required
                  />
                </div>
              </div>

              <div class="col-md-6">
                <div class="field">
                  <label class="field__label" for="event-type">Tip *</label>
                  <select
                    id="event-type"
                    name="event_type"
                    class="form-select field__control"
                    required
                  >
                    <option value="festival">Festival</option>
                    <option value="piata">Piață</option>
                    <option value="atelier">Atelier</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="event-location">Locație *</label>
              <input
                id="event-location"
                name="location"
                class="form-control field__control"
                required
              />
              <div class="field__help">
                Ex: Stradă + oraș, sau locație + punct de reper.
              </div>
            </div>
          </div>

          <aside class="grid__side">
            <div class="cardlike">
              <div class="cardlike__head">
                <div class="cardlike__title">
                  <i class="bi bi-image"></i>
                  Imagine
                </div>
                <div class="cardlike__sub">
                  Upload local (se salvează ca base64).
                </div>
              </div>

              <div class="cardlike__body">
                <input
                  type="file"
                  class="form-control"
                  accept="image/*"
                  on:change={previewImage}
                />

                <input type="hidden" name="image_url" value={imagePreview} />

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
                  Publicare
                </div>
                <div class="cardlike__sub">
                  Controlează vizibilitatea pe site.
                </div>
              </div>

              <div class="cardlike__body">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    name="published"
                    value="true"
                    id="publishedSwitch"
                  />
                  <label class="form-check-label fw-bold" for="publishedSwitch">
                    Publică imediat
                  </label>
                </div>
                <div class="small text-muted mt-2">
                  Debifat = draft (nu apare public).
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div class="panel__foot">
        <a href="/admin/evenimente" class="btn btn-outline-secondary">
          Anulează
        </a>
        <button class="btn btn-primary btn-lg">
          <i class="bi bi-check-circle"></i>
          Salvează
        </button>
      </div>
    </section>
  </form>
</div>

<style>

  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin: 6px 0 16px;
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

  .page__back {
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .shell {
    width: 100%;
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
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    background: #fff;
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
  .field__help {
    margin-top: 6px;
    color: rgba(0, 0, 0, 0.55);
    font-size: 0.9rem;
  }

  .cardlike {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 14px;
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

  @media (max-width: 991.98px) {
    .page {
      margin-left: 0;
      padding-top: 84px;
    }
  }
</style>
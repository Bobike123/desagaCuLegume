<!-- src/routes/admin/noutati/[id]/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";

  type NoutateItem = {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    image_url: string | null;
    published: boolean;
    created_at: string;
    updated_at: string | null;
  };

  export let data: { item: NoutateItem };

  let form = {
    title: data.item.title ?? "",
    content: data.item.content ?? "",
    excerpt: data.item.excerpt ?? "",
    image_url: data.item.image_url ?? "",
    published: Boolean(data.item.published),
  };

  let saving = false;
  let deleting = false;
  let success = "";
  let error = "";

  let toast = "";
  let toastType: "success" | "danger" | "info" = "info";
  function showToast(msg: string, type: typeof toastType = "info") {
    toast = msg;
    toastType = type;
    setTimeout(() => (toast = ""), 2500);
  }

  function roDateTime(value: string | null) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("ro-RO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  }

  async function save() {
    saving = true;
    success = "";
    error = "";

    const payload = {
      title: form.title.trim(),
      content: form.content,
      excerpt: form.excerpt.trim() || null,
      image_url: form.image_url.trim() || null,
      published: Boolean(form.published),
    };

    try {
      const res = await fetch(`/api/noutati/${data.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = out?.error ?? "Eroare la salvare";
        showToast(error, "danger");
        return;
      }

      success = "Salvat cu succes.";
      showToast("Salvat", "success");
      setTimeout(() => (success = ""), 2500);
    } catch (e) {
      error = e instanceof Error ? e.message : "Eroare la salvare";
      showToast(error, "danger");
    } finally {
      saving = false;
    }
  }

  async function remove() {
    if (!confirm("Ștergi această noutate?")) return;

    deleting = true;
    error = "";
    success = "";

    try {
      const res = await fetch(`/api/noutati/${data.item.id}`, {
        method: "DELETE",
      });
      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
        error = out?.error ?? "Eroare la ștergere";
        showToast(error, "danger");
        return;
      }

      showToast("Noutate ștearsă", "success");
      await goto("/admin/noutati");
    } catch (e) {
      error = e instanceof Error ? e.message : "Eroare la ștergere";
      showToast(error, "danger");
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Editare Noutate - Admin</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true"
          ><i class="bi bi-newspaper"></i></span
        >
        Editare noutate
      </h1>
      <p class="page__subtitle">ID: <code>{data.item.id}</code></p>
    </div>

    <div class="page__actions">
      <a class="btn btn-outline-secondary page__btn" href="/admin/noutati">
        <i class="bi bi-arrow-left"></i>
        <span>Înapoi</span>
      </a>
      <button
        class="btn btn-outline-danger page__btn"
        on:click={remove}
        disabled={saving || deleting}
      >
        {#if deleting}
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Se șterge…
        {:else}
          <i class="bi bi-trash"></i>
          <span>Șterge</span>
        {/if}
      </button>
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

  {#if success}
    <div
      class="alert alert-success d-flex align-items-center gap-2 shadow-sm mb-3"
      role="alert"
    >
      <i class="bi bi-check-circle"></i>
      <div>{success}</div>
    </div>
  {/if}

  <div class="grid">
    <section class="panel">
      <div class="panel__head">
        <h2 class="panel__title">
          <i class="bi bi-pencil-square"></i>
          Conținut
        </h2>
        <span class="panel__hint">Titlu + excerpt + text complet</span>
      </div>

      <div class="panel__body">
        <div class="field">
          <label class="field__label" for="title">Titlu *</label>
          <input
            id="title"
            class="form-control field__control"
            bind:value={form.title}
            disabled={saving || deleting}
          />
        </div>

        <div class="field">
          <label class="field__label" for="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            class="form-control field__control"
            rows="3"
            bind:value={form.excerpt}
            disabled={saving || deleting}
          ></textarea>
          <div class="field__help">Opțional. Apare în lista de noutăți.</div>
        </div>

        <div class="field">
          <label class="field__label" for="content">Conținut *</label>
          <textarea
            id="content"
            class="form-control field__control"
            rows="12"
            bind:value={form.content}
            disabled={saving || deleting}
          ></textarea>
        </div>

        <div class="actions">
          <button
            class="btn btn-primary btn-lg actions__save"
            on:click={save}
            disabled={saving || deleting}
          >
            {#if saving}
              <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Se salvează…
            {:else}
              <i class="bi bi-check2-circle"></i>
              Salvează
            {/if}
          </button>
        </div>
      </div>
    </section>

    <aside class="side">
      <div class="cardlike">
        <div class="cardlike__head">
          <div class="cardlike__title">
            <i class="bi bi-image"></i>
            Imagine
          </div>
          <div class="cardlike__sub">URL + preview</div>
        </div>
        <div class="cardlike__body">
          <input
            class="form-control"
            placeholder="https://..."
            bind:value={form.image_url}
            disabled={saving || deleting}
          />

          {#if form.image_url}
            <div class="preview">
              <img src={form.image_url} alt="Preview" class="preview__img" />
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
          <div class="cardlike__sub">Public / Draft</div>
        </div>
        <div class="cardlike__body">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              id="published"
              type="checkbox"
              bind:checked={form.published}
              disabled={saving || deleting}
            />
            <label class="form-check-label fw-bold" for="published">
              {form.published ? "Public" : "Draft"}
            </label>
          </div>
          <div class="small text-muted mt-2">Draft = nu apare public.</div>
        </div>
      </div>

      <div class="cardlike">
        <div class="cardlike__head">
          <div class="cardlike__title">
            <i class="bi bi-info-circle"></i>
            Meta
          </div>
          <div class="cardlike__sub">Timestamps</div>
        </div>
        <div class="cardlike__body">
          <ul class="list-unstyled mb-0 small">
            <li>
              <b>Creat:</b>
              <span class="muted">{roDateTime(data.item.created_at)}</span>
            </li>
            <li class="mt-1">
              <b>Actualizat:</b>
              <span class="muted">{roDateTime(data.item.updated_at)}</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
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

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  .actions__save {
    border-radius: 14px;
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

  .muted {
    color: rgba(0, 0, 0, 0.55);
    font-weight: 600;
  }

  .form-control:focus,
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

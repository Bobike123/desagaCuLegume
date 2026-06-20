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
        fd.append("folder", "events");
        const uploadRes = await fetch("/api/products/upload", { method: "POST", body: fd });
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
      const res = await fetch(`/api/evenimente/${item.id}`, { method: "DELETE" });
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

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Calendar public</p>
      <h1>Editare eveniment</h1>
      <p>ID: <code>{item.id}</code></p>
    </div>
    <div class="actions">
      <a href="/admin/evenimente" class="pill"><i class="bi bi-arrow-left"></i> Înapoi</a>
      <button class="pill danger" disabled={submitting} on:click={handleDelete}>
        <i class="bi bi-trash"></i> Șterge
      </button>
    </div>
  </header>

  {#if success}
    <div class="notice success"><i class="bi bi-check-circle"></i>{success}</div>
  {/if}
  {#if error}
    <div class="notice danger"><i class="bi bi-exclamation-triangle"></i>{error}</div>
  {/if}

  <form class="editor" on:submit={handleSave}>
    <section class="panel main">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Conținut</p>
          <h2>Modifică datele</h2>
        </div>
        <span>{formData.published ? 'Public' : 'Draft'}</span>
      </div>
      <div class="formGrid">
        <label class="full">
          <span>Titlu *</span>
          <input bind:value={formData.title} required disabled={submitting} />
        </label>
        <label>
          <span>Data și ora *</span>
          <input type="datetime-local" bind:value={formData.date} required disabled={submitting} />
        </label>
        <label>
          <span>Tip eveniment *</span>
          <select bind:value={formData.event_type} required disabled={submitting}>
            <option value="piata">Piață</option>
            <option value="festival">Festival</option>
            <option value="atelier">Atelier</option>
          </select>
        </label>
        <label class="full">
          <span>Locație *</span>
          <input bind:value={formData.location} required disabled={submitting} />
        </label>
        <label class="full">
          <span>Descriere *</span>
          <textarea rows="8" bind:value={formData.description} required disabled={submitting}></textarea>
        </label>
      </div>
    </section>

    <aside class="side">
      <section class="panel">
        <div class="panelHead compact">
          <div>
            <p class="eyebrow">Media</p>
            <h2>Imagine</h2>
          </div>
        </div>
        <label>
          <span>Image URL</span>
          <input
            placeholder="https://..."
            bind:value={formData.image_url}
            disabled={submitting}
            on:input={() => (imagePreview = formData.image_url)}
          />
        </label>
        <label>
          <span>Upload</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" on:change={handleImageChange} disabled={submitting} />
        </label>
        {#if imagePreview}
          <div class="preview"><img src={imagePreview} alt="Preview" /></div>
        {:else}
          <div class="preview empty">
            <i class="bi bi-card-image"></i>
            <span>Fără imagine</span>
          </div>
        {/if}
      </section>

      <section class="panel">
        <div class="panelHead compact">
          <div>
            <p class="eyebrow">Stare</p>
            <h2>Publicare</h2>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" bind:checked={formData.published} disabled={submitting} />
          <span>{formData.published ? "Public" : "Draft"}</span>
        </label>
        <small>Draft: nu apare public. Public: apare pe /evenimente.</small>
      </section>

      <section class="panel submitPanel">
        <button type="submit" class="submitBtn" disabled={submitting}>
          {submitting ? 'Se salvează...' : 'Salvează'}
        </button>
      </section>
    </aside>
  </form>
</div>

<style>
  code {
    background: rgba(255, 253, 247, 0.9);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 2px 6px;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .pill,
  .submitBtn {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--surface);
    color: var(--ink);
    text-decoration: none;
    font-weight: 950;
    cursor: pointer;
  }

  .pill.danger {
    background: #fff4f4;
    border-color: #facaca;
    color: #842029;
  }

  h2 {
    margin: 0;
    font-weight: 950;
    font-size: clamp(1.35rem, 3vw, 2rem);
    letter-spacing: -0.04em;
    color: var(--ink);
  }

  .switch {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .switch input {
    width: 22px;
    min-height: 22px;
    flex-shrink: 0;
  }

  .switch span {
    font-weight: 950;
  }

  .submitBtn {
    width: 100%;
    border: 0;
    background: var(--accent);
    color: #fffdf7;
  }

  @media (max-width: 991.98px) {
    .actions,
    .pill {
      width: 100%;
    }
  }
</style>

<!-- src/routes/admin/evenimente/new/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";

  let imageFile: File | null = null;
  let imagePreview = "";
  let imageUrl = "";
  let error = "";
  let saving = false;

  function previewImage(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    imageFile = file;
    if (!file) {
      imagePreview = imageUrl;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return imageUrl;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("folder", "events");

    const response = await fetch("/api/products/upload", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error ?? "Încărcarea imaginii a eșuat.");
    return data.url as string;
  }

  async function submit(event: Event) {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const formData = new FormData(formElement);

    saving = true;
    error = "";

    try {
      const uploadedImageUrl = await uploadImageIfNeeded();
      const payload = {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        date: String(formData.get("date") ?? ""),
        event_type: String(formData.get("event_type") ?? "festival"),
        location: String(formData.get("location") ?? ""),
        image_url: uploadedImageUrl || null,
        published: formData.get("published") === "true",
      };

      const response = await fetch("/api/evenimente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Nu am putut crea evenimentul.");

      const createdId = data?.item?.id;
      await goto(createdId ? `/admin/evenimente/${createdId}` : "/admin/evenimente");
    } catch (err) {
      error = err instanceof Error ? err.message : "Nu am putut crea evenimentul.";
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Eveniment nou · Admin</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Calendar public</p>
      <h1>Creează eveniment</h1>
      <p>Completează detaliile, alege imaginea și setează vizibilitatea.</p>
    </div>
    <a href="/admin/evenimente" class="pill">
      <i class="bi bi-arrow-left"></i> Înapoi
    </a>
  </header>

  {#if error}
    <div class="notice danger">
      <i class="bi bi-exclamation-triangle"></i>{error}
    </div>
  {/if}

  <form method="POST" on:submit={submit} class="editor">
    <section class="panel main">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Conținut</p>
          <h2>Detalii eveniment</h2>
        </div>
        <span>Obligatorii *</span>
      </div>
      <div class="formGrid">
        <label class="full">
          <span>Titlu *</span>
          <input name="title" required autocomplete="off" disabled={saving} />
        </label>
        <label class="full">
          <span>Descriere *</span>
          <textarea name="description" rows="8" required disabled={saving}></textarea>
          <small>Text scurt, clar. Include program, reguli și ce găsește lumea acolo.</small>
        </label>
        <label>
          <span>Data *</span>
          <input type="datetime-local" name="date" required disabled={saving} />
        </label>
        <label>
          <span>Tip *</span>
          <select name="event_type" required disabled={saving}>
            <option value="festival">Festival</option>
            <option value="piata">Piață</option>
            <option value="atelier">Atelier</option>
          </select>
        </label>
        <label class="full">
          <span>Locație *</span>
          <input name="location" required disabled={saving} />
          <small>Ex: Stradă + oraș, sau locație + punct de reper.</small>
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
            name="image_url"
            placeholder="https://..."
            bind:value={imageUrl}
            disabled={saving}
            on:input={() => {
              if (!imageFile) imagePreview = imageUrl;
            }}
          />
        </label>
        <label>
          <span>Upload</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" on:change={previewImage} disabled={saving} />
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
          <input type="checkbox" name="published" value="true" disabled={saving} />
          <span>Publică imediat</span>
        </label>
        <small>Debifat = draft, nu apare public.</small>
      </section>

      <section class="panel submitPanel">
        <a href="/admin/evenimente" class="pill">Anulează</a>
        <button class="submitBtn" disabled={saving}>
          <i class="bi bi-check-circle"></i>{saving ? "Se salvează..." : "Salvează"}
        </button>
      </section>
    </aside>
  </form>
</div>

<style>
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
    .pill {
      width: 100%;
    }
  }
</style>

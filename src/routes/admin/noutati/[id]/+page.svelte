<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import type { Noutate } from "$lib/stores/noutati";

  const dispatch = createEventDispatcher();

  let noutate: Noutate | null = null;

  let formData: Noutate = {
    id: "",
    title: "",
    excerpt: "",
    content: "",
    image_url: "",
    created_at: "",
    author_id: "",
    published: false,
  };

  let imageFile: File | null = null;
  let imagePreview = "";
  let loading = false;
  let error = "";
  let deleting = false;

  export let id: string | null = null;

  onMount(async () => {
    if (!id) return;
    loading = true;
    try {
      const res = await fetch(`/api/noutati/${id}`);
      if (!res.ok) throw new Error("Failed to load news item");
      noutate = await res.json();
      if (noutate) {
        formData = { ...noutate };
        imagePreview = noutate.image_url || "";
      }
    } catch (err) {
      if (err instanceof Error) error = err.message;
      else error = "Unknown error";
    } finally {
      loading = false;
    }
  });

  function handleImageChange(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target || !target.files) return;
    const file = target.files[0];
    if (!file) return;

    imageFile = file;

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      imagePreview =
        typeof ev.target?.result === "string" ? ev.target.result : "";
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = "";

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        body.append(key, String(value));
      });
      if (imageFile) body.append("image", imageFile);

      const res = await fetch(id ? `/api/noutati/${id}` : "/api/noutati", {
        method: id ? "PUT" : "POST",
        body,
      });

      if (!res.ok) throw new Error("Failed to save news");

      dispatch("saved");
    } catch (err) {
      if (err instanceof Error) error = err.message;
      else error = "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function handleDelete() {
    if (!id) return;
    deleting = true;
    try {
      const res = await fetch(`/api/noutati/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete news");
      dispatch("deleted");
    } catch (err) {
      if (err instanceof Error) error = err.message;
      else error = "Unknown error";
    } finally {
      deleting = false;
    }
  }
</script>

{#if error}
  <div class="alert alert-danger">{error}</div>
{/if}

<form on:submit|preventDefault={handleSubmit}>
  <div class="mb-3">
    <label for="title" class="form-label">Title</label>
    <input
      id="title"
      class="form-control"
      bind:value={formData.title}
      required
    />
  </div>

  <div class="mb-3">
    <label for="excerpt" class="form-label">Excerpt</label>
    <textarea
      id="excerpt"
      class="form-control"
      bind:value={formData.excerpt}
      required
    ></textarea>
  </div>

  <div class="mb-3">
    <label for="content" class="form-label">Content</label>
    <textarea
      id="content"
      class="form-control"
      bind:value={formData.content}
      required
    ></textarea>
  </div>

  <div class="mb-3">
    <label for="image" class="form-label">Image</label>
    <input
      id="image"
      type="file"
      accept="image/*"
      class="form-control"
      on:change={handleImageChange}
    />

    {#if imagePreview}
      <img src={imagePreview} alt="Preview" class="img-fluid mt-2" />
    {/if}
  </div>

  <div class="form-check mb-3">
    <input
      id="published"
      class="form-check-input"
      type="checkbox"
      bind:checked={formData.published}
    />
    <label for="published" class="form-check-label">Published</label>
  </div>

  <button class="btn btn-primary" disabled={loading}>
    {#if loading}
      Saving...
    {:else}
      Save
    {/if}
  </button>

  {#if id}
    <button
      type="button"
      class="btn btn-danger ms-2"
      on:click={handleDelete}
      disabled={loading || deleting}
      aria-label="Șterge noutatea"
    >
      {#if deleting}
        Deleting...
      {:else}
        Delete
      {/if}
    </button>
  {/if}
</form>

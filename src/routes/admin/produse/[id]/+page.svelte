<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fallbackImage, PLACEHOLDER_IMAGE } from '$lib/images';

  type Option = { value: string; label: string; hint?: string };
  const categories: Option[] = [
    { value: 'de-sezon', label: 'De sezon', hint: 'Legume și fructe proaspete' },
    { value: 'la-borcan', label: 'La borcan', hint: 'Conserve, murături, sosuri' },
  ];
  const statuses: Option[] = [
    { value: 'ACTIVE', label: 'Activ', hint: 'Apare pe site dacă stocul este peste 0' },
    { value: 'OUT_OF_STOCK', label: 'Stoc epuizat', hint: 'Vizibil public, dar nu poate fi comandat' },
    { value: 'DISCONTINUED', label: 'Scos din ofertă', hint: 'Ascuns pentru clienți' },
    { value: 'DRAFT', label: 'Draft', hint: 'Ascuns până este pregătit' },
  ];

  let form = {
    sku: '',
    name: '',
    category: 'de-sezon',
    description: '',
    price: 0,
    stock_quantity: 0,
    status: 'ACTIVE',
    image_url: '',
  };
  let imageFile: File | null = null;
  let imagePreview = '';
  let error = '';
  let success = '';
  let loading = true;
  let saving = false;
  let deleting = false;

  $: selectedCategory = categories.find((item) => item.value === form.category) ?? categories[0];
  $: selectedStatus = statuses.find((item) => item.value === form.status) ?? statuses[0];
  $: previewUrl = imagePreview || form.image_url || PLACEHOLDER_IMAGE;
  $: stockWarning = form.status === 'ACTIVE' && Number(form.stock_quantity) <= 0;

  async function loadProduct() {
    loading = true;
    error = '';
    success = '';
    try {
      const res = await fetch(`/api/products/${$page.params.id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca produsul.');
      form = {
        sku: data.item?.sku ?? '',
        name: data.item?.name ?? '',
        category: data.item?.category ?? 'de-sezon',
        description: data.item?.description ?? '',
        price: Number(data.item?.price ?? 0),
        stock_quantity: Number(data.item?.stock_quantity ?? 0),
        status: data.item?.status ?? 'ACTIVE',
        image_url: data.item?.image_url ?? '',
      };
      imagePreview = '';
      imageFile = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca produsul.';
    } finally {
      loading = false;
    }
  }

  onMount(loadProduct);

  function handleImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    imageFile = file;
    if (!file) {
      imagePreview = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    imageFile = null;
    imagePreview = '';
    form.image_url = '';
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.image_url;
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await fetch('/api/products/upload', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Încărcarea imaginii a eșuat.');
    return data.url as string;
  }

  async function submit(event: Event) {
    event.preventDefault();
    saving = true;
    error = '';
    success = '';
    try {
      const image_url = await uploadImageIfNeeded();
      const res = await fetch(`/api/products/${$page.params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image_url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu s-a putut salva produsul.');
      success = 'Produsul a fost salvat.';
      await goto('/admin/produse');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu s-a putut salva produsul.';
    } finally {
      saving = false;
    }
  }

  async function deleteProduct() {
    if (!confirm('Ștergi produsul definitiv din baza de date?')) return;
    deleting = true;
    error = '';
    success = '';
    try {
      const res = await fetch(`/api/products/${$page.params.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu s-a putut șterge produsul.');
      await goto('/admin/produse');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu s-a putut șterge produsul.';
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Editare produs - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Catalog</p>
      <h1>Editare produs</h1>
      <p>ID produs: <code>{$page.params.id}</code></p>
    </div>
    <div class="actions">
      <a href="/admin/produse" class="pill"><i class="bi bi-arrow-left"></i> Înapoi</a>
      <a href={`/produse/${$page.params.id}`} class="pill" target="_blank" rel="noopener noreferrer">
        Vezi public
      </a>
      <button class="pill danger" type="button" on:click={deleteProduct} disabled={loading || saving || deleting}>
        {deleting ? 'Se șterge…' : 'Șterge'}
      </button>
    </div>
  </header>

  {#if error}
    <div class="notice danger"><i class="bi bi-exclamation-triangle"></i>{error}</div>
  {/if}
  {#if success}
    <div class="notice success"><i class="bi bi-check-circle"></i>{success}</div>
  {/if}
  {#if stockWarning}
    <div class="notice warn">
      <i class="bi bi-info-circle"></i>Un produs activ cu stoc 0 va fi tratat ca indisponibil în UI.
    </div>
  {/if}

  {#if loading}
    <section class="stateCard">
      <span class="spinner" aria-hidden="true"></span>
      <strong>Se încarcă produsul…</strong>
    </section>
  {:else}
    <form class="editor" on:submit={submit}>
      <section class="panel main">
        <div class="panelHead">
          <div>
            <p class="eyebrow">Date produs</p>
            <h2>Informații de vânzare</h2>
          </div>
          <span>{selectedStatus.label}</span>
        </div>
        <div class="formGrid">
          <label>
            <span>SKU</span>
            <input bind:value={form.sku} autocomplete="off" disabled={saving || deleting} />
          </label>
          <label>
            <span>Nume *</span>
            <input bind:value={form.name} required autocomplete="off" disabled={saving || deleting} />
          </label>
          <label>
            <span>Categorie</span>
            <select bind:value={form.category} disabled={saving || deleting}>
              {#each categories as category}
                <option value={category.value}>{category.label}</option>
              {/each}
            </select>
            <small>{selectedCategory.hint}</small>
          </label>
          <label>
            <span>Stare</span>
            <select bind:value={form.status} disabled={saving || deleting}>
              {#each statuses as status}
                <option value={status.value}>{status.label}</option>
              {/each}
            </select>
            <small>{selectedStatus.hint}</small>
          </label>
          <label>
            <span>Preț *</span>
            <div class="inputRow">
              <input type="number" step="0.01" bind:value={form.price} min="0" required disabled={saving || deleting} />
              <em>RON</em>
            </div>
          </label>
          <label>
            <span>Stoc *</span>
            <input type="number" bind:value={form.stock_quantity} min="0" required disabled={saving || deleting} />
          </label>
          <label class="full">
            <span>Descriere</span>
            <textarea rows="7" bind:value={form.description} disabled={saving || deleting}></textarea>
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
          <div class="preview">
            <img src={previewUrl} alt="Preview produs" on:error={fallbackImage} />
          </div>
          <label>
            <span>Imagine URL</span>
            <input bind:value={form.image_url} placeholder="https://..." disabled={saving || deleting} />
          </label>
          <label>
            <span>Upload imagine</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              on:change={handleImage}
              disabled={saving || deleting}
            />
          </label>
          <button
            class="clearBtn"
            type="button"
            on:click={clearImage}
            disabled={saving || deleting || (!form.image_url && !imageFile && !imagePreview)}
          >
            Șterge imaginea
          </button>
        </section>

        <section class="panel summary">
          <h2>Rezumat</h2>
          <div><span>Nume</span><strong>{form.name || '—'}</strong></div>
          <div><span>Categorie</span><strong>{selectedCategory.label}</strong></div>
          <div><span>Stare</span><strong>{selectedStatus.label}</strong></div>
          <div><span>Stoc</span><strong>{Number(form.stock_quantity || 0)}</strong></div>
          <div><span>Preț</span><strong>{Number(form.price || 0).toFixed(2)} RON</strong></div>
          <button class="submitBtn" type="submit" disabled={saving || deleting}>
            {saving ? 'Se salvează…' : 'Salvează modificările'}
          </button>
        </section>
      </aside>
    </form>
  {/if}
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
  .clearBtn,
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

  .inputRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px;
  }

  .inputRow input {
    border-radius: 16px 0 0 16px;
  }

  .inputRow em {
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    border-left: 0;
    border-radius: 0 16px 16px 0;
    background: #f5f0e5;
    font-style: normal;
    font-weight: 950;
  }

  .clearBtn {
    width: 100%;
    margin-top: 6px;
  }

  .summary {
    display: grid;
    gap: 10px;
  }

  .summary h2 {
    margin: 0;
  }

  .summary div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 9px;
  }

  .summary span {
    color: var(--muted);
  }

  .summary strong {
    text-align: right;
  }

  .submitBtn {
    width: 100%;
    border: 0;
    background: var(--accent);
    color: #fffdf7;
    margin-top: 6px;
  }

  @media (max-width: 991.98px) {
    .actions,
    .pill {
      width: 100%;
    }
  }
</style>

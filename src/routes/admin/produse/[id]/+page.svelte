<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type Option = {
    value: string;
    label: string;
    hint?: string;
  };

  const categories: Option[] = [
    { value: 'de-sezon', label: 'De sezon', hint: 'Legume și fructe proaspete' },
    { value: 'la-borcan', label: 'La borcan', hint: 'Conserve, murături, sosuri' },
    { value: 'colaboratori', label: 'Colaboratori', hint: 'Produse locale partenere' },
    { value: 'horeca', label: 'HORECA', hint: 'Ofertă pentru restaurante și magazine' },
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
  $: previewUrl = imagePreview || form.image_url || '/placeholder.png';
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

  function fallbackImage(event: Event) {
    const img = event.currentTarget as HTMLImageElement;
    if (!img.src.endsWith('/placeholder.png')) img.src = '/placeholder.png';
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.image_url;

    const formData = new FormData();
    formData.append('file', imageFile);

    const res = await fetch('/api/products/upload', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data?.error ?? 'Upload failed');
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

<AdminNav />

<div class="admin-page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Catalog</p>
      <h1>Editare produs</h1>
      <p>ID produs: <code>{$page.params.id}</code></p>
    </div>

    <div class="head-actions">
      <a href="/admin/produse" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Înapoi
      </a>
      <a href={`/produse/${$page.params.id}`} class="btn btn-outline-accent" target="_blank" rel="noopener noreferrer">
        <i class="bi bi-box-arrow-up-right"></i> Vezi public
      </a>
      <button class="btn btn-outline-danger" type="button" on:click={deleteProduct} disabled={loading || saving || deleting}>
        {deleting ? 'Se șterge…' : 'Șterge'}
      </button>
    </div>
  </header>

  {#if error}
    <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <div>{error}</div>
    </div>
  {/if}

  {#if success}
    <div class="alert alert-success d-flex align-items-center gap-2" role="alert">
      <i class="bi bi-check-circle"></i>
      <div>{success}</div>
    </div>
  {/if}

  {#if stockWarning}
    <div class="alert alert-warning d-flex align-items-center gap-2" role="alert">
      <i class="bi bi-info-circle"></i>
      <div>Un produs activ cu stoc 0 va fi tratat ca indisponibil în UI.</div>
    </div>
  {/if}

  {#if loading}
    <div class="panel loading-panel">
      <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
      <span>Se încarcă produsul…</span>
    </div>
  {:else}
    <form class="editor" on:submit={submit}>
      <section class="panel main-panel">
        <div class="panel-head">
          <div>
            <h2>Detalii produs</h2>
            <p>Salvarea face <code>PUT</code> pe <code>/api/products/{$page.params.id}</code>.</p>
          </div>
          <span class="badge-soft">{selectedStatus.label}</span>
        </div>

        <div class="form-grid">
          <label>
            <span>SKU</span>
            <input class="form-control" bind:value={form.sku} autocomplete="off" disabled={saving || deleting} />
          </label>

          <label>
            <span>Nume *</span>
            <input class="form-control" bind:value={form.name} required autocomplete="off" disabled={saving || deleting} />
          </label>

          <label>
            <span>Categorie</span>
            <select class="form-select" bind:value={form.category} disabled={saving || deleting}>
              {#each categories as category}
                <option value={category.value}>{category.label}</option>
              {/each}
            </select>
            <small>{selectedCategory.hint}</small>
          </label>

          <label>
            <span>Status</span>
            <select class="form-select" bind:value={form.status} disabled={saving || deleting}>
              {#each statuses as status}
                <option value={status.value}>{status.label}</option>
              {/each}
            </select>
            <small>{selectedStatus.hint}</small>
          </label>

          <label>
            <span>Preț *</span>
            <div class="input-group">
              <input class="form-control" type="number" step="0.01" bind:value={form.price} min="0" required disabled={saving || deleting} />
              <span class="input-group-text">RON</span>
            </div>
          </label>

          <label>
            <span>Stoc *</span>
            <input class="form-control" type="number" bind:value={form.stock_quantity} min="0" required disabled={saving || deleting} />
          </label>

          <label class="full">
            <span>Descriere</span>
            <textarea class="form-control" rows="6" bind:value={form.description} disabled={saving || deleting}></textarea>
          </label>
        </div>
      </section>

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-head compact">
            <div>
              <h2>Imagine</h2>
              <p>URL sau upload local.</p>
            </div>
          </div>

          <div class="preview">
            <img src={previewUrl} alt="Preview produs" on:error={fallbackImage} />
          </div>

          <label class="stacked">
            <span>Imagine URL</span>
            <input class="form-control" bind:value={form.image_url} placeholder="https://..." disabled={saving || deleting} />
          </label>

          <label class="stacked">
            <span>Upload imagine</span>
            <input class="form-control" type="file" accept="image/jpeg,image/png,image/webp" on:change={handleImage} disabled={saving || deleting} />
          </label>

          <button class="btn btn-outline-secondary w-100" type="button" on:click={clearImage} disabled={saving || deleting || (!form.image_url && !imageFile && !imagePreview)}>
            Șterge imaginea
          </button>
        </section>

        <section class="panel summary-panel">
          <h2>Rezumat</h2>
          <div class="summary-row"><span>Nume</span><strong>{form.name || '—'}</strong></div>
          <div class="summary-row"><span>Categorie</span><strong>{selectedCategory.label}</strong></div>
          <div class="summary-row"><span>Status</span><strong>{selectedStatus.label}</strong></div>
          <div class="summary-row"><span>Stoc</span><strong>{Number(form.stock_quantity || 0)}</strong></div>
          <div class="summary-row"><span>Preț</span><strong>{Number(form.price || 0).toFixed(2)} RON</strong></div>

          <button class="btn btn-primary btn-lg w-100 mt-3" type="submit" disabled={saving || deleting}>
            {#if saving}
              <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              Se salvează…
            {:else}
              <i class="bi bi-check-circle"></i> Salvează modificările
            {/if}
          </button>
        </section>
      </aside>
    </form>
  {/if}
</div>

<style>
  .admin-page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0 0 4px;
    color: var(--desaga-blue);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem;
  }

  .page-head h1 {
    margin: 0;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .page-head p:not(.eyebrow) {
    margin: 6px 0 0;
    color: var(--desaga-muted);
  }

  .head-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .editor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 18px;
    align-items: start;
  }

  .panel {
    background: #fff;
    border: 1px solid var(--desaga-border);
    border-radius: var(--desaga-radius-lg);
    box-shadow: var(--desaga-shadow-sm);
    padding: 18px;
  }

  .loading-panel {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--desaga-muted);
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .panel-head.compact {
    margin-bottom: 12px;
  }

  .panel h2,
  .panel-head h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 950;
    color: var(--desaga-heading);
  }

  .panel-head p {
    margin: 4px 0 0;
    color: var(--desaga-muted);
    font-size: 0.92rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  label span,
  .stacked span {
    display: block;
    font-weight: 850;
    margin-bottom: 6px;
    color: rgba(20, 33, 43, 0.82);
  }

  label small {
    display: block;
    margin-top: 6px;
    color: var(--desaga-muted);
  }

  .full {
    grid-column: 1 / -1;
  }

  .side-panel {
    display: grid;
    gap: 16px;
  }

  .preview {
    aspect-ratio: 4 / 3;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.04);
    border: 1px solid var(--desaga-border);
    margin-bottom: 14px;
  }

  .preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .stacked {
    display: block;
    margin-bottom: 12px;
  }

  .summary-panel h2 {
    margin-bottom: 12px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid var(--desaga-border);
  }

  .summary-row span {
    color: var(--desaga-muted);
  }

  .summary-row strong {
    text-align: right;
  }

  @media (max-width: 991.98px) {
    .admin-page {
      margin-left: 0;
      padding: 84px 16px 22px;
    }

    .page-head,
    .editor {
      grid-template-columns: 1fr;
      display: grid;
    }

    .head-actions {
      justify-content: flex-start;
    }
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
<script lang="ts">
  import { goto } from '$app/navigation';
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
  let loading = false;

  $: selectedCategory = categories.find((item) => item.value === form.category) ?? categories[0];
  $: selectedStatus = statuses.find((item) => item.value === form.status) ?? statuses[0];
  $: previewUrl = imagePreview || form.image_url || PLACEHOLDER_IMAGE;
  $: stockWarning = form.status === 'ACTIVE' && Number(form.stock_quantity) <= 0;

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
    loading = true;
    error = '';
    try {
      const image_url = await uploadImageIfNeeded();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image_url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu s-a putut salva produsul.');
      await goto('/admin/produse');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu s-a putut salva produsul.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Produs nou - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Catalog</p>
      <h1>Produs nou</h1>
      <p>Adaugă un produs nou și controlează categoria, prețul, stocul și imaginea.</p>
    </div>
    <div class="actions">
      <a href="/admin/produse" class="pill"><i class="bi bi-arrow-left"></i> Înapoi</a>
      <a href="/produse" class="pill" target="_blank" rel="noopener noreferrer">Vezi catalogul</a>
    </div>
  </header>

  {#if error}
    <div class="notice danger"><i class="bi bi-exclamation-triangle"></i>{error}</div>
  {/if}
  {#if stockWarning}
    <div class="notice warn">
      <i class="bi bi-info-circle"></i>Un produs activ cu stoc 0 va fi tratat ca indisponibil în UI.
    </div>
  {/if}

  <form class="editor" on:submit={submit}>
    <section class="panel main">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Date produs</p>
          <h2>Informații de vânzare</h2>
        </div>
        <span>Nou</span>
      </div>
      <div class="formGrid">
        <label>
          <span>SKU</span>
          <input bind:value={form.sku} placeholder="PROD-001" autocomplete="off" disabled={loading} />
          <small>Lăsat gol, backend-ul generează SKU automat.</small>
        </label>
        <label>
          <span>Nume *</span>
          <input bind:value={form.name} required autocomplete="off" disabled={loading} />
        </label>
        <label>
          <span>Categorie</span>
          <select bind:value={form.category} disabled={loading}>
            {#each categories as category}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>
          <small>{selectedCategory.hint}</small>
        </label>
        <label>
          <span>Stare</span>
          <select bind:value={form.status} disabled={loading}>
            {#each statuses as status}
              <option value={status.value}>{status.label}</option>
            {/each}
          </select>
          <small>{selectedStatus.hint}</small>
        </label>
        <label>
          <span>Preț *</span>
          <div class="inputRow">
            <input type="number" step="0.01" bind:value={form.price} min="0" required disabled={loading} />
            <em>RON</em>
          </div>
        </label>
        <label>
          <span>Stoc *</span>
          <input type="number" bind:value={form.stock_quantity} min="0" required disabled={loading} />
        </label>
        <label class="full">
          <span>Descriere</span>
          <textarea rows="7" bind:value={form.description} disabled={loading}></textarea>
          <small>Descriere scurtă pentru cardul public și pagina de detaliu.</small>
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
          <input bind:value={form.image_url} placeholder="https://..." disabled={loading} />
        </label>
        <label>
          <span>Upload imagine</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" on:change={handleImage} disabled={loading} />
        </label>
        <button
          class="clearBtn"
          type="button"
          on:click={clearImage}
          disabled={loading || (!form.image_url && !imageFile && !imagePreview)}
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
        <button class="submitBtn" type="submit" disabled={loading}>
          {loading ? 'Se salvează…' : 'Salvează produsul'}
        </button>
      </section>
    </aside>
  </form>
</div>

<style>
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

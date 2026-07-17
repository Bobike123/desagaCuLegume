<script lang="ts">
  import { goto } from '$app/navigation';
  import { flip } from 'svelte/animate';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fallbackImage, PLACEHOLDER_IMAGE } from '$lib/images';
  import { PRODUCT_CATEGORIES, DEFAULT_CATEGORY_SLUG } from '$lib/categories';

  type Option = { value: string; label: string; hint?: string };
  type ProductImage = { url?: string | null; image_url?: string | null } | string;
  type MediaItem = {
    key: string;
    url: string;
    file: File | null;
    preview: string;
    source: 'url' | 'upload' | 'existing';
  };

  const categories: Option[] = PRODUCT_CATEGORIES.map((c) => ({ value: c.slug, label: c.name, hint: c.hint }));
  const statuses: Option[] = [
    { value: 'ACTIVE', label: 'Activ', hint: 'Apare pe site dacă stocul este peste 0' },
    { value: 'OUT_OF_STOCK', label: 'Stoc epuizat', hint: 'Vizibil public, dar nu poate fi comandat' },
    { value: 'DISCONTINUED', label: 'Scos din ofertă', hint: 'Ascuns pentru clienți' },
    { value: 'DRAFT', label: 'Draft', hint: 'Ascuns până este pregătit' },
  ];
  const measureUnits: Option[] = [
    { value: 'PER_KG', label: 'per kg', hint: 'Prețul se afișează pentru un kilogram' },
    { value: 'PER_BUC', label: 'pe buc.', hint: 'Prețul se afișează pentru o bucată' },
  ];
  const promotionLabels: Option[] = [
    { value: 'NONE', label: 'Fără promoție', hint: 'Produsul se afișează normal' },
    { value: 'NOU', label: 'NOU', hint: 'Etichetă roșie pentru produse noi' },
    { value: 'PROMOTIE', label: 'PROMOȚIE', hint: 'Etichetă roșie pentru ofertă sau produs evidențiat' },
    { value: 'NOU_PROMOTIE', label: 'NOU + PROMOȚIE', hint: 'Afișează ambele etichete pe card și în coș' },
  ];

  let form = {
    sku: '',
    name: '',
    category: DEFAULT_CATEGORY_SLUG,
    description: '',
    price: 0,
    measure_unit: 'PER_KG',
    promotion_label: 'NONE',
    stock_quantity: 0,
    status: 'ACTIVE',
  };

  let mediaItems: MediaItem[] = [];
  let urlDraft = '';
  let error = '';
  let success = '';
  let loading = true;
  let saving = false;
  let deleting = false;

  $: selectedCategory = categories.find((item) => item.value === form.category) ?? categories[0];
  $: selectedStatus = statuses.find((item) => item.value === form.status) ?? statuses[0];
  $: selectedMeasureUnit = measureUnits.find((item) => item.value === form.measure_unit) ?? measureUnits[0];
  $: selectedPromotionLabel = promotionLabels.find((item) => item.value === form.promotion_label) ?? promotionLabels[0];
  $: previewUrl = mediaItems[0]?.preview || mediaItems[0]?.url || PLACEHOLDER_IMAGE;
  $: stockWarning = form.status === 'ACTIVE' && Number(form.stock_quantity) <= 0;

  function mediaKey() {
    return `media-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function imageUrlOf(image: ProductImage) {
    if (typeof image === 'string') return image.trim();
    return String(image?.url ?? image?.image_url ?? '').trim();
  }

  function setExistingImages(images: ProductImage[], fallbackUrl: string) {
    const seen = new Set<string>();
    const urls: string[] = [];

    for (const image of images ?? []) {
      const url = imageUrlOf(image);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }

    const fallback = fallbackUrl.trim();
    if (fallback && !seen.has(fallback)) urls.unshift(fallback);

    mediaItems = urls.map((url) => ({ key: mediaKey(), url, file: null, preview: url, source: 'existing' }));
  }

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
        category: data.item?.category ?? DEFAULT_CATEGORY_SLUG,
        description: data.item?.description ?? '',
        price: Number(data.item?.price ?? 0),
        measure_unit: data.item?.measure_unit ?? 'PER_KG',
        promotion_label: data.item?.promotion_label ?? 'NONE',
        stock_quantity: Number(data.item?.stock_quantity ?? 0),
        status: data.item?.status ?? 'ACTIVE',
      };
      setExistingImages(Array.isArray(data.item?.images) ? data.item.images : [], data.item?.image_url ?? '');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca produsul.';
    } finally {
      loading = false;
    }
  }

  onMount(loadProduct);

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (mediaItems.some((item) => item.url === url)) {
      urlDraft = '';
      return;
    }
    mediaItems = [...mediaItems, { key: mediaKey(), url, file: null, preview: url, source: 'url' }];
    urlDraft = '';
  }

  function handleUrlKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addUrl();
  }

  function handleImages(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      const key = mediaKey();
      mediaItems = [...mediaItems, { key, url: '', file, preview: '', source: 'upload' }];
      const reader = new FileReader();
      reader.onload = () => {
        const preview = typeof reader.result === 'string' ? reader.result : '';
        mediaItems = mediaItems.map((item) => (item.key === key ? { ...item, preview } : item));
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  function removeMedia(index: number) {
    mediaItems = mediaItems.filter((_, itemIndex) => itemIndex !== index);
  }

  function moveMedia(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= mediaItems.length) return;
    const next = [...mediaItems];
    [next[index], next[target]] = [next[target], next[index]];
    mediaItems = next;
  }

  function clearImages() {
    mediaItems = [];
    urlDraft = '';
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/products/upload', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Încărcarea imaginii a eșuat.');
    return data.url as string;
  }

  async function uploadImagesIfNeeded() {
    const urls: string[] = [];
    const seen = new Set<string>();

    for (const item of mediaItems) {
      const url = item.file ? await uploadImage(item.file) : item.url.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }

    return urls;
  }

  async function submit(event: Event) {
    event.preventDefault();
    saving = true;
    error = '';
    success = '';
    try {
      const images = await uploadImagesIfNeeded();
      const res = await fetch(`/api/products/${$page.params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image_url: images[0] ?? '', images }),
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
            <span>Unitate măsură</span>
            <select bind:value={form.measure_unit} disabled={saving || deleting}>
              {#each measureUnits as unit}
                <option value={unit.value}>{unit.label}</option>
              {/each}
            </select>
            <small>{selectedMeasureUnit.hint}</small>
          </label>
          <label>
            <span>Etichetă produs</span>
            <select bind:value={form.promotion_label} disabled={saving || deleting}>
              {#each promotionLabels as label}
                <option value={label.value}>{label.label}</option>
              {/each}
            </select>
            <small>{selectedPromotionLabel.hint}</small>
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
        <section class="panel media-panel">
          <div class="panelHead compact">
            <div>
              <p class="eyebrow">Media</p>
              <h2>Galerie produs</h2>
            </div>
            <span>{mediaItems.length} imagini</span>
          </div>

          <div class="preview">
            <img src={previewUrl} alt="Preview produs" on:error={fallbackImage} />
            {#if mediaItems.length > 1}
              <small>{mediaItems.length} imagini în slideshow</small>
            {/if}
          </div>

          <label>
            <span>Upload imagini</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              on:change={handleImages}
              disabled={saving || deleting}
            />
            <small>Prima imagine din listă devine imaginea principală.</small>
          </label>

          <div class="urlRow">
            <input bind:value={urlDraft} placeholder="https://..." disabled={saving || deleting} on:keydown={handleUrlKeydown} />
            <button type="button" class="miniBtn" on:click={addUrl} disabled={saving || deleting || !urlDraft.trim()}>Adaugă URL</button>
          </div>

          {#if mediaItems.length > 0}
            <div class="media-list">
              {#each mediaItems as item, index (item.key)}
                <div class="media-item" animate:flip={{ duration: 180 }}>
                  <img src={item.preview || item.url || PLACEHOLDER_IMAGE} alt={`Imagine ${index + 1}`} on:error={fallbackImage} />
                  <div>
                    <strong>{index === 0 ? 'Principală' : `Imagine ${index + 1}`}</strong>
                    <small>{item.file ? item.file.name : item.url}</small>
                    <div class="media-actions">
                      <button type="button" on:click={() => moveMedia(index, -1)} disabled={saving || deleting || index === 0}>Sus</button>
                      <button type="button" on:click={() => moveMedia(index, 1)} disabled={saving || deleting || index === mediaItems.length - 1}>Jos</button>
                      <button type="button" class="dangerText" on:click={() => removeMedia(index)} disabled={saving || deleting}>Elimină</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <button class="clearBtn" type="button" on:click={clearImages} disabled={saving || deleting}>Șterge toate imaginile</button>
          {/if}
        </section>

        <section class="panel summary">
          <h2>Rezumat</h2>
          <div><span>Nume</span><strong>{form.name || '-'}</strong></div>
          <div><span>Categorie</span><strong>{selectedCategory.label}</strong></div>
          <div><span>Stare</span><strong>{selectedStatus.label}</strong></div>
          <div><span>Stoc</span><strong>{Number(form.stock_quantity || 0)}</strong></div>
          <div><span>Unitate</span><strong>{selectedMeasureUnit.label}</strong></div>
          <div><span>Etichetă</span><strong>{selectedPromotionLabel.label}</strong></div>
          <div><span>Imagini</span><strong>{mediaItems.length}</strong></div>
          <div><span>Preț</span><strong>{Number(form.price || 0).toFixed(2)} RON / {selectedMeasureUnit.value === 'PER_BUC' ? 'buc.' : 'kg'}</strong></div>
          <button class="submitBtn" type="submit" disabled={saving || deleting}>
            {saving ? 'Se salvează…' : 'Salvează modificările'}
          </button>
        </section>
      </aside>
    </form>
  {/if}
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
  .submitBtn,
  .miniBtn {
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

  .danger {
    color: #842029;
    background: #fff4f4;
    border-color: #facaca;
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

  .media-panel {
    display: grid;
    gap: 12px;
  }

  .preview {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.04);
  }

  .preview img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
  }

  .preview small {
    position: absolute;
    left: 10px;
    bottom: 10px;
    border-radius: 999px;
    padding: 0.25rem 0.6rem;
    background: rgba(255, 255, 255, 0.9);
    font-weight: 900;
  }

  .urlRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .urlRow input {
    min-width: 0;
  }

  .miniBtn {
    min-height: 42px;
    background: rgba(var(--accent-rgb, 36, 146, 204), 0.1);
    color: var(--accent, #2492cc);
  }

  .media-list {
    display: grid;
    gap: 10px;
  }

  .media-item {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 9px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.02);
    will-change: transform;
  }

  .media-item img {
    width: 76px;
    height: 76px;
    border-radius: 12px;
    object-fit: cover;
    background: rgba(0, 0, 0, 0.04);
  }

  .media-item strong,
  .media-item small {
    display: block;
  }

  .media-item small {
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .media-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 7px;
  }

  .media-actions button {
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    padding: 0.25rem 0.55rem;
    font-weight: 900;
    font-size: 0.78rem;
  }

  .dangerText {
    color: #842029;
  }

  .clearBtn {
    width: 100%;
    margin-top: 2px;
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

  @media (prefers-reduced-motion: reduce) {
    .media-item {
      transition: none;
    }
  }

  @media (max-width: 991.98px) {
    .actions,
    .pill {
      width: 100%;
    }

    .urlRow {
      grid-template-columns: 1fr;
    }
  }
</style>

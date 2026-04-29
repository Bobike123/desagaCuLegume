<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminNav from '$lib/components/AdminNav.svelte';

  const categories = ['de-sezon', 'la-borcan', 'colaboratori', 'horeca'];
  const statuses = ['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DRAFT'];

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
  let error = '';
  let loading = false;

  function handleImage(event: Event) {
    const input = event.target as HTMLInputElement;
    imageFile = input.files?.[0] ?? null;
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

<AdminNav />

<div class="page">
  <div class="page__head">
    <div>
      <h1>Produs nou</h1>
      <p>Adaugă un produs în catalog.</p>
    </div>
    <a href="/admin/produse" class="btn btn-outline-secondary">Înapoi</a>
  </div>

  {#if error}<div class="alert alert-danger">{error}</div>{/if}

  <form class="panel formGrid" on:submit={submit}>
    <label>
      <span>SKU</span>
      <input class="form-control" bind:value={form.sku} placeholder="SKU-001" />
    </label>
    <label>
      <span>Nume</span>
      <input class="form-control" bind:value={form.name} required />
    </label>
    <label>
      <span>Categorie</span>
      <select class="form-select" bind:value={form.category}>
        {#each categories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Status</span>
      <select class="form-select" bind:value={form.status}>
        {#each statuses as status}
          <option value={status}>{status}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Preț</span>
      <input class="form-control" type="number" step="0.01" bind:value={form.price} min="0" required />
    </label>
    <label>
      <span>Stoc</span>
      <input class="form-control" type="number" bind:value={form.stock_quantity} min="0" required />
    </label>
    <label class="full">
      <span>Descriere</span>
      <textarea class="form-control" rows="5" bind:value={form.description}></textarea>
    </label>
    <label class="full">
      <span>Imagine URL</span>
      <input class="form-control" bind:value={form.image_url} placeholder="https://..." />
    </label>
    <label class="full">
      <span>Upload imagine</span>
      <input class="form-control" type="file" accept="image/jpeg,image/png,image/webp" on:change={handleImage} />
    </label>
    <div class="full actions">
      <button class="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Se salvează…' : 'Salvează produsul'}</button>
    </div>
  </form>
</div>

<style>
  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
  }

  .page__head h1 { margin: 0; font-weight: 900; }
  .page__head p { margin: 6px 0 0; color: rgba(0, 0, 0, 0.65); }

  .panel {
    background: white;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .formGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .formGrid label span {
    display: block;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .full { grid-column: 1 / -1; }
  .actions { display: flex; justify-content: flex-end; }
</style>

<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type Option = { value: string; label: string; hint?: string; };
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

  let form = { sku: '', name: '', category: 'de-sezon', description: '', price: 0, stock_quantity: 0, status: 'ACTIVE', image_url: '' };
  let imageFile: File | null = null;
  let imagePreview = '';
  let error = '';
  let loading = false;

  $: selectedCategory = categories.find((item) => item.value === form.category) ?? categories[0];
  $: selectedStatus = statuses.find((item) => item.value === form.status) ?? statuses[0];
  $: previewUrl = imagePreview || form.image_url || '/placeholder.png';
  $: stockWarning = form.status === 'ACTIVE' && Number(form.stock_quantity) <= 0;

  function handleImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    imageFile = file;
    if (!file) { imagePreview = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { imagePreview = typeof reader.result === 'string' ? reader.result : ''; };
    reader.readAsDataURL(file);
  }

  function clearImage() { imageFile = null; imagePreview = ''; form.image_url = ''; }
  function fallbackImage(event: Event) { const img = event.currentTarget as HTMLImageElement; if (!img.src.endsWith('/placeholder.png')) img.src = '/placeholder.png'; }

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
      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, image_url }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu s-a putut salva produsul.');
      await goto('/admin/produse');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu s-a putut salva produsul.';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Produs nou - Admin DeSaga</title></svelte:head>
<AdminNav />

<div class="page">
  <header class="topbar">
    <div><p class="eyebrow">Catalog</p><h1>Produs nou</h1><p>Adaugă un produs nou și controlează categoria, prețul, stocul și imaginea.</p></div>
    <div class="actions"><a href="/admin/produse" class="pill"><i class="bi bi-arrow-left"></i> Înapoi</a><a href="/produse" class="pill" target="_blank" rel="noopener noreferrer">Vezi catalogul</a></div>
  </header>

  {#if error}<div class="notice danger"><i class="bi bi-exclamation-triangle"></i>{error}</div>{/if}
  {#if stockWarning}<div class="notice warn"><i class="bi bi-info-circle"></i>Un produs activ cu stoc 0 va fi tratat ca indisponibil în UI.</div>{/if}

  <form class="editor" on:submit={submit}>
    <section class="panel main">
      <div class="panelHead"><div><p class="eyebrow">Date produs</p><h2>Informații de vânzare</h2></div><span>Nou</span></div>
      <div class="formGrid">
        <label><span>SKU</span><input bind:value={form.sku} placeholder="PROD-001" autocomplete="off" disabled={loading} /><small>Lăsat gol, backend-ul generează SKU automat.</small></label>
        <label><span>Nume *</span><input bind:value={form.name} required autocomplete="off" disabled={loading} /></label>
        <label><span>Categorie</span><select bind:value={form.category} disabled={loading}>{#each categories as category}<option value={category.value}>{category.label}</option>{/each}</select><small>{selectedCategory.hint}</small></label>
        <label><span>Status</span><select bind:value={form.status} disabled={loading}>{#each statuses as status}<option value={status.value}>{status.label}</option>{/each}</select><small>{selectedStatus.hint}</small></label>
        <label><span>Preț *</span><div class="inputRow"><input type="number" step="0.01" bind:value={form.price} min="0" required disabled={loading} /><em>RON</em></div></label>
        <label><span>Stoc *</span><input type="number" bind:value={form.stock_quantity} min="0" required disabled={loading} /></label>
        <label class="full"><span>Descriere</span><textarea rows="7" bind:value={form.description} disabled={loading}></textarea><small>Descriere scurtă pentru cardul public și pagina de detaliu.</small></label>
      </div>
    </section>

    <aside class="side">
      <section class="panel">
        <div class="panelHead compact"><div><p class="eyebrow">Media</p><h2>Imagine</h2></div></div>
        <div class="preview"><img src={previewUrl} alt="Preview produs" on:error={fallbackImage} /></div>
        <label><span>Imagine URL</span><input bind:value={form.image_url} placeholder="https://..." disabled={loading} /></label>
        <label><span>Upload imagine</span><input type="file" accept="image/jpeg,image/png,image/webp" on:change={handleImage} disabled={loading} /></label>
        <button class="clearBtn" type="button" on:click={clearImage} disabled={loading || (!form.image_url && !imageFile && !imagePreview)}>Șterge imaginea</button>
      </section>

      <section class="panel summary">
        <h2>Rezumat</h2>
        <div><span>Nume</span><strong>{form.name || '—'}</strong></div><div><span>Categorie</span><strong>{selectedCategory.label}</strong></div><div><span>Status</span><strong>{selectedStatus.label}</strong></div><div><span>Stoc</span><strong>{Number(form.stock_quantity || 0)}</strong></div><div><span>Preț</span><strong>{Number(form.price || 0).toFixed(2)} RON</strong></div>
        <button class="submitBtn" type="submit" disabled={loading}>{loading ? 'Se salvează…' : 'Salvează produsul'}</button>
      </section>
    </aside>
  </form>
</div>

<style>
  .page{--bg:#f6f1e7;--surface:#fffdf7;--ink:#1d241b;--muted:#6b7165;--line:rgba(31,42,28,.12);--accent:#274f2a;margin-left:240px;min-height:100vh;padding:clamp(18px,3vw,34px);background:radial-gradient(900px 420px at 8% -5%,rgba(139,212,80,.2),transparent 60%),var(--bg);color:var(--ink)}
  .topbar{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:16px}.eyebrow{margin:0 0 6px;color:var(--accent);text-transform:uppercase;letter-spacing:.13em;font-size:.75rem;font-weight:950}h1{margin:0;font-size:clamp(2.2rem,7vw,4.6rem);line-height:.94;letter-spacing:-.07em;font-weight:950}.topbar p:not(.eyebrow){margin:12px 0 0;max-width:720px;color:var(--muted)}.actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.pill,.clearBtn,.submitBtn{min-height:46px;border:1px solid var(--line);border-radius:999px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);color:var(--ink);text-decoration:none;font-weight:950;cursor:pointer}.editor{display:grid;grid-template-columns:minmax(0,1fr)370px;gap:16px}.panel{border:1px solid var(--line);border-radius:28px;background:rgba(255,253,247,.92);box-shadow:0 20px 56px rgba(35,51,30,.09);padding:18px}.panelHead{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:16px}.panelHead h2,.summary h2{margin:0;font-weight:950;letter-spacing:-.04em}.panelHead>span{border-radius:999px;background:rgba(139,212,80,.22);color:var(--accent);padding:7px 11px;font-weight:950}.formGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.full{grid-column:1/-1}label span{display:block;margin-bottom:7px;font-weight:950}small{display:block;margin-top:6px;color:var(--muted)}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:16px;min-height:48px;padding:0 12px;background:#fff;color:var(--ink);font-weight:800}textarea{padding:12px;resize:vertical}.inputRow{display:grid;grid-template-columns:minmax(0,1fr)72px}.inputRow input{border-radius:16px 0 0 16px}.inputRow em{display:grid;place-items:center;border:1px solid var(--line);border-left:0;border-radius:0 16px 16px 0;background:#f5f0e5;font-style:normal;font-weight:950}.side{display:grid;gap:16px;align-content:start}.preview{aspect-ratio:4/3;border-radius:22px;border:1px solid var(--line);overflow:hidden;background:#f3eee2;margin-bottom:14px}.preview img{width:100%;height:100%;object-fit:cover;display:block}.clearBtn{width:100%;margin-top:6px}.summary{display:grid;gap:10px}.summary div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:9px}.summary span{color:var(--muted)}.summary strong{text-align:right}.submitBtn{width:100%;border:0;background:var(--accent);color:#fffdf7;margin-top:6px}.notice{border-radius:18px;padding:14px 16px;margin-bottom:14px;display:flex;gap:10px;align-items:center;font-weight:850}.notice.danger{background:#fff1f1;border:1px solid #facaca;color:#842029}.notice.warn{background:#fff7db;border:1px solid #ecd27b;color:#725100}@media(max-width:991.98px){.page{margin-left:0;padding:88px 16px 24px}.editor{grid-template-columns:1fr}.topbar{display:grid;align-items:stretch}.actions,.pill{width:100%}}@media(max-width:640px){.formGrid{grid-template-columns:1fr}.panel{border-radius:22px}}
</style>

<!-- src/routes/admin/evenimente/new/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import AdminNav from "$lib/components/AdminNav.svelte";

  export let form: { success?: boolean; error?: string; createdId?: string; };
  let imagePreview = "";
  function previewImage(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") imagePreview = reader.result; };
    reader.readAsDataURL(file);
  }
</script>

<svelte:head><title>Eveniment nou · Admin</title></svelte:head>
<AdminNav />

<div class="page">
  <header class="topbar"><div><p class="eyebrow">Calendar public</p><h1>Creează eveniment</h1><p>Completează detaliile, alege imaginea și setează vizibilitatea.</p></div><a href="/admin/evenimente" class="pill"><i class="bi bi-arrow-left"></i> Înapoi</a></header>
  {#if form?.success}<div class="notice success"><i class="bi bi-check-circle"></i><div><strong>Eveniment creat cu succes</strong><div class="links"><a href="/admin/evenimente">Vezi evenimentele</a><a href="/admin/evenimente/new">Creează altul</a>{#if form.createdId}<a href={`/admin/evenimente/${form.createdId}`}>Deschide</a>{/if}</div></div></div>{/if}
  {#if form?.error}<div class="notice danger"><i class="bi bi-exclamation-triangle"></i>{form.error}</div>{/if}

  <form method="POST" use:enhance class="editor">
    <section class="panel main"><div class="panelHead"><div><p class="eyebrow">Conținut</p><h2>Detalii eveniment</h2></div><span>Obligatorii *</span></div><div class="formGrid"><label class="full"><span>Titlu *</span><input name="title" required autocomplete="off" /></label><label class="full"><span>Descriere *</span><textarea name="description" rows="8" required></textarea><small>Text scurt, clar. Include program, reguli și ce găsește lumea acolo.</small></label><label><span>Data *</span><input type="datetime-local" name="date" required /></label><label><span>Tip *</span><select name="event_type" required><option value="festival">Festival</option><option value="piata">Piață</option><option value="atelier">Atelier</option></select></label><label class="full"><span>Locație *</span><input name="location" required /><small>Ex: Stradă + oraș, sau locație + punct de reper.</small></label></div></section>
    <aside class="side"><section class="panel"><div class="panelHead compact"><div><p class="eyebrow">Media</p><h2>Imagine</h2></div></div><input type="file" accept="image/*" on:change={previewImage} /><input type="hidden" name="image_url" value={imagePreview} />{#if imagePreview}<div class="preview"><img src={imagePreview} alt="Preview" /></div>{:else}<div class="preview empty"><i class="bi bi-card-image"></i><span>Fără imagine</span></div>{/if}</section><section class="panel"><div class="panelHead compact"><div><p class="eyebrow">Status</p><h2>Publicare</h2></div></div><label class="switch"><input type="checkbox" name="published" value="true" /><span>Publică imediat</span></label><small>Debifat = draft, nu apare public.</small></section><section class="panel submitPanel"><a href="/admin/evenimente" class="pill">Anulează</a><button class="submitBtn"><i class="bi bi-check-circle"></i> Salvează</button></section></aside>
  </form>
</div>

<style>
  .page{--bg:#f6f1e7;--surface:#fffdf7;--ink:#1d241b;--muted:#6b7165;--line:rgba(31,42,28,.12);--accent:#274f2a;margin-left:240px;min-height:100vh;padding:clamp(18px,3vw,34px);background:radial-gradient(900px 420px at 8% -5%,rgba(139,212,80,.2),transparent 60%),var(--bg);color:var(--ink)}.topbar{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:16px}.eyebrow{margin:0 0 6px;color:var(--accent);text-transform:uppercase;letter-spacing:.13em;font-size:.75rem;font-weight:950}h1{margin:0;font-size:clamp(2.2rem,7vw,4.6rem);line-height:.94;letter-spacing:-.07em;font-weight:950}.topbar p:not(.eyebrow){margin:12px 0 0;max-width:720px;color:var(--muted)}.pill,.submitBtn{min-height:46px;border:1px solid var(--line);border-radius:999px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);color:var(--ink);text-decoration:none;font-weight:950}.editor{display:grid;grid-template-columns:minmax(0,1fr)370px;gap:16px}.panel{border:1px solid var(--line);border-radius:28px;background:rgba(255,253,247,.92);box-shadow:0 20px 56px rgba(35,51,30,.09);padding:18px}.panelHead{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:16px}.panelHead h2{margin:0;font-weight:950;letter-spacing:-.04em}.panelHead>span{border-radius:999px;background:rgba(139,212,80,.22);color:var(--accent);padding:7px 11px;font-weight:950}.formGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.full{grid-column:1/-1}label span,.switch span{display:block;margin-bottom:7px;font-weight:950}small{display:block;margin-top:6px;color:var(--muted)}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:16px;min-height:48px;padding:0 12px;background:#fff;color:var(--ink);font-weight:800}textarea{padding:12px;resize:vertical}.side{display:grid;gap:16px;align-content:start}.preview{margin-top:14px;aspect-ratio:4/3;border-radius:22px;border:1px solid var(--line);overflow:hidden;background:#f3eee2}.preview img{width:100%;height:100%;object-fit:cover}.preview.empty{display:grid;place-items:center;color:var(--muted)}.switch{display:flex;align-items:center;gap:10px}.switch input{width:22px;min-height:22px}.submitPanel{display:grid;gap:10px}.submitBtn{border:0;background:var(--accent);color:#fffdf7}.notice{border-radius:18px;padding:14px 16px;margin-bottom:14px;display:flex;gap:10px;align-items:flex-start;font-weight:850}.notice.danger{background:#fff1f1;border:1px solid #facaca;color:#842029}.notice.success{background:#ecf8df;border:1px solid #b9e58d;color:#285b20}.links{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.links a{color:inherit;font-weight:950}@media(max-width:991.98px){.page{margin-left:0;padding:88px 16px 24px}.editor{grid-template-columns:1fr}.topbar{display:grid;align-items:stretch}.pill{width:100%}}@media(max-width:640px){.formGrid{grid-template-columns:1fr}.panel{border-radius:22px}}
</style>

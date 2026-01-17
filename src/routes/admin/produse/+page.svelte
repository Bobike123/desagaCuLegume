<!-- src/routes/admin/produse/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";

  type ProductItem = {
    id: string;
    name: string | null;
    category: string | null;
    price: number | null;
    in_stock: boolean | null;
    created_at: string;
  };

  let items: ProductItem[] = [];
  let loading = true;
  let error = "";
  let searchQuery = "";

  let toast = "";
  let toastType: "success" | "danger" | "info" = "info";
  function showToast(msg: string, type: typeof toastType = "info") {
    toast = msg;
    toastType = type;
    setTimeout(() => (toast = ""), 2500);
  }

  async function readJsonSafely(res: Response) {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  async function loadItems() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/products?admin=true", {
        credentials: "include",
      });

      const data = await readJsonSafely(res);

      if (!res.ok) {
        error = (data as any)?.error ?? "Eroare la încărcarea produselor";
        return;
      }

      items = (data ?? []).map((x: any) => ({
        id: String(x.id),
        name: x.name ?? x.title ?? null,
        category: x.category ?? null,
        price:
          typeof x.price === "number"
            ? x.price
            : x.price != null
              ? Number(x.price)
              : null,
        in_stock:
          x.in_stock === true ||
          x.in_stock === 1 ||
          x.in_stock === "true" ||
          x.in_stock === "1",
        created_at: String(x.created_at ?? new Date().toISOString()),
      }));
    } catch (e) {
      error = e instanceof Error ? e.message : "Eroare la încărcare";
    } finally {
      loading = false;
    }
  }

  onMount(loadItems);

  $: filtered = items.filter((p) =>
    (p.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function toggleStock(id: string, current: boolean) {
    error = "";
    const next = !current;

    try {
      const res = await fetch(`/api/products/${id}?admin=true`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ in_stock: next }),
      });

      const data = await readJsonSafely(res);

      if (!res.ok) {
        const msg =
          (data as any)?.error ?? `Eroare la actualizare (${res.status})`;
        error = msg;
        showToast(msg, "danger");
        return;
      }

      items = items.map((x) => (x.id === id ? { ...x, in_stock: next } : x));
      showToast(next ? "Pus în stoc" : "Scos din stoc", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare la actualizare";
      error = msg;
      showToast(msg, "danger");
    }
  }

  async function remove(id: string) {
    if (!confirm("Ești sigur că vrei să ștergi?")) return;

    error = "";
    try {
      const res = await fetch(`/api/products/${id}?admin=true`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const data = await readJsonSafely(res);

      if (!res.ok) {
        const msg =
          (data as any)?.error ?? `Eroare la ștergere (${res.status})`;
        error = msg;
        showToast(msg, "danger");
        return;
      }

      items = items.filter((x) => x.id !== id);
      showToast("Produs șters", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare la ștergere";
      error = msg;
      showToast(msg, "danger");
    }
  }
</script>

<svelte:head>
  <title>Gestionare Produse - Admin DeSaga</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true">
          <i class="bi bi-box"></i>
        </span>
        Produse
      </h1>
      <p class="page__subtitle">Listă, căutare, stoc, editare, ștergere</p>
    </div>

    <div class="page__actions">
      <button
        class="btn btn-outline-secondary page__btn"
        on:click={loadItems}
        disabled={loading}
      >
        <i class="bi bi-arrow-clockwise"></i>
        <span>Reîncarcă</span>
      </button>
      <a href="/admin/produse/new" class="btn btn-primary page__btn">
        <i class="bi bi-plus-circle"></i>
        <span>Produs nou</span>
      </a>
    </div>
  </header>

  {#if toast}
    <div
      class={`alert alert-${toastType} d-flex align-items-center gap-2 shadow-sm mb-3`}
      role="alert"
    >
      <i class="bi bi-info-circle"></i>
      <div>{toast}</div>
    </div>
  {/if}

  {#if error}
    <div
      class="alert alert-danger d-flex align-items-center gap-2 shadow-sm mb-3"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle"></i>
      <div>{error}</div>
    </div>
  {/if}

  <section class="toolbar">
    <div class="toolbar__search">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input
        type="text"
        class="form-control toolbar__input"
        placeholder="Caută produse..."
        bind:value={searchQuery}
      />
    </div>
    <div class="toolbar__meta">
      <span class="badge text-bg-light border">
        {#if loading}…{:else}{filtered.length} rezultate{/if}
      </span>
    </div>
  </section>

  {#if loading}
    <div class="card border-0 shadow-sm">
      <div class="card-body py-5 text-center">
        <div class="spinner-border" role="status" aria-label="Se încarcă"></div>
        <div class="mt-3 text-muted">Se încarcă produsele…</div>
      </div>
    </div>
  {:else if filtered.length > 0}
    <div class="card border-0 shadow-sm tablecard">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="thead">
            <tr>
              <th>Nume</th>
              <th class="d-none d-md-table-cell">Categorie</th>
              <th>Preț</th>
              <th>Stoc</th>
              <th class="text-end">Acțiuni</th>
            </tr>
          </thead>

          <tbody>
            {#each filtered as p (p.id)}
              <tr class={!p.in_stock ? "row--warn" : ""}>
                <td class="title">
                  <div class="title__main">{p.name ?? "-"}</div>
                  <div class="title__sub d-md-none muted">
                    {p.category ?? "-"}
                  </div>
                </td>

                <td class="d-none d-md-table-cell muted">
                  {p.category ?? "-"}
                </td>

                <td class="muted">
                  {p.price ?? "-"}{p.price !== null ? " RON" : ""}
                </td>

                <td>
                  <span
                    class={`badge ${
                      p.in_stock ? "text-bg-success" : "text-bg-secondary"
                    }`}
                  >
                    {p.in_stock ? "În stoc" : "Stoc epuizat"}
                  </span>
                </td>

                <td class="text-end text-nowrap">
                  <button
                    class={`btn btn-sm ${
                      p.in_stock ? "btn-outline-secondary" : "btn-success"
                    } me-2`}
                    on:click={() => toggleStock(p.id, !!p.in_stock)}
                  >
                    {p.in_stock ? "Scoate din stoc" : "Pune în stoc"}
                  </button>

                  <a
                    href={`/admin/produse/${p.id}`}
                    class="btn btn-sm btn-primary me-2"
                  >
                    <i class="bi bi-pencil"></i>
                    <span class="d-none d-sm-inline">Editează</span>
                  </a>

                  <button
                    class="btn btn-sm btn-outline-danger"
                    on:click={() => remove(p.id)}
                  >
                    <i class="bi bi-trash"></i>
                    <span class="d-none d-sm-inline">Șterge</span>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="empty">
      <div class="empty__icon"><i class="bi bi-info-circle"></i></div>
      <div class="empty__text">
        <div class="fw-bold">Nu sunt produse disponibile</div>
        <div class="text-muted">Creează primul produs din „Produs nou”.</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    padding: 10px 0 22px;
  }

  .page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin: 6px 0 14px;
  }
  .page__title {
    margin: 0;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--desaga-brown);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.6rem;
    line-height: 1.2;
  }
  .page__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
  }
  .page__subtitle {
    margin: 6px 0 0;
    color: rgba(0, 0, 0, 0.55);
  }
  .page__actions {
    display: flex;
    gap: 10px;
  }
  .page__btn {
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 10px 0 14px;
  }
  .toolbar__search {
    position: relative;
    flex: 1 1 auto;
    max-width: 520px;
  }
  .toolbar__search > i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0, 0, 0, 0.45);
  }
  .toolbar__input {
    padding-left: 38px;
    border-radius: 14px;
  }
  .toolbar__meta {
    flex: 0 0 auto;
  }

  .tablecard {
    border-radius: 16px;
    overflow: hidden;
  }
  .thead {
    background: rgba(0, 0, 0, 0.015);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .title {
    font-weight: 800;
    color: rgba(0, 0, 0, 0.78);
  }
  .title__main {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 520px;
  }
  .title__sub {
    margin-top: 4px;
  }
  .muted {
    color: rgba(0, 0, 0, 0.55);
    font-weight: 600;
  }

  .row--warn {
    background: rgba(255, 193, 7, 0.12);
  }

  .empty {
    border: 1px dashed rgba(0, 0, 0, 0.18);
    border-radius: 16px;
    padding: 18px 14px;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.015);
  }
  .empty__icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.55);
    flex: 0 0 auto;
  }

  .form-control:focus {
    border-color: var(--desaga-green);
    box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
  }

  @media (max-width: 576px) {
    .page__actions {
      flex-direction: column;
      align-items: stretch;
    }
    .page__btn {
      justify-content: center;
    }
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    .toolbar__search {
      max-width: none;
    }
    .title__main {
      max-width: 240px;
    }
  }
</style>

<!-- src/routes/admin/noutati/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";

  type NewsItem = {
    id: string;
    title: string | null;
    created_at: string;
    published: boolean | null;
  };

  let items: NewsItem[] = [];
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

  function roDateTime(value: string) {
    try {
      return new Date(value).toLocaleString("ro-RO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  }

  async function loadItems() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/noutati?admin=true");
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        error = (data as any)?.error ?? "Eroare la încărcarea noutăților";
        return;
      }

      items = (data ?? []).map((x: any) => ({
        id: String(x.id),
        title: x.title ?? null,
        created_at: String(x.created_at ?? new Date().toISOString()),
        published: Boolean(x.published),
      }));
    } catch (e) {
      error = e instanceof Error ? e.message : "Eroare la încărcare";
    } finally {
      loading = false;
    }
  }

  onMount(loadItems);

  $: filtered = items.filter((n) =>
    (n.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function togglePublished(id: string, current: boolean) {
    error = "";
    const next = !current;

    try {
      const res = await fetch(`/api/noutati/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data as any)?.error ?? "Eroare la actualizare";
        error = msg;
        showToast(msg, "danger");
        return;
      }

      items = items.map((x) => (x.id === id ? { ...x, published: next } : x));
      showToast(next ? "Marcat public" : "Marcat draft", "success");
    } catch {
      showToast("Eroare la actualizare", "danger");
    }
  }

  async function remove(id: string) {
    if (!confirm("Ești sigur că vrei să ștergi?")) return;

    error = "";
    try {
      const res = await fetch(`/api/noutati/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data as any)?.error ?? "Eroare la ștergere";
        error = msg;
        showToast(msg, "danger");
        return;
      }

      items = items.filter((x) => x.id !== id);
      showToast("Noutate ștearsă", "success");
    } catch {
      showToast("Eroare la ștergere", "danger");
    }
  }
</script>

<svelte:head>
  <title>Gestionare Noutăți - Admin DeSaga</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">
        <span class="page__icon" aria-hidden="true"
          ><i class="bi bi-newspaper"></i></span
        >
        Noutăți
      </h1>
      <p class="page__subtitle">Listă, căutare, publicare, editare, ștergere</p>
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
      <a href="/admin/noutati/new" class="btn btn-primary page__btn">
        <i class="bi bi-plus-circle"></i>
        <span>Noutate nouă</span>
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
        placeholder="Caută noutăți..."
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
        <div class="mt-3 text-muted">Se încarcă noutățile…</div>
      </div>
    </div>
  {:else if filtered.length > 0}
    <div class="card border-0 shadow-sm tablecard">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="thead">
            <tr>
              <th>Titlu</th>
              <th class="d-none d-md-table-cell">Creat</th>
              <th>Status</th>
              <th class="text-end">Acțiuni</th>
            </tr>
          </thead>

          <tbody>
            {#each filtered as n (n.id)}
              <tr class={!n.published ? "row--draft" : ""}>
                <td class="title">
                  <div class="title__main">{n.title ?? "-"}</div>
                  <div class="title__sub d-md-none muted">
                    {roDateTime(n.created_at)}
                  </div>
                </td>

                <td class="d-none d-md-table-cell muted"
                  >{roDateTime(n.created_at)}</td
                >

                <td>
                  <span
                    class={`badge ${n.published ? "text-bg-success" : "text-bg-secondary"}`}
                  >
                    {n.published ? "Public" : "Draft"}
                  </span>
                </td>

                <td class="text-end text-nowrap">
                  <button
                    class={`btn btn-sm ${n.published ? "btn-outline-secondary" : "btn-success"} me-2`}
                    on:click={() => togglePublished(n.id, !!n.published)}
                  >
                    {n.published ? "Retrage" : "Publică"}
                  </button>

                  <a
                    href={`/admin/noutati/${n.id}`}
                    class="btn btn-sm btn-primary me-2"
                  >
                    <i class="bi bi-pencil"></i>
                    <span class="d-none d-sm-inline">Editează</span>
                  </a>

                  <button
                    class="btn btn-sm btn-outline-danger"
                    on:click={() => remove(n.id)}
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
        <div class="fw-bold">Nu sunt noutăți disponibile</div>
        <div class="text-muted">Creează prima noutate din „Noutate nouă”.</div>
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
  .row--draft {
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

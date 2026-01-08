<!-- src/routes/admin/messages/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";

    type MessageItem = {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        message: string;
        created_at: string;
        read: boolean;
    };

    let items: MessageItem[] = [];
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

    async function loadMessages() {
        loading = true;
        error = "";
        try {
            const res = await fetch("/api/messages");
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                error = data?.error ?? "Failed to load messages";
                return;
            }
            items = data.items ?? [];
        } catch {
            error = "Failed to load messages";
        } finally {
            loading = false;
        }
    }

    onMount(loadMessages);

    $: filtered = (items ?? []).filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const hay = [
            m.name ?? "",
            m.email ?? "",
            m.phone ?? "",
            m.message ?? "",
        ]
            .join(" ")
            .toLowerCase();
        return hay.includes(q);
    });

    $: unreadCount = (items ?? []).filter((m) => !m.read).length;

    async function toggleRead(id: string, read: boolean) {
        try {
            const res = await fetch(`/api/messages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ read }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showToast(data?.error ?? "Eroare la actualizare", "danger");
                return;
            }
            items = items.map((m) => (m.id === id ? { ...m, read } : m));
            showToast(read ? "Marcat citit" : "Marcat necitit", "success");
        } catch {
            showToast("Eroare la actualizare", "danger");
        }
    }

    async function remove(id: string) {
        if (!confirm("Ștergi acest mesaj?")) return;

        try {
            const res = await fetch(`/api/messages/${id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showToast(data?.error ?? "Eroare la ștergere", "danger");
                return;
            }
            items = items.filter((m) => m.id !== id);
            showToast("Mesaj șters", "success");
        } catch {
            showToast("Eroare la ștergere", "danger");
        }
    }
</script>

<svelte:head>
    <title>Mesaje - Admin</title>
</svelte:head>

<div class="page">
    <header class="page__header">
        <div>
            <h1 class="page__title">
                <span class="page__icon" aria-hidden="true"
                    ><i class="bi bi-inbox"></i></span
                >
                Mesaje
            </h1>
            <p class="page__subtitle">
                Mesaje primite din formularul de contact
            </p>
        </div>

        <div class="page__actions">
            <button
                class="btn btn-outline-secondary page__btn"
                on:click={loadMessages}
                disabled={loading}
            >
                <i class="bi bi-arrow-clockwise"></i>
                <span>Reîncarcă</span>
            </button>
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
                placeholder="Caută nume, email, telefon, mesaj..."
                bind:value={searchQuery}
            />
        </div>

        <div class="toolbar__meta">
            <span class="badge text-bg-light border">
                {#if loading}…{:else}{filtered.length} rezultate{/if}
            </span>
            <span
                class={`badge ${unreadCount > 0 ? "text-bg-danger" : "text-bg-success"}`}
            >
                {unreadCount > 0 ? `${unreadCount} necitite` : "0 necitite"}
            </span>
        </div>
    </section>

    {#if loading}
        <div class="card border-0 shadow-sm">
            <div class="card-body py-5 text-center">
                <div
                    class="spinner-border"
                    role="status"
                    aria-label="Se încarcă"
                ></div>
                <div class="mt-3 text-muted">Se încarcă mesajele…</div>
            </div>
        </div>
    {:else if items.length === 0}
        <div class="empty">
            <div class="empty__icon"><i class="bi bi-info-circle"></i></div>
            <div class="empty__text">
                <div class="fw-bold">Nu există mesaje</div>
                <div class="text-muted">
                    Când cineva trimite formularul, apare aici.
                </div>
            </div>
        </div>
    {:else if filtered.length === 0}
        <div class="empty">
            <div class="empty__icon"><i class="bi bi-search"></i></div>
            <div class="empty__text">
                <div class="fw-bold">Niciun rezultat</div>
                <div class="text-muted">Schimbă căutarea.</div>
            </div>
        </div>
    {:else}
        <div class="card border-0 shadow-sm tablecard">
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead class="thead">
                        <tr class="text-secondary">
                            <th>Data</th>
                            <th>Nume</th>
                            <th class="d-none d-md-table-cell">Email</th>
                            <th class="d-none d-lg-table-cell">Telefon</th>
                            <th>Mesaj</th>
                            <th class="text-end">Acțiuni</th>
                        </tr>
                    </thead>

                    <tbody>
                        {#each filtered as m (m.id)}
                            <tr class={!m.read ? "row--unread" : ""}>
                                <td class="text-nowrap muted"
                                    >{roDateTime(m.created_at)}</td
                                >
                                <td class="name">
                                    <div class="name__main">
                                        {m.name ?? "-"}
                                    </div>
                                    <div class="name__sub d-md-none">
                                        <span class="muted"
                                            >{m.email ?? "-"}</span
                                        >
                                        <span class="dot">•</span>
                                        <span class="muted"
                                            >{m.phone ?? "-"}</span
                                        >
                                    </div>
                                </td>
                                <td class="d-none d-md-table-cell muted"
                                    >{m.email ?? "-"}</td
                                >
                                <td class="d-none d-lg-table-cell muted"
                                    >{m.phone ?? "-"}</td
                                >

                                <td class="msg" style="max-width: 520px;">
                                    <div class="msg__line" title={m.message}>
                                        {m.message}
                                    </div>
                                </td>

                                <td class="text-end text-nowrap">
                                    <button
                                        class={`btn btn-sm ${m.read ? "btn-outline-secondary" : "btn-success"} me-2`}
                                        on:click={() =>
                                            toggleRead(m.id, !m.read)}
                                    >
                                        {m.read ? "Necitit" : "Citit"}
                                    </button>

                                    <button
                                        class="btn btn-sm btn-outline-danger"
                                        on:click={() => remove(m.id)}
                                    >
                                        <i class="bi bi-trash"></i>
                                        <span class="d-none d-sm-inline"
                                            >Șterge</span
                                        >
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
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
        max-width: 560px;
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
        display: inline-flex;
        gap: 8px;
        align-items: center;
    }

    .tablecard {
        border-radius: 16px;
        overflow: hidden;
    }

    .thead {
        background: rgba(0, 0, 0, 0.015);
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .muted {
        color: rgba(0, 0, 0, 0.55);
        font-weight: 600;
    }

    .row--unread {
        background: rgba(255, 193, 7, 0.12);
    }

    .name {
        font-weight: 800;
        color: rgba(0, 0, 0, 0.78);
    }
    .name__sub {
        margin-top: 4px;
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .dot {
        color: rgba(0, 0, 0, 0.35);
    }

    .msg__line {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    .form-control:focus,
    .form-select:focus {
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
    }
</style>

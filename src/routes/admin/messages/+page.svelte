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

    async function loadMessages() {
        loading = true;
        error = "";
        try {
            const res = await fetch("/api/messages");
            const data = await res.json();
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

    async function markRead(id: string, read: boolean) {
        const res = await fetch(`/api/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read }),
        });
        if (res.ok) {
            items = items.map((m) => (m.id === id ? { ...m, read } : m));
        }
    }

    async function remove(id: string) {
        const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
        if (res.ok) items = items.filter((m) => m.id !== id);
    }

    onMount(loadMessages);
</script>

<svelte:head>
    <title>Mesaje - Admin</title>
</svelte:head>

<div class="row mb-4">
    <div class="col-12 d-flex justify-content-between align-items-center">
        <div>
            <h1 class="h2 text-brown fw-bold m-0">
                <i class="bi bi-inbox"></i> Mesaje
            </h1>
            <p class="text-secondary mb-0">
                Mesaje primite din formularul de contact
            </p>
        </div>
        <button
            class="btn btn-outline-secondary"
            on:click={loadMessages}
            disabled={loading}
        >
            <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
    </div>
</div>

{#if error}
    <div class="alert alert-danger">{error}</div>
{/if}

{#if loading}
    <div class="text-center py-5">
        <div class="spinner-border" role="status"></div>
    </div>
{:else if items.length === 0}
    <div class="alert alert-info">
        <i class="bi bi-info-circle"></i> Nu există mesaje.
    </div>
{:else}
    <div class="card border-0 shadow-sm">
        <div class="table-responsive">
            <table class="table align-middle mb-0">
                <thead>
                    <tr class="text-secondary">
                        <th>Data</th>
                        <th>Nume</th>
                        <th>Email</th>
                        <th>Telefon</th>
                        <th>Mesaj</th>
                        <th class="text-end">Acțiuni</th>
                    </tr>
                </thead>
                <tbody>
                    {#each items as m (m.id)}
                        <tr class={!m.read ? "table-warning" : ""}>
                            <td class="text-nowrap"
                                >{new Date(m.created_at).toLocaleString(
                                    "ro-RO",
                                )}</td
                            >
                            <td>{m.name ?? "-"}</td>
                            <td>{m.email ?? "-"}</td>
                            <td>{m.phone ?? "-"}</td>
                            <td style="max-width: 520px;">
                                <div class="text-truncate" title={m.message}>
                                    {m.message}
                                </div>
                            </td>
                            <td class="text-end text-nowrap">
                                <button
                                    class={`btn btn-sm ${m.read ? "btn-outline-secondary" : "btn-success"} me-2`}
                                    on:click={() => markRead(m.id, !m.read)}
                                >
                                    {m.read
                                        ? "Marchează necitit"
                                        : "Marchează citit"}
                                </button>
                                <button
                                    class="btn btn-sm btn-outline-danger"
                                    on:click={() => remove(m.id)}
                                >
                                    Șterge
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
{/if}

<style>
    .text-brown {
        color: var(--desaga-brown) !important;
    }
    .text-truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

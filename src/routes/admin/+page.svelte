<!-- Admin edit eveniment (varianta cu $lib/stores/events) -->
<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import {
        type Event as EventType,
        getEventById,
        updateEvent,
        deleteEvent,
    } from "$lib/stores/events";

    let event: EventType | null = null;
    let formData: EventType = {
        id: "",
        title: "",
        description: "",
        date: "",
        event_type: "",
        location: "",
        image_url: "",
        published: false,
    };

    let submitting = false;
    let deletingFlag = false;
    let error = "";
    let loading = true;

    let imageFile: File | null = null;
    let imagePreview = "";

    let toast = "";
    let toastType: "success" | "danger" | "info" = "info";
    function showToast(msg: string, type: typeof toastType = "info") {
        toast = msg;
        toastType = type;
        setTimeout(() => (toast = ""), 2500);
    }

    function toDatetimeLocal(value: string | null) {
        if (!value) return "";
        const d = new Date(value);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    onMount(async () => {
        const id = $page.params.id;
        if (!id) {
            error = "ID eveniment invalid";
            loading = false;
            return;
        }

        const data = await getEventById(id);
        if (data) {
            event = data;
            formData = {
                ...data,
                date: toDatetimeLocal(data.date as any),
            } as any;
            imagePreview = data.image_url ?? "";
        } else {
            error = "Eveniment nu găsit";
        }
        loading = false;
    });

    function handleImageChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        imageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        submitting = true;
        error = "";

        const id = $page.params.id;
        if (!id) {
            error = "ID eveniment invalid";
            submitting = false;
            return;
        }

        try {
            let imageUrl = formData.image_url;

            if (imageFile) {
                const fd = new FormData();
                fd.append("file", imageFile);

                const uploadRes = await fetch("/api/products/upload", {
                    method: "POST",
                    body: fd,
                });
                if (uploadRes.ok) {
                    const { url } = await uploadRes
                        .json()
                        .catch(() => ({ url: "" }));
                    if (url) imageUrl = url;
                }
            }

            const payload = {
                ...formData,
                date: formData.date
                    ? new Date(formData.date as any).toISOString()
                    : null,
                image_url: imageUrl,
            } as any;

            const updated = await updateEvent(id, payload);
            if (updated) {
                showToast("Salvat", "success");
                goto("/admin/evenimente");
            } else {
                error = "Eroare la actualizare";
                showToast(error, "danger");
            }
        } catch (err: unknown) {
            error = (err as Error).message || "Eroare necunoscută";
            showToast(error, "danger");
        } finally {
            submitting = false;
        }
    }

    async function handleDelete() {
        const id = $page.params.id;
        if (!id) {
            error = "ID eveniment invalid";
            return;
        }

        if (!confirm("Ești sigur?")) return;

        deletingFlag = true;
        try {
            const ok = await deleteEvent(id);
            if (ok) {
                showToast("Eveniment șters", "success");
                goto("/admin/evenimente");
            } else {
                error = "Eroare la ștergere";
                showToast(error, "danger");
            }
        } catch {
            error = "Eroare la ștergere";
            showToast(error, "danger");
        } finally {
            deletingFlag = false;
        }
    }
</script>

<svelte:head>
    <title>Editare Eveniment - Admin DeSaga</title>
</svelte:head>

<div class="page">
    <header class="page__header">
        <div>
            <h1 class="page__title">
                <span class="page__icon" aria-hidden="true"
                    ><i class="bi bi-pencil-square"></i></span
                >
                Editare eveniment
            </h1>
            <p class="page__subtitle">{event ? `ID: ${event.id}` : " "}</p>
        </div>

        <div class="page__actions">
            <a
                href="/admin/evenimente"
                class="btn btn-outline-secondary page__btn"
            >
                <i class="bi bi-arrow-left"></i>
                <span>Înapoi</span>
            </a>
            <button
                class="btn btn-outline-danger page__btn"
                on:click={handleDelete}
                disabled={loading || deletingFlag}
            >
                {#if deletingFlag}
                    <span
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                    ></span>
                    Se șterge…
                {:else}
                    <i class="bi bi-trash"></i>
                    <span>Șterge</span>
                {/if}
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

    {#if loading}
        <div class="card border-0 shadow-sm">
            <div class="card-body py-5 text-center">
                <div
                    class="spinner-border"
                    role="status"
                    aria-label="Se încarcă"
                ></div>
                <div class="mt-3 text-muted">Se încarcă evenimentul…</div>
            </div>
        </div>
    {:else if event}
        <form class="grid" on:submit={handleSubmit}>
            <section class="panel">
                <div class="panel__head">
                    <h2 class="panel__title">
                        <i class="bi bi-sliders"></i>
                        Detalii eveniment
                    </h2>
                    <span class="panel__hint">Titlu + dată + locație</span>
                </div>

                <div class="panel__body">
                    <div class="field">
                        <label class="field__label" for="title">Titlu *</label>
                        <input
                            id="title"
                            class="form-control field__control"
                            bind:value={formData.title}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="field">
                                <label class="field__label" for="date"
                                    >Data și ora *</label
                                >
                                <input
                                    id="date"
                                    type="datetime-local"
                                    class="form-control field__control"
                                    bind:value={formData.date}
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="field">
                                <label class="field__label" for="type"
                                    >Tip eveniment *</label
                                >
                                <select
                                    id="type"
                                    class="form-select field__control"
                                    bind:value={formData.event_type}
                                    required
                                    disabled={submitting}
                                >
                                    <option value="piata">Piață</option>
                                    <option value="festival">Festival</option>
                                    <option value="atelier">Atelier</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label class="field__label" for="location"
                            >Locație *</label
                        >
                        <input
                            id="location"
                            class="form-control field__control"
                            bind:value={formData.location}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div class="field">
                        <label class="field__label" for="description"
                            >Descriere *</label
                        >
                        <textarea
                            id="description"
                            class="form-control field__control"
                            rows="8"
                            bind:value={formData.description}
                            required
                            disabled={submitting}
                        ></textarea>
                    </div>

                    <div class="panel__footInline">
                        <button
                            type="submit"
                            class="btn btn-primary btn-lg"
                            disabled={submitting}
                        >
                            {#if submitting}
                                <span
                                    class="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Se salvează…
                            {:else}
                                <i class="bi bi-check-circle"></i>
                                Salvează
                            {/if}
                        </button>
                    </div>
                </div>
            </section>

            <aside class="side">
                <div class="cardlike">
                    <div class="cardlike__head">
                        <div class="cardlike__title">
                            <i class="bi bi-image"></i>
                            Imagine
                        </div>
                        <div class="cardlike__sub">Upload + preview</div>
                    </div>

                    <div class="cardlike__body">
                        <input
                            type="file"
                            class="form-control"
                            accept="image/*"
                            on:change={handleImageChange}
                            disabled={submitting}
                        />

                        {#if imagePreview}
                            <div class="preview">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    class="preview__img"
                                />
                            </div>
                        {:else}
                            <div class="preview preview--empty">
                                <div class="preview__empty">
                                    <i class="bi bi-card-image"></i>
                                    <div>Fără imagine</div>
                                </div>
                            </div>
                        {/if}

                        <div class="mt-3">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label class="field__label">Image URL</label>
                            <input
                                class="form-control"
                                bind:value={formData.image_url}
                                disabled={submitting}
                                placeholder=""
                            />
                        </div>
                    </div>
                </div>

                <div class="cardlike">
                    <div class="cardlike__head">
                        <div class="cardlike__title">
                            <i class="bi bi-megaphone"></i>
                            Status
                        </div>
                        <div class="cardlike__sub">Public / Draft</div>
                    </div>

                    <div class="cardlike__body">
                        <div class="form-check form-switch">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                bind:checked={formData.published}
                                id="pub_store"
                                disabled={submitting}
                            />
                            <label
                                class="form-check-label fw-bold"
                                for="pub_store"
                                >{formData.published
                                    ? "Public"
                                    : "Draft"}</label
                            >
                        </div>
                    </div>
                </div>
            </aside>
        </form>
    {:else}
        <div class="empty">
            <div class="empty__icon">
                <i class="bi bi-exclamation-triangle"></i>
            </div>
            <div class="empty__text">
                <div class="fw-bold">Eveniment nu găsit</div>
                <div class="text-muted">Nu există date pentru ID-ul cerut.</div>
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

    .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 14px;
        align-items: start;
    }

    .panel {
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        overflow: hidden;
    }
    .panel__head {
        padding: 14px 14px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(0, 0, 0, 0.015);
    }
    .panel__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 900;
        color: var(--desaga-brown);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .panel__hint {
        color: rgba(0, 0, 0, 0.55);
        font-weight: 600;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    .panel__body {
        padding: 14px;
    }
    .panel__footInline {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
    }

    .field {
        margin-bottom: 12px;
    }
    .field__label {
        display: block;
        font-weight: 800;
        color: rgba(0, 0, 0, 0.78);
        margin-bottom: 6px;
    }

    .cardlike {
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        margin-bottom: 14px;
    }
    .cardlike__head {
        padding: 12px 12px 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(0, 0, 0, 0.015);
    }
    .cardlike__title {
        font-weight: 900;
        color: var(--desaga-brown);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .cardlike__sub {
        margin-top: 4px;
        color: rgba(0, 0, 0, 0.55);
        font-size: 0.9rem;
    }
    .cardlike__body {
        padding: 12px;
    }

    .preview {
        margin-top: 12px;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.1);
        background: rgba(0, 0, 0, 0.02);
    }
    .preview__img {
        width: 100%;
        display: block;
        max-height: 240px;
        object-fit: cover;
    }
    .preview--empty {
        display: grid;
        place-items: center;
        padding: 22px 12px;
    }
    .preview__empty {
        color: rgba(0, 0, 0, 0.55);
        display: grid;
        gap: 6px;
        justify-items: center;
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
    .form-select:focus,
    textarea:focus {
        border-color: var(--desaga-blue);
        box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
    }

    @media (max-width: 992px) {
        .grid {
            grid-template-columns: 1fr;
        }
        .panel__hint {
            display: none;
        }
    }
</style>

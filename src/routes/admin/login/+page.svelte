<script lang="ts">
    import { goto } from "$app/navigation";
    import { setUser, setAdmin } from "$lib/stores/auth";

    let email = "";
    let password = "";
    let error = "";
    let loading = false;

    // Access VITE-prefixed env variables
    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

    async function handleLogin(e: Event) {
        e.preventDefault();
        loading = true;
        error = "";

        try {
            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                setAdmin(true);
                setUser({ email } as any);
                goto("/admin/dashboard");
            } else {
                error = "Email sau parolă incorectă";
            }
        } catch (err) {
            error = "A apărut o eroare. Încearcă din nou!";
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Admin Login - DeSaga cu Legume</title>
</svelte:head>

<div
    class="min-vh-100 d-flex align-items-center justify-content-center"
    style="background-color: var(--desaga-cream);"
>
    <div class="w-100" style="max-width: 500px;">
        <div class="card border-0 shadow-lg">
            <div class="card-body p-5">
                <h1 class="h3 text-center text-brown fw-bold mb-4">
                    <i class="bi bi-gear"></i> Admin Panel
                </h1>

                {#if error}
                    <div
                        class="alert alert-danger alert-dismissible fade show"
                        role="alert"
                    >
                        <i class="bi bi-exclamation-triangle"></i>
                        {error}
                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="alert"
                            aria-label="Close"
                        ></button>
                    </div>
                {/if}

                <form on:submit={handleLogin}>
                    <div class="mb-4">
                        <label for="email" class="form-label text-brown fw-bold"
                            >Email</label
                        >
                        <input
                            type="email"
                            class="form-control form-control-lg"
                            id="email"
                            placeholder="your@email.com"
                            bind:value={email}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div class="mb-4">
                        <label
                            for="password"
                            class="form-label text-brown fw-bold">Parolă</label
                        >
                        <input
                            type="password"
                            class="form-control form-control-lg"
                            id="password"
                            placeholder="••••••••"
                            bind:value={password}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div class="d-grid mb-3">
                        <button
                            type="submit"
                            class="btn btn-primary btn-lg"
                            disabled={loading}
                        >
                            {#if loading}
                                <span
                                    class="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Se conectează...
                            {:else}
                                <i class="bi bi-box-arrow-in-right"></i> Conectare
                            {/if}
                        </button>
                    </div>

                    <div class="text-center text-secondary">
                        <p class="small mb-0">
                            <i class="bi bi-info-circle"></i> Doar adminii pot accesa
                            panoul de administrare
                        </p>
                    </div>
                </form>
            </div>
        </div>

        <div class="text-center mt-4">
            <a href="/" class="text-decoration-none">
                <i class="bi bi-arrow-left"></i> Înapoi la acasă
            </a>
        </div>
    </div>
</div>

<style>
    .text-brown {
        color: var(--desaga-brown) !important;
    }

    .form-control:focus {
        border-color: var(--desaga-green);
        box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
    }
</style>

<script lang="ts">
    import { supabase } from "$lib/api/supabase";
    import { goto } from "$app/navigation";
    import { isAdmin, user } from "$lib/stores/auth";

    let email = "";
    let password = "";
    let error = "";
    let loading = false;

    async function handleLogin(e: Event) {
        e.preventDefault();
        loading = true;
        error = "";

        try {
            const { data: authData, error: signInError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

            if (signInError) {
                error = "Email sau parolă incorectă";
                throw signInError;
            }

            if (authData.user) {
                // Check if user is admin
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", authData.user.id)
                    .single();

                if (userError || userData?.role !== "admin") {
                    await supabase.auth.signOut();
                    error = "Acces neautorizat";
                    return;
                }

                isAdmin.set(true);
                user.set(authData.user);
                goto("/admin/dashboard");
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
                            placeholder="admin@desaga.ro"
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

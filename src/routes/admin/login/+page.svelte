<!-- src/routes/admin/login/+page.svelte -->
<script lang="ts">
    import { goto } from "$app/navigation";

    let email = "";
    let password = "";
    let error = "";
    let loading = false;

    async function handleLogin(e: Event) {
        e.preventDefault();
        loading = true;
        error = "";

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: email, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                error = data?.error ?? "Login failed";
                return;
            }

            await goto("/admin/dashboard");
        } catch {
            error = "Login failed";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Admin Login</title>
</svelte:head>

<div class="auth">
    <div class="auth__card">
        <header class="auth__head">
            <div class="auth__brand">
                <div class="auth__logo" aria-hidden="true">
                    <i class="bi bi-shield-lock"></i>
                </div>
                <div>
                    <h1 class="auth__title">Admin Panel</h1>
                    <p class="auth__sub">Autentificare pentru administrare</p>
                </div>
            </div>
        </header>

        <div class="auth__body">
            {#if error}
                <div
                    class="alert alert-danger d-flex align-items-center gap-2 shadow-sm mb-3"
                    role="alert"
                >
                    <i class="bi bi-exclamation-triangle"></i>
                    <div>{error}</div>
                </div>
            {/if}

            <form class="auth__form" on:submit={handleLogin}>
                <div class="field">
                    <label class="field__label" for="email">Email</label>
                    <div class="field__controlWrap">
                        <i class="bi bi-envelope" aria-hidden="true"></i>
                        <input
                            id="email"
                            class="form-control form-control-lg field__control"
                            type="text"
                            bind:value={email}
                            required
                            autocomplete="email"
                            placeholder="admin@exemplu.ro"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div class="field">
                    <label class="field__label" for="password">Password</label>
                    <div class="field__controlWrap">
                        <i class="bi bi-key" aria-hidden="true"></i>
                        <input
                            id="password"
                            class="form-control form-control-lg field__control"
                            type="password"
                            bind:value={password}
                            required
                            autocomplete="current-password"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    class="btn btn-primary btn-lg w-100 auth__submit"
                    type="submit"
                    disabled={loading}
                >
                    {#if loading}
                        <span
                            class="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                        ></span>
                        Se autentifică…
                    {:else}
                        <i class="bi bi-box-arrow-in-right"></i>
                        Autentificare
                    {/if}
                </button>

                <div class="auth__note">
                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                    <span>Acces restricționat. Folosește contul de admin.</span>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    .auth {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 18px 12px;
        background: radial-gradient(
                900px 500px at 20% 10%,
                rgba(118, 236, 30, 0.12),
                transparent 60%
            ),
            radial-gradient(
                700px 420px at 90% 30%,
                rgba(0, 0, 0, 0.06),
                transparent 60%
            ),
            #f6f0e6;
    }

    .auth__card {
        width: min(560px, 100%);
        border-radius: 18px;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .auth__head {
        padding: 18px 18px 14px;
        background: rgba(0, 0, 0, 0.015);
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .auth__brand {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .auth__logo {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.04);
        color: var(--desaga-brown);
        font-size: 1.2rem;
    }

    .auth__title {
        margin: 0;
        font-weight: 900;
        letter-spacing: -0.02em;
        color: var(--desaga-brown);
        line-height: 1.2;
        font-size: 1.35rem;
    }

    .auth__sub {
        margin: 4px 0 0;
        color: rgba(0, 0, 0, 0.55);
        font-weight: 600;
    }

    .auth__body {
        padding: 18px;
    }

    .auth__form {
        display: grid;
        gap: 12px;
    }

    .field__label {
        display: block;
        font-weight: 800;
        color: rgba(0, 0, 0, 0.78);
        margin-bottom: 6px;
    }

    .field__controlWrap {
        position: relative;
    }

    .field__controlWrap > i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(0, 0, 0, 0.45);
    }

    .field__control {
        padding-left: 40px;
        border-radius: 14px;
    }

    .auth__submit {
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 4px;
    }

    .auth__note {
        margin-top: 6px;
        display: flex;
        gap: 8px;
        align-items: center;
        color: rgba(0, 0, 0, 0.55);
        font-weight: 600;
        font-size: 0.92rem;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(0, 0, 0, 0.015);
        border: 1px solid rgba(0, 0, 0, 0.06);
    }

    .form-control:focus {
        border-color: var(--desaga-green);
        box-shadow: 0 0 0 0.2rem rgba(118, 236, 30, 0.25);
    }
</style>

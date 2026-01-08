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
                body: JSON.stringify({ email, password }),
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

<div
    class="min-vh-100 d-flex align-items-center justify-content-center"
    style="background:#f6f0e6;"
>
    <div
        class="card shadow-lg border-0"
        style="width:520px;border-radius:18px;"
    >
        <div class="card-body p-5">
            <h1 class="h3 fw-bold mb-4">Admin Panel</h1>

            {#if error}
                <div class="alert alert-danger">{error}</div>
            {/if}

            <form on:submit={handleLogin}>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Email</label>
                    <input
                        class="form-control form-control-lg"
                        type="email"
                        bind:value={email}
                        required
                    />
                </div>

                <div class="mb-4">
                    <label class="form-label fw-semibold">Password</label>
                    <input
                        class="form-control form-control-lg"
                        type="password"
                        bind:value={password}
                        required
                    />
                </div>

                <button
                    class="btn btn-primary btn-lg w-100"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    </div>
</div>

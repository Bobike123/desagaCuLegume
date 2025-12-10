<script>
    import AdminNav from "$lib/components/AdminNav.svelte";
    import { isAdmin } from "$lib/stores/auth";
    import { goto } from "$app/navigation";

    $: if (!$isAdmin) {
        goto("/admin/login");
    }
</script>

{#if $isAdmin}
    <AdminNav />

    <main class="py-4">
        <div class="container-fluid">
            <slot />
        </div>
    </main>
{:else}
    <div class="d-flex align-items-center justify-content-center min-vh-100">
        <div class="text-center">
            <div class="spinner-border mb-3" role="status">
                <span class="visually-hidden">Se verifică acesul...</span>
            </div>
            <p>Se verifică accesul...</p>
        </div>
    </div>
{/if}

<style>
    main {
        min-height: calc(100vh - 60px);
    }
</style>

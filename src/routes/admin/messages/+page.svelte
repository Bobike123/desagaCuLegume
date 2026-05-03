<script lang="ts">
  import AdminNav from '$lib/components/AdminNav.svelte';
  import MessageThread from '$lib/components/MessageThread.svelte';
</script>

<svelte:head>
  <title>Mesaje - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="admin-page">
  <header class="page-head surface">
    <div>
      <span class="badge-soft"><i class="bi bi-chat-dots"></i> Suport clienți</span>
      <h1>Mesaje</h1>
      <p>Toate conversațiile dintre utilizatori și administratori sunt gestionate prin componenta comună.</p>
    </div>
  </header>

  <MessageThread mode="admin" expanded={true} collapsible={false} title="Inbox suport" subtitle="Caută, filtrează, răspunde și schimbă statusul conversațiilor." />
</div>

<style>
  .admin-page {
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(1rem, 3vw, 1.75rem);
    background: var(--desaga-cream);
  }

  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: clamp(1rem, 3vw, 1.4rem);
    margin-bottom: 1rem;
  }

  .page-head h1 {
    margin: 0.65rem 0 0;
    font-weight: 950;
    color: var(--desaga-heading);
    letter-spacing: -0.035em;
  }

  .page-head p {
    margin: 0.35rem 0 0;
    color: var(--desaga-muted);
  }

  @media (max-width: 991.98px) {
    .admin-page {
      margin-left: 0;
    }
  }
</style>

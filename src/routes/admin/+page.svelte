<script lang="ts">
  import AdminNav from '$lib/components/AdminNav.svelte';
</script>

<svelte:head>
  <title>Admin - DeSaga</title>
</svelte:head>

<AdminNav />

<div class="adminPage">
  <div class="heroCard">
    <h1>Panou administrare</h1>
    <p>Alege o secțiune din meniul din stânga.</p>
    <div class="actions">
      <a href="/admin/dashboard" class="btn btn-primary">Dashboard</a>
      <a href="/admin/produse" class="btn btn-outline-secondary">Produse</a>
      <a href="/admin/comenzi" class="btn btn-outline-secondary">Comenzi</a>
      <a href="/admin/messages" class="btn btn-outline-secondary">Mesaje</a>
    </div>
  </div>
</div>

<style>
  .adminPage {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .heroCard {
    max-width: 760px;
    background: white;
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .heroCard h1 {
    margin: 0 0 8px;
    font-weight: 900;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }
</style>

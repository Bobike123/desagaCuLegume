<script lang="ts">
  import MessageThread from '$lib/components/MessageThread.svelte';
</script>

<svelte:head>
  <title>Mesaje - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <section class="hero">
    <div>
      <p class="eyebrow">Suport clienți</p>
      <h1>Mesaje</h1>
      <p>Mesagerie pentru conversațiile dintre utilizatori și administratori. Caută, filtrează, răspunde și actualizează starea conversațiilor.</p>
    </div>
    <div class="heroIcon" aria-hidden="true"><i class="bi bi-chat-dots"></i></div>
  </section>

  <section class="threadShell">
    <MessageThread mode="admin" expanded={true} collapsible={false} title="Mesagerie suport" subtitle="Caută, filtrează, răspunde și schimbă starea conversațiilor." />
  </section>
</div>

<style>
  .hero {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: clamp(20px, 4vw, 34px);
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 18px;
    background: linear-gradient(135deg, rgba(39, 79, 42, 0.96), rgba(25, 44, 27, 0.94));
    color: #fffdf7;
    box-shadow: 0 24px 70px rgba(35, 51, 30, 0.16);
    margin-bottom: 16px;
  }

  .hero .eyebrow {
    color: #bdf48a;
  }

  .hero p:not(.eyebrow) {
    max-width: 760px;
    margin: 14px 0 0;
    color: rgba(255, 253, 247, 0.76);
  }

  .heroIcon {
    width: 82px;
    height: 82px;
    flex: 0 0 auto;
    border-radius: var(--radius-lg);
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    font-size: 2rem;
  }

  .threadShell {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: clamp(10px, 2vw, 18px);
    background: rgba(255, 253, 247, 0.88);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.1);
    overflow: hidden;
  }

  :global(.threadShell *) {
    min-width: 0;
  }

  :global(.threadShell input),
  :global(.threadShell textarea),
  :global(.threadShell select),
  :global(.threadShell button) {
    min-height: 44px;
  }

  :global(.threadShell table) {
    width: 100%;
  }

  @media (max-width: 640px) {
    .hero {
      align-items: stretch;
      flex-direction: column;
      border-radius: var(--radius-lg);
    }

    .heroIcon {
      width: 100%;
      height: 58px;
      border-radius: var(--radius);
    }

    .threadShell {
      border-radius: var(--radius-lg);
      padding: 8px;
    }
  }
</style>

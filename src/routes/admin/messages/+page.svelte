<script lang="ts">
  import AdminNav from '$lib/components/AdminNav.svelte';
  import MessageThread from '$lib/components/MessageThread.svelte';
</script>

<svelte:head>
  <title>Mesaje - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="admin-page">
  <section class="hero">
    <div>
      <p class="eyebrow">Suport clienți</p>
      <h1>Mesaje</h1>
      <p>Inbox pentru conversațiile dintre utilizatori și administratori. Caută, filtrează, răspunde și actualizează statusul conversațiilor.</p>
    </div>
    <div class="heroIcon" aria-hidden="true"><i class="bi bi-chat-dots"></i></div>
  </section>

  <section class="threadShell">
    <MessageThread mode="admin" expanded={true} collapsible={false} title="Inbox suport" subtitle="Caută, filtrează, răspunde și schimbă statusul conversațiilor." />
  </section>
</div>

<style>
  .admin-page {
    --bg: #f6f1e7;
    --surface: #fffdf7;
    --ink: #1d241b;
    --muted: #6b7165;
    --line: rgba(31, 42, 28, 0.12);
    --accent: #274f2a;
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(18px, 3vw, 34px);
    background:
      radial-gradient(900px 420px at 8% -5%, rgba(139, 212, 80, 0.22), transparent 60%),
      var(--bg);
    color: var(--ink);
  }

  .hero {
    border: 1px solid var(--line);
    border-radius: 30px;
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

  .eyebrow {
    margin: 0 0 8px;
    color: #bdf48a;
    font-size: 0.75rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    font-weight: 950;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 7vw, 4.6rem);
    line-height: 0.94;
    letter-spacing: -0.07em;
    font-weight: 950;
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
    border-radius: 26px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    font-size: 2rem;
  }

  .threadShell {
    border: 1px solid var(--line);
    border-radius: 30px;
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

  @media (max-width: 991.98px) {
    .admin-page {
      margin-left: 0;
      padding: 88px 16px 24px;
    }
  }

  @media (max-width: 640px) {
    .hero {
      align-items: stretch;
      flex-direction: column;
      border-radius: 24px;
    }

    .heroIcon {
      width: 100%;
      height: 58px;
      border-radius: 18px;
    }

    .threadShell {
      border-radius: 22px;
      padding: 8px;
    }
  }
</style>

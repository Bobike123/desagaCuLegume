<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  let identity = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin(event: Event) {
    event.preventDefault();
    loading = true;
    error = '';

    try {
      await auth.login({ identity, password, requireAdmin: true });
      await goto('/admin/dashboard');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Autentificarea a eșuat.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Autentificare admin - DeSaga</title>
</svelte:head>

<div class="auth">
  <section class="visualPanel" aria-hidden="true">
    <p class="eyebrow">DeSaga</p>
    <h1>Acces administrare</h1>
    <p>Intrare securizată pentru administrarea catalogului, comenzilor și conversațiilor.</p>
  </section>

  <section class="authCard">
    <header>
      <div class="logo"><i class="bi bi-shield-lock"></i></div>
      <div>
        <p class="eyebrow">Autentificare</p>
        <h2>Panou administrare</h2>
      </div>
    </header>

    {#if error}
      <div class="notice" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        <span>{error}</span>
      </div>
    {/if}

    <form on:submit={handleLogin}>
      <label>
        <span>Email sau username</span>
        <div class="inputWrap">
          <i class="bi bi-person"></i>
          <input type="text" bind:value={identity} required autocomplete="username" placeholder="admin@exemplu.ro" disabled={loading} />
        </div>
      </label>

      <label>
        <span>Parolă</span>
        <div class="inputWrap">
          <i class="bi bi-key"></i>
          <input type="password" bind:value={password} required autocomplete="current-password" placeholder="introdu parola" disabled={loading} />
        </div>
      </label>

      <button type="submit" disabled={loading}>
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>
          Se autentifică…
        {:else}
          <i class="bi bi-box-arrow-in-right"></i>
          Autentificare
        {/if}
      </button>
    </form>
  </section>
</div>

<style>
  .auth {
    --bg: #f6f1e7;
    --surface: #fffdf7;
    --ink: #1d241b;
    --muted: #6b7165;
    --line: rgba(31, 42, 28, 0.12);
    --accent: #274f2a;
    min-height: 100vh;
    padding: clamp(16px, 3vw, 34px);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(380px, 520px);
    gap: 18px;
    background:
      radial-gradient(900px 420px at 8% -5%, rgba(139, 212, 80, 0.23), transparent 60%),
      var(--bg);
    color: var(--ink);
  }

  .visualPanel,
  .authCard {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    box-shadow: 0 28px 80px rgba(35, 51, 30, 0.14);
  }

  .visualPanel {
    min-height: calc(100vh - 68px);
    padding: clamp(28px, 6vw, 62px);
    display: flex;
    flex-direction: column;
    justify-content: end;
    background: linear-gradient(135deg, rgba(39, 79, 42, 0.96), rgba(25, 44, 27, 0.94));
    color: #fffdf7;
    overflow: hidden;
    position: relative;
  }

  .visualPanel::before {
    content: '';
    position: absolute;
    inset: -120px -90px auto auto;
    width: 360px;
    height: 360px;
    border-radius: var(--radius-lg);
    background: rgba(139, 212, 80, 0.22);
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #3e6a35;
    font-size: 0.75rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .visualPanel .eyebrow {
    color: #bdf48a;
  }

  h1,
  h2 {
    margin: 0;
    font-weight: 700;
    letter-spacing: -0.065em;
  }

  h1 {
    max-width: 760px;
    font-size: clamp(3rem, 9vw, 7rem);
    line-height: 0.9;
  }

  h2 {
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    color: var(--ink);
  }

  .visualPanel p:not(.eyebrow) {
    max-width: 620px;
    margin: 18px 0 0;
    color: rgba(255, 253, 247, 0.74);
    font-size: clamp(1rem, 2vw, 1.2rem);
  }

  .authCard {
    align-self: center;
    padding: clamp(20px, 4vw, 34px);
    background: rgba(255, 253, 247, 0.92);
  }

  .authCard header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 22px;
  }

  .logo {
    width: 58px;
    height: 58px;
    border-radius: var(--radius-lg);
    display: grid;
    place-items: center;
    color: var(--accent);
    background: rgba(139, 212, 80, 0.22);
    font-size: 1.35rem;
  }

  form {
    display: grid;
    gap: 15px;
  }

  label span {
    display: block;
    margin-bottom: 7px;
    color: var(--ink);
    font-weight: 700;
  }

  .inputWrap {
    position: relative;
  }

  .inputWrap i {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
  }

  input {
    width: 100%;
    min-height: 56px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 0 16px 0 46px;
    background: #fff;
    color: var(--ink);
    font-weight: 600;
  }

  input:focus {
    outline: 3px solid rgba(139, 212, 80, 0.32);
    border-color: rgba(39, 79, 42, 0.42);
  }

  button {
    min-height: 56px;
    border: 0;
    border-radius: var(--radius-sm);
    margin-top: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fffdf7;
    background: var(--accent);
    font-weight: 700;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .notice {
    margin-bottom: 16px;
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff1f1;
    border: 1px solid #facaca;
    color: #842029;
    font-weight: 600;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border-radius: var(--radius-lg);
    border: 2px solid rgba(255, 255, 255, 0.38);
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 900px) {
    .auth {
      grid-template-columns: 1fr;
      align-content: center;
    }

    .visualPanel {
      min-height: auto;
      padding: 28px;
      border-radius: var(--radius-lg);
    }
  }

  @media (max-width: 560px) {
    .auth {
      padding: 12px;
    }

    .visualPanel {
      display: none;
    }

    .authCard {
      border-radius: var(--radius-lg);
    }
  }
</style>

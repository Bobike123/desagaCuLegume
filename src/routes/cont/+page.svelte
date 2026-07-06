
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';

  let mode: 'login' | 'register' = 'login';
  let error = '';
  let loading = false;

  let loginForm = {
    identity: '',
    password: '',
  };

  let registerForm = {
    fullName: '',
    phone: '',
    username: '',
    email: '',
    password: '',
    newsletter: false,
  };

  async function redirectAuthenticatedUser() {
    if ($auth.isAdmin) {
      await goto('/admin/dashboard');
      return;
    }

    if ($auth.isAuthenticated) {
      await goto('/utilizator');
    }
  }

  async function submitLogin(event: Event) {
    event.preventDefault();
    error = '';
    loading = true;

    try {
      await auth.login(loginForm);
      await redirectAuthenticatedUser();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Autentificarea a eșuat.';
    } finally {
      loading = false;
    }
  }

  async function submitRegister(event: Event) {
    event.preventDefault();
    error = '';
    loading = true;

    try {
      await auth.register(registerForm);
      await goto('/utilizator');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Înregistrarea a eșuat.';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await auth.refresh();
    await redirectAuthenticatedUser();
  });
</script>

<svelte:head>
  <title>Cont client - DeSaga cu Legume</title>
  <meta name="description" content="Autentificare sau înregistrare client DeSaga cu Legume." />
</svelte:head>

<section class="account-auth-page">
  <div class="container auth-wrap">
    <div class="auth-copy">
      <p class="eyebrow">Cont client</p>
      <h1>Intră în cont sau creează unul nou</h1>
      <p>
        Contul păstrează comenzile, conversațiile cu adminul și datele necesare pentru checkout.
      </p>

      <div class="benefits">
        <div><i class="bi bi-receipt"></i><span>Istoric comenzi</span></div>
        <div><i class="bi bi-chat-dots"></i><span>Mesaje despre comenzi</span></div>
        <div><i class="bi bi-person-gear"></i><span>Date personale editabile</span></div>
      </div>
    </div>

    <div class="auth-card surface">
      <div class="auth-tabs" role="tablist" aria-label="Autentificare sau înregistrare">
        <button type="button" class:active={mode === 'login'} on:click={() => (mode = 'login')}>
          Am cont
        </button>
        <button type="button" class:active={mode === 'register'} on:click={() => (mode = 'register')}>
          Creez cont
        </button>
      </div>

      {#if error}
        <div class="alert alert-danger" role="alert">{error}</div>
      {/if}

      {#if mode === 'login'}
        <form class="auth-form" on:submit={submitLogin}>
          <label>
            <span>Email sau username</span>
            <input class="form-control form-control-lg" autocomplete="username" bind:value={loginForm.identity} required disabled={loading} />
          </label>

          <label>
            <span>Parolă</span>
            <input class="form-control form-control-lg" type="password" autocomplete="current-password" bind:value={loginForm.password} required disabled={loading} />
          </label>

          <button class="btn btn-primary btn-lg w-100" type="submit" disabled={loading}>
            {loading ? 'Se autentifică…' : 'Intră în cont'}
          </button>
        </form>
      {:else}
        <form class="auth-form" on:submit={submitRegister}>
          <div class="form-grid">
            <label>
              <span>Nume</span>
              <input class="form-control" autocomplete="name" bind:value={registerForm.fullName} required disabled={loading} />
            </label>
            <label>
              <span>Telefon</span>
              <input class="form-control" autocomplete="tel" bind:value={registerForm.phone} required disabled={loading} />
            </label>
          </div>

          <label>
            <span>Username</span>
            <input class="form-control" autocomplete="username" bind:value={registerForm.username} disabled={loading} placeholder="opțional" />
          </label>

          <label>
            <span>Email</span>
            <input class="form-control" type="email" autocomplete="email" bind:value={registerForm.email} required disabled={loading} />
          </label>

          <label>
            <span>Parolă</span>
            <input class="form-control" type="password" autocomplete="new-password" bind:value={registerForm.password} required disabled={loading} />
            <small>Minim 8 caractere, o literă mare și o cifră.</small>
          </label>

          <label class="newsletter-optin">
            <input class="form-check-input" type="checkbox" bind:checked={registerForm.newsletter} disabled={loading} />
            <span>Vreau să primesc noutăți pe email (newsletter). Mă pot dezabona oricând.</span>
          </label>

          <button class="btn btn-primary btn-lg w-100" type="submit" disabled={loading}>
            {loading ? 'Se creează contul…' : 'Creează cont'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</section>

<style>
  .account-auth-page {
    min-height: calc(100vh - 180px);
    display: grid;
    align-items: center;
    padding: clamp(2rem, 6vw, 5rem) 0;
    background:
      radial-gradient(circle at top left, rgba(var(--desaga-accent-rgb), 0.14), transparent 34rem),
      linear-gradient(180deg, #fff, var(--desaga-cream));
  }

  .auth-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 460px);
    gap: clamp(1.5rem, 5vw, 4rem);
    align-items: center;
  }

  .eyebrow {
    color: var(--desaga-blue);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 0.75rem;
  }

  .auth-copy h1 {
    max-width: 680px;
    margin: 0;
    font-size: clamp(2rem, 6vw, 4rem);
    font-weight: 950;
    letter-spacing: -0.045em;
    line-height: 0.98;
    color: var(--desaga-heading);
  }

  .auth-copy p:not(.eyebrow) {
    max-width: 560px;
    margin: 1rem 0 0;
    color: var(--desaga-muted);
    font-size: 1.08rem;
    line-height: 1.55;
  }

  .benefits {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .benefits div {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    width: fit-content;
    padding: 0.65rem 0.85rem;
    border-radius: 999px;
    background: #fff;
    border: 1px solid var(--desaga-border);
    box-shadow: var(--desaga-shadow-sm);
    font-weight: 850;
  }

  .benefits i {
    color: var(--desaga-blue);
  }

  .auth-card {
    padding: 1rem;
  }

  .auth-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.35rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.05);
  }

  .auth-tabs button {
    border: 0;
    border-radius: 999px;
    padding: 0.7rem 0.9rem;
    background: transparent;
    font-weight: 900;
    color: rgba(20, 33, 43, 0.68);
  }

  .auth-tabs button.active {
    background: #fff;
    color: var(--desaga-blue);
    box-shadow: var(--desaga-shadow-sm);
  }

  .auth-form,
  .form-grid {
    display: grid;
    gap: 0.85rem;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  label span {
    display: block;
    margin-bottom: 0.35rem;
    font-weight: 850;
    color: rgba(20, 33, 43, 0.78);
  }

  small {
    display: block;
    margin-top: 0.35rem;
    color: var(--desaga-muted);
  }

  .newsletter-optin {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .newsletter-optin input {
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  .newsletter-optin span {
    margin-bottom: 0;
    font-weight: 500;
    font-size: 0.9rem;
    color: rgba(20, 33, 43, 0.72);
  }


  @media (max-width: 991.98px) {
    .auth-wrap {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 575.98px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .benefits div {
      width: 100%;
      border-radius: var(--desaga-radius-md);
    }
  }
</style>

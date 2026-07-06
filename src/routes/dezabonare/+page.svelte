<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  export let data: { hasToken: boolean };
  export let form: { done?: boolean } | null;

  $: token = $page.url.searchParams.get('token') ?? '';
</script>

<svelte:head>
  <title>Dezabonare newsletter - DeSaga cu Legume</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="unsubscribe-page">
  <div class="container">
    <div class="unsubscribe-card">
      {#if form?.done}
        <i class="bi bi-check-circle-fill success-icon" aria-hidden="true"></i>
        <h1>Ai fost dezabonat</h1>
        <p>Nu vei mai primi emailuri de la newsletterul DeSaga cu Legume.</p>
        <p class="muted">Te-ai răzgândit? Te poți abona din nou oricând din pagina principală.</p>
        <a class="btn btn-primary" href="/">Înapoi la site</a>
      {:else if data.hasToken}
        <h1>Dezabonare newsletter</h1>
        <p>Confirmă că nu mai vrei să primești emailuri cu noutăți de la DeSaga cu Legume.</p>
        <form method="POST" use:enhance>
          <input type="hidden" name="token" value={token} />
          <button class="btn btn-primary" type="submit">Dezabonează-mă</button>
        </form>
      {:else}
        <h1>Link invalid</h1>
        <p>Linkul de dezabonare este incomplet. Folosește linkul din emailul primit.</p>
        <a class="btn btn-primary" href="/">Înapoi la site</a>
      {/if}
    </div>
  </div>
</section>

<style>
  .unsubscribe-page {
    min-height: calc(100vh - 180px);
    display: grid;
    align-items: center;
    padding: clamp(2rem, 6vw, 5rem) 0;
    background:
      radial-gradient(circle at top left, rgba(var(--desaga-accent-rgb), 0.14), transparent 34rem),
      linear-gradient(180deg, #fff, var(--desaga-cream));
  }

  .unsubscribe-card {
    max-width: 32rem;
    margin: 0 auto;
    background: #fff;
    border-radius: var(--desaga-radius-md, 12px);
    box-shadow: var(--desaga-shadow-sm, 0 8px 24px rgba(0, 0, 0, 0.08));
    padding: clamp(1.5rem, 4vw, 2.5rem);
    text-align: center;
  }

  .success-icon {
    font-size: 2.4rem;
    color: #2f9e44;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 950;
    margin: 0.75rem 0;
  }

  p {
    color: rgba(20, 33, 43, 0.78);
  }

  .muted {
    font-size: 0.9rem;
    color: var(--desaga-muted, #6b7280);
  }

  form,
  a.btn {
    margin-top: 1rem;
  }
</style>

<script lang="ts">
  import Hero from '$lib/components/Hero.svelte';

  const phoneHref = 'tel:+40729969822';

  const businessTypes = [
    'Restaurant',
    'Cafenea',
    'Băcănie',
    'Magazin alimentar',
    'Catering',
    'Hotel / pensiune',
    'Alt tip de business',
  ];

  const frequencies = [
    'O singură comandă',
    'Săptămânal',
    'De 2–3 ori pe săptămână',
    'Lunar',
    'În funcție de stoc',
  ];

  let form = {
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    businessType: 'Restaurant',
    city: 'Cluj-Napoca',
    address: '',
    productsNeeded: '',
    estimatedQuantity: '',
    frequency: 'Săptămânal',
    preferredContact: 'phone',
    message: '',
  };

  let submitting = false;
  let success = '';
  let error = '';

  function resetForm() {
    form = {
      businessName: '',
      contactName: '',
      phone: '',
      email: '',
      businessType: 'Restaurant',
      city: 'Cluj-Napoca',
      address: '',
      productsNeeded: '',
      estimatedQuantity: '',
      frequency: 'Săptămânal',
      preferredContact: 'phone',
      message: '',
    };
  }

  async function submitRequest(event: Event) {
    event.preventDefault();
    submitting = true;
    success = '';
    error = '';

    try {
      const res = await fetch('/api/horeca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut trimite cererea HORECA.');

      success = 'Cererea a fost trimisă. Te vom contacta pentru confirmarea stocului și a ofertei.';
      resetForm();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut trimite cererea HORECA.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>HORECA - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Cere ofertă HORECA de la DeSaga cu Legume pentru restaurant, cafenea, băcănie sau magazin local."
  />
</svelte:head>

<Hero
  title="HORECA"
  subtitle="Cereri de ofertă pentru restaurante, cafenele, băcănii și magazine locale. Completează formularul fără cont."
  backgroundImage="/images/horeca/hero-borcane.jpg"
  height="320px"
  eyebrow="Pentru business-uri locale"
  primaryHref="#cerere-horeca"
  primaryLabel="Completează formularul"
  secondaryHref={phoneHref}
  secondaryLabel="Sună direct"
  facts={[
    { icon: '', label: 'Fără login' },
    { icon: '', label: 'Stoc de sezon' },
    { icon: 'bi-telephone', label: '+40 729 969 822', href: phoneHref },
  ]}
/>

<section class="horeca-page py-5">
  <div class="container">
    <div class="intro-card">
      <div>
        <p class="eyebrow mb-2">De la fermă către business-ul tău</p>
        <h2>Ofertă stabilită pe stoc real, sezon și volum</h2>
        <p>
          HORECA este un flux separat pentru cereri de ofertă, discuții directe și comenzi recurente cu DeSaga cu Legume.
        </p>
      </div>
      <div class="intro-actions">
        <a href="#cerere-horeca" class="btn btn-primary btn-lg">
          <i class="bi bi-send"></i> Trimite cerere
        </a>
        <a href={phoneHref} class="btn btn-outline-primary btn-lg">
          <i class="bi bi-telephone"></i> Sună direct
        </a>
      </div>
    </div>

    <div class="features-grid">
      <article class="feature-card">
        <i class="bi bi-basket"></i>
        <h3>Necesar personalizat</h3>
        <p>Scrii ce produse cauți, cantitățile estimate și frecvența dorită.</p>
      </article>
      <article class="feature-card">
        <i class="bi bi-calendar-week"></i>
        <h3>Sezon și disponibilitate</h3>
        <p>Oferta se confirmă în funcție de recoltă, stoc și disponibilitatea locală.</p>
      </article>
      <article class="feature-card">
        <i class="bi bi-truck"></i>
        <h3>Ridicare sau livrare</h3>
        <p>Stabilim împreună soluția potrivită pentru programul și zona ta.</p>
      </article>
      <article class="feature-card">
        <i class="bi bi-chat-dots"></i>
        <h3>Contact direct</h3>
        <p>După trimitere, cererea apare în panoul administratorului.</p>
      </article>
    </div>

    <div class="layout" id="cerere-horeca">
      <form class="request-card" on:submit={submitRequest}>
        <div class="form-head">
          <div>
            <p class="eyebrow mb-2">Cerere ofertă</p>
            <h2>Completează datele business-ului</h2>
            <p>Nu este nevoie de cont. Datele ajung direct în panoul administratorului.</p>
          </div>
        </div>

        {#if success}
          <div class="alert alert-success" role="alert">{success}</div>
        {/if}
        {#if error}
          <div class="alert alert-danger" role="alert">{error}</div>
        {/if}

        <div class="form-grid">
          <label>
            <span>Nume business *</span>
            <input class="form-control" bind:value={form.businessName} required placeholder="Restaurant / magazin / cafenea" />
          </label>

          <label>
            <span>Persoană de contact *</span>
            <input class="form-control" bind:value={form.contactName} required autocomplete="name" />
          </label>

          <label>
            <span>Telefon *</span>
            <input class="form-control" bind:value={form.phone} required autocomplete="tel" />
          </label>

          <label>
            <span>Email</span>
            <input class="form-control" type="email" bind:value={form.email} autocomplete="email" />
          </label>

          <label>
            <span>Tip business</span>
            <select class="form-select" bind:value={form.businessType}>
              {#each businessTypes as type}
                <option value={type}>{type}</option>
              {/each}
            </select>
          </label>

          <label>
            <span>Frecvență estimată</span>
            <select class="form-select" bind:value={form.frequency}>
              {#each frequencies as frequency}
                <option value={frequency}>{frequency}</option>
              {/each}
            </select>
          </label>

          <label>
            <span>Oraș</span>
            <input class="form-control" bind:value={form.city} />
          </label>

          <label>
            <span>Adresă / zonă</span>
            <input class="form-control" bind:value={form.address} placeholder="Opțional" />
          </label>

          <label class="full">
            <span>Produse dorite *</span>
            <textarea
              class="form-control"
              rows="5"
              bind:value={form.productsNeeded}
              required
              placeholder="Ex: roșii, castraveți, ardei, verdețuri, zacuscă, murături..."
            ></textarea>
          </label>

          <label class="full">
            <span>Cantitate estimată</span>
            <input class="form-control" bind:value={form.estimatedQuantity} placeholder="Ex: 10 kg / săptămână, 20 borcane / lună" />
          </label>

          <div class="full contact-choice" role="radiogroup" aria-label="Metodă preferată de contact">
            <div class="choice-title">Cum preferi să fii contactat?</div>
            <label>
              <input type="radio" bind:group={form.preferredContact} value="phone" />
              <span>Telefon</span>
            </label>
            <label>
              <input type="radio" bind:group={form.preferredContact} value="email" />
              <span>Email</span>
            </label>
            <label>
              <input type="radio" bind:group={form.preferredContact} value="whatsapp" />
              <span>WhatsApp</span>
            </label>
          </div>

          <label class="full">
            <span>Mesaj</span>
            <textarea
              class="form-control"
              rows="4"
              bind:value={form.message}
              placeholder="Program, livrare, observații sau alte detalii."
            ></textarea>
          </label>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary btn-lg" type="submit" disabled={submitting}>
            {#if submitting}
              <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              Se trimite…
            {:else}
              <i class="bi bi-send"></i> Trimite cererea
            {/if}
          </button>
          <a class="btn btn-outline-primary btn-lg" href={phoneHref}>
            <i class="bi bi-telephone"></i> Sună acum
          </a>
        </div>
      </form>

      <aside class="side-card">
        <h2>Cum se lucrează</h2>
        <ol class="steps">
          <li><span>1</span><p>Trimiți necesarul și datele de contact.</p></li>
          <li><span>2</span><p>Adminul vede cererea în dashboard.</p></li>
          <li><span>3</span><p>Primești confirmare pentru stoc, preț și livrare.</p></li>
          <li><span>4</span><p>Stabiliți comanda recurentă sau ridicarea punctuală.</p></li>
        </ol>

        <div class="contact-box">
          <strong>Contact rapid</strong>
          <a href={phoneHref}>+40 729 969 822</a>
          <span>Cluj-Napoca, Str. Constantin Brâncuși nr. 153</span>
        </div>
      </aside>
    </div>
  </div>
</section>

<style>
  .horeca-page {
    background: var(--paper);
  }

  .intro-card,
  .request-card,
  .side-card,
  .feature-card {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(var(--desaga-accent-rgb), 0.14);
    background: #fff;
    box-shadow: var(--desaga-shadow-sm);
  }

  .intro-card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    margin-bottom: 20px;
    padding: 22px;
  }

  @media (min-width: 992px) {
    .intro-card {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  .eyebrow {
    color: var(--desaga-blue);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem;
  }

  h2,
  h3 {
    color: var(--ink);
    font-weight: 700;
    letter-spacing: -0.035em;
  }

  .intro-card h2,
  .request-card h2,
  .side-card h2 {
    margin: 0 0 0.55rem;
  }

  .intro-card p,
  .request-card p,
  .feature-card p,
  .steps p,
  .side-card span {
    color: rgba(0, 0, 0, 0.68);
    margin: 0;
  }

  .intro-actions,
  .form-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .feature-card {
    padding: 18px;
  }

  .feature-card i {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: var(--radius);
    color: var(--desaga-blue);
    background: rgba(var(--desaga-accent-rgb), 0.12);
    font-size: 1.2rem;
    margin-bottom: 12px;
  }

  .feature-card h3 {
    font-size: 1.05rem;
    margin: 0 0 0.4rem;
  }

  .layout {
    display: grid;
    gap: 18px;
    align-items: start;
  }

  @media (min-width: 992px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 360px;
    }
  }

  .request-card,
  .side-card {
    padding: 22px;
  }

  .form-head {
    margin-bottom: 18px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  @media (min-width: 768px) {
    .form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  label span,
  .choice-title {
    display: block;
    font-weight: 600;
    color: rgba(20, 33, 43, 0.78);
    margin-bottom: 6px;
  }

  .full {
    grid-column: 1 / -1;
  }

  .contact-choice {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius);
    background: var(--paper-2);
    border: 1px solid var(--line);
  }

  .contact-choice .choice-title {
    width: 100%;
    margin: 0;
  }

  /* The radio glyph itself is only 13px, so the label carries the tap
     target: a full-height row the thumb can actually hit. */
  .contact-choice label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding-inline: var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-weight: 600;
    cursor: pointer;
  }

  .contact-choice label:has(input:checked) {
    border-color: var(--tomato-ink);
    background: var(--tomato-wash);
    color: var(--tomato-deep);
  }

  .contact-choice label:focus-within {
    outline: 2px solid var(--tomato-ink);
    outline-offset: 2px;
  }

  .contact-choice input[type='radio'] {
    width: 18px;
    height: 18px;
    accent-color: var(--tomato-ink);
  }

  .contact-choice label span {
    margin: 0;
  }

  .form-actions {
    margin-top: 18px;
    justify-content: flex-end;
  }

  .steps {
    list-style: none;
    padding: 0;
    margin: 14px 0 0;
    display: grid;
    gap: 12px;
  }

  .steps li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: start;
    padding: 12px;
    border-radius: var(--radius);
    background: rgba(var(--desaga-accent-rgb), 0.06);
  }

  .steps span {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: var(--radius);
    color: #fff;
    background: var(--desaga-blue);
    font-weight: 700;
  }

  .contact-box {
    margin-top: 18px;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--desaga-slate);
    color: #fff;
    display: grid;
    gap: 6px;
  }

  .contact-box a,
  .contact-box span {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: #fff;
    text-decoration: none;
  }

  .contact-box a:hover,
  .contact-box a:focus-visible {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 576px) {
    .intro-actions .btn,
    .form-actions .btn {
      width: 100%;
    }
  }
</style>

<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";

  let formData = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  };

  let submitting = false;
  let submitted = false;
  let error = "";

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    error = "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        error = result?.error || "A apărut o eroare. Încearcă din nou!";
        return;
      }

      submitted = true;
      formData = {
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      };

      setTimeout(() => {
        submitted = false;
      }, 5000);
    } catch (err) {
      error = "Eroare de conexiune. Încearcă din nou!";
      console.error(err);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Contact - DeSaga cu Legume</title>
</svelte:head>

<Hero
  title="Contact"
  subtitle="Alătură-te nouă sau cere informații"
  backgroundImage="/images/contact-hero.jpg"
  height="400px"
/>

<section class="py-5">
  <div class="container">
    <div class="row g-5">
      <!-- Contact Information -->
      <div class="col-lg-4">
        <h2 class="h3 text-brown fw-bold mb-4">
          <i class="bi bi-info-circle"></i> Informații de contact
        </h2>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h5 class="card-title text-green fw-bold mb-3">
              <i class="bi bi-geo-alt"></i> Locație
            </h5>
            <p class="card-text">
              DeSaga cu Legume<br />
              Strada Constantin Brâncuși nr. 155<br />
              Cluj-Napoca, 400489<br />
              România
            </p>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h5 class="card-title text-green fw-bold mb-3">
              <i class="bi bi-telephone"></i> Telefon
            </h5>
            <p class="card-text">
              <a href="tel:+40700000000" class="text-decoration-none">
                +40 700 000 000
              </a>
              <br />
              Luni - Duminică: 08:00 - 20:00
            </p>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h5 class="card-title text-green fw-bold mb-3">
              <i class="bi bi-envelope"></i> Email
            </h5>
            <p class="card-text">
              <a
                href="mailto:desagatech@gmail.com"
                class="text-decoration-none"
              >
                desagatech@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="col-lg-8">
        <h2 class="h3 text-brown fw-bold mb-4">
          <i class="bi bi-pencil-square"></i> Contactează-ne
        </h2>

        {#if submitted}
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle"></i>
            <strong>Mesaj trimis cu succes!</strong> Vom reveni în curând.
          </div>
        {/if}

        {#if error}
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Eroare:</strong>
            {error}
          </div>
        {/if}

        <form on:submit={handleSubmit} class="card border-0 shadow-sm p-4">
          <div class="mb-3">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label text-brown fw-bold">Nume</label>
            <input
              type="text"
              class="form-control"
              bind:value={formData.name}
              required
            />
          </div>

          <div class="mb-3">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label text-brown fw-bold">Email</label>
            <input
              type="email"
              class="form-control"
              bind:value={formData.email}
              required
            />
          </div>

          <div class="mb-3">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label text-brown fw-bold">
              Telefon (opțional)
            </label>
            <input
              type="tel"
              class="form-control"
              bind:value={formData.phone}
            />
          </div>

          <div class="mb-3">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label text-brown fw-bold">Subiect</label>
            <input
              type="text"
              class="form-control"
              bind:value={formData.subject}
              required
            />
          </div>

          <div class="mb-3">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label text-brown fw-bold">Mesaj</label>
            <textarea
              class="form-control"
              rows="5"
              bind:value={formData.message}
              required
            ></textarea>
          </div>

          <div class="d-grid">
            <button
              type="submit"
              class="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {#if submitting}
                Se trimite…
              {:else}
                <i class="bi bi-send"></i> Trimite mesajul
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>

<style>
  .text-brown {
    color: var(--desaga-brown) !important;
  }

  .text-green {
    color: var(--desaga-green) !important;
  }
</style>

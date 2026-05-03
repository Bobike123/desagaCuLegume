<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import EventCard from "$lib/components/EventCard.svelte";

  type EventItem = {
    id: string;
    title: string;
    description: string | null;
    date: string | null;
    location: string | null;
    event_type: string | null;
    image_url: string | null;
    published: boolean | null;
    created_at: string | null;
  };

  type FilterKey = "all" | "upcoming" | "past";

  export let data: { events?: EventItem[] } = { events: [] };

  let currentPage = 1;
  let filterKey: FilterKey = "all";

  const pageSize = 9;

  function parseEventDate(event: EventItem) {
    const value = String(event.date ?? "").trim();
    if (!value) return null;

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const localDate = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isFinite(localDate.getTime()) ? localDate : null;
    }

    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  function eventDayTimestamp(event: EventItem) {
    const date = parseEventDate(event);
    if (!date) return null;

    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  }

  function eventSortTimestamp(event: EventItem) {
    const date = parseEventDate(event);
    return date ? date.getTime() : null;
  }

  function todayTimestamp() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }

  function isPastEvent(event: EventItem) {
    const timestamp = eventDayTimestamp(event);
    return timestamp !== null && timestamp < todayTimestamp();
  }

  function isUpcomingEvent(event: EventItem) {
    const timestamp = eventDayTimestamp(event);
    return timestamp !== null && timestamp >= todayTimestamp();
  }

  function sortEvents(a: EventItem, b: EventItem) {
    const aDay = eventDayTimestamp(a);
    const bDay = eventDayTimestamp(b);

    if (aDay === null && bDay === null) {
      return String(a.title ?? "").localeCompare(String(b.title ?? ""), "ro");
    }

    if (aDay === null) return 1;
    if (bDay === null) return -1;

    const aPast = isPastEvent(a);
    const bPast = isPastEvent(b);

    if (aPast !== bPast) return aPast ? 1 : -1;

    const aSort = eventSortTimestamp(a) ?? aDay;
    const bSort = eventSortTimestamp(b) ?? bDay;

    if (aPast && bPast) return bSort - aSort;
    return aSort - bSort;
  }

  function selectFilter(next: FilterKey) {
    filterKey = next;
    currentPage = 1;
  }

  $: allEvents = (data?.events ?? []).filter((event) => String(event?.title ?? "").trim().length > 0);

  $: visibleEvents = [...allEvents]
    .filter((event) => {
      if (filterKey === "upcoming") return isUpcomingEvent(event);
      if (filterKey === "past") return isPastEvent(event);
      return true;
    })
    .sort(sortEvents);

  $: totalPages = Math.max(1, Math.ceil(visibleEvents.length / pageSize));
  $: if (currentPage > totalPages) currentPage = totalPages;
  $: paginatedEvents = visibleEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  $: upcomingCount = allEvents.filter((event) => isUpcomingEvent(event)).length;
  $: pastCount = allEvents.filter((event) => isPastEvent(event)).length;
</script>

<svelte:head>
  <title>Evenimente - DeSaga cu Legume</title>
  <meta
    name="description"
    content="Evenimente DeSaga cu Legume: târguri, degustări, ateliere și activități locale."
  />
</svelte:head>

<Hero
  title="Evenimente"
  subtitle="Târguri, degustări și întâlniri locale"
  backgroundImage=""
  height="320px"
/>

<section class="events-page">
  <div class="container">
    <div class="intro-card">
      <div>
        <span class="eyebrow"><i class="bi bi-calendar-event"></i> Comunitatea DeSaga</span>
        <h1>Evenimente și activități</h1>
        <p>
          Aici apar târgurile, degustările și întâlnirile unde poți descoperi produsele
          DeSaga și oamenii din spatele lor.
        </p>
      </div>

      <div class="intro-actions">
        <a class="btn btn-accent" href="/contact">
          <i class="bi bi-chat-dots"></i> Întreabă despre următorul eveniment
        </a>
        <a class="btn btn-outline-accent" href="tel:+40729969822">
          <i class="bi bi-telephone"></i> Sună
        </a>
      </div>
    </div>

    <div class="toolbar">
      <div class="filter-group" aria-label="Filtru evenimente">
        <button
          type="button"
          class="filter-chip"
          class:active={filterKey === "all"}
          aria-pressed={filterKey === "all"}
          on:click={() => selectFilter("all")}
        >
          <i class="bi bi-grid-3x3-gap"></i>
          <span>Toate</span>
        </button>

        <button
          type="button"
          class="filter-chip"
          class:active={filterKey === "upcoming"}
          aria-pressed={filterKey === "upcoming"}
          on:click={() => selectFilter("upcoming")}
        >
          <i class="bi bi-calendar-check"></i>
          <span>Evenimente viitoare</span>
        </button>

        <button
          type="button"
          class="filter-chip"
          class:active={filterKey === "past"}
          aria-pressed={filterKey === "past"}
          on:click={() => selectFilter("past")}
        >
          <i class="bi bi-clock-history"></i>
          <span>Evenimente trecute</span>
        </button>
      </div>

      <div class="counts" aria-label="Rezumat evenimente">
        <span><strong>{upcomingCount}</strong> viitoare</span>
        <span><strong>{pastCount}</strong> trecute</span>
      </div>
    </div>

    {#if allEvents.length === 0}
      <div class="empty-state">
        <div class="empty-icon"><i class="bi bi-calendar2-plus"></i></div>
        <div>
          <h2>Nu avem evenimente publicate momentan</h2>
          <p>
            Urmărește pagina sau contactează-ne pentru următorul târg, atelier sau degustare.
          </p>
          <div class="empty-actions">
            <a class="btn btn-accent" href="/contact">
              <i class="bi bi-chat-dots"></i> Contact
            </a>
            <a class="btn btn-outline-accent" href="/produse">
              <i class="bi bi-basket"></i> Vezi produsele
            </a>
          </div>
        </div>
      </div>
    {:else if visibleEvents.length === 0}
      <div class="empty-state">
        <div class="empty-icon"><i class="bi bi-funnel"></i></div>
        <div>
          <h2>Nu există evenimente în acest filtru</h2>
          <p>Schimbă filtrul pentru a vedea celelalte evenimente publicate.</p>
          <button class="btn btn-outline-accent" type="button" on:click={() => selectFilter("all")}>
            Vezi toate evenimentele
          </button>
        </div>
      </div>
    {:else}
      <div class="events-grid" aria-label="Lista evenimentelor">
        {#each paginatedEvents as event (event.id)}
          <EventCard {event} />
        {/each}
      </div>

      {#if totalPages > 1}
        <nav class="pagination-wrap" aria-label="Paginare evenimente">
          <button
            class="page-button"
            type="button"
            on:click={() => currentPage > 1 && (currentPage -= 1)}
            disabled={currentPage === 1}
          >
            <i class="bi bi-chevron-left"></i>
            Anterior
          </button>

          <div class="page-numbers">
            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
              <button
                class="page-number"
                class:active={currentPage === page}
                type="button"
                aria-current={currentPage === page ? "page" : undefined}
                on:click={() => (currentPage = page)}
              >
                {page}
              </button>
            {/each}
          </div>

          <button
            class="page-button"
            type="button"
            on:click={() => currentPage < totalPages && (currentPage += 1)}
            disabled={currentPage === totalPages}
          >
            Următoare
            <i class="bi bi-chevron-right"></i>
          </button>
        </nav>
      {/if}
    {/if}
  </div>
</section>

<style>
  :global(:root) {
    --accent: var(--desaga-blue, #2492cc);
    --accent-rgb: 36, 146, 204;
  }

  .events-page {
    padding: 2.5rem 0 3.5rem;
    background:
      radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.08), transparent 28rem),
      #f8fafc;
  }

  .intro-card {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding: 1.35rem;
    border-radius: 24px;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.07);
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
    margin-bottom: 1rem;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent);
    font-weight: 900;
    font-size: 0.84rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.45rem;
  }

  .intro-card h1 {
    margin: 0;
    color: var(--desaga-brown);
    font-weight: 950;
    letter-spacing: -0.035em;
  }

  .intro-card p {
    max-width: 46rem;
    margin: 0.45rem 0 0;
    color: rgba(15, 23, 42, 0.68);
    line-height: 1.55;
  }

  .intro-actions,
  .empty-actions {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin: 1rem 0 1.2rem;
  }

  .filter-group {
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .filter-chip {
    border: 1px solid rgba(15, 23, 42, 0.09);
    background: #fff;
    color: rgba(15, 23, 42, 0.76);
    border-radius: 999px;
    padding: 0.58rem 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
  }

  .filter-chip.active,
  .filter-chip:hover,
  .filter-chip:focus {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.1);
    border-color: rgba(var(--accent-rgb), 0.3);
  }

  .counts {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
    color: rgba(15, 23, 42, 0.65);
    font-weight: 800;
    font-size: 0.92rem;
  }

  .counts span {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.07);
    border-radius: 999px;
    padding: 0.45rem 0.7rem;
  }

  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 18px;
  }

  .empty-state {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 22px;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.07);
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.1);
  }

  .empty-state h2 {
    margin: 0;
    color: var(--desaga-brown);
    font-size: 1.15rem;
    font-weight: 950;
  }

  .empty-state p {
    margin: 0.35rem 0 1rem;
    color: rgba(15, 23, 42, 0.68);
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-top: 2rem;
  }

  .page-numbers {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .page-button,
  .page-number {
    min-height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #fff;
    color: rgba(15, 23, 42, 0.76);
    font-weight: 900;
  }

  .page-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 0.9rem;
  }

  .page-number {
    min-width: 40px;
  }

  .page-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-number.active,
  .page-button:not(:disabled):hover,
  .page-button:not(:disabled):focus,
  .page-number:hover,
  .page-number:focus {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
  }

  :global(.btn-accent) {
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    color: #fff !important;
    font-weight: 900;
    box-shadow: 0 10px 22px rgba(var(--accent-rgb), 0.2);
  }

  :global(.btn-accent:hover),
  :global(.btn-accent:focus) {
    filter: brightness(0.95);
  }

  :global(.btn-outline-accent) {
    border-color: rgba(var(--accent-rgb), 0.45) !important;
    color: var(--accent) !important;
    font-weight: 900;
  }

  :global(.btn-outline-accent:hover),
  :global(.btn-outline-accent:focus) {
    background: rgba(var(--accent-rgb), 0.1) !important;
    border-color: rgba(var(--accent-rgb), 0.7) !important;
    color: var(--accent) !important;
  }

  @media (max-width: 576px) {
    .events-page {
      padding-top: 1.5rem;
    }

    .intro-card,
    .empty-state {
      border-radius: 18px;
      padding: 1rem;
    }

    .empty-state {
      display: block;
    }

    .empty-icon {
      margin-bottom: 0.75rem;
    }

    .intro-actions,
    .empty-actions,
    .intro-actions :global(.btn),
    .empty-actions :global(.btn) {
      width: 100%;
    }
  }
</style>
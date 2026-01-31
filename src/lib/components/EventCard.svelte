<!-- FILE: src/lib/components/EventCard.svelte -->
<script lang="ts">
  interface Event {
    id: string;
    title: string;
    description: string;
    date: string | Date;
    location: string;
    event_type: string;
    image_url?: string;
  }

  export let event: Event = {
    id: "",
    title: "",
    description: "",
    image_url: "",
    date: new Date(),
    location: "",
    event_type: "festival",
  };

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "piata":
        return "🏪 Piață";
      case "festival":
        return "🎉 Festival";
      case "atelier":
        return "🎨 Atelier";
      default:
        return type;
    }
  };
</script>

<a href={`/evenimente/${event.id}`} class="event-card">
  <img
    src={event.image_url || "/placeholder.png"}
    alt={event.title}
    class="event-image"
  />

  <div class="card-body">
    <div class="top">
      <h5 class="event-title">{event.title}</h5>

      <span class="event-type">{getEventTypeLabel(event.event_type)}</span>

      <p class="event-description">
        {event.description || "Eveniment organizat de DeSaga"}
      </p>
    </div>

    <div class="bottom">
      <div class="meta">
        <span>
          <i class="bi bi-calendar-event"></i>
          {formatDate(event.date)}
        </span>
        <span>
          <i class="bi bi-geo-alt"></i>
          {event.location}
        </span>
      </div>

      <span class="cta">
        Vezi detalii <i class="bi bi-arrow-right"></i>
      </span>
    </div>
  </div>
</a>

<style>
  /* === CARD === */
  .event-card {
    width: 360px;
    height: 380px;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    flex-shrink: 0;
  }

  .event-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.14);
  }

  /* === IMAGE === */
  .event-image {
    height: 170px;
    width: 100%;
    object-fit: cover;
    flex-shrink: 0;
  }

  /* === BODY === */
  .card-body {
    flex: 1;
    padding: 14px;
    display: flex;
    flex-direction: column;
  }

  .top {
    flex: 1;
  }

  .bottom {
    margin-top: 10px;
  }

  /* === TEXT === */
  .event-type {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(var(--accent-rgb, 36, 146, 204), 0.12);
    color: var(--accent, #2492cc);
    margin-bottom: 8px;
  }

  .event-title {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0 0 6px;
    line-height: 1.25;
    color: #222;
  }

  .event-description {
    font-size: 0.9rem;
    color: #666;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
    color: #555;
  }

  .meta i {
    margin-right: 6px;
    color: var(--accent, #2492cc);
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--accent, #2492cc);
  }

  /* === MOBILE === */
  @media (max-width: 576px) {
    .event-card {
      width: 320px;
      height: 360px;
    }

    .event-image {
      height: 150px;
    }
  }
</style>

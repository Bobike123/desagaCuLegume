<script lang="ts">
  interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    event_type: string;
    image_url?: string;
  }

  export let event: Event = {
    id: "",
    title: "",
    description: "",
    image_url: "/images/placeholder.jpg",
    date: "",
    location: "",
    event_type: "festival",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO");
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

<div class="event-card card h-100">
  <img
    src={event.image_url || "/images/placeholder.jpg"}
    alt={event.title}
    class="event-image card-img-top"
  />

  <div class="card-body d-flex flex-column">
    <h5 class="event-title card-title">{event.title}</h5>

    <p class="card-text text-secondary grow">{event.description}</p>

    <div class="mt-3">
      <p class="event-date mb-2">
        <i class="bi bi-calendar-event"></i>
        {formatDate(event.date)}
      </p>

      <p class="event-location mb-2">
        <i class="bi bi-geo-alt"></i>
        {event.location}
      </p>

      <span class="event-type badge bg-brown">
        {getEventTypeLabel(event.event_type)}
      </span>
    </div>

    <a href="/evenimente/{event.id}" class="btn btn-primary btn-sm mt-3">
      Vezi detalii
    </a>
  </div>
</div>

<style>
  .event-card {
    border-color: var(--desaga-border);
    transition: all 0.3s ease;
  }

  .event-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .event-image {
    height: 200px;
    object-fit: cover;
  }

  .event-title {
    color: var(--desaga-brown);
    font-weight: bold;
  }

  .event-date {
    color: var(--desaga-green);
    font-weight: bold;
  }

  .event-location {
    color: var(--desaga-text);
  }

  .event-type {
    background-color: var(--desaga-brown) !important;
    color: white;
  }

  .bg-brown {
    background-color: var(--desaga-brown) !important;
  }
</style>

<script lang="ts">
  import { fallbackImage, optimizedImageUrl, PLACEHOLDER_IMAGE } from '$lib/images';

  type EventCardItem = {
    id: string;
    title: string;
    description?: string | null;
    date?: string | Date | null;
    location?: string | null;
    event_type?: string | null;
    image_url?: string | null;
  };

  export let event: EventCardItem = {
    id: '',
    title: '',
    description: '',
    image_url: '',
    date: null,
    location: '',
    event_type: 'festival',
  };

  function validDate(value: string | Date | null | undefined) {
    if (!value) return null;

    const date = typeof value === 'string' ? new Date(value) : value;
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value: string | Date | null | undefined) {
    const date = validDate(value);
    if (!date) return 'Data se anunță curând';

    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function isPast(value: string | Date | null | undefined) {
    const date = validDate(value);
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }

  function getEventTypeLabel(type: string | null | undefined) {
    switch (type) {
      case 'piata':
        return { label: 'Piață', icon: 'bi-shop' };
      case 'atelier':
        return { label: 'Atelier', icon: 'bi-brush' };
      case 'degustare':
        return { label: 'Degustare', icon: 'bi-cup-hot' };
      case 'festival':
        return { label: 'Festival', icon: 'bi-stars' };
      default:
        return { label: type ? String(type) : 'Eveniment', icon: 'bi-calendar-event' };
    }
  }

  $: title = String(event?.title ?? '').trim() || 'Eveniment DeSaga';
  $: description = String(event?.description ?? '').trim() || 'Detaliile evenimentului vor fi actualizate în curând.';
  $: location = String(event?.location ?? '').trim() || 'Locația se anunță curând';
  $: imageUrl = String(event?.image_url ?? '').trim() || PLACEHOLDER_IMAGE;
  $: cardImageUrl = imageUrl === PLACEHOLDER_IMAGE ? imageUrl : optimizedImageUrl(imageUrl, { width: 760, height: 520 });
  $: typeMeta = getEventTypeLabel(event?.event_type);
  $: statusLabel = isPast(event?.date) ? 'Trecut' : 'Urmează';
</script>

<a href={`/evenimente/${event.id}`} class="event-card" aria-label={`Vezi detalii pentru ${title}`}>
  <div class="media">
    <img
      src={cardImageUrl}
      alt={title}
      class="event-image"
      loading="lazy"
      decoding="async"
      on:error={fallbackImage}
    />

    <div class="badges">
      <span class="badge badge-type">
        <i class={'bi ' + typeMeta.icon}></i>
        {typeMeta.label}
      </span>
      <span class={`badge ${statusLabel === 'Urmează' ? 'badge-active' : 'badge-muted'}`}>
        {statusLabel}
      </span>
    </div>
  </div>

  <div class="card-body">
    <div class="top">
      <h3 class="event-title">{title}</h3>
      <p class="event-description">{description}</p>
    </div>

    <div class="bottom">
      <div class="meta">
        <span>
          <i class="bi bi-calendar-event"></i>
          {formatDate(event?.date)}
        </span>
        <span>
          <i class="bi bi-geo-alt"></i>
          {location}
        </span>
      </div>

      <span class="cta">
        Vezi detalii <i class="bi bi-arrow-right"></i>
      </span>
    </div>
  </div>
</a>

<style>
  .event-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: inherit;
    text-decoration: none;
    overflow: hidden;
    transition: border-color var(--motion-fast) var(--ease);
  }

  @media (hover: hover) and (pointer: fine) {
    .event-card:hover {
      border-color: var(--line-strong);
    }

    .event-card:hover .cta {
      color: var(--tomato-deep);
      text-decoration: underline;
    }
  }

  .event-card:focus-visible {
    outline: 2px solid var(--tomato-ink);
    outline-offset: 2px;
  }

  .media {
    position: relative;
    background: var(--paper-2);
  }

  .event-image {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    outline: none;
  }

  .badges {
    position: absolute;
    left: var(--space-2);
    bottom: var(--space-2);
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: calc(100% - var(--space-4));
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.45rem;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--line-strong);
    color: var(--ink-2);
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
  }

  .badge-type {
    background: var(--ink);
    border-color: var(--ink);
    color: #fff;
  }

  /* Upcoming events are the ones worth acting on, so only that state gets
     colour. Past events stay neutral. */
  .badge-active {
    background: var(--leaf-wash);
    border-color: rgba(47, 107, 58, 0.3);
    color: var(--leaf);
  }

  .badge-muted {
    color: var(--ink-3);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .top {
    min-height: 0;
  }

  .event-title {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 700;
    line-height: var(--leading-snug);
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-description {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    color: var(--ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .bottom {
    margin-top: auto;
  }

  .meta {
    display: grid;
    gap: var(--space-1);
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--ink-2);
  }

  .meta span {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    min-width: 0;
  }

  .meta i {
    color: var(--ink-3);
    flex: 0 0 auto;
    margin-top: 2px;
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--tomato-ink);
  }
</style>

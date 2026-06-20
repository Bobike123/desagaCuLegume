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
      <h5 class="event-title">{title}</h5>
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
    width: 100%;
    min-height: 390px;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    overflow: hidden;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    text-decoration: none;
    color: inherit;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease,
      border-color 0.16s ease;
  }

  .event-card:hover,
  .event-card:focus {
    transform: translateY(-3px);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
    border-color: rgba(var(--accent-rgb, 36, 146, 204), 0.25);
    color: inherit;
  }

  .media {
    position: relative;
    height: 180px;
    background: rgba(15, 23, 42, 0.04);
    overflow: hidden;
  }

  .event-image {
    height: 100%;
    width: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.18s ease;
  }

  .event-card:hover .event-image,
  .event-card:focus .event-image {
    transform: scale(1.03);
  }

  .badges {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 0.32rem 0.62rem;
    font-size: 0.76rem;
    font-weight: 900;
    border: 1px solid rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(6px);
  }

  .badge-type {
    color: var(--accent, #2492cc);
    background: rgba(255, 255, 255, 0.92);
  }

  .badge-active {
    color: #146c43;
    background: rgba(209, 231, 221, 0.94);
    border-color: rgba(25, 135, 84, 0.18);
  }

  .badge-muted {
    color: rgba(15, 23, 42, 0.65);
    background: rgba(255, 255, 255, 0.88);
  }

  .card-body {
    flex: 1;
    padding: 15px;
    display: flex;
    flex-direction: column;
  }

  .top {
    flex: 1;
  }

  .bottom {
    margin-top: 12px;
  }

  .event-title {
    font-size: 1.08rem;
    font-weight: 950;
    margin: 0 0 8px;
    line-height: 1.25;
    color: var(--desaga-brown, #5c4033);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-description {
    margin: 0;
    font-size: 0.92rem;
    color: rgba(15, 23, 42, 0.68);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    display: grid;
    gap: 6px;
    font-size: 0.88rem;
    color: rgba(15, 23, 42, 0.68);
  }

  .meta span {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    min-width: 0;
  }

  .meta i {
    color: var(--accent, #2492cc);
    margin-top: 2px;
    flex: 0 0 auto;
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: 0.9rem;
    font-weight: 950;
    color: var(--accent, #2492cc);
  }

  @media (max-width: 576px) {
    .event-card {
      min-height: 360px;
    }

    .media {
      height: 158px;
    }
  }
</style>

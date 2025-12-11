<script lang="ts">
  import type { Noutate } from "$lib/stores/noutati";

  export let noutate: Noutate = {
    id: "",
    title: "",
    excerpt: "",
    content: "",
    image_url: "/images/placeholder.jpg",
    created_at: new Date(),
    author_id: "",
    published: true,
  };

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString("ro-RO");
  };
</script>

<div class="news-card card h-100">
  <img
    src={noutate.image_url}
    alt={noutate.title}
    class="news-image card-img-top"
  />
  <div class="card-body d-flex flex-column">
    <h5 class="news-title card-title">{noutate.title}</h5>
    <p class="news-excerpt card-text grow">{noutate.excerpt}</p>
    <div class="d-flex justify-content-between align-items-center mt-3">
      <small class="news-meta text-secondary"
        ><i class="bi bi-calendar"></i> {formatDate(noutate.created_at)}</small
      >
      <a href="/noutati/{noutate.id}" class="btn btn-sm btn-primary">Citeste</a>
    </div>
  </div>
</div>

<style>
  .news-card {
    border-color: var(--desaga-border);
    transition: all 0.3s ease;
  }
  .news-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  .news-image {
    height: 200px;
    object-fit: cover;
  }
  .news-title {
    color: #5e5240;
    font-weight: bold;
  }
  .news-excerpt {
    color: #333333;
    font-size: 0.95rem;
  }
  .news-meta {
    color: #333333;
    font-size: 0.85rem;
  }
</style>

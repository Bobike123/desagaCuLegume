<script lang="ts">
  import type { Product } from "$lib/stores/products";

  export let product: Product = {
    id: "",
    title: "",
    description: "",
    price: 0,
    image_url: "/images/placeholder.jpg",
    category: "de-sezon",
  };
</script>

<div class="product-card card">
  <img
    src={product.image_url}
    alt={product.title}
    class="product-image card-img-top"
  />
  <div class="card-body">
    <h5 class="product-name card-title">{product.title}</h5>
    <p class="product-category badge">
      {product.category === "de-sezon"
        ? "🌱 De Sezon"
        : product.category === "la-borcan"
          ? "🫙 La Borcan"
          : product.category === "colaboratori"
            ? "🤝 Colaboratori"
            : "🍽️ HORECA"}
    </p>
    <p class="card-text text-secondary">
      {product.description || "Produs de calitate"}
    </p>
    {#if product.price !== undefined}
      <p class="product-price mb-3">{product.price.toFixed(2)} RON</p>
    {/if}
    <div class="d-grid gap-2">
      <a href="/produse/{product.id}" class="btn btn-primary"
        ><i class="bi bi-eye"></i> Vezi detalii</a
      >
    </div>
  </div>
</div>

<style>
  .product-card {
    border-color: var(--desaga-border);
    transition: all 0.3s ease;
  }
  .product-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-4px);
  }
  .product-image {
    height: 250px;
    object-fit: cover;
  }
  .product-name {
    color: #5e5240;
    font-weight: bold;
  }
  .product-price {
    color: #066423;
    font-weight: bold;
    font-size: 1.3rem;
  }
  .product-category {
    background-color: #ffffff;
    color: #5e5240;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
</style>

<script lang="ts">
  import type { Product } from "$lib/stores/products";

  // Canonical empty Product that matches the interface (no missing fields).
  const EMPTY_PRODUCT: Product = {
    id: "",
    name: "",
    description: "",
    category: "de-sezon",
    price: 0,
    image_url: "",
    in_stock: false,
    created_at: undefined,
    updated_at: undefined,
  };

  export let product: Product = EMPTY_PRODUCT;

  // Defensive display values (prevents runtime issues if API returns bad/null data).
  $: name = product?.name ?? "";
  $: imageUrl = product?.image_url || "/placeholder.png";
  $: price =
    typeof product?.price === "number"
      ? product.price
      : Number(product?.price ?? 0);

  $: categoryLabel =
    product?.category === "de-sezon"
      ? "🌱 De Sezon"
      : product?.category === "la-borcan"
        ? "🫙 La Borcan"
        : product?.category === "colaboratori"
          ? "🤝 Colaboratori"
          : "🍽️ HORECA";
</script>

<div class="product-card card">
  <img src={imageUrl} alt={name} class="product-image card-img-top" />
  <div class="card-body">
    <h5 class="product-name card-title">{name}</h5>

    <p class="product-category badge">{categoryLabel}</p>

    <p class="card-text text-secondary">
      {product.description || "Produs de calitate"}
    </p>

    <p class="product-price mb-3">{price.toFixed(2)} RON</p>

    <div class="d-grid gap-2">
      <a href={`/produse/${product.id}`} class="btn btn-primary">
        <i class="bi bi-eye"></i> Vezi detalii
      </a>
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

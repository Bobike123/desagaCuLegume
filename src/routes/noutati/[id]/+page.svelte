<!-- src/routes/noutati/[id]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import {
    getAllNoutati,
    type NewsItem,
    type Noutate,
  } from "$lib/stores/noutati";

  // Backward compat: some files use Noutate, some use NewsItem
  type Item = NewsItem | Noutate;

  let noutate: Item | null = null;
  let related: Item[] = [];
  let all: Item[] = [];
  let error = "";

  function toIsoString(value: unknown): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  onMount(async () => {
    try {
      const id = $page.params.id;

      const raw = await getAllNoutati();

      // normalize created_at to string so TS matches NewsItem
      all = raw.map((x: any) => ({
        ...x,
        created_at: toIsoString(x.created_at),
        updated_at: toIsoString(x.updated_at),
      })) as Item[];

      const found = all.find((x: any) => x.id === id);
      if (!found) {
        error = "Noutate not found";
        return;
      }

      noutate = found;

      // simple related: latest 4 excluding current
      related = all.filter((x: any) => x.id !== id).slice(0, 4);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  });
</script>

<svelte:head>
  <title>{noutate?.title ?? "Noutate"} - DeSaga cu Legume</title>
</svelte:head>

{#if error}
  <div class="alert alert-danger">{error}</div>
{:else if !noutate}
  <div class="text-center py-5">Se încarcă...</div>
{:else}
  <div class="container py-5">
    <h1 class="h2 fw-bold mb-3">{noutate.title}</h1>

    {#if noutate.created_at}
      <p class="text-secondary small mb-4">
        {new Date(noutate.created_at).toLocaleDateString("ro-RO")}
      </p>
    {/if}

    {#if noutate.image_url}
      <img
        src={noutate.image_url}
        alt={noutate.title}
        class="img-fluid rounded mb-4"
      />
    {/if}

    {#if noutate.excerpt}
      <p class="lead">{noutate.excerpt}</p>
    {/if}

    {#if noutate.content}
      <div class="mt-4" style="white-space: pre-wrap;">{noutate.content}</div>
    {/if}

    {#if related.length > 0}
      <hr class="my-5" />
      <h2 class="h4 fw-bold mb-3">Alte noutăți</h2>
      <ul>
        {#each related as r (r.id)}
          <li><a href={`/noutati/${r.id}`}>{r.title}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

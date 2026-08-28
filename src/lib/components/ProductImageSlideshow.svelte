<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { fallbackImage, optimizedImageUrl, PLACEHOLDER_IMAGE } from '$lib/images';

  type ImageLike =
    | string
    | {
        url?: string | null;
        image_url?: string | null;
        alt?: string | null;
        alt_text?: string | null;
      };

  type NormalizedImage = {
    url: string;
    alt: string;
  };

  export let images: ImageLike[] = [];
  export let alt = 'Produs';
  export let variant: 'card' | 'detail' | 'cart' = 'detail';
  export let interactive = true;
  export let intervalMs = 3600;
  export let resumeAfterMs = 60_000;

  let activeIndex = 0;
  let slideDirection: 1 | -1 = 1;
  let pausedByUser = false;
  let mounted = false;

  let slideTimer: number | null = null;
  let resumeTimer: number | null = null;
  let lastSignature = '';

  function imageUrlOf(image: ImageLike) {
    if (typeof image === 'string') return image.trim();
    return String(image?.url ?? image?.image_url ?? '').trim();
  }

  function imageAltOf(image: ImageLike, index: number) {
    if (typeof image === 'string') return alt || `Imagine produs ${index + 1}`;
    return String(image?.alt ?? image?.alt_text ?? (alt || `Imagine produs ${index + 1}`)).trim();
  }

  function uniqueImages(value: ImageLike[]) {
    const seen = new Set<string>();
    const next: NormalizedImage[] = [];

    for (const image of value ?? []) {
      const url = imageUrlOf(image);
      if (!url || seen.has(url)) continue;

      seen.add(url);
      next.push({
        url,
        alt: imageAltOf(image, next.length)
      });
    }

    return next.length > 0 ? next : [{ url: PLACEHOLDER_IMAGE, alt }];
  }

  function displayUrl(url: string) {
    if (url === PLACEHOLDER_IMAGE) return url;

    if (variant === 'detail') {
      return optimizedImageUrl(url, {
        width: 1200,
        height: 980,
        quality: 82
      });
    }

    if (variant === 'cart') {
      return optimizedImageUrl(url, {
        width: 180,
        height: 180,
        quality: 78
      });
    }

    return optimizedImageUrl(url, {
      width: 720,
      height: 540,
      quality: 78
    });
  }

  function clearSlideTimer() {
    if (slideTimer !== null) {
      window.clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  function clearResumeTimer() {
    if (resumeTimer !== null) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function setActiveImage(index: number, direction: 1 | -1 = 1) {
    if (normalizedImages.length === 0) return;

    const nextIndex = (index + normalizedImages.length) % normalizedImages.length;
    if (nextIndex === activeIndex) return;

    slideDirection = direction;
    activeIndex = nextIndex;
  }

  function startAuto() {
    clearSlideTimer();

    if (!mounted || pausedByUser || normalizedImages.length <= 1) return;

    slideTimer = window.setInterval(() => {
      setActiveImage(activeIndex + 1, 1);
    }, intervalMs);
  }

  function pauseForUser() {
    if (!mounted || !interactive || normalizedImages.length <= 1) return;

    pausedByUser = true;
    clearSlideTimer();
    clearResumeTimer();

    resumeTimer = window.setTimeout(() => {
      pausedByUser = false;
      startAuto();
    }, resumeAfterMs);
  }

  function recordActivity() {
    if (!pausedByUser) return;

    clearResumeTimer();

    resumeTimer = window.setTimeout(() => {
      pausedByUser = false;
      startAuto();
    }, resumeAfterMs);
  }

  function selectImage(index: number) {
    if (!interactive) return;

    setActiveImage(index, index > activeIndex ? 1 : -1);
    pauseForUser();
  }

  function previousImage() {
    if (!interactive || normalizedImages.length <= 1) return;

    setActiveImage(activeIndex - 1, -1);
    pauseForUser();
  }

  function nextImage() {
    if (!interactive || normalizedImages.length <= 1) return;

    setActiveImage(activeIndex + 1, 1);
    pauseForUser();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previousImage();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextImage();
      return;
    }

    recordActivity();
  }

  $: normalizedImages = uniqueImages(images);
  $: activeImage = normalizedImages[Math.min(activeIndex, normalizedImages.length - 1)] ?? normalizedImages[0];
  $: signature = normalizedImages.map((image) => image.url).join('|');

  $: if (activeIndex >= normalizedImages.length) {
    activeIndex = 0;
  }

  $: if (mounted && signature !== lastSignature) {
    lastSignature = signature;
    activeIndex = 0;
    slideDirection = 1;
    pausedByUser = false;
    clearResumeTimer();
    startAuto();
  }

  onMount(() => {
    mounted = true;
    lastSignature = signature;
    startAuto();
  });

  onDestroy(() => {
    clearSlideTimer();
    clearResumeTimer();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class={`slideshow slideshow--${variant}`}
  data-many={normalizedImages.length > 1}
  role="region"
  tabindex="0"
  aria-label="Galerie imagini produs"
  on:pointermove={recordActivity}
  on:keydown={handleKeydown}
>
  <div class="stage">
    {#key activeImage.url}
      <div
        class="slide-frame"
        in:fly={{ x: slideDirection * 54, duration: 380, easing: cubicOut }}
        out:fly={{ x: slideDirection * -54, duration: 320, easing: cubicOut }}
      >
        <img
          src={displayUrl(activeImage.url)}
          alt={activeImage.alt || alt}
          loading={variant === 'detail' ? 'eager' : 'lazy'}
          decoding="async"
          on:error={fallbackImage}
        />
      </div>
    {/key}

    {#if normalizedImages.length > 1}
      <div class="counter" aria-label="Număr imagini">
        {activeIndex + 1}/{normalizedImages.length}
      </div>
    {/if}

    {#if interactive && normalizedImages.length > 1}
      <button class="nav nav--prev" type="button" aria-label="Imaginea anterioară" on:click={previousImage}>
        <i class="bi bi-chevron-left"></i>
      </button>

      <button class="nav nav--next" type="button" aria-label="Imaginea următoare" on:click={nextImage}>
        <i class="bi bi-chevron-right"></i>
      </button>
    {/if}
  </div>

  {#if interactive && normalizedImages.length > 1}
    <div class="thumbs" aria-label="Alege imagine produs">
      {#each normalizedImages as image, index}
        <button
          type="button"
          class:active={index === activeIndex}
          aria-label={`Afișează imaginea ${index + 1}`}
          aria-current={index === activeIndex ? 'true' : undefined}
          on:click={() => selectImage(index)}
        >
          <img src={displayUrl(image.url)} alt="" loading="lazy" decoding="async" on:error={fallbackImage} />
        </button>
      {/each}
    </div>
  {:else if normalizedImages.length > 1}
    <div class="dots" aria-hidden="true">
      {#each normalizedImages as _, index}
        <span class:active={index === activeIndex}></span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .slideshow {
    position: relative;
    width: 100%;
    height: 100%;
    color: inherit;
  }

  .stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.03);
    isolation: isolate;
  }

  .slide-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    will-change: transform, opacity;
  }

  .slide-frame img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.38s ease;
  }

  .slideshow--detail .stage {
    border-radius: var(--radius-lg);
    aspect-ratio: 1 / 0.86;
    min-height: 360px;
  }

  .slideshow--card .stage,
  .slideshow--cart .stage {
    border-radius: inherit;
  }

  .slideshow--card .slide-frame img,
  .slideshow--cart .slide-frame img {
    height: 100%;
  }

  .counter {
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0.18rem 0.52rem;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--line);
    color: rgba(0, 0, 0, 0.68);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .slideshow--card .counter,
  .slideshow--cart .counter {
    display: none;
  }

  .nav {
    position: absolute;
    top: 50%;
    z-index: 4;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.88);
    color: rgba(0, 0, 0, 0.72);
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  .nav:hover,
  .nav:focus-visible {
    color: var(--desaga-blue, var(--tomato-ink));
    background: #fff;
    outline: none;
  }

  .nav--prev {
    left: 12px;
  }

  .nav--next {
    right: 12px;
  }

  .thumbs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
    gap: 10px;
    padding: 12px;
    background: #fff;
  }

  .thumbs button {
    min-width: 0;
    height: 72px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius);
    overflow: hidden;
    background: rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition:
      transform 0.14s ease,
      border-color 0.14s ease,
      box-shadow 0.14s ease;
  }

  .thumbs button:hover,
  .thumbs button:focus-visible {
    transform: translateY(-1px);
    outline: none;
  }

  .thumbs button.active {
    border-color: var(--desaga-blue, var(--tomato-ink));
    box-shadow: 0 0 0 3px rgba(181, 42, 47, 0.22);
  }

  .thumbs img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .dots {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    z-index: 3;
    display: flex;
    justify-content: center;
    gap: 5px;
    pointer-events: none;
  }

  .dots span {
    width: 7px;
    height: 7px;
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(0, 0, 0, 0.16);
    transition:
      width 0.18s ease,
      background 0.18s ease;
  }

  .dots span.active {
    width: 18px;
    background: #fff;
  }

  @media (prefers-reduced-motion: reduce) {
    .slide-frame,
    .thumbs button,
    .dots span {
      transition: none;
    }
  }

  @media (max-width: 576px) {
    .slideshow--detail .stage {
      min-height: 300px;
    }

    .thumbs {
      grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
      gap: 8px;
      padding: 10px;
    }

    .thumbs button {
      height: 62px;
    }
  }
</style>
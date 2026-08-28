<script lang="ts">
  import { page } from '$app/stores';
  import { cartCount } from '$lib/stores/cart';

  const tabs = [
    { href: '/', label: 'Acasă', icon: 'bi-house-door' },
    { href: '/produse', label: 'Produse', icon: 'bi-shop-window' },
    { href: '/cos', label: 'Coș', icon: 'bi-basket', showCart: true },
    { href: '/evenimente', label: 'Evenimente', icon: 'bi-calendar-event' },
    { href: '/contact', label: 'Contact', icon: 'bi-telephone' },
  ] as const;

  $: path = $page.url.pathname;

  function isActive(currentPath: string, href: string) {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }
</script>

<nav class="tabbar" aria-label="Navigare rapidă">
  {#each tabs as tab (tab.href)}
    <a
      href={tab.href}
      class="tab"
      class:active={isActive(path, tab.href)}
      aria-current={isActive(path, tab.href) ? 'page' : undefined}
    >
      <span class="icon-wrap">
        <i class={'bi ' + tab.icon} aria-hidden="true"></i>
        {#if 'showCart' in tab && tab.showCart && $cartCount > 0}
          <span class="cart-badge" aria-hidden="true">{$cartCount > 99 ? '99+' : $cartCount}</span>
        {/if}
      </span>
      <span class="label">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    display: none;
  }

  /* Visible only while the burger nav is active (below the lg breakpoint). */
  @media (max-width: 991.98px) {
    :global(body) {
      padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
    }

    /* Opaque paper, a hairline top rule, no blur. A blurred bar over a
       photo-heavy shop just made the page underneath look smeared. */
    .tabbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1030;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      height: calc(60px + env(safe-area-inset-bottom, 0px));
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: var(--surface);
      border-top: 1px solid var(--line);
    }

    .tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-width: 0;
      color: var(--ink-3);
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      transition: color var(--motion-fast) var(--ease);
    }

    .tab:active {
      background: var(--tomato-wash);
    }

    /* The active tab gets a rule at the top edge, matching the underline the
       desktop nav uses. One active-state idea across both navigations. */
    .tab.active {
      color: var(--tomato-ink);
      box-shadow: inset 0 2px 0 0 var(--tomato);
    }

    .icon-wrap {
      position: relative;
      display: grid;
      place-items: center;
      width: 28px;
      height: 24px;
      font-size: 1.15rem;
      line-height: 1;
    }

    .cart-badge {
      position: absolute;
      top: -5px;
      right: -9px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      display: grid;
      place-items: center;
      border-radius: var(--radius-full);
      background: var(--tomato-ink);
      color: #fff;
      font-size: 0.625rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
  }
</style>

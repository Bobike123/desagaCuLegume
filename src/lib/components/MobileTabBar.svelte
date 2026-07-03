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
      padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px));
    }

    .tabbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1050;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      height: calc(62px + env(safe-area-inset-bottom, 0px));
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-top: 1px solid rgba(15, 23, 42, 0.1);
      box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.08);
    }

    .tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      min-width: 0;
      border-radius: 14px;
      color: rgba(20, 33, 43, 0.62);
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      transition: color 0.12s ease, background 0.12s ease;
    }

    .tab:active {
      background: rgba(var(--accent-rgb, 38, 153, 214), 0.1);
    }

    .tab.active {
      color: var(--accent, #2699d6);
    }

    .icon-wrap {
      position: relative;
      display: grid;
      place-items: center;
      width: 30px;
      height: 26px;
      font-size: 1.15rem;
      line-height: 1;
    }

    .tab.active .icon-wrap {
      transform: translateY(-1px);
    }

    .cart-badge {
      position: absolute;
      top: -4px;
      right: -8px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: var(--desaga-red, #dc3545);
      color: #fff;
      font-size: 0.62rem;
      font-weight: 950;
      line-height: 1;
    }

    .label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.64rem;
      font-weight: 900;
      letter-spacing: 0.01em;
    }
  }
</style>

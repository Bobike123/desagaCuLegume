<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { onDestroy } from 'svelte';

  const links = [
    {
      href: '/admin/dashboard',
      label: 'Panou',
      icon: 'bi-house',
      active: (path: string) => path === '/admin/dashboard' || path === '/admin',
    },
    {
      href: '/admin/produse',
      label: 'Produse',
      icon: 'bi-box-seam',
      active: (path: string) => path.startsWith('/admin/produse'),
    },
    {
      href: '/admin/comenzi',
      label: 'Comenzi',
      icon: 'bi-receipt',
      active: (path: string) => path.startsWith('/admin/comenzi'),
    },
    {
      href: '/admin/horeca',
      label: 'HORECA',
      icon: 'bi-shop',
      active: (path: string) => path.startsWith('/admin/horeca'),
    },
    {
      href: '/admin/messages',
      label: 'Mesaje',
      icon: 'bi-chat-dots',
      active: (path: string) => path.startsWith('/admin/messages'),
    },
    {
      href: '/admin/security',
      label: 'Securitate',
      icon: 'bi-shield-exclamation',
      active: (path: string) => path.startsWith('/admin/security'),
    },
    {
      href: '/admin/evenimente',
      label: 'Evenimente',
      icon: 'bi-calendar-event',
      active: (path: string) => path.startsWith('/admin/evenimente'),
    },
  ];

  function normalize(path: string) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  let isOpen = false;
  let lastNavPath: string | null = null;

  function closeMenu() {
    isOpen = false;
  }

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) closeMenu();
  }

  $: currentPath = normalize($page.url.pathname);

  $: if (currentPath !== lastNavPath) {
    lastNavPath = currentPath;
    isOpen = false;
  }

  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });

  async function handleLogout() {
    closeMenu();
    await auth.logout();
    await goto('/cont');
  }
</script>

<nav class="adminNav" aria-label="Navigare administrare">
  <a class="adminNav__brand" href="/admin/dashboard" aria-label="Panou admin DeSaga">
    <span class="adminNav__brandIcon"><i class="bi bi-shield-lock"></i></span>
    <span class="adminNav__brandText">
      <strong>Administrare DeSaga</strong>
      <small>catalog și comenzi</small>
    </span>
  </a>

  <ul class="adminNav__list">
    {#each links as item (item.href)}
      <li>
        <a href={item.href} class:active={item.active(currentPath)} aria-current={item.active(currentPath) ? 'page' : undefined}>
          <i class={`bi ${item.icon}`}></i>
          <span>{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>

  <div class="adminNav__bottom">
    <a class="adminNav__store" href="/" target="_blank" rel="noopener noreferrer">
      <i class="bi bi-box-arrow-up-right"></i>
      <span>Vezi site-ul</span>
    </a>

    <button class="adminNav__logout" type="button" on:click={handleLogout}>
      <i class="bi bi-box-arrow-right"></i>
      <span>Deconectare</span>
    </button>
  </div>
</nav>

<svelte:window on:keydown={handleKeydown} />

<nav class="adminMobileBar" aria-label="Navigare administrare mobilă">
  <a class="adminMobileBar__brand" href="/admin/dashboard" on:click={closeMenu}>
    <span class="adminMobileBar__brandIcon"><i class="bi bi-shield-lock"></i></span>
    <span class="adminMobileBar__brandText">
      <strong>Admin</strong>
      <small>DeSaga</small>
    </span>
  </a>

  <button
    class="adminMobileBar__toggle"
    type="button"
    aria-label={isOpen ? 'Închide meniul admin' : 'Deschide meniul admin'}
    aria-expanded={isOpen}
    aria-controls="admin-mobile-navigation"
    on:click={toggleMenu}
  >
    <span class="adminMobileBar__bars" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
  </button>
</nav>

<button
  type="button"
  class="adminMobileBackdrop"
  class:show={isOpen}
  tabindex="-1"
  aria-hidden="true"
  on:click={closeMenu}
></button>

<aside
  id="admin-mobile-navigation"
  class="adminMobileDrawer"
  class:show={isOpen}
  aria-label="Navigare administrare mobilă"
  aria-hidden={!isOpen}
>
  <div class="adminMobileDrawer__head">
    <a class="adminMobileDrawer__brand" href="/admin/dashboard" on:click={closeMenu}>
      <span class="adminMobileDrawer__brandIcon"><i class="bi bi-shield-lock"></i></span>
      <span>
        <strong>Administrare DeSaga</strong>
        <small>catalog și comenzi</small>
      </span>
    </a>

    <button class="adminMobileDrawer__close" type="button" aria-label="Închide meniul admin" on:click={closeMenu}>
      <i class="bi bi-x-lg"></i>
    </button>
  </div>

  <nav class="adminMobileDrawer__body" aria-label="Secțiuni administrare">
    {#each links as item (item.href)}
      <a
        class="adminMobileDrawer__link"
        class:active={item.active(currentPath)}
        href={item.href}
        aria-current={item.active(currentPath) ? 'page' : undefined}
        on:click={closeMenu}
      >
        <i class={`bi ${item.icon}`}></i>
        <span>{item.label}</span>
        <i class="bi bi-chevron-right"></i>
      </a>
    {/each}
  </nav>

  <div class="adminMobileDrawer__bottom">
    <a class="adminMobileDrawer__store" href="/" target="_blank" rel="noopener noreferrer" on:click={closeMenu}>
      <i class="bi bi-box-arrow-up-right"></i>
      <span>Vezi site-ul</span>
    </a>

    <button class="adminMobileDrawer__logout" type="button" on:click={handleLogout}>
      <i class="bi bi-box-arrow-right"></i>
      <span>Deconectare</span>
    </button>
  </div>
</aside>

<style>
  .adminNav,
  .adminMobileBar,
  .adminMobileDrawer {
    --admin-bg: #f6f1e7;
    --admin-surface: #fffdf7;
    --admin-ink: #1d241b;
    --admin-muted: #6b7165;
    --admin-line: rgba(31, 42, 28, 0.12);
    --admin-accent: #274f2a;
    --admin-green: #8bd450;
    --admin-danger: #a83232;
  }

  .adminNav {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1040;
    width: 240px;
    height: 100vh;
    background: var(--admin-surface);
    border-right: 1px solid var(--admin-line);
    padding: 16px;
    display: flex;
    flex-direction: column;
    box-shadow: 8px 0 28px rgba(35, 51, 30, 0.08);
  }

  .adminNav__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--admin-ink);
    text-decoration: none;
    margin-bottom: 24px;
  }

  .adminNav__brandIcon {
    width: 42px;
    height: 42px;
    border-radius: var(--radius);
    display: grid;
    place-items: center;
    color: #fff;
    background: var(--admin-accent);
    box-shadow: 0 12px 24px rgba(39, 79, 42, 0.22);
  }

  .adminNav__brandText {
    display: grid;
    gap: 1px;
    line-height: 1.1;
  }

  .adminNav__brandText strong {
    font-weight: 700;
  }

  .adminNav__brandText small {
    color: var(--admin-muted);
    font-weight: 600;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .adminNav__list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    display: grid;
    align-content: start;
    gap: 7px;
  }

  .adminNav__list a,
  .adminNav__store,
  .adminNav__logout {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: var(--radius);
    text-decoration: none;
    font-weight: 600;
    color: var(--admin-muted);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }

  .adminNav__list a:hover,
  .adminNav__list a:focus,
  .adminNav__store:hover,
  .adminNav__store:focus,
  .adminNav__logout:hover,
  .adminNav__logout:focus {
    background: rgba(139, 212, 80, 0.14);
    border-color: rgba(39, 79, 42, 0.12);
    color: var(--admin-accent);
  }

  .adminNav__list a.active {
    background: rgba(139, 212, 80, 0.2);
    border-color: rgba(39, 79, 42, 0.16);
    color: var(--admin-accent);
  }

  .adminNav__bottom {
    display: grid;
    gap: 6px;
    padding-top: 14px;
    border-top: 1px solid var(--admin-line);
  }

  .adminNav__store {
    color: var(--admin-muted);
  }

  .adminNav__logout {
    color: var(--admin-danger);
    text-align: left;
  }

  .adminMobileBar,
  .adminMobileBackdrop,
  .adminMobileDrawer {
    display: none;
  }

  @media (max-width: 991.98px) {
    .adminNav {
      display: none;
    }

    .adminMobileBar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1040;
      min-height: 64px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(255, 253, 247, 0.96);
      border-bottom: 1px solid var(--admin-line);
      box-shadow: 0 10px 26px rgba(35, 51, 30, 0.08);
    }

    .adminMobileBar__brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      color: var(--admin-ink);
      text-decoration: none;
    }

    .adminMobileBar__brandIcon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius);
      display: grid;
      place-items: center;
      color: #fff;
      background: var(--admin-accent);
      flex: 0 0 auto;
    }

    .adminMobileBar__brandText {
      display: grid;
      line-height: 1.05;
      min-width: 0;
    }

    .adminMobileBar__brandText strong {
      color: var(--admin-ink);
      font-weight: 700;
    }

    .adminMobileBar__brandText small {
      color: var(--admin-muted);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .adminMobileBar__toggle {
      width: 42px;
      height: 42px;
      border-radius: var(--radius);
      display: grid;
      place-items: center;
      padding: 9px;
      color: var(--admin-ink);
      background: rgba(39, 79, 42, 0.08);
      border: 1px solid rgba(39, 79, 42, 0.12);
      cursor: pointer;
      transition:
        background 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease;
    }

    .adminMobileBar__toggle:hover,
    .adminMobileBar__toggle:focus,
    .adminMobileBar__toggle[aria-expanded='true'] {
      color: #fff;
      background: var(--admin-accent);
      border-color: var(--admin-accent);
    }

    .adminMobileBar__bars {
      width: 22px;
      height: 17px;
      display: grid;
      align-content: space-between;
    }

    .adminMobileBar__bars span {
      height: 2px;
      width: 100%;
      border-radius: var(--radius-sm);
      background: currentColor;
      transform-origin: center;
      transition:
        transform 220ms ease,
        opacity 180ms ease;
    }

    .adminMobileBar__toggle[aria-expanded='true'] .adminMobileBar__bars span:nth-child(1) {
      transform: translateY(7.5px) rotate(45deg);
    }

    .adminMobileBar__toggle[aria-expanded='true'] .adminMobileBar__bars span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0.6);
    }

    .adminMobileBar__toggle[aria-expanded='true'] .adminMobileBar__bars span:nth-child(3) {
      transform: translateY(-7.5px) rotate(-45deg);
    }

    .adminMobileBackdrop {
      position: fixed;
      inset: 0;
      z-index: 1045;
      display: block;
      margin: 0;
      padding: 0;
      border: 0;
      background: rgba(29, 36, 27, 0.5);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.28s ease,
        visibility 0.28s ease;
    }

    .adminMobileBackdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .adminMobileDrawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 1050;
      width: min(92vw, 390px);
      max-width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--admin-surface);
      border-left: 1px solid var(--admin-line);
      box-shadow: -16px 0 44px rgba(29, 36, 27, 0.2);
      transform: translateX(100%);
      visibility: hidden;
      transition:
        transform 0.28s ease,
        visibility 0.28s ease;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .adminMobileDrawer.show {
      transform: translateX(0);
      visibility: visible;
    }

    .adminMobileDrawer__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--admin-line);
      background:
        linear-gradient(180deg, rgba(139, 212, 80, 0.16), rgba(255, 253, 247, 0));
    }

    .adminMobileDrawer__brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      color: var(--admin-ink);
      text-decoration: none;
    }

    .adminMobileDrawer__brandIcon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius);
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      color: #fff;
      background: var(--admin-accent);
      box-shadow: 0 12px 24px rgba(39, 79, 42, 0.2);
    }

    .adminMobileDrawer__brand span:last-child {
      display: grid;
      line-height: 1.05;
      min-width: 0;
    }

    .adminMobileDrawer__brand strong {
      font-weight: 700;
      color: var(--admin-ink);
    }

    .adminMobileDrawer__brand small {
      color: var(--admin-muted);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .adminMobileDrawer__close {
      width: 40px;
      height: 40px;
      border-radius: var(--radius);
      display: grid;
      place-items: center;
      border: 0;
      color: var(--admin-muted);
      background: rgba(39, 79, 42, 0.08);
      cursor: pointer;
      flex: 0 0 auto;
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }

    .adminMobileDrawer__close:hover,
    .adminMobileDrawer__close:focus {
      color: var(--admin-accent);
      background: rgba(139, 212, 80, 0.2);
    }

    .adminMobileDrawer__body {
      flex: 1 1 auto;
      display: grid;
      align-content: start;
      gap: 8px;
      padding: 14px;
      overflow-y: auto;
    }

    .adminMobileDrawer__link,
    .adminMobileDrawer__store,
    .adminMobileDrawer__logout {
      min-height: 48px;
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 13px;
      color: var(--admin-muted);
      background: rgba(39, 79, 42, 0.05);
      border: 1px solid rgba(39, 79, 42, 0.08);
      text-decoration: none;
      font-weight: 700;
      text-align: left;
      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
    }

    .adminMobileDrawer__link > i:first-child,
    .adminMobileDrawer__store > i,
    .adminMobileDrawer__logout > i {
      width: 22px;
      text-align: center;
      flex: 0 0 auto;
    }

    .adminMobileDrawer__link span,
    .adminMobileDrawer__store span,
    .adminMobileDrawer__logout span {
      min-width: 0;
      flex: 1 1 auto;
    }

    .adminMobileDrawer__link > i:last-child {
      color: rgba(107, 113, 101, 0.7);
      flex: 0 0 auto;
    }

    .adminMobileDrawer__link:hover,
    .adminMobileDrawer__link:focus,
    .adminMobileDrawer__store:hover,
    .adminMobileDrawer__store:focus {
      color: var(--admin-accent);
      background: rgba(139, 212, 80, 0.16);
      border-color: rgba(39, 79, 42, 0.14);
    }

    .adminMobileDrawer__link.active {
      color: var(--admin-accent);
      background: rgba(139, 212, 80, 0.22);
      border-color: rgba(39, 79, 42, 0.18);
    }

    .adminMobileDrawer__bottom {
      display: grid;
      gap: 8px;
      padding: 14px;
      border-top: 1px solid var(--admin-line);
    }

    .adminMobileDrawer__logout {
      color: var(--admin-danger);
      cursor: pointer;
    }

    .adminMobileDrawer__logout:hover,
    .adminMobileDrawer__logout:focus {
      color: #842029;
      background: #fff1f1;
      border-color: #facaca;
    }

    @media (prefers-reduced-motion: reduce) {
      .adminMobileBar__bars span,
      .adminMobileBackdrop,
      .adminMobileDrawer {
        transition: none;
      }
    }

    @media (max-width: 420px) {
      .adminMobileBar {
        padding-inline: 10px;
      }

      .adminMobileBar__brandText strong {
        font-size: 0.95rem;
      }

      .adminMobileDrawer {
        width: min(94vw, 370px);
      }
    }
  }
</style>

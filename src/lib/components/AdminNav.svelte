<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';

  const links = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
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
      href: '/admin/evenimente',
      label: 'Evenimente',
      icon: 'bi-calendar-event',
      active: (path: string) => path.startsWith('/admin/evenimente'),
    },
  ];

  function normalize(path: string) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  $: currentPath = normalize($page.url.pathname);

  async function handleLogout() {
    await auth.logout();
    await goto('/admin/login');
  }
</script>

<nav class="adminNav" aria-label="Navigare administrare">
  <a class="adminNav__brand" href="/admin/dashboard" aria-label="Dashboard admin DeSaga">
    <span class="adminNav__brandIcon"><i class="bi bi-shield-lock"></i></span>
    <span class="adminNav__brandText">
      <strong>Admin DeSaga</strong>
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
      <span>Logout</span>
    </button>
  </div>
</nav>

<nav class="adminMobileBar" aria-label="Navigare administrare mobilă">
  <a class="adminMobileBar__brand" href="/admin/dashboard">
    <i class="bi bi-shield-lock"></i>
    <span>Admin</span>
  </a>

  <div class="adminMobileBar__links">
    {#each links as item (item.href)}
      <a href={item.href} class:active={item.active(currentPath)} aria-label={item.label} aria-current={item.active(currentPath) ? 'page' : undefined}>
        <i class={`bi ${item.icon}`}></i>
      </a>
    {/each}
  </div>
</nav>

<style>
  .adminNav {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1040;
    width: 240px;
    height: 100vh;
    background: #ffffff;
    border-right: 1px solid var(--desaga-border, rgba(15, 23, 42, 0.08));
    padding: 16px;
    display: flex;
    flex-direction: column;
    box-shadow: 8px 0 24px rgba(15, 23, 42, 0.04);
  }

  .adminNav__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--desaga-heading, #14212b);
    text-decoration: none;
    margin-bottom: 24px;
  }

  .adminNav__brandIcon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #fff;
    background: var(--desaga-blue, #2699d6);
    box-shadow: 0 10px 22px rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.22);
  }

  .adminNav__brandText {
    display: grid;
    gap: 1px;
    line-height: 1.1;
  }

  .adminNav__brandText strong {
    font-weight: 950;
  }

  .adminNav__brandText small {
    color: var(--desaga-muted, rgba(20, 33, 43, 0.66));
    font-weight: 800;
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

  .adminNav a,
  .adminNav__logout {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 850;
    color: rgba(20, 33, 43, 0.74);
    background: transparent;
    border: 0;
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }

  .adminNav a:hover,
  .adminNav a:focus,
  .adminNav__logout:hover,
  .adminNav__logout:focus {
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.08);
    color: var(--desaga-blue, #2699d6);
  }

  .adminNav a.active {
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.12);
    color: var(--desaga-blue, #2699d6);
  }

  .adminNav__bottom {
    display: grid;
    gap: 6px;
    padding-top: 14px;
    border-top: 1px solid var(--desaga-border, rgba(15, 23, 42, 0.08));
  }

  .adminNav__store {
    color: rgba(20, 33, 43, 0.62) !important;
  }

  .adminNav__logout {
    color: rgba(220, 53, 69, 0.92);
  }

  .adminMobileBar {
    display: none;
  }

  @media (max-width: 991.98px) {
    .adminNav {
      display: none;
    }

    .adminMobileBar {
      position: sticky;
      top: 0;
      z-index: 1040;
      min-height: 62px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid var(--desaga-border, rgba(15, 23, 42, 0.08));
      backdrop-filter: blur(12px);
    }

    .adminMobileBar__brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--desaga-heading, #14212b);
      text-decoration: none;
      font-weight: 950;
    }

    .adminMobileBar__brand i {
      color: var(--desaga-blue, #2699d6);
    }

    .adminMobileBar__links {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .adminMobileBar__links a {
      width: 40px;
      height: 40px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      color: rgba(20, 33, 43, 0.7);
      text-decoration: none;
      background: rgba(15, 23, 42, 0.04);
      flex: 0 0 auto;
    }

    .adminMobileBar__links a.active {
      color: var(--desaga-blue, #2699d6);
      background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.12);
    }
  }
</style>
<!-- FILE: src/lib/components/AdminNav.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { logout } from "$lib/stores/auth";

  async function handleLogout() {
    await logout();
  }

  const links = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: "bi-house",
      active: (p: string) => p === "/admin/dashboard",
    },
    {
      href: "/admin/produse",
      label: "Produse",
      icon: "bi-box",
      active: (p: string) => p.startsWith("/admin/produse"),
    },
    {
      href: "/admin/evenimente",
      label: "Evenimente",
      icon: "bi-calendar-event",
      active: (p: string) => p.startsWith("/admin/evenimente"),
    },
    {
      href: "/admin/messages",
      label: "Mesaje",
      icon: "bi-inbox",
      active: (p: string) => p.startsWith("/admin/messages"),
    },
  ];
</script>

<nav class="adminNav">
  <div class="adminNav__brand">
    <i class="bi bi-gear"></i>
    <span>Admin</span>
  </div>

  <ul class="adminNav__list">
    {#each links as item (item.href)}
      <li>
        <a href={item.href} class:active={item.active($page.url.pathname)}>
          <i class={`bi ${item.icon}`}></i>
          <span>{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>

  <button class="adminNav__logout" on:click={handleLogout}>
    <i class="bi bi-box-arrow-right"></i>
    <span>Logout</span>
  </button>
</nav>

<style>
  .adminNav {
    position: fixed;
    left: 0;
    top: 0;
    width: 240px;
    height: 100vh;
    background: #ffffff;
    border-right: 1px solid rgba(0, 0, 0, 0.08);
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .adminNav__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    font-size: 1.1rem;
    color: var(--desaga-brown);
    margin-bottom: 24px;
  }

  .adminNav__list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    display: grid;
    gap: 6px;
  }

  .adminNav a,
  .adminNav__logout {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.75);
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .adminNav a:hover,
  .adminNav__logout:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .adminNav a.active {
    background: rgba(6, 100, 35, 0.12);
    color: var(--desaga-brown);
  }

  .adminNav__logout {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding-top: 14px;
  }
</style>

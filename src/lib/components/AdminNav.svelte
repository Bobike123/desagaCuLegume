<script>
  import { page } from '$app/stores';
  import { logout } from '$lib/stores/auth';

  async function handleLogout() {
    await logout();
  }
</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-brown sticky-top">
  <div class="container-fluid">
    <a class="navbar-brand fw-bold" href="/admin/dashboard">
      <i class="bi bi-gear"></i> Admin Panel
    </a>

    <div class="collapse navbar-collapse">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item">
          <a
            class="nav-link {$page.url.pathname === '/admin/dashboard' ? 'active' : ''}"
            href="/admin/dashboard"
          >
            <i class="bi bi-house"></i> Dashboard
          </a>
        </li>

        <li class="nav-item">
          <a
            class="nav-link {$page.url.pathname.startsWith('/admin/produse') ? 'active' : ''}"
            href="/admin/produse"
          >
            <i class="bi bi-box"></i> Produse
          </a>
        </li>

        <li class="nav-item">
          <a
            class="nav-link {$page.url.pathname.startsWith('/admin/noutati') ? 'active' : ''}"
            href="/admin/noutati"
          >
            <i class="bi bi-newspaper"></i> Noutăți
          </a>
        </li>

        <li class="nav-item">
          <a
            class="nav-link {$page.url.pathname.startsWith('/admin/evenimente')
              ? 'active'
              : ''}"
            href="/admin/evenimente"
          >
            <i class="bi bi-calendar-event"></i> evenimente
          </a>
        </li>

        <li class="nav-item">
          <button class="nav-link btn btn-link" on:click={handleLogout}>
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </li>
      </ul>
    </div>
  </div>
</nav>

<style>
  .bg-brown {
    background-color: var(--desaga-brown) !important;
  }

  .nav-link {
    color: white !important;
  }

  .nav-link:hover {
    color: var(--desaga-green) !important;
  }

  .nav-link.active {
    color: var(--desaga-green) !important;
  }

  .btn-link {
    color: white !important;
    text-decoration: none;
  }

  .btn-link:hover {
    color: var(--desaga-green) !important;
  }
</style>

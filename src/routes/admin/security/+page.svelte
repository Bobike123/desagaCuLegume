<script lang="ts">
  import { onMount } from 'svelte';

  type SecurityEvent = {
    id: string;
    eventType: 'DECOY_HIT' | 'RATE_LIMIT' | 'LOGIN_FAILED';
    requestId: string;
    route: string;
    method: string;
    observedIp: string;
    userAgent: string;
    frequencyCount: number;
    rateLimited: boolean;
    countryRegion: string | null;
    createdAt: string;
    seenAt: string | null;
  };

  type SecurityDashboardData = {
    unreadCount: number;
    decoyHits24h: number;
    rateLimitEvents24h: number;
    failedLogins24h: number;
    failedLoginTrends: Array<{ date: string; count: number }>;
    events: SecurityEvent[];
  };

  type AdminUser = {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    status: string;
    createdAt: string;
    orderCount: number;
    roles: string[];
    lastLoginAt: string | null;
  };

  type AdminUserDetail = AdminUser & {
    updatedAt: string;
    deletedAt: string | null;
    addresses: Array<{
      id: string;
      label: string | null;
      fullName: string;
      phone: string | null;
      line1: string;
      line2: string | null;
      city: string;
      stateRegion: string | null;
      postalCode: string;
      countryCode: string;
      isDefault: boolean;
    }>;
    orders: Array<{
      id: string;
      orderNumber: string;
      total: number;
      currency: string;
      status: string;
      createdAt: string;
    }>;
    conversations: Array<{
      id: string;
      subject: string;
      status: string;
      topic: string;
      orderId: string | null;
      updatedAt: string;
      closedAt: string | null;
    }>;
    authLogs: Array<{
      id: string;
      eventType: string;
      eventTime: string;
      ipAddress: string | null;
      userAgent: string | null;
    }>;
  };

  const emptyData: SecurityDashboardData = {
    unreadCount: 0,
    decoyHits24h: 0,
    rateLimitEvents24h: 0,
    failedLogins24h: 0,
    failedLoginTrends: [],
    events: [],
  };

  const labels = {
    DECOY_HIT: 'Acces decoy',
    RATE_LIMIT: 'Limitare cereri',
    LOGIN_FAILED: 'Autentificare eșuată',
  };

  let data = emptyData;
  let loading = true;
  let error = '';
  let users: AdminUser[] = [];
  let usersTotal = 0;
  let usersLoading = true;
  let usersLoadingMore = false;
  let usersPage = 1;
  let usersHasMore = false;
  let usersError = '';
  let userSearch = '';
  let userStatus = '';
  let selectedUser: AdminUserDetail | null = null;
  let selectedUserLoading = false;

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('ro-RO', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'UTC',
    }).format(date);
  }

  function formatOptionalDate(value: string | null | undefined) {
    return value ? formatDate(value) : '—';
  }

  function statusLabel(value: string) {
    if (value === 'ACTIVE') return 'Activ';
    if (value === 'LOCKED') return 'Blocat';
    if (value === 'DELETED') return 'Șters';
    return value;
  }

  async function loadSecurityEvents() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/admin/security-events?limit=80');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Nu am putut încărca evenimentele de securitate.');
      data = {
        unreadCount: Number(json?.unreadCount ?? 0),
        decoyHits24h: Number(json?.decoyHits24h ?? 0),
        rateLimitEvents24h: Number(json?.rateLimitEvents24h ?? 0),
        failedLogins24h: Number(json?.failedLogins24h ?? 0),
        failedLoginTrends: Array.isArray(json?.failedLoginTrends) ? json.failedLoginTrends : [],
        events: Array.isArray(json?.events) ? json.events : [],
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca evenimentele de securitate.';
    } finally {
      loading = false;
    }
  }

  async function markRead() {
    try {
      const res = await fetch('/api/admin/security-events', { method: 'PATCH' });
      if (!res.ok) throw new Error('Nu am putut marca evenimentele ca citite.');
      await loadSecurityEvents();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut marca evenimentele ca citite.';
    }
  }

  async function loadUsers(reset = true) {
    if (reset) {
      usersPage = 1;
      usersLoading = true;
    } else {
      usersLoadingMore = true;
    }
    usersError = '';

    try {
      const params = new URLSearchParams({ limit: '50', page: String(usersPage) });
      if (userSearch.trim()) params.set('q', userSearch.trim());
      if (userStatus) params.set('status', userStatus);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Nu am putut încărca utilizatorii.');
      const nextUsers = Array.isArray(json?.items) ? json.items : [];
      users = reset ? nextUsers : [...users, ...nextUsers];
      usersTotal = Number(json?.total ?? users.length);
      usersHasMore = Boolean(json?.page?.hasMore);
    } catch (err) {
      usersError = err instanceof Error ? err.message : 'Nu am putut încărca utilizatorii.';
    } finally {
      usersLoading = false;
      usersLoadingMore = false;
    }
  }

  async function loadMoreUsers() {
    if (usersLoadingMore || !usersHasMore) return;
    usersPage += 1;
    await loadUsers(false);
  }

  async function openUser(user: AdminUser) {
    selectedUserLoading = true;
    usersError = '';

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Nu am putut încărca utilizatorul.');
      selectedUser = json.item ?? null;
    } catch (err) {
      usersError = err instanceof Error ? err.message : 'Nu am putut încărca utilizatorul.';
    } finally {
      selectedUserLoading = false;
    }
  }

  onMount(() => {
    void loadSecurityEvents();
    void loadUsers();
  });
</script>

<svelte:head>
  <title>Securitate - Admin DeSaga</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Securitate</p>
      <h1>Evenimente monitorizate</h1>
      <p>Accesări decoy, limitări și autentificări eșuate, fără payload-uri sau date sensibile.</p>
    </div>
    <div class="actions">
      <button type="button" class="action" on:click={loadSecurityEvents} disabled={loading}>
        <i class="bi bi-arrow-clockwise"></i>
        <span>{loading ? 'Se încarcă' : 'Reîncarcă'}</span>
      </button>
      <button type="button" class="action muted" on:click={markRead} disabled={loading || data.unreadCount === 0}>
        <i class="bi bi-check2-circle"></i>
        <span>Marchează citit</span>
      </button>
    </div>
  </header>

  {#if error}
    <div class="notice danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <span>{error}</span>
    </div>
  {/if}

  <section class="metricGrid" aria-label="Sumar securitate">
    <article class:hot={data.unreadCount > 0} class="metric">
      <span class="metric__label">Notificări noi</span>
      <strong>{loading ? '…' : data.unreadCount}</strong>
      <small>Evenimente nemarcate ca citite</small>
    </article>
    <article class="metric">
      <span class="metric__label">Accesări decoy</span>
      <strong>{loading ? '…' : data.decoyHits24h}</strong>
      <small>Ultimele 24h</small>
    </article>
    <article class="metric">
      <span class="metric__label">Limitări cereri</span>
      <strong>{loading ? '…' : data.rateLimitEvents24h}</strong>
      <small>Ultimele 24h</small>
    </article>
    <article class="metric">
      <span class="metric__label">Login eșuat</span>
      <strong>{loading ? '…' : data.failedLogins24h}</strong>
      <small>Ultimele 24h</small>
    </article>
  </section>

  <section class="panel">
    <div class="panelHead">
      <div>
        <p class="eyebrow">Trend</p>
        <h2>Autentificări eșuate</h2>
      </div>
    </div>
    <div class="trend" aria-label="Trend autentificări eșuate">
      {#each data.failedLoginTrends as item (item.date)}
        <div class="trendItem">
          <span>{item.date}</span>
          <strong>{item.count}</strong>
        </div>
      {:else}
        <p class="empty">Nu există date de trend momentan.</p>
      {/each}
    </div>
  </section>

  <section class="panel">
    <div class="panelHead">
      <div>
        <p class="eyebrow">Utilizatori</p>
        <h2>Conturi și activitate</h2>
      </div>
      <strong class="panelMetric">{usersLoading ? '…' : usersTotal} total</strong>
    </div>

    <div class="userToolbar">
      <label class="searchBox" aria-label="Caută utilizatori">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input
          type="search"
          placeholder="Caută nume, username, email sau telefon"
          bind:value={userSearch}
          on:keydown={(event) => {
            if (event.key === 'Enter') void loadUsers();
          }}
        />
      </label>
      <select bind:value={userStatus} aria-label="Filtrează status utilizator" on:change={() => loadUsers()}>
        <option value="">Toate statusurile</option>
        <option value="ACTIVE">Activ</option>
        <option value="LOCKED">Blocat</option>
        <option value="DELETED">Șters</option>
      </select>
      <button type="button" class="action muted" on:click={() => loadUsers()} disabled={usersLoading}>
        <i class="bi bi-search"></i>
        <span>Caută</span>
      </button>
    </div>

    {#if usersError}
      <div class="notice danger" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        <span>{usersError}</span>
      </div>
    {/if}

    <div class="tableWrap">
      <table class="usersTable">
        <thead>
          <tr>
            <th>Utilizator</th>
            <th>Email</th>
            <th>Telefon</th>
            <th>Comenzi</th>
            <th>Creat</th>
            <th>Ultimul login</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#if usersLoading}
            <tr><td colspan="7" class="empty">Se încarcă utilizatorii…</td></tr>
          {:else}
            {#each users as user (user.id)}
              <tr
                class:selected={selectedUser?.id === user.id}
                role="button"
                tabindex="0"
                on:click={() => openUser(user)}
                on:keydown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') void openUser(user);
                }}
              >
                <td>
                  <strong>{user.fullName ?? user.username}</strong>
                  <small>@{user.username}</small>
                </td>
                <td>{user.email}</td>
                <td>{user.phone ?? '—'}</td>
                <td>{user.orderCount}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatOptionalDate(user.lastLoginAt)}</td>
                <td><span class={`badge user-${user.status.toLowerCase()}`}>{statusLabel(user.status)}</span></td>
              </tr>
            {:else}
              <tr><td colspan="7" class="empty">Nu există utilizatori pentru filtrul curent.</td></tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    {#if usersHasMore}
      <div class="loadMore">
        <button type="button" class="action muted" on:click={loadMoreUsers} disabled={usersLoadingMore}>
          <i class={`bi ${usersLoadingMore ? 'bi-arrow-repeat' : 'bi-plus-circle'}`}></i>
          <span>{usersLoadingMore ? 'Se încarcă…' : 'Încarcă mai mulți utilizatori'}</span>
        </button>
      </div>
    {/if}

    {#if selectedUserLoading}
      <div class="userDetail loadingDetail">Se încarcă detaliile utilizatorului…</div>
    {:else if selectedUser}
      <div class="userDetail">
        <div class="detailHead">
          <div>
            <h3>{selectedUser.fullName ?? selectedUser.username}</h3>
            <p>{selectedUser.email} · @{selectedUser.username}</p>
          </div>
          <span class={`badge user-${selectedUser.status.toLowerCase()}`}>{statusLabel(selectedUser.status)}</span>
        </div>

        <div class="detailGrid">
          <div><span>Telefon</span><strong>{selectedUser.phone ?? '—'}</strong></div>
          <div><span>Comenzi</span><strong>{selectedUser.orderCount}</strong></div>
          <div><span>Creat</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
          <div><span>Ultimul login</span><strong>{formatOptionalDate(selectedUser.lastLoginAt)}</strong></div>
          <div><span>Roluri</span><strong>{selectedUser.roles.length ? selectedUser.roles.join(', ') : 'CUSTOMER'}</strong></div>
        </div>

        <div class="detailColumns">
          <section>
            <h4>Adrese salvate</h4>
            {#each selectedUser.addresses as address (address.id)}
              <p class="detailLine">
                <strong>{address.label ?? (address.isDefault ? 'Implicită' : 'Adresă')}</strong>
                {address.fullName}, {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.postalCode}
              </p>
            {:else}
              <p class="empty">Nu există adrese salvate.</p>
            {/each}
          </section>

          <section>
            <h4>Comenzi recente</h4>
            {#each selectedUser.orders as order (order.id)}
              <p class="detailLine">
                <strong>#{order.orderNumber}</strong>
                {order.total.toFixed(2)} {order.currency} · {order.status}
              </p>
            {:else}
              <p class="empty">Nu există comenzi.</p>
            {/each}
          </section>

          <section>
            <h4>Conversații/support</h4>
            {#each selectedUser.conversations as conversation (conversation.id)}
              <p class="detailLine">
                <strong>{conversation.subject}</strong>
                {conversation.status} · {formatDate(conversation.updatedAt)}
              </p>
            {:else}
              <p class="empty">Nu există conversații.</p>
            {/each}
          </section>

          <section>
            <h4>Autentificări</h4>
            {#each selectedUser.authLogs as log (log.id)}
              <p class="detailLine">
                <strong>{log.eventType}</strong>
                {formatDate(log.eventTime)}
              </p>
            {:else}
              <p class="empty">Nu există loguri.</p>
            {/each}
          </section>
        </div>
      </div>
    {/if}
  </section>

  <section class="panel">
    <div class="panelHead">
      <div>
        <p class="eyebrow">Recent</p>
        <h2>Evenimente</h2>
      </div>
    </div>

    <div class="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Timp UTC</th>
            <th>Tip</th>
            <th>Route</th>
            <th>Metodă</th>
            <th>IP observat</th>
            <th>User agent</th>
            <th>Request ID</th>
            <th>Frecvență</th>
            <th>Țară/Regiune</th>
          </tr>
        </thead>
        <tbody>
          {#each data.events as event (event.id)}
            <tr class:unread={!event.seenAt}>
              <td>{formatDate(event.createdAt)}</td>
              <td><span class={`badge ${event.eventType.toLowerCase()}`}>{labels[event.eventType]}</span></td>
              <td>{event.route}</td>
              <td>{event.method}</td>
              <td>{event.observedIp}</td>
              <td class="ua">{event.userAgent}</td>
              <td class="requestId">{event.requestId}</td>
              <td>{event.frequencyCount}</td>
              <td>{event.countryRegion ?? 'Necolectat'}</td>
            </tr>
          {:else}
            <tr>
              <td colspan="9" class="empty">Nu există evenimente monitorizate.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>

<style>
  /* Security page has no gradient background */
  .admin-page {
    background: var(--bg);
  }

  h2 {
    margin: 0;
    color: var(--ink);
    font-weight: 950;
    letter-spacing: -0.045em;
    font-size: clamp(1.35rem, 2.5vw, 2rem);
  }

  .topbar p:not(.eyebrow) {
    margin: 10px 0 0;
    color: var(--muted);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .action {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 900;
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.08);
    cursor: pointer;
  }

  .action:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .action.muted {
    background: #fff;
  }

  .metricGrid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .metric,
  .panel {
    border: 1px solid var(--line);
    border-radius: 24px;
    background: rgba(255, 253, 247, 0.9);
    box-shadow: 0 18px 50px rgba(35, 51, 30, 0.08);
  }

  .metric {
    min-height: 150px;
    padding: 18px;
    display: grid;
    align-content: space-between;
    gap: 12px;
  }

  .metric.hot {
    border-color: rgba(132, 32, 41, 0.34);
    background: #fff8ec;
  }

  .metric__label,
  .metric small {
    color: var(--muted);
    font-weight: 850;
  }

  .metric strong {
    display: block;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 0.95;
    font-weight: 950;
    color: var(--ink);
  }

  .panel {
    padding: 18px;
    margin-bottom: 16px;
  }

  .panelHead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 14px;
  }

  .panelMetric {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    background: rgba(38, 153, 214, 0.1);
    color: var(--accent);
    font-weight: 950;
    white-space: nowrap;
  }

  .userToolbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px) auto;
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
  }

  .searchBox {
    position: relative;
  }

  .searchBox i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
  }

  .searchBox input,
  .userToolbar select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    color: var(--ink);
    font-weight: 850;
  }

  .searchBox input {
    padding: 0 14px 0 38px;
  }

  .userToolbar select {
    padding: 0 14px;
  }

  .trend {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
  }

  .trendItem {
    min-height: 82px;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 12px;
    display: grid;
    align-content: space-between;
    background: #fff;
  }

  .trendItem span {
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 850;
  }

  .trendItem strong {
    font-size: 1.7rem;
    font-weight: 950;
    color: var(--ink);
  }

  .tableWrap {
    overflow-x: auto;
  }

  .loadMore {
    display: flex;
    justify-content: center;
    margin-top: 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1080px;
  }

  th,
  td {
    padding: 12px 10px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    font-size: 0.9rem;
    color: var(--ink);
  }

  th {
    color: var(--muted);
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
  }

  tr.unread td {
    background: #fff8ec;
  }

  .usersTable tr[role='button'] {
    cursor: pointer;
  }

  .usersTable tr[role='button']:hover td,
  .usersTable tr.selected td {
    background: rgba(38, 153, 214, 0.08);
  }

  .usersTable small {
    display: block;
    margin-top: 3px;
    color: var(--muted);
    font-weight: 850;
  }

  .badge {
    display: inline-flex;
    border-radius: 999px;
    padding: 5px 9px;
    color: #fff;
    background: #274f2a;
    font-weight: 900;
    white-space: nowrap;
  }

  .badge.rate_limit   { background: #842029; }
  .badge.login_failed { background: #6b4e00; }
  .badge.user-active { background: #276749; }
  .badge.user-locked { background: #6b4e00; }
  .badge.user-deleted { background: #842029; }

  .userDetail {
    margin-top: 16px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: #fff;
    padding: 16px;
  }

  .loadingDetail {
    color: var(--muted);
    font-weight: 900;
  }

  .detailHead {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
    margin-bottom: 14px;
  }

  .detailHead h3 {
    margin: 0;
    color: var(--ink);
    font-weight: 950;
    font-size: 1.25rem;
  }

  .detailHead p {
    margin: 4px 0 0;
    color: var(--muted);
    font-weight: 850;
  }

  .detailGrid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }

  .detailGrid div,
  .detailLine {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 10px;
    background: rgba(255, 253, 247, 0.72);
  }

  .detailGrid span {
    display: block;
    margin-bottom: 4px;
    color: var(--muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 950;
  }

  .detailGrid strong {
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .detailColumns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .detailColumns h4 {
    margin: 0 0 8px;
    color: var(--ink);
    font-weight: 950;
  }

  .detailLine {
    margin: 0 0 8px;
    color: var(--muted);
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .detailLine strong {
    display: block;
    color: var(--ink);
    margin-bottom: 3px;
  }

  .ua,
  .requestId {
    max-width: 260px;
    overflow-wrap: anywhere;
  }

  .empty {
    color: var(--muted);
    font-weight: 850;
  }

  @media (max-width: 1180px) {
    .metricGrid,
    .trend,
    .detailGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .actions,
    .action {
      width: 100%;
    }

    .metricGrid,
    .trend,
    .detailGrid,
    .detailColumns,
    .userToolbar {
      grid-template-columns: 1fr;
    }
  }
</style>

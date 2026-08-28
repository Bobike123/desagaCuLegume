<script lang="ts">
  import { onMount } from 'svelte';

  type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type SecurityReviewStatus = 'UNREVIEWED' | 'REVIEWED' | 'FALSE_POSITIVE' | 'NEEDS_ACTION';

  type SecurityEvent = {
    id: string;
    eventType: string;
    requestId: string;
    route: string;
    method: string;
    observedIp: string;
    userAgent: string;
    frequencyCount: number;
    rateLimited: boolean;
    countryRegion: string | null;
    severity: SecuritySeverity;
    reviewStatus: SecurityReviewStatus;
    adminNote: string | null;
    targetUser: { id: string; label: string; email: string } | null;
    createdAt: string;
    seenAt: string | null;
    reviewedAt: string | null;
  };

  type ActiveSession = {
    sessionId: string;
    userId: string;
    userLabel: string;
    email: string;
    roles: string[];
    status: string;
    startedAt: string;
    lastActivityAt: string;
    expiresAt: string;
    idleMinutes: number;
    sessionAgeMinutes: number;
    stateLabel: 'ACTIVE_NOW' | 'ACTIVE_RECENTLY' | 'IDLE' | 'EXPIRING_SOON';
    ipAddress: string;
    browser: string;
    os: string;
    device: string;
  };

  type SharedIpGroup = {
    ipAddress: string;
    accountCount: number;
    activeSessions: number;
    failedLogins30d: number;
    orders: number;
    firstSeenAt: string;
    lastSeenAt: string;
    riskScore: number;
    riskLevel: SecuritySeverity;
    reasons: string[];
    users: Array<{
      id: string;
      label: string;
      email: string;
      status: string;
      lastSeenAt: string;
      userAgents: string[];
    }>;
  };

  type RiskyUser = {
    userId: string;
    label: string;
    email: string;
    status: string;
    riskScore: number;
    riskLevel: SecuritySeverity;
    reasons: string[];
    activeSessions: number;
    failedLogins30d: number;
    sharedIpAccounts: number;
    recentActivityCount: number;
    lastActivityAt: string | null;
  };

  type AdminAuditEntry = {
    id: string;
    action: string;
    adminLabel: string;
    targetLabel: string;
    note: string | null;
    createdAt: string;
  };

  type SecurityDashboardData = {
    unreadCount: number;
    unreviewedCount: number;
    decoyHits24h: number;
    rateLimitEvents24h: number;
    failedLogins24h: number;
    activeSessionsNow: number;
    suspiciousIpGroups: number;
    highRiskUsers: number;
    adminActions7d: number;
    failedLoginTrends: Array<{ date: string; count: number }>;
    activeSessions: ActiveSession[];
    sharedIpGroups: SharedIpGroup[];
    riskyUsers: RiskyUser[];
    adminAudit: AdminAuditEntry[];
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
    sessions?: Array<{
      status: string;
      createdAt: string;
      lastActivityAt: string;
      expiresAt: string;
      endedAt: string | null;
      ipAddress: string | null;
      userAgent: string | null;
    }>;
    activity?: Array<{
      activityType: string;
      route: string;
      method: string;
      createdAt: string;
      ipAddress: string | null;
      userAgent: string | null;
    }>;
    timeline?: Array<{
      type: string;
      label: string;
      time: string;
      route: string | null;
      ipAddress: string | null;
    }>;
  };

  const emptyData: SecurityDashboardData = {
    unreadCount: 0,
    unreviewedCount: 0,
    decoyHits24h: 0,
    rateLimitEvents24h: 0,
    failedLogins24h: 0,
    activeSessionsNow: 0,
    suspiciousIpGroups: 0,
    highRiskUsers: 0,
    adminActions7d: 0,
    failedLoginTrends: [],
    activeSessions: [],
    sharedIpGroups: [],
    riskyUsers: [],
    adminAudit: [],
    events: [],
  };

  const eventLabels: Record<string, string> = {
    DECOY_HIT: 'Acces decoy',
    RATE_LIMIT: 'Limitare cereri',
    LOGIN_FAILED: 'Login eșuat',
    LOGIN_SUCCESS: 'Login reușit',
    LOGOUT: 'Logout',
    SESSION_REVOKED: 'Sesiune revocată',
    PASSWORD_CHANGED: 'Parolă schimbată',
    PASSWORD_RESET_REQUESTED: 'Resetare parolă',
    MULTIPLE_ACCOUNTS_SAME_IP: 'Conturi multiple pe IP',
    MANY_FAILED_LOGINS: 'Multe loginuri eșuate',
    LOGIN_AFTER_FAILURES: 'Login după eșecuri',
    NEW_DEVICE_LOGIN: 'Device nou',
    NEW_IP_LOGIN: 'IP nou',
    SUSPICIOUS_CHECKOUT_PATTERN: 'Checkout suspect',
    ADMIN_SECURITY_ACTION: 'Acțiune admin',
    USER_STATUS_CHANGED: 'Status utilizator schimbat',
  };

  const reviewLabels: Record<SecurityReviewStatus, string> = {
    UNREVIEWED: 'Nerevizuit',
    REVIEWED: 'Revizuit',
    FALSE_POSITIVE: 'Fals pozitiv',
    NEEDS_ACTION: 'Necesită acțiune',
  };

  const stateLabels: Record<ActiveSession['stateLabel'], string> = {
    ACTIVE_NOW: 'Activ acum',
    ACTIVE_RECENTLY: 'Activ recent',
    IDLE: 'Inactiv',
    EXPIRING_SOON: 'Expiră curând',
  };

  type SecurityTab = 'overview' | 'sessions' | 'ips' | 'users' | 'events' | 'audit';

  let activeTab: SecurityTab = 'overview';
  let data = emptyData;
  let loading = true;
  let error = '';
  let actionMessage = '';
  let actionBusy = '';

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

  function formatDate(value: string | null | undefined) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('ro-RO', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'Europe/Bucharest',
    }).format(date);
  }

  function statusLabel(value: string) {
    if (value === 'ACTIVE') return 'Activ';
    if (value === 'LOCKED') return 'Blocat';
    if (value === 'DELETED') return 'Șters';
    if (value === 'REVOKED') return 'Revocat';
    if (value === 'LOGGED_OUT') return 'Deconectat';
    return value;
  }

  function riskLabel(value: SecuritySeverity) {
    if (value === 'CRITICAL') return 'Critic';
    if (value === 'HIGH') return 'Ridicat';
    if (value === 'MEDIUM') return 'Mediu';
    return 'Scăzut';
  }

  function eventLabel(value: string) {
    return eventLabels[value] ?? value;
  }

  function roleList(roles: string[]) {
    return roles.length ? roles.join(', ') : 'USER';
  }

  async function loadSecurityEvents() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/admin/security-events?limit=50');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Nu am putut încărca securitatea.');
      data = {
        unreadCount: Number(json?.unreadCount ?? 0),
        unreviewedCount: Number(json?.unreviewedCount ?? 0),
        decoyHits24h: Number(json?.decoyHits24h ?? 0),
        rateLimitEvents24h: Number(json?.rateLimitEvents24h ?? 0),
        failedLogins24h: Number(json?.failedLogins24h ?? 0),
        activeSessionsNow: Number(json?.activeSessionsNow ?? 0),
        suspiciousIpGroups: Number(json?.suspiciousIpGroups ?? 0),
        highRiskUsers: Number(json?.highRiskUsers ?? 0),
        adminActions7d: Number(json?.adminActions7d ?? 0),
        failedLoginTrends: Array.isArray(json?.failedLoginTrends) ? json.failedLoginTrends : [],
        activeSessions: Array.isArray(json?.activeSessions) ? json.activeSessions : [],
        sharedIpGroups: Array.isArray(json?.sharedIpGroups) ? json.sharedIpGroups : [],
        riskyUsers: Array.isArray(json?.riskyUsers) ? json.riskyUsers : [],
        adminAudit: Array.isArray(json?.adminAudit) ? json.adminAudit : [],
        events: Array.isArray(json?.events) ? json.events : [],
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca securitatea.';
    } finally {
      loading = false;
    }
  }

  async function securityAction(body: Record<string, unknown>, busyKey: string, successText: string) {
    actionBusy = busyKey;
    actionMessage = '';
    error = '';

    try {
      const res = await fetch('/api/admin/security-events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Acțiunea a eșuat.');
      actionMessage = successText;
      await loadSecurityEvents();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Acțiunea a eșuat.';
    } finally {
      actionBusy = '';
    }
  }

  async function markRead() {
    await securityAction({ action: 'MARK_READ' }, 'MARK_READ', 'Evenimentele au fost marcate ca citite.');
  }

  async function reviewEvent(eventId: string, reviewStatus: SecurityReviewStatus) {
    await securityAction(
      { action: 'REVIEW_EVENT', eventId, reviewStatus },
      `REVIEW_${eventId}_${reviewStatus}`,
      'Statusul evenimentului a fost actualizat.'
    );
  }

  async function revokeSession(sessionId: string) {
    await securityAction(
      { action: 'REVOKE_SESSION', sessionId },
      `SESSION_${sessionId}`,
      'Sesiunea a fost revocată.'
    );
  }

  async function revokeUserSessions(userId: string) {
    await securityAction(
      { action: 'REVOKE_USER_SESSIONS', userId },
      `USER_SESSIONS_${userId}`,
      'Toate sesiunile active ale utilizatorului au fost revocate.'
    );
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

  async function openUserById(id: string) {
    const user = users.find((item) => item.id === id);
    if (user) {
      await openUser(user);
      return;
    }

    selectedUserLoading = true;
    usersError = '';
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Nu am putut încărca utilizatorul.');
      selectedUser = json.item ?? null;
    } catch (err) {
      usersError = err instanceof Error ? err.message : 'Nu am putut încărca utilizatorul.';
    } finally {
      selectedUserLoading = false;
    }
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
      <h1>Control securitate</h1>
      <p>Sesiuni active, IP-uri comune, utilizatori cu risc, evenimente de autentificare și audit admin.</p>
    </div>
    <div class="actions">
      <button type="button" class="action" on:click={loadSecurityEvents} disabled={loading}>
        <i class="bi bi-arrow-clockwise"></i>
        <span>{loading ? 'Se încarcă' : 'Reîncarcă'}</span>
      </button>
      <button type="button" class="action muted" on:click={markRead} disabled={loading || data.unreadCount === 0 || actionBusy === 'MARK_READ'}>
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

  {#if actionMessage}
    <div class="notice success" role="status">
      <i class="bi bi-check-circle"></i>
      <span>{actionMessage}</span>
    </div>
  {/if}

  <section class="metricGrid" aria-label="Sumar securitate">
    <article class:hot={data.activeSessionsNow > 0} class="metric">
      <span class="metric__label">Utilizatori activi</span>
      <strong>{loading ? '…' : data.activeSessionsNow}</strong>
      <small>Sesiuni active recent</small>
    </article>
    <article class:hot={data.suspiciousIpGroups > 0} class="metric">
      <span class="metric__label">IP-uri suspecte</span>
      <strong>{loading ? '…' : data.suspiciousIpGroups}</strong>
      <small>Conturi non-admin pe același IP</small>
    </article>
    <article class:hot={data.highRiskUsers > 0} class="metric">
      <span class="metric__label">Utilizatori cu risc</span>
      <strong>{loading ? '…' : data.highRiskUsers}</strong>
      <small>Adminul este exclus din scorul de risc</small>
    </article>
    <article class:hot={data.unreviewedCount > 0} class="metric">
      <span class="metric__label">Nerevizuite</span>
      <strong>{loading ? '…' : data.unreviewedCount}</strong>
      <small>Evenimente care necesită verificare</small>
    </article>
  </section>

  <nav class="securityTabs" aria-label="Secțiuni securitate">
    <button type="button" class:active={activeTab === 'overview'} on:click={() => (activeTab = 'overview')}>Overview</button>
    <button type="button" class:active={activeTab === 'sessions'} on:click={() => (activeTab = 'sessions')}>Sesiuni <span>{data.activeSessions.length}</span></button>
    <button type="button" class:active={activeTab === 'ips'} on:click={() => (activeTab = 'ips')}>IP-uri comune <span>{data.sharedIpGroups.length}</span></button>
    <button type="button" class:active={activeTab === 'users'} on:click={() => (activeTab = 'users')}>Utilizatori <span>{usersTotal}</span></button>
    <button type="button" class:active={activeTab === 'events'} on:click={() => (activeTab = 'events')}>Evenimente <span>{data.events.length}</span></button>
    <button type="button" class:active={activeTab === 'audit'} on:click={() => (activeTab = 'audit')}>Audit <span>{data.adminAudit.length}</span></button>
  </nav>

  {#if activeTab === 'overview'}
    <section class="overviewGrid">
      <article class="panel priorityPanel">
        <div class="panelHead">
          <div>
            <p class="eyebrow">Regulă risc</p>
            <h2>Adminul partajat nu este tratat ca fraudă</h2>
          </div>
        </div>
        <p>
          Sesiunile cu rol ADMIN pot apărea de pe mai multe IP-uri și dispozitive. Ele rămân vizibile în tabul Sesiuni, dar nu intră în scorul de risc, în grupurile de IP suspecte sau în alertele de device/IP nou.
        </p>
        <div class="miniStats">
          <span>{data.failedLogins24h} loginuri eșuate / 24h</span>
          <span>{data.rateLimitEvents24h} rate-limit / 24h</span>
          <span>{data.decoyHits24h} decoy hits / 24h</span>
          <span>{data.adminActions7d} acțiuni admin / 7 zile</span>
        </div>
      </article>

      <article class="panel">
        <div class="panelHead compactHead">
          <div>
            <p class="eyebrow">Prioritate</p>
            <h2>Utilizatori de verificat</h2>
          </div>
          <button type="button" class="smallAction" on:click={() => (activeTab = 'users')}>Deschide</button>
        </div>
        <div class="quickList">
          {#each data.riskyUsers.slice(0, 5) as user (user.userId)}
            <button type="button" on:click={() => { activeTab = 'users'; void openUserById(user.userId); }}>
              <span><strong>{user.label}</strong><small>{user.reasons[0] ?? user.email}</small></span>
              <em class={`riskPill risk-${user.riskLevel.toLowerCase()}`}>{riskLabel(user.riskLevel)}</em>
            </button>
          {:else}
            <p class="empty">Nu există utilizatori non-admin cu risc calculat.</p>
          {/each}
        </div>
      </article>

      <article class="panel">
        <div class="panelHead compactHead">
          <div>
            <p class="eyebrow">Corelare</p>
            <h2>IP-uri comune</h2>
          </div>
          <button type="button" class="smallAction" on:click={() => (activeTab = 'ips')}>Deschide</button>
        </div>
        <div class="quickList">
          {#each data.sharedIpGroups.slice(0, 5) as group (group.ipAddress)}
            <button type="button" on:click={() => (activeTab = 'ips')}>
              <span><strong>{group.ipAddress}</strong><small>{group.accountCount} conturi non-admin · {group.failedLogins30d} loginuri eșuate</small></span>
              <em class={`riskPill risk-${group.riskLevel.toLowerCase()}`}>{riskLabel(group.riskLevel)}</em>
            </button>
          {:else}
            <p class="empty">Nu există IP-uri comune suspecte pentru utilizatori non-admin.</p>
          {/each}
        </div>
      </article>

      <article class="panel fullWidth">
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
      </article>
    </section>
  {:else if activeTab === 'sessions'}
    <section class="panel">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Live</p>
          <h2>Sesiuni active</h2>
          <p class="panelHint">Contul cu rol ADMIN poate avea IP-uri multiple; aceste sesiuni sunt informative, nu risc automat.</p>
        </div>
        <strong class="panelMetric">{data.activeSessions.length} sesiuni</strong>
      </div>

      <div class="tableWrap cappedTable">
        <table>
          <thead>
            <tr>
              <th>Utilizator</th>
              <th>Rol</th>
              <th>Device</th>
              <th>IP</th>
              <th>Start</th>
              <th>Ultima activitate</th>
              <th>Idle</th>
              <th>Status</th>
              <th>Acțiune</th>
            </tr>
          </thead>
          <tbody>
            {#if loading}
              <tr><td colspan="9" class="empty">Se încarcă sesiunile…</td></tr>
            {:else}
              {#each data.activeSessions as session (session.sessionId)}
                <tr class:adminRow={session.roles.includes('ADMIN')}>
                  <td>
                    <button class="linkButton" type="button" on:click={() => openUserById(session.userId)}>
                      <strong>{session.userLabel}</strong>
                      <small>{session.roles.includes('ADMIN') ? 'Cont admin partajat' : session.email}</small>
                    </button>
                  </td>
                  <td>{roleList(session.roles)}</td>
                  <td>
                    <strong>{session.device}</strong>
                    <small>{session.browser} · {session.os}</small>
                  </td>
                  <td>{session.ipAddress}</td>
                  <td>{formatDate(session.startedAt)}</td>
                  <td>{formatDate(session.lastActivityAt)}</td>
                  <td>{session.idleMinutes} min</td>
                  <td><span class={`badge state-${session.stateLabel.toLowerCase()}`}>{stateLabels[session.stateLabel]}</span></td>
                  <td>
                    <button
                      type="button"
                      class="smallAction dangerAction"
                      on:click={() => revokeSession(session.sessionId)}
                      disabled={actionBusy === `SESSION_${session.sessionId}`}
                    >
                      Revocă
                    </button>
                  </td>
                </tr>
              {:else}
                <tr><td colspan="9" class="empty">Nu există sesiuni active.</td></tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </section>
  {:else if activeTab === 'ips'}
    <section class="panel">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Corelare IP</p>
          <h2>Conturi non-admin pe același IP</h2>
          <p class="panelHint">Rolul ADMIN este exclus din grupare ca să nu apară alerte false din cauza contului partajat.</p>
        </div>
        <strong class="panelMetric">{data.sharedIpGroups.length} grupuri</strong>
      </div>

      <div class="ipGroups cappedList">
        {#each data.sharedIpGroups as group (group.ipAddress)}
          <details class={`ipGroup risk-${group.riskLevel.toLowerCase()}`}>
            <summary>
              <span>
                <strong>{group.ipAddress}</strong>
                <small>{group.accountCount} conturi · {group.activeSessions} sesiuni active · {group.failedLogins30d} loginuri eșuate</small>
              </span>
              <span class={`riskPill risk-${group.riskLevel.toLowerCase()}`}>{riskLabel(group.riskLevel)} · {group.riskScore}</span>
            </summary>
            <div class="reasonList">
              {#each group.reasons as reason}
                <span>{reason}</span>
              {/each}
            </div>
            <div class="groupUsers">
              {#each group.users as user (user.id)}
                <article>
                  <button type="button" class="linkButton" on:click={() => openUserById(user.id)}>
                    <strong>{user.label}</strong>
                    <small>{user.email}</small>
                  </button>
                  <p>Ultima activitate: {formatDate(user.lastSeenAt)}</p>
                  <p>{user.userAgents.join(' / ') || 'Device necunoscut'}</p>
                </article>
              {/each}
            </div>
          </details>
        {:else}
          <p class="empty">Nu există grupuri suspecte de conturi non-admin pe același IP.</p>
        {/each}
      </div>
    </section>
  {:else if activeTab === 'users'}
    <section class="panel">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Utilizatori</p>
          <h2>Conturi și profil securitate</h2>
          <p class="panelHint">Lista se deschide separat de evenimente ca pagina să rămână compactă.</p>
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

      <div class="tableWrap cappedTable usersListWrap">
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
                  <td>{user.phone ?? '-'}</td>
                  <td>{user.orderCount}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLoginAt)}</td>
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
        <div class="userDetail loadingDetail">Se încarcă profilul de securitate…</div>
      {:else if selectedUser}
        <div class="userDetail">
          <div class="detailHead">
            <div>
              <h3>{selectedUser.fullName ?? selectedUser.username}</h3>
              <p>{selectedUser.email} · @{selectedUser.username}</p>
            </div>
            <div class="detailActions">
              <span class={`badge user-${selectedUser.status.toLowerCase()}`}>{statusLabel(selectedUser.status)}</span>
              <button class="smallAction dangerAction" type="button" on:click={() => selectedUser && revokeUserSessions(selectedUser.id)} disabled={actionBusy === `USER_SESSIONS_${selectedUser.id}`}>
                Revocă sesiunile active
              </button>
            </div>
          </div>

          <div class="detailGrid">
            <div><span>Telefon</span><strong>{selectedUser.phone ?? '-'}</strong></div>
            <div><span>Comenzi</span><strong>{selectedUser.orderCount}</strong></div>
            <div><span>Creat</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
            <div><span>Ultimul login</span><strong>{formatDate(selectedUser.lastLoginAt)}</strong></div>
            <div><span>Roluri</span><strong>{roleList(selectedUser.roles)}</strong></div>
          </div>

          <div class="detailColumns three cappedDetail">
            <section>
              <h4>Timeline</h4>
              {#each selectedUser.timeline ?? [] as item (`${item.type}-${item.time}-${item.route ?? ''}`)}
                <p class="detailLine">
                  <strong>{eventLabel(item.label)}</strong>
                  {formatDate(item.time)}{item.route ? ` · ${item.route}` : ''}{item.ipAddress ? ` · ${item.ipAddress}` : ''}
                </p>
              {:else}
                <p class="empty">Nu există activitate salvată.</p>
              {/each}
            </section>

            <section>
              <h4>Sesiuni recente</h4>
              {#each selectedUser.sessions ?? [] as session (`${session.status}-${session.createdAt}`)}
                <p class="detailLine">
                  <strong>{statusLabel(session.status)}</strong>
                  Ultima activitate: {formatDate(session.lastActivityAt)}{session.ipAddress ? ` · ${session.ipAddress}` : ''}
                </p>
              {:else}
                <p class="empty">Nu există sesiuni salvate.</p>
              {/each}
            </section>

            <section>
              <h4>Adrese și comenzi</h4>
              {#each selectedUser.addresses as address (address.id)}
                <p class="detailLine">
                  <strong>{address.label ?? (address.isDefault ? 'Implicită' : 'Adresă')}</strong>
                  {address.fullName}, {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.postalCode}
                </p>
              {/each}
              {#each selectedUser.orders as order (order.id)}
                <p class="detailLine">
                  <strong>#{order.orderNumber}</strong>
                  {order.total.toFixed(2)} {order.currency} · {order.status}
                </p>
              {:else}
                <p class="empty">Nu există comenzi.</p>
              {/each}
            </section>
          </div>
        </div>
      {/if}
    </section>
  {:else if activeTab === 'events'}
    <section class="panel">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Evenimente</p>
          <h2>Log securitate revizuibil</h2>
          <p class="panelHint">Se afișează ultimele 50 de evenimente; tabelul are scroll intern.</p>
        </div>
      </div>

      <div class="tableWrap cappedTable tallTable">
        <table>
          <thead>
            <tr>
              <th>Timp</th>
              <th>Tip</th>
              <th>Severitate</th>
              <th>Review</th>
              <th>Utilizator</th>
              <th>Route</th>
              <th>IP</th>
              <th>Frecvență</th>
              <th>Acțiune</th>
            </tr>
          </thead>
          <tbody>
            {#each data.events as event (event.id)}
              <tr class:unread={!event.seenAt || event.reviewStatus === 'UNREVIEWED'}>
                <td>{formatDate(event.createdAt)}</td>
                <td><span class="eventType">{eventLabel(event.eventType)}</span></td>
                <td><span class={`riskPill risk-${event.severity.toLowerCase()}`}>{riskLabel(event.severity)}</span></td>
                <td><span class={`badge review-${event.reviewStatus.toLowerCase()}`}>{reviewLabels[event.reviewStatus]}</span></td>
                <td>{event.targetUser ? `${event.targetUser.label} · ${event.targetUser.email}` : '-'}</td>
                <td>{event.method} {event.route}</td>
                <td>{event.observedIp}</td>
                <td>{event.frequencyCount}</td>
                <td class="eventActions">
                  <button type="button" class="smallAction" on:click={() => reviewEvent(event.id, 'REVIEWED')} disabled={actionBusy === `REVIEW_${event.id}_REVIEWED`}>Revizuit</button>
                  <button type="button" class="smallAction" on:click={() => reviewEvent(event.id, 'FALSE_POSITIVE')} disabled={actionBusy === `REVIEW_${event.id}_FALSE_POSITIVE`}>Fals pozitiv</button>
                  <button type="button" class="smallAction warnAction" on:click={() => reviewEvent(event.id, 'NEEDS_ACTION')} disabled={actionBusy === `REVIEW_${event.id}_NEEDS_ACTION`}>Necesită acțiune</button>
                </td>
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
  {:else if activeTab === 'audit'}
    <section class="panel">
      <div class="panelHead">
        <div>
          <p class="eyebrow">Audit</p>
          <h2>Acțiuni admin</h2>
        </div>
      </div>

      <div class="auditList cappedList">
        {#each data.adminAudit as item (item.id)}
          <article>
            <strong>{item.action}</strong>
            <span>{item.adminLabel} → {item.targetLabel}</span>
            <small>{formatDate(item.createdAt)}{item.note ? ` · ${item.note}` : ''}</small>
          </article>
        {:else}
          <p class="empty">Nu există acțiuni admin în audit.</p>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .admin-page {
    background: var(--bg);
  }

  h2 {
    margin: 0;
    color: var(--ink);
    font-weight: 700;
    letter-spacing: -0.045em;
    font-size: clamp(1.35rem, 2.5vw, 2rem);
  }

  .actions,
  .detailActions,
  .eventActions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .action,
  .smallAction {
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 700;
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.08);
    cursor: pointer;
  }

  .smallAction {
    min-height: 34px;
    padding: 0 12px;
    font-size: 0.78rem;
    box-shadow: none;
  }

  .action:disabled,
  .smallAction:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .action.muted {
    background: #fff;
  }

  .dangerAction {
    border-color: rgba(132, 32, 41, 0.24);
    color: #842029;
    background: #fff5f5;
  }

  .warnAction {
    border-color: rgba(107, 78, 0, 0.24);
    color: #6b4e00;
    background: #fff7db;
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
    border-radius: var(--radius-lg);
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

  .compactMetric {
    min-height: 118px;
  }

  .metric.hot {
    border-color: rgba(132, 32, 41, 0.34);
    background: #fff8ec;
  }

  .metric__label,
  .metric small {
    color: var(--muted);
    font-weight: 600;
  }

  .metric strong {
    display: block;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 0.95;
    font-weight: 700;
    color: var(--ink);
  }

  .panel {
    padding: 18px;
    margin-bottom: 16px;
  }

  .securityTabs {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 0 0 16px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: rgba(255, 253, 247, 0.94);
    box-shadow: 0 18px 50px rgba(35, 51, 30, 0.08);
  }

  .securityTabs button {
    min-height: 42px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    color: var(--muted);
    font-weight: 700;
    cursor: pointer;
  }

  .securityTabs button.active {
    border-color: rgba(39, 79, 42, 0.18);
    background: #fff;
    color: var(--ink);
    box-shadow: 0 10px 28px rgba(35, 51, 30, 0.08);
  }

  .securityTabs span {
    min-width: 22px;
    min-height: 22px;
    border-radius: var(--radius-lg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    background: rgba(39, 79, 42, 0.08);
    color: var(--accent);
    font-size: 0.76rem;
  }

  .overviewGrid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
    gap: 16px;
    align-items: start;
  }

  .fullWidth {
    grid-column: 1 / -1;
  }

  .priorityPanel p,
  .panelHint {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
    line-height: 1.55;
  }

  .miniStats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .miniStats span {
    border-radius: var(--radius-sm);
    padding: 7px 10px;
    background: rgba(39, 79, 42, 0.08);
    color: var(--accent);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .quickList {
    display: grid;
    gap: 8px;
  }

  .quickList button {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 10px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    background: #fff;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }

  .quickList strong,
  .quickList small {
    display: block;
  }

  .quickList em {
    font-style: normal;
  }

  .compactHead {
    align-items: center;
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
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    background: rgba(28, 26, 23, 0.04);
    color: var(--accent);
    font-weight: 700;
    white-space: nowrap;
  }

  .splitGrid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
    gap: 16px;
    align-items: start;
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
    border-radius: var(--radius-sm);
    background: #fff;
    color: var(--ink);
    font-weight: 600;
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
    border-radius: var(--radius);
    padding: 12px;
    display: grid;
    align-content: space-between;
    background: #fff;
  }

  .trendItem span,
  small {
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .trendItem strong {
    font-size: 1.7rem;
    font-weight: 700;
    color: var(--ink);
  }

  .tableWrap {
    overflow: auto;
  }

  .cappedTable {
    max-height: min(620px, 70vh);
    border: 1px solid var(--line);
    border-radius: var(--radius);
  }

  .tallTable {
    max-height: min(720px, 74vh);
  }

  .usersListWrap {
    max-height: 430px;
  }

  .cappedList {
    max-height: min(660px, 72vh);
    overflow: auto;
    padding-right: 4px;
  }

  .cappedDetail {
    max-height: 520px;
    overflow: auto;
    padding-right: 4px;
  }

  .loadMore {
    display: flex;
    justify-content: center;
    margin-top: 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1100px;
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

  tr.adminRow td {
    background: rgba(28, 26, 23, 0.04);
  }

  .usersTable tr[role='button'] {
    cursor: pointer;
  }

  .usersTable tr[role='button']:hover td,
  .usersTable tr.selected td {
    background: rgba(28, 26, 23, 0.04);
  }

  .usersTable small,
  td small {
    display: block;
    margin-top: 3px;
  }

  .linkButton {
    appearance: none;
    display: grid;
    gap: 3px;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .linkButton strong {
    color: var(--ink);
    font-weight: 700;
  }

  .linkButton:hover strong {
    text-decoration: underline;
  }

  .badge,
  .riskPill {
    display: inline-flex;
    border-radius: var(--radius-sm);
    padding: 5px 9px;
    color: #fff;
    background: #274f2a;
    font-weight: 700;
    white-space: nowrap;
    line-height: 1;
  }

  .riskPill {
    background: #276749;
  }

  .riskPill.risk-low,
  .badge.state-active_now,
  .badge.user-active,
  .badge.review-reviewed { background: #276749; }
  .riskPill.risk-medium,
  .badge.state-active_recently,
  .badge.state-expiring_soon,
  .badge.user-locked,
  .badge.review-needs_action { background: #6b4e00; }
  .riskPill.risk-high,
  .riskPill.risk-critical,
  .badge.state-idle,
  .badge.user-deleted,
  .badge.review-unreviewed { background: #842029; }
  .badge.review-false_positive { background: #59606a; }

  .ipGroups,
  .riskUsers,
  .auditList {
    display: grid;
    gap: 10px;
  }

  .ipGroup,
  .riskUser,
  .auditList article {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #fff;
    padding: 12px;
  }

  .ipGroup summary {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    cursor: pointer;
  }

  .ipGroup summary span:first-child,
  .auditList article {
    display: grid;
    gap: 4px;
  }

  .reasonList {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }

  .reasonList.compact {
    margin: 8px 0 0;
  }

  .reasonList span {
    border-radius: var(--radius-sm);
    padding: 5px 9px;
    background: rgba(39, 79, 42, 0.08);
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .groupUsers {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .groupUsers article {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 10px;
    background: rgba(255, 253, 247, 0.76);
  }

  .groupUsers p {
    margin: 6px 0 0;
    color: var(--muted);
    font-weight: 600;
    font-size: 0.85rem;
  }

  .riskUser {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .riskUser__side {
    display: grid;
    justify-items: end;
    gap: 8px;
  }

  .userDetail {
    margin-top: 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #fff;
    padding: 16px;
  }

  .loadingDetail {
    color: var(--muted);
    font-weight: 700;
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
    font-weight: 700;
    font-size: 1.25rem;
  }

  .detailHead p {
    margin: 4px 0 0;
    color: var(--muted);
    font-weight: 600;
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
    border-radius: var(--radius);
    padding: 10px;
    background: rgba(255, 253, 247, 0.72);
  }

  .detailGrid span {
    display: block;
    margin-bottom: 4px;
    color: var(--muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 700;
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

  .detailColumns.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .detailColumns h4 {
    margin: 0 0 8px;
    color: var(--ink);
    font-weight: 700;
  }

  .detailLine {
    margin: 0 0 8px;
    color: var(--muted);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .detailLine strong {
    display: block;
    color: var(--ink);
    margin-bottom: 3px;
  }

  .eventType {
    font-weight: 700;
  }

  .empty {
    color: var(--muted);
    font-weight: 600;
  }

  @media (max-width: 1320px) {
    .metricGrid,
    .trend,
    .detailGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .overviewGrid,
    .splitGrid,
    .detailColumns.three {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .actions,
    .action,
    .securityTabs button,
    .riskUser,
    .ipGroup summary {
      width: 100%;
    }

    .riskUser,
    .ipGroup summary,
    .detailHead {
      display: grid;
    }

    .metricGrid,
    .trend,
    .detailGrid,
    .detailColumns,
    .groupUsers,
    .userToolbar {
      grid-template-columns: 1fr;
    }
  }
</style>

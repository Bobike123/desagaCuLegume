<script lang="ts">
  import { onMount } from 'svelte';

  type Campaign = {
    id: string;
    subject: string;
    bodyHtml: string;
    status: string;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    queuedAt: string | null;
    sentAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  type Subscriber = {
    id: string;
    email: string;
    userId: string | null;
    source: string;
    consentedAt: string;
    unsubscribedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  let tab: 'campaigns' | 'subscribers' = 'campaigns';

  let campaigns: Campaign[] = [];
  let selected: Campaign | null = null;
  let subjectDraft = '';
  let bodyDraft = '';
  let showPreview = false;
  let creating = false;

  let subscribers: Subscriber[] = [];
  let counts = { active: 0, unsubscribed: 0 };
  let subscriberQuery = '';

  let loading = true;
  let saving = false;
  let error = '';
  let success = '';

  function formatDate(value: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusLabel(value: string) {
    const labels: Record<string, string> = {
      DRAFT: 'Ciornă',
      SENDING: 'Se trimite',
      SENT: 'Trimisă',
      CANCELLED: 'Anulată',
    };
    return labels[value] ?? value;
  }

  function statusClass(value: string) {
    if (value === 'DRAFT') return 'warn';
    if (value === 'SENDING') return 'info';
    if (value === 'SENT') return 'success';
    return 'neutral';
  }

  function sourceLabel(value: string) {
    const labels: Record<string, string> = {
      REGISTER: 'Înregistrare',
      FOOTER: 'Formular site',
      ADMIN: 'Admin',
    };
    return labels[value] ?? value;
  }

  async function loadCampaigns() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/admin/newsletter/campaigns?limit=100');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca campaniile.');
      campaigns = Array.isArray(data?.items) ? data.items : [];
      const keep = selected ? campaigns.find((item) => item.id === selected?.id) : null;
      selectCampaign(keep ?? campaigns[0] ?? null, { keepMessages: true });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca campaniile.';
    } finally {
      loading = false;
    }
  }

  async function loadSubscribers() {
    loading = true;
    error = '';
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (subscriberQuery.trim()) params.set('q', subscriberQuery.trim());
      const res = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca abonații.');
      subscribers = Array.isArray(data?.items) ? data.items : [];
      counts = data?.counts ?? { active: 0, unsubscribed: 0 };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca abonații.';
    } finally {
      loading = false;
    }
  }

  function selectCampaign(item: Campaign | null, options: { keepMessages?: boolean } = {}) {
    selected = item;
    subjectDraft = item?.subject ?? '';
    bodyDraft = item?.bodyHtml ?? '';
    showPreview = false;
    if (!options.keepMessages) {
      success = '';
      error = '';
    }
  }

  async function createCampaign() {
    if (creating) return;
    creating = true;
    error = '';
    success = '';
    try {
      const res = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Newsletter DeSaga',
          bodyHtml: '<h2>Salut!</h2>\n<p>Scrie aici conținutul newsletterului…</p>',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut crea campania.');
      campaigns = [data.item, ...campaigns];
      selectCampaign(data.item);
      success = 'Ciornă creată.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut crea campania.';
    } finally {
      creating = false;
    }
  }

  async function patchCampaign(payload: Record<string, unknown>, failMessage: string) {
    if (!selected || saving) return null;
    saving = true;
    error = '';
    success = '';
    try {
      const res = await fetch('/api/admin/newsletter/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? failMessage);
      if (data.item) {
        campaigns = campaigns.map((item) => (item.id === data.item.id ? data.item : item));
        selectCampaign(data.item, { keepMessages: true });
      }
      return data;
    } catch (err) {
      error = err instanceof Error ? err.message : failMessage;
      return null;
    } finally {
      saving = false;
    }
  }

  async function saveDraft() {
    const data = await patchCampaign(
      { subject: subjectDraft, bodyHtml: bodyDraft },
      'Nu am putut salva campania.'
    );
    if (data) success = 'Ciorna a fost salvată.';
  }

  async function sendTest() {
    const data = await patchCampaign({ action: 'test' }, 'Trimiterea testului a eșuat.');
    if (data) success = `Email de test trimis către ${data.sentTo}.`;
  }

  async function queueCampaign() {
    if (!selected) return;
    const confirmed = confirm(
      `Pui campania „${selected.subject}” în coada de trimitere către toți abonații activi (${counts.active})? Trimiterea se face automat, câte ~280 de emailuri pe zi.`
    );
    if (!confirmed) return;

    const data = await patchCampaign({ action: 'queue' }, 'Nu am putut pune campania în coadă.');
    if (data) success = `Campania a fost pusă în coadă pentru ${data.totalRecipients} abonați.`;
  }

  async function cancelCampaign() {
    if (!selected) return;
    if (!confirm('Anulezi trimiterea? Emailurile rămase nu vor mai fi trimise.')) return;
    const data = await patchCampaign({ action: 'cancel' }, 'Nu am putut anula campania.');
    if (data) success = 'Campania a fost anulată.';
  }

  async function deleteDraft() {
    if (!selected || saving) return;
    if (!confirm('Ștergi această ciornă definitiv?')) return;
    saving = true;
    error = '';
    success = '';
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns?id=${selected.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut șterge campania.');
      campaigns = campaigns.filter((item) => item.id !== selected?.id);
      selectCampaign(campaigns[0] ?? null, { keepMessages: true });
      success = 'Ciorna a fost ștearsă.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut șterge campania.';
    } finally {
      saving = false;
    }
  }

  async function deleteSubscriber(subscriber: Subscriber) {
    if (!confirm(`Ștergi definitiv abonatul ${subscriber.email}? (cerere GDPR de ștergere)`)) return;
    error = '';
    success = '';
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?id=${subscriber.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut șterge abonatul.');
      await loadSubscribers();
      success = 'Abonatul a fost șters.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut șterge abonatul.';
    }
  }

  function switchTab(next: 'campaigns' | 'subscribers') {
    if (tab === next) return;
    tab = next;
    error = '';
    success = '';
    if (next === 'campaigns') void loadCampaigns();
    else void loadSubscribers();
  }

  function progressText(item: Campaign) {
    if (item.status === 'DRAFT') return 'Netrimisă';
    const failed = item.failedCount > 0 ? ` · ${item.failedCount} eșuate` : '';
    return `${item.sentCount} din ${item.totalRecipients} trimise${failed}`;
  }

  onMount(async () => {
    await Promise.all([loadCampaigns(), loadSubscribers()]);
  });
</script>

<svelte:head>
  <title>Newsletter - Admin DeSaga</title>
</svelte:head>

<div class="admin-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Marketing</p>
      <h1>Newsletter</h1>
      <p>Campanii de email către abonații care și-au dat acordul. Trimiterea rulează automat, câte ~280 de emailuri pe zi (limita Brevo gratuită).</p>
    </div>
    <div class="topActions">
      <button class="pill" on:click={() => (tab === 'campaigns' ? loadCampaigns() : loadSubscribers())} disabled={loading}>
        <i class="bi bi-arrow-clockwise"></i> Reîncarcă
      </button>
      <button class="pill primary" on:click={createCampaign} disabled={creating}>
        <i class="bi bi-plus-lg"></i> Campanie nouă
      </button>
    </div>
  </header>

  {#if error}<div class="notice danger">{error}</div>{/if}
  {#if success}<div class="notice success">{success}</div>{/if}

  <section class="stats">
    <div><span>Abonați activi</span><strong>{loading ? '…' : counts.active}</strong></div>
    <div><span>Dezabonați</span><strong>{loading ? '…' : counts.unsubscribed}</strong></div>
    <div><span>Campanii</span><strong>{loading ? '…' : campaigns.length}</strong></div>
  </section>

  <section class="toolbar">
    <div class="filters">
      <button type="button" class:active={tab === 'campaigns'} on:click={() => switchTab('campaigns')}>
        Campanii
      </button>
      <button type="button" class:active={tab === 'subscribers'} on:click={() => switchTab('subscribers')}>
        Abonați
      </button>
    </div>
    {#if tab === 'subscribers'}
      <form class="searchBox" on:submit|preventDefault={loadSubscribers} aria-label="Caută abonați">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input type="search" placeholder="Caută după email…" bind:value={subscriberQuery} />
      </form>
    {/if}
  </section>

  {#if loading}
    <section class="stateCard">
      <span class="spinner" aria-hidden="true"></span>
      <strong>Se încarcă…</strong>
    </section>
  {:else if tab === 'campaigns'}
    {#if campaigns.length === 0}
      <section class="emptyCard">
        <i class="bi bi-envelope-paper"></i>
        <h2>Nu există campanii încă</h2>
        <p>Creează prima campanie și trimite un test către emailul tău înainte de a o pune în coadă.</p>
        <button class="pill primary" on:click={createCampaign} disabled={creating}>Campanie nouă</button>
      </section>
    {:else}
      <div class="workspace">
        <aside class="listPanel">
          {#each campaigns as item (item.id)}
            <button
              class:selected={selected?.id === item.id}
              class="requestBtn"
              type="button"
              on:click={() => selectCampaign(item)}
            >
              <div class="requestTop">
                <strong>{item.subject}</strong>
                <span class={`tag ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
              </div>
              <p>{progressText(item)}</p>
              <time>{formatDate(item.createdAt)}</time>
            </button>
          {/each}
        </aside>

        <section class="detailPanel">
          {#if selected}
            <header class="detailHead">
              <div>
                <h2>{selected.status === 'DRAFT' ? 'Editează ciorna' : selected.subject}</h2>
                <p>Creată {formatDate(selected.createdAt)}{selected.sentAt ? ` · finalizată ${formatDate(selected.sentAt)}` : ''}</p>
              </div>
              <span class={`tag ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
            </header>

            {#if selected.status !== 'DRAFT'}
              <div class="progressBox">
                <div class="progressTop">
                  <strong>{progressText(selected)}</strong>
                  {#if selected.status === 'SENDING'}
                    <span>Restul se trimit automat în zilele următoare.</span>
                  {/if}
                </div>
                <div class="progressBar" role="progressbar" aria-valuemin="0" aria-valuemax={selected.totalRecipients} aria-valuenow={selected.sentCount}>
                  <span style={`width:${selected.totalRecipients ? Math.round((selected.sentCount / selected.totalRecipients) * 100) : 0}%`}></span>
                </div>
              </div>
            {/if}

            <div class="composer">
              <label for="campaign-subject">Subiect</label>
              <input
                id="campaign-subject"
                maxlength="200"
                bind:value={subjectDraft}
                disabled={selected.status !== 'DRAFT' || saving}
              />

              <div class="editorHead">
                <label for="campaign-body">Conținut (HTML)</label>
                <button type="button" class="pill small" on:click={() => (showPreview = !showPreview)}>
                  <i class={`bi ${showPreview ? 'bi-code-slash' : 'bi-eye'}`}></i>
                  {showPreview ? 'Editează' : 'Previzualizează'}
                </button>
              </div>

              {#if showPreview}
                <iframe class="preview" title="Previzualizare email" sandbox="" srcdoc={bodyDraft}></iframe>
              {:else}
                <textarea
                  id="campaign-body"
                  rows="14"
                  bind:value={bodyDraft}
                  disabled={selected.status !== 'DRAFT' || saving}
                  placeholder="<h2>Titlu</h2>\n<p>Conținut…</p>"
                ></textarea>
              {/if}

              <p class="hint">
                Footerul cu identitatea expeditorului și linkul de dezabonare se adaugă automat la trimitere.
              </p>

              <div class="statusActions">
                {#if selected.status === 'DRAFT'}
                  <button type="button" disabled={saving} on:click={deleteDraft}>
                    <i class="bi bi-trash"></i> Șterge
                  </button>
                  <button type="button" disabled={saving} on:click={sendTest}>
                    <i class="bi bi-send"></i> Trimite test
                  </button>
                  <button type="button" disabled={saving} on:click={saveDraft}>
                    {saving ? 'Se salvează…' : 'Salvează'}
                  </button>
                  <button class="primary" type="button" disabled={saving} on:click={queueCampaign}>
                    <i class="bi bi-envelope-arrow-up"></i> Pune în coadă
                  </button>
                {:else if selected.status === 'SENDING'}
                  <button type="button" disabled={saving} on:click={sendTest}>
                    <i class="bi bi-send"></i> Trimite test
                  </button>
                  <button class="dangerBtn" type="button" disabled={saving} on:click={cancelCampaign}>
                    <i class="bi bi-x-circle"></i> Anulează trimiterea
                  </button>
                {/if}
              </div>
            </div>
          {:else}
            <div class="muted">Selectează o campanie.</div>
          {/if}
        </section>
      </div>
    {/if}
  {:else if subscribers.length === 0}
    <section class="emptyCard">
      <i class="bi bi-people"></i>
      <h2>Nu există abonați</h2>
      <p>Abonările din footerul site-ului și de la înregistrare vor apărea aici.</p>
    </section>
  {:else}
    <section class="detailPanel">
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Sursă</th>
              <th>Abonat la</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each subscribers as subscriber (subscriber.id)}
              <tr>
                <td>{subscriber.email}</td>
                <td>{sourceLabel(subscriber.source)}</td>
                <td>{formatDate(subscriber.consentedAt)}</td>
                <td>
                  {#if subscriber.unsubscribedAt}
                    <span class="tag neutral">Dezabonat {formatDate(subscriber.unsubscribedAt)}</span>
                  {:else}
                    <span class="tag success">Activ</span>
                  {/if}
                </td>
                <td>
                  <button
                    class="iconBtn"
                    type="button"
                    aria-label={`Șterge ${subscriber.email}`}
                    on:click={() => deleteSubscriber(subscriber)}
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>

<style>
  h1 {
    font-size: clamp(2.2rem, 7vw, 4.6rem);
  }

  h2 {
    margin: 0;
    font-weight: 950;
    font-size: clamp(1.35rem, 3vw, 2rem);
    letter-spacing: -0.04em;
    color: var(--ink);
  }

  .topbar p:not(.eyebrow) {
    max-width: 720px;
    margin: 12px 0 0;
    color: var(--muted);
  }

  .topActions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .pill,
  .filters button,
  .statusActions button {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0 15px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 950;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .pill.small {
    min-height: 36px;
    font-size: 0.85rem;
  }

  .pill.primary,
  .statusActions .primary {
    background: var(--accent);
    color: #fffdf7;
    border-color: transparent;
  }

  .statusActions .dangerBtn {
    color: #842029;
    border-color: #facaca;
    background: #fff1f1;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .stats div {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
  }

  .stats span {
    display: block;
    color: var(--muted);
    font-weight: 900;
    margin-bottom: 6px;
  }

  .stats strong {
    font-size: 2.2rem;
    font-weight: 950;
    letter-spacing: -0.06em;
    color: var(--ink);
  }

  .toolbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
  }

  .filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filters button.active {
    background: rgba(139, 212, 80, 0.22);
    color: var(--accent);
    border-color: rgba(139, 212, 80, 0.4);
  }

  .workspace {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 16px;
  }

  .listPanel,
  .detailPanel {
    border: 1px solid var(--line);
    border-radius: 28px;
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
  }

  .listPanel {
    display: grid;
    gap: 10px;
    align-content: start;
    max-height: calc(100vh - 310px);
    overflow: auto;
  }

  .requestBtn {
    text-align: left;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: #fff;
    padding: 13px;
    cursor: pointer;
    width: 100%;
  }

  .requestBtn.selected {
    outline: 3px solid rgba(139, 212, 80, 0.24);
    border-color: rgba(39, 79, 42, 0.35);
  }

  .requestTop {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .requestBtn p,
  .muted,
  .detailHead p,
  .hint {
    color: var(--muted);
  }

  .requestBtn p {
    margin: 6px 0;
  }

  .requestBtn time {
    display: block;
    margin-top: 6px;
    font-size: 0.82rem;
    color: var(--muted);
  }

  .tag {
    border-radius: 999px;
    padding: 6px 9px;
    font-size: 0.72rem;
    font-weight: 950;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tag.warn    { background: #fff7db; color: #725100; }
  .tag.info    { background: #e9f0ff; color: #173b7a; }
  .tag.success { background: #e4f6e6; color: #1d5b26; }
  .tag.neutral { background: #ece8dd; color: #65685d; }

  .detailHead {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-start;
  }

  .progressBox {
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.55);
    padding: 12px;
    margin-bottom: 16px;
    display: grid;
    gap: 10px;
  }

  .progressTop {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .progressTop span {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .progressBar {
    height: 10px;
    border-radius: 999px;
    background: #ece8dd;
    overflow: hidden;
  }

  .progressBar span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
    transition: width 0.3s ease;
  }

  .composer {
    display: grid;
    gap: 10px;
  }

  .composer > label,
  .editorHead label {
    font-weight: 950;
    color: var(--ink);
  }

  .editorHead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .composer input,
  textarea {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 12px;
    background: #fff;
    color: var(--ink);
    font-weight: 800;
  }

  textarea {
    resize: vertical;
    min-height: 240px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .preview {
    width: 100%;
    min-height: 320px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: #fff;
  }

  .hint {
    margin: 0;
    font-size: 0.85rem;
  }

  .statusActions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .tableWrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  th {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .iconBtn {
    border: 1px solid #facaca;
    border-radius: 12px;
    background: #fff1f1;
    color: #842029;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  @media (max-width: 991.98px) {
    .workspace,
    .toolbar {
      grid-template-columns: 1fr;
    }

    .listPanel {
      max-height: none;
    }

    .topbar {
      display: grid;
      align-items: stretch;
    }

    .topActions .pill {
      flex: 1 1 auto;
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    .stats {
      grid-template-columns: 1fr;
    }

    .detailHead {
      display: grid;
    }

    .statusActions button {
      width: 100%;
      justify-content: center;
    }
  }
</style>

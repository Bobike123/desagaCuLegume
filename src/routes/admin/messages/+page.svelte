<script lang="ts">
  import { onMount } from 'svelte';
  import AdminNav from '$lib/components/AdminNav.svelte';

  type ConversationListItem = {
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    updatedAt: string;
    user: {
      fullName: string | null;
      email: string;
      phone: string | null;
    } | null;
    lastMessage: {
      body: string;
      senderType: string;
      createdAt: string;
    } | null;
  };

  type ConversationDetail = {
    id: string;
    subject: string;
    status: string;
    user: {
      fullName: string | null;
      email: string;
      phone: string | null;
    } | null;
    messages: Array<{
      id: string;
      senderType: string;
      body: string;
      createdAt: string;
      isRead: boolean;
    }>;
  };

  let items: ConversationListItem[] = [];
  let current: ConversationDetail | null = null;
  let selectedId = '';
  let reply = '';
  let loading = true;
  let error = '';

  async function loadList() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca mesajele.');
      items = Array.isArray(data?.items) ? data.items : [];

      if (!selectedId && items.length > 0) {
        selectedId = items[0].id;
      }

      if (selectedId) {
        await loadConversation(selectedId);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nu am putut încărca mesajele.';
    } finally {
      loading = false;
    }
  }

  async function loadConversation(id: string) {
    selectedId = id;
    const res = await fetch(`/api/messages/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca conversația.');
    current = data.item;
    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markRead: true }),
    });
    await refreshListSilent();
  }

  async function refreshListSilent() {
    const res = await fetch('/api/messages');
    const data = await res.json().catch(() => ({}));
    if (res.ok) items = Array.isArray(data?.items) ? data.items : [];
  }

  async function sendReply() {
    if (!selectedId || !reply.trim()) return;

    const res = await fetch(`/api/messages/${selectedId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: reply }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error = data?.error ?? 'Nu am putut trimite răspunsul.';
      return;
    }

    reply = '';
    await loadConversation(selectedId);
  }

  async function updateStatus(status: string) {
    if (!selectedId) return;
    const res = await fetch(`/api/messages/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error = data?.error ?? 'Nu am putut actualiza statusul.';
      return;
    }
    await loadConversation(selectedId);
  }

  onMount(loadList);
</script>

<svelte:head>
  <title>Mesaje - Admin DeSaga</title>
</svelte:head>

<AdminNav />

<div class="page">
  <div class="page__head">
    <div>
      <h1>Mesaje</h1>
      <p>Conversații dintre utilizatori și administratori.</p>
    </div>
    <button class="btn btn-outline-secondary" on:click={loadList} disabled={loading}>Reîncarcă</button>
  </div>

  {#if error}<div class="alert alert-danger">{error}</div>{/if}

  <div class="grid">
    <div class="panel listPanel">
      {#if loading}
        <div>Se încarcă conversațiile…</div>
      {:else if items.length === 0}
        <div>Nu există conversații.</div>
      {:else}
        {#each items as item (item.id)}
          <button class:selected={selectedId === item.id} class="conversationBtn" on:click={() => loadConversation(item.id)}>
            <div class="conversationBtn__top">
              <strong>{item.user?.fullName || item.user?.email || 'Utilizator'}</strong>
              {#if item.unreadCount > 0}<span class="badge text-bg-danger">{item.unreadCount}</span>{/if}
            </div>
            <div class="conversationBtn__subject">{item.subject}</div>
            {#if item.lastMessage}
              <div class="conversationBtn__message">{item.lastMessage.body}</div>
            {/if}
          </button>
        {/each}
      {/if}
    </div>

    <div class="panel detailPanel">
      {#if current}
        <div class="detailHead">
          <div>
            <h2>{current.subject}</h2>
            <div class="muted">{current.user?.fullName || current.user?.email}</div>
            <div class="muted">{current.user?.phone || ''}</div>
          </div>
          <div class="detailActions">
            <button class="btn btn-sm btn-outline-secondary" on:click={() => updateStatus('OPEN')}>Open</button>
            <button class="btn btn-sm btn-outline-secondary" on:click={() => updateStatus('CLOSED')}>Closed</button>
            <button class="btn btn-sm btn-outline-secondary" on:click={() => updateStatus('ARCHIVED')}>Archived</button>
          </div>
        </div>

        <div class="messages">
          {#each current.messages as message (message.id)}
            <div class={`message ${message.senderType === 'ADMIN' ? 'message--admin' : 'message--user'}`}>
              <div class="message__meta">{message.senderType} · {new Date(message.createdAt).toLocaleString('ro-RO')}</div>
              <div>{message.body}</div>
            </div>
          {/each}
        </div>

        <div class="replyBox">
          <textarea class="form-control" rows="4" bind:value={reply} placeholder="Scrie răspunsul administratorului..."></textarea>
          <div class="replyActions">
            <button class="btn btn-primary" on:click={sendReply}>Trimite răspuns</button>
          </div>
        </div>
      {:else}
        <div>Selectează o conversație.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .page {
    margin-left: 240px;
    min-height: 100vh;
    padding: 24px;
    background: #f8fafc;
  }

  .page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
  }

  .page__head h1 { margin: 0; font-weight: 900; }
  .page__head p { margin: 6px 0 0; color: rgba(0, 0, 0, 0.65); }

  .grid {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 16px;
  }

  .panel {
    background: white;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .listPanel {
    display: grid;
    gap: 10px;
    align-content: start;
    max-height: calc(100vh - 120px);
    overflow: auto;
  }

  .conversationBtn {
    text-align: left;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    border-radius: 14px;
    padding: 12px;
  }

  .conversationBtn.selected {
    border-color: rgba(38, 153, 214, 0.45);
    background: rgba(38, 153, 214, 0.06);
  }

  .conversationBtn__top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .conversationBtn__subject {
    margin-top: 6px;
    font-weight: 700;
  }

  .conversationBtn__message {
    margin-top: 6px;
    color: rgba(0, 0, 0, 0.65);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .detailHead {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .detailHead h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 900;
  }

  .detailActions {
    display: flex;
    gap: 8px;
    align-items: start;
  }

  .messages {
    display: grid;
    gap: 12px;
    max-height: 55vh;
    overflow: auto;
    padding-right: 4px;
  }

  .message {
    padding: 12px;
    border-radius: 14px;
  }

  .message--user {
    background: rgba(0, 0, 0, 0.04);
  }

  .message--admin {
    background: rgba(38, 153, 214, 0.08);
  }

  .message__meta {
    font-size: 0.82rem;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 6px;
  }

  .replyBox {
    margin-top: 16px;
  }

  .replyActions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .muted { color: rgba(0, 0, 0, 0.65); }
</style>

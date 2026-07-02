<script lang="ts">
  import { formatMessageDate, messageBubbleClass, senderLabel, type Mode } from '$lib/message-thread';

  export let messages: Array<{
    id: string;
    senderType: string;
    body: string;
    createdAt: string | null;
  }> = [];
  export let mode: Mode = 'user';
</script>

{#each messages as msg (msg.id)}
  <div class={`msg ${messageBubbleClass(msg.senderType, mode)}`}>
    <div class="msg-meta">
      <strong>{senderLabel(msg.senderType, mode)}</strong>
      <span>{formatMessageDate(msg.createdAt, mode)}</span>
    </div>
    <div class="msg-body">{msg.body}</div>
  </div>
{/each}

<style>
  .msg {
    max-width: min(760px, 92%);
    padding: 0.85rem;
    border-radius: var(--desaga-radius-md, 12px);
    font-size: 0.9rem;
    border: 1px solid var(--desaga-border, rgba(0, 0, 0, 0.08));
  }

  .msg-other {
    background: rgba(15, 23, 42, 0.04);
    align-self: flex-start;
  }

  .msg-own {
    background: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.08);
    border-color: rgba(var(--desaga-accent-rgb, 38, 153, 214), 0.16);
    align-self: flex-end;
  }

  .msg-system {
    max-width: min(640px, 94%);
    align-self: center;
    text-align: center;
    background: rgba(100, 116, 139, 0.08);
    color: rgba(20, 33, 43, 0.72);
  }

  .msg-system .msg-meta {
    justify-content: center;
  }

  .msg-meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--desaga-muted, rgba(0, 0, 0, 0.62));
    margin-bottom: 6px;
  }

  .msg-body {
    white-space: pre-wrap;
    word-break: break-word;
    color: rgba(20, 33, 43, 0.86);
    line-height: 1.45;
  }
</style>

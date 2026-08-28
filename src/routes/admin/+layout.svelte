<script lang="ts">
  import { page } from '$app/stores';
  import AdminNav from '$lib/components/AdminNav.svelte';

  $: isLoginRoute = $page.url.pathname === '/admin/login';
</script>

{#if !isLoginRoute}
  <AdminNav />
{/if}

<slot />

<style>
  /*
   * Shared admin page shell.
   * All admin pages use <div class="admin-page"> as their root wrapper.
   * These global rules provide the base layout, CSS vars, and shared UI
   * patterns so individual pages only define their own unique styles.
   */

  :global(.admin-page) {
    --bg: #f6f1e7;
    --surface: #fffdf7;
    --ink: #1d241b;
    --muted: #6b7165;
    --line: rgba(31, 42, 28, 0.12);
    --accent: #274f2a;
    --green: #8bd450;
    margin-left: 240px;
    min-height: 100vh;
    padding: clamp(18px, 3vw, 34px);
    background:
      radial-gradient(900px 420px at 8% -5%, rgba(139, 212, 80, 0.22), transparent 60%),
      var(--bg);
    color: var(--ink);
  }

  /* Page title */
  :global(.admin-page h1) {
    margin: 0;
    font-size: clamp(2.2rem, 7vw, 4.6rem);
    line-height: 0.94;
    letter-spacing: -0.07em;
    font-weight: 700;
    color: var(--ink);
  }

  /* Section label above headings */
  :global(.admin-page .eyebrow) {
    margin: 0 0 6px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.13em;
    font-size: 0.75rem;
    font-weight: 700;
  }

  /* Page top bar: title left, action buttons right */
  :global(.admin-page .topbar) {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 18px;
    margin-bottom: 16px;
  }

  :global(.admin-page .topbar p:not(.eyebrow)) {
    max-width: 720px;
    margin: 12px 0 0;
    color: var(--muted);
  }

  /* Notification banners */
  :global(.admin-page .notice) {
    margin-bottom: 16px;
    border-radius: var(--radius);
    padding: 14px 16px;
    display: flex;
    gap: 10px;
    align-items: center;
    font-weight: 600;
  }

  :global(.admin-page .notice.danger) {
    background: #fff1f1;
    border: 1px solid #facaca;
    color: #842029;
  }

  :global(.admin-page .notice.success) {
    background: #ecf8df;
    border: 1px solid #b9e58d;
    color: #285b20;
  }

  :global(.admin-page .notice.info) {
    background: #f4f1e8;
    border: 1px solid rgba(31, 42, 28, 0.12);
    color: #274f2a;
  }

  :global(.admin-page .notice.warn) {
    background: #fff7db;
    border: 1px solid #ecd27b;
    color: #725100;
  }

  /* Spinner used in loading states */
  :global(.admin-page .spinner) {
    display: inline-block;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-lg);
    border: 3px solid rgba(39, 79, 42, 0.18);
    border-top-color: var(--accent);
    animation: admin-spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes admin-spin {
    to { transform: rotate(360deg); }
  }

  /* Full-width loading card */
  :global(.admin-page .stateCard) {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 36px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: var(--muted);
    font-weight: 600;
  }

  /* Full-width empty state card */
  :global(.admin-page .emptyCard) {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 36px 20px;
    display: grid;
    place-items: center;
    text-align: center;
    gap: 12px;
    color: var(--muted);
  }

  :global(.admin-page .emptyCard > i) {
    font-size: 2rem;
    color: var(--accent);
  }

  :global(.admin-page .emptyCard > h2) {
    margin: 0;
    color: var(--ink);
    font-weight: 700;
  }

  /* Search toolbar (icon + input) */
  :global(.admin-page .searchBox) {
    position: relative;
    display: block;
  }

  :global(.admin-page .searchBox > i) {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
  }

  :global(.admin-page .searchBox > input) {
    width: 100%;
    min-height: 54px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 0 18px 0 46px;
    background: rgba(255, 253, 247, 0.9);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 12px 30px rgba(35, 51, 30, 0.07);
  }

  /* Form editor: main content + sidebar */
  :global(.admin-page .editor) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 370px;
    gap: 16px;
  }

  :global(.admin-page .editor .side) {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  /* Shared panel card */
  :global(.admin-page .panel) {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: rgba(255, 253, 247, 0.92);
    box-shadow: 0 20px 56px rgba(35, 51, 30, 0.09);
    padding: 18px;
  }

  :global(.admin-page .panelHead) {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  :global(.admin-page .panelHead h2) {
    margin: 0;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  :global(.admin-page .panelHead > span) {
    border-radius: var(--radius-sm);
    background: rgba(139, 212, 80, 0.22);
    color: var(--accent);
    padding: 7px 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* Two-column form grid inside editor panels */
  :global(.admin-page .formGrid) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  :global(.admin-page .formGrid .full) {
    grid-column: 1 / -1;
  }

  /* Form field inputs */
  :global(.admin-page .formGrid label span),
  :global(.admin-page .panel label > span:first-child) {
    display: block;
    margin-bottom: 7px;
    font-weight: 700;
    color: var(--ink);
  }

  :global(.admin-page .formGrid input),
  :global(.admin-page .formGrid select),
  :global(.admin-page .formGrid textarea),
  :global(.admin-page .panel input:not([type='checkbox']):not([type='file'])),
  :global(.admin-page .panel select),
  :global(.admin-page .panel textarea) {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    min-height: 48px;
    padding: 0 12px;
    background: #fff;
    color: var(--ink);
    font-weight: 600;
  }

  :global(.admin-page .formGrid textarea),
  :global(.admin-page .panel textarea) {
    padding: 12px;
    resize: vertical;
  }

  :global(.admin-page .panel small) {
    display: block;
    margin-top: 6px;
    color: var(--muted);
  }

  /* Image preview box inside editor sidebar */
  :global(.admin-page .preview) {
    margin-top: 14px;
    aspect-ratio: 4/3;
    border-radius: var(--radius-lg);
    border: 1px solid var(--line);
    overflow: hidden;
    background: #f3eee2;
    margin-bottom: 14px;
  }

  :global(.admin-page .preview img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  :global(.admin-page .preview.empty) {
    display: grid;
    place-items: center;
    color: var(--muted);
  }

  /* Submit panel at bottom of editor sidebar */
  :global(.admin-page .submitPanel) {
    display: grid;
    gap: 10px;
  }

  /* ---- Responsive ---- */

  @media (max-width: 991.98px) {
    :global(.admin-page) {
      margin-left: 0;
      padding: 88px 16px 24px;
    }
  }

  @media (max-width: 991.98px) {
    :global(.admin-page .editor) {
      grid-template-columns: 1fr;
    }

    :global(.admin-page .topbar) {
      display: grid;
      align-items: stretch;
    }
  }

  @media (max-width: 640px) {
    :global(.admin-page .formGrid) {
      grid-template-columns: 1fr;
    }

    :global(.admin-page .panel) {
      border-radius: var(--radius-lg);
    }
  }
</style>

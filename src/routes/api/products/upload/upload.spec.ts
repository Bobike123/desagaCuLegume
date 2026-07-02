import { describe, expect, it, beforeEach, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), upload: vi.fn() }));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
}));

const { POST } = await import('./+server');

function makeAdmin() {
  return {
    storage: {
      from: () => ({
        upload: adminMocks.upload,
        getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/x.png' } }),
      }),
    },
  };
}

function uploadEvent(file: File | null, opts: { isAdmin?: boolean } = {}) {
  const formData = new FormData();
  if (file) formData.set('file', file);
  formData.set('folder', 'products');

  return {
    locals: { isAuthenticated: true, isAdmin: opts.isAdmin ?? true, user: { id: 1 } },
    request: new Request('https://desagaculegume.ro/api/products/upload', {
      method: 'POST',
      body: formData,
    }),
  } as any;
}

describe('/api/products/upload POST', () => {
  beforeEach(() => {
    adminMocks.createAdminClient.mockReset();
    adminMocks.upload.mockReset();
    adminMocks.createAdminClient.mockReturnValue(makeAdmin());
    adminMocks.upload.mockResolvedValue({ error: null });
  });

  it('requires admin', async () => {
    const file = new File([new Uint8Array(16)], 'x.png', { type: 'image/png' });
    const res = await POST(uploadEvent(file, { isAdmin: false }));
    expect(res.status).toBe(401);
    expect(adminMocks.upload).not.toHaveBeenCalled();
  });

  it('rejects requests without a file', async () => {
    const res = await POST(uploadEvent(null));
    expect(res.status).toBe(400);
  });

  it('rejects files over the 10MB cap before reading them', async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    const res = await POST(uploadEvent(big));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('prea mare') });
    expect(adminMocks.upload).not.toHaveBeenCalled();
  });

  it('rejects disallowed declared MIME types', async () => {
    const file = new File([new Uint8Array(16)], 'x.svg', { type: 'image/svg+xml' });
    const res = await POST(uploadEvent(file));
    expect(res.status).toBe(400);
    expect(adminMocks.upload).not.toHaveBeenCalled();
  });

  it('rejects content whose magic bytes are not a real image (spoofed extension/type)', async () => {
    const fake = new File([new TextEncoder().encode('<?php echo "not an image"; ?>')], 'x.png', {
      type: 'image/png',
    });
    const res = await POST(uploadEvent(fake));
    expect(res.status).toBe(400);
    expect(adminMocks.upload).not.toHaveBeenCalled();
  });
});

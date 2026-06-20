import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { auth } = await import('./auth');

function fakeResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

const SESSION_USER = {
  id: 1,
  email: 'user@example.com',
  username: 'user1',
  fullName: 'Ion Popescu',
  phone: '0729000000',
  status: 'active',
};

const SESSION_RESPONSE = {
  isAuthenticated: true,
  isAdmin: false,
  user: SESSION_USER,
  roles: [],
};

beforeEach(() => {
  fetchMock.mockReset();
  auth.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('auth.initAuth / refresh', () => {
  it('sets authenticated state on success', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse(SESSION_RESPONSE));
    await auth.initAuth();
    const state = get(auth);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isAdmin).toBe(false);
    expect(state.user).toMatchObject({ email: 'user@example.com' });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clears state on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Unauthorized' }, 401));
    await auth.initAuth();
    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('clears state on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network failure'));
    await auth.initAuth();
    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toContain('Network failure');
  });

  it('marks admin when isAdmin is true', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ ...SESSION_RESPONSE, isAdmin: true }));
    await auth.initAuth();
    expect(get(auth).isAdmin).toBe(true);
  });
});

describe('auth.login', () => {
  it('calls login endpoint and then loads session', async () => {
    fetchMock
      .mockReturnValueOnce(fakeResponse({ success: true }))
      .mockReturnValueOnce(fakeResponse(SESSION_RESPONSE));
    await auth.login({ identity: 'user@example.com', password: 'secret' });
    expect(get(auth).isAuthenticated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws and sets error on non-ok login response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Credențiale incorecte.' }, 401));
    await expect(auth.login({ identity: 'bad', password: 'wrong' })).rejects.toThrow(
      'Credențiale incorecte.'
    );
    expect(get(auth).error).toBe('Credențiale incorecte.');
  });
});

describe('auth.logout', () => {
  it('clears auth state', async () => {
    fetchMock
      .mockReturnValueOnce(fakeResponse(SESSION_RESPONSE))
      .mockReturnValueOnce(fakeResponse({ success: true }));
    await auth.initAuth();
    await auth.logout();
    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('clears state even when logout request fails', async () => {
    fetchMock
      .mockReturnValueOnce(fakeResponse(SESSION_RESPONSE))
      .mockRejectedValueOnce(new Error('Network error'));
    await auth.initAuth();
    // logout uses try/finally: state is cleared but the error still propagates
    await auth.logout().catch(() => {});
    expect(get(auth).isAuthenticated).toBe(false);
  });
});

describe('auth.updateProfile', () => {
  it('sends PATCH and refreshes session', async () => {
    const updatedUser = { ...SESSION_USER, fullName: 'Ion Modificat' };
    fetchMock
      .mockReturnValueOnce(fakeResponse({ success: true }))
      .mockReturnValueOnce(fakeResponse({ ...SESSION_RESPONSE, user: updatedUser }));
    await auth.updateProfile({ fullName: 'Ion Modificat' });
    expect(get(auth).user?.fullName).toBe('Ion Modificat');
  });

  it('throws and sets error on failure', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Profile update failed' }, 400));
    await expect(auth.updateProfile({ fullName: 'X' })).rejects.toThrow('Profile update failed');
    expect(get(auth).error).toBe('Profile update failed');
  });
});

describe('auth.register', () => {
  it('calls register endpoint and then loads session', async () => {
    fetchMock
      .mockReturnValueOnce(fakeResponse({ success: true }))
      .mockReturnValueOnce(fakeResponse(SESSION_RESPONSE));
    await auth.register({ email: 'new@example.com', password: 'pass123' });
    expect(get(auth).isAuthenticated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws and sets error on non-ok register response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Email already taken' }, 409));
    await expect(auth.register({ email: 'x@x.com', password: 'p' })).rejects.toThrow('Email already taken');
    expect(get(auth).error).toBe('Email already taken');
  });
});

describe('auth.deleteAccount', () => {
  it('clears auth state on successful deletion', async () => {
    fetchMock
      .mockReturnValueOnce(fakeResponse(SESSION_RESPONSE))
      .mockReturnValueOnce(fakeResponse({ success: true }));
    await auth.initAuth();
    await auth.deleteAccount({ currentPassword: 'pass', confirmation: 'DELETE' });
    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('throws and sets error when deletion fails', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Parola incorectă.' }, 401));
    await expect(auth.deleteAccount({ currentPassword: 'wrong', confirmation: 'DELETE' })).rejects.toThrow(
      'Parola incorectă.'
    );
    expect(get(auth).error).toBe('Parola incorectă.');
  });
});

describe('auth.changePassword', () => {
  it('sends POST to change-password and resolves', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ success: true }));
    await auth.changePassword({ currentPassword: 'old', newPassword: 'new' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const state = get(auth);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('throws on failure', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Wrong password' }, 401));
    await expect(auth.changePassword({ currentPassword: 'x', newPassword: 'y' })).rejects.toThrow(
      'Wrong password'
    );
  });
});

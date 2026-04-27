import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from 'firebase/auth';

import { useAuthStoreBase } from './auth.store';

const fakeUser = (overrides: Partial<User> = {}): User =>
  ({
    uid: 'u1',
    email: 'user@example.com',
    displayName: 'User',
    ...overrides,
  }) as User;

beforeEach(() => {
  useAuthStoreBase.setState({ user: null, isInitializing: true });
});

describe('auth.store — initial state', () => {
  it('starts with user=null and isInitializing=true', () => {
    expect(useAuthStoreBase.getState().user).toBeNull();
    expect(useAuthStoreBase.getState().isInitializing).toBe(true);
  });
});

describe('auth.store — setUser', () => {
  it('sets a user', () => {
    const u = fakeUser();
    useAuthStoreBase.getState().setUser(u);
    expect(useAuthStoreBase.getState().user).toBe(u);
  });

  it('clears the user with null', () => {
    useAuthStoreBase.getState().setUser(fakeUser());
    useAuthStoreBase.getState().setUser(null);
    expect(useAuthStoreBase.getState().user).toBeNull();
  });

  it('does not change isInitializing', () => {
    useAuthStoreBase.getState().setUser(fakeUser());
    expect(useAuthStoreBase.getState().isInitializing).toBe(true);
  });

  it('replaces the previous user reference', () => {
    const a = fakeUser({ uid: 'a' });
    const b = fakeUser({ uid: 'b' });
    useAuthStoreBase.getState().setUser(a);
    useAuthStoreBase.getState().setUser(b);
    expect(useAuthStoreBase.getState().user).toBe(b);
  });
});

describe('auth.store — setInitialized', () => {
  it('flips isInitializing to false', () => {
    useAuthStoreBase.getState().setInitialized();
    expect(useAuthStoreBase.getState().isInitializing).toBe(false);
  });

  it('is idempotent — calling twice keeps it false', () => {
    useAuthStoreBase.getState().setInitialized();
    useAuthStoreBase.getState().setInitialized();
    expect(useAuthStoreBase.getState().isInitializing).toBe(false);
  });

  it('does not affect the user value', () => {
    const u = fakeUser();
    useAuthStoreBase.getState().setUser(u);
    useAuthStoreBase.getState().setInitialized();
    expect(useAuthStoreBase.getState().user).toBe(u);
  });
});

describe('auth.store — full lifecycle', () => {
  it('models a complete login/logout sequence', () => {
    expect(useAuthStoreBase.getState().isInitializing).toBe(true);
    useAuthStoreBase.getState().setInitialized();
    expect(useAuthStoreBase.getState().isInitializing).toBe(false);

    const u = fakeUser({ uid: 'login' });
    useAuthStoreBase.getState().setUser(u);
    expect(useAuthStoreBase.getState().user).toBe(u);

    useAuthStoreBase.getState().setUser(null);
    expect(useAuthStoreBase.getState().user).toBeNull();
    expect(useAuthStoreBase.getState().isInitializing).toBe(false);
  });
});

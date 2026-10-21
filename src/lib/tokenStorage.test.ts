import { beforeEach, describe, expect, it } from 'vitest';

import { tokenStorage } from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    tokenStorage.clear();
    window.localStorage.clear();
  });

  it('access token 只存在内存，refresh token 落到 localStorage', () => {
    tokenStorage.setSession('access-1', 'refresh-1');

    expect(tokenStorage.getAccessToken()).toBe('access-1');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1');
    expect(window.localStorage.getItem('bsw.refreshToken')).toBe('refresh-1');
    expect(JSON.stringify(window.localStorage)).not.toContain('access-1');
  });

  it('clear 同时清空内存与 localStorage', () => {
    tokenStorage.setSession('access-1', 'refresh-1');
    tokenStorage.clear();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(window.localStorage.getItem('bsw.refreshToken')).toBeNull();
  });
});

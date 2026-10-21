const REFRESH_TOKEN_KEY = 'bsw.refreshToken';

// access token 只放内存：刷新页面后靠 refresh token 恢复会话
let accessToken: string | null = null;

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // 隐私模式 / 存储被禁用：退化为仅内存会话
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  getRefreshToken(): string | null {
    return safeGet(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string | null): void {
    safeSet(REFRESH_TOKEN_KEY, token);
  },

  setSession(nextAccessToken: string, nextRefreshToken: string): void {
    accessToken = nextAccessToken;
    safeSet(REFRESH_TOKEN_KEY, nextRefreshToken);
  },

  clear(): void {
    accessToken = null;
    safeSet(REFRESH_TOKEN_KEY, null);
  },
};

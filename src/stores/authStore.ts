import { create } from 'zustand';

import { authApi } from '@/api/auth';
import { isApiError, setUnauthorizedHandler } from '@/api/client';
import { queryClient } from '@/lib/queryClient';
import { tokenStorage } from '@/lib/tokenStorage';
import type { AuthStatus, LoginInput, RegisterInput, User } from '@/types/auth';

type AuthState = {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  errorCode: string | null;
  errorRequestId: string | null;
  login: (input: LoginInput) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
  handleUnauthorized: () => void;
};

let bootstrapPromise: Promise<void> | null = null;

function readError(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return { message: error.message, code: error.code, requestId: error.requestId ?? null };
  }
  return { message: fallback, code: 'UNKNOWN', requestId: null };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',
  error: null,
  errorCode: null,
  errorRequestId: null,

  clearError: () => set({ error: null, errorCode: null, errorRequestId: null }),

  handleUnauthorized: () => {
    tokenStorage.clear();
    queryClient.clear();
    set({
      user: null,
      status: 'anonymous',
      error: null,
      errorCode: null,
      errorRequestId: null,
    });
  },

  bootstrap: () => {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      if (get().status === 'authenticated') {
        return;
      }

      if (!tokenStorage.getRefreshToken()) {
        set({ user: null, status: 'anonymous' });
        return;
      }

      set({ status: 'loading', error: null, errorCode: null, errorRequestId: null });

      try {
        await authApi.refresh();
        const user = await authApi.me();
        set({ user, status: 'authenticated' });
      } catch (error) {
        // 只有明确失效才清空；网络错误保留 refresh token，下次可重试
        if (isApiError(error) && error.status === 401) {
          tokenStorage.clear();
        }
        set({ user: null, status: 'anonymous' });
      }
    })().finally(() => {
      bootstrapPromise = null;
    });

    return bootstrapPromise;
  },

  login: async (input) => {
    set({
      status: 'loading',
      error: null,
      errorCode: null,
      errorRequestId: null,
    });

    try {
      const response = await authApi.login(input);
      tokenStorage.setSession(response.accessToken, response.refreshToken);
      queryClient.clear();
      set({ user: response.user, status: 'authenticated' });
      return true;
    } catch (error) {
      const detail = readError(error, '登录失败，请稍后重试');
      set({
        status: 'anonymous',
        error: detail.message,
        errorCode: detail.code,
        errorRequestId: detail.requestId,
      });
      return false;
    }
  },

  register: async (input) => {
    set({
      status: 'loading',
      error: null,
      errorCode: null,
      errorRequestId: null,
    });

    try {
      const response = await authApi.register(input);
      tokenStorage.setSession(response.accessToken, response.refreshToken);
      queryClient.clear();
      set({ user: response.user, status: 'authenticated' });
      return true;
    } catch (error) {
      const detail = readError(error, '注册失败，请稍后重试');
      set({
        status: 'anonymous',
        error: detail.message,
        errorCode: detail.code,
        errorRequestId: detail.requestId,
      });
      return false;
    }
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // 登出接口幂等；本地清理不依赖服务端结果
      }
    }

    tokenStorage.clear();
    queryClient.clear();
    set({
      user: null,
      status: 'anonymous',
      error: null,
      errorCode: null,
      errorRequestId: null,
    });
  },
}));

setUnauthorizedHandler(() => {
  useAuthStore.getState().handleUnauthorized();
});

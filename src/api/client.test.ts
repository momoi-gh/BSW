import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tokenStorage } from '@/lib/tokenStorage';

import { ApiError, apiRequest, refreshSession } from './client';

const USER = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: null,
  createdAt: '2026-10-19T12:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function authHeader(init?: RequestInit): string | null {
  return new Headers(init?.headers as HeadersInit | undefined).get('authorization');
}

describe('apiClient', () => {
  beforeEach(() => {
    tokenStorage.clear();
    tokenStorage.setSession('expired-access', 'refresh-1');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    tokenStorage.clear();
  });

  it('并发 401 只触发一次 refresh，并用新 token 重放', async () => {
    let refreshCount = 0;
    let meCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.endsWith('/auth/refresh')) {
          refreshCount += 1;
          await new Promise((resolve) => setTimeout(resolve, 10));
          return jsonResponse({
            user: USER,
            accessToken: 'new-access',
            refreshToken: 'refresh-2',
            expiresIn: 900,
          });
        }

        if (url.endsWith('/users/me')) {
          meCount += 1;
          if (authHeader(init) === 'Bearer new-access') {
            return jsonResponse(USER);
          }
          return jsonResponse(
            { error: { code: 'UNAUTHORIZED', message: '过期', requestId: 'rid-1' } },
            401,
          );
        }

        throw new Error(`unexpected url: ${url}`);
      }),
    );

    const [a, b, c] = await Promise.all([
      apiRequest<typeof USER>('/users/me'),
      apiRequest<typeof USER>('/users/me'),
      apiRequest<typeof USER>('/users/me'),
    ]);

    expect([a.id, b.id, c.id]).toEqual(['u1', 'u1', 'u1']);
    expect(refreshCount).toBe(1);
    expect(meCount).toBe(6);
    expect(tokenStorage.getAccessToken()).toBe('new-access');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-2');
  });

  it('refresh 失败时清空会话并抛出 ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/users/me')) {
          return jsonResponse({ error: { code: 'UNAUTHORIZED', message: '过期' } }, 401);
        }
        if (url.endsWith('/auth/refresh')) {
          return jsonResponse(
            { error: { code: 'INVALID_REFRESH_TOKEN', message: 'refresh 已失效' } },
            401,
          );
        }
        throw new Error(`unexpected url: ${url}`);
      }),
    );

    await expect(apiRequest('/users/me')).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
      status: 401,
    });
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('认证接口不自动刷新', async () => {
    let refreshCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith('/auth/refresh')) {
          refreshCount += 1;
        }
        return jsonResponse({ error: { code: 'INVALID_CREDENTIALS', message: '密码错误' } }, 401);
      }),
    );

    await expect(
      apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'a@b.com', password: 'password123' },
        skipAuth: true,
        skipRefresh: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(refreshCount).toBe(0);
  });

  it('解析错误体与 x-request-id，5xx 不暴露后端 message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'SQL 参数泄露' } }, 500, {
          'x-request-id': 'rid-500',
        }),
      ),
    );

    const error = await apiRequest('/boom').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误，请稍后重试',
      requestId: 'rid-500',
    });
  });

  it('204 返回 undefined，不调用 response.json()', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    await expect(
      apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken: 'refresh-1' },
        skipAuth: true,
        skipRefresh: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('网络错误转成 NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(apiRequest('/users/me')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('GET 遇到 429 按 Retry-After 退避，写操作不自动重试', async () => {
    let getCalls = 0;
    let postCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/slow')) {
          getCalls += 1;
          if (getCalls < 3) {
            return jsonResponse(
              { error: { code: 'TOO_MANY_REQUESTS', message: '请求过于频繁' } },
              429,
              { 'retry-after': '0' },
            );
          }
          return jsonResponse({ ok: true });
        }

        if (url.endsWith('/write')) {
          postCalls += 1;
          return jsonResponse(
            { error: { code: 'TOO_MANY_REQUESTS', message: '请求过于频繁' } },
            429,
            { 'retry-after': '0' },
          );
        }

        throw new Error(`unexpected url: ${url} ${init?.method ?? ''}`);
      }),
    );

    await expect(apiRequest('/slow')).resolves.toEqual({ ok: true });
    expect(getCalls).toBe(3);

    await expect(apiRequest('/write', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 429,
      code: 'TOO_MANY_REQUESTS',
    });
    expect(postCalls).toBe(1);
  });

  it('没有 refresh token 时不发请求，直接判定过期', async () => {
    tokenStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshSession()).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

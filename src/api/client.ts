import type { AuthResponse } from '@/types/auth';

import { tokenStorage } from '@/lib/tokenStorage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** 不带 Authorization（登录/注册/刷新/登出） */
  skipAuth?: boolean;
  /** 401 时不尝试刷新（认证类接口） */
  skipRefresh?: boolean;
  /** 429 时是否指数退避重试，默认仅幂等 GET 开启 */
  retryOn429?: boolean;
  timeoutMs?: number;
};

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshing: Promise<string> | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function send(
  path: string,
  options: ApiRequestOptions,
  accessTokenOverride?: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort, { once: true });

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  const token = accessTokenOverride ?? tokenStorage.getAccessToken();
  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData || options.body instanceof Blob) {
      body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
  }

  try {
    return await fetch(buildUrl(path), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT', '请求超时，请检查网络后重试');
    }
    throw new ApiError(0, 'NETWORK_ERROR', '网络连接失败，请检查网络后重试');
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onAbort);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const body = payload as
    { error?: { code?: string; message?: string; requestId?: string } } | undefined;
  const requestId = body?.error?.requestId ?? response.headers.get('x-request-id') ?? undefined;

  const code = body?.error?.code ?? `HTTP_${response.status}`;
  const message =
    response.status >= 500
      ? '服务器内部错误，请稍后重试'
      : (body?.error?.message ?? `请求失败（${response.status}）`);

  return new ApiError(response.status, code, message, requestId);
}

function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return Promise.resolve(undefined as T);
  }
  return response.json() as Promise<T>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function retryAfterMs(response: Response, attempt: number): number {
  const header = response.headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) {
      return Math.max(0, seconds * 1000);
    }
    const date = Date.parse(header);
    if (Number.isFinite(date)) {
      return Math.max(0, date - Date.now());
    }
  }
  // 1s / 2s / 4s + 抖动，最多 3 次
  return Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 250;
}

/**
 * 刷新令牌（单飞）。
 * 交接文档 §2.5：多个请求同时 401 时只能发一次 refresh，否则旧 refresh 会被吊销。
 */
export function refreshSession(): Promise<string> {
  refreshing ??= (async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      unauthorizedHandler?.();
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', '登录已过期，请重新登录');
    }

    const response = await send('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true,
      skipRefresh: true,
    });

    if (!response.ok) {
      const error = await toApiError(response);
      tokenStorage.clear();
      unauthorizedHandler?.();
      throw error;
    }

    const data = (await response.json()) as AuthResponse;
    tokenStorage.setSession(data.accessToken, data.refreshToken);
    return data.accessToken;
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !options.skipAuth && !options.skipRefresh) {
    const newAccessToken = await refreshSession();
    response = await send(path, options, newAccessToken);
  }

  const method = options.method ?? 'GET';
  const canRetry429 = options.retryOn429 ?? method === 'GET';
  for (let attempt = 0; response.status === 429 && canRetry429 && attempt < 3; attempt += 1) {
    await sleep(retryAfterMs(response, attempt));
    response = await send(path, options);
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuth) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }
    throw await toApiError(response);
  }

  return parseBody<T>(response);
}

const FALLBACK = '/chat';

/** 只允许站内绝对路径，避免开放重定向 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value) {
    return FALLBACK;
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return FALLBACK;
  }
  return value;
}

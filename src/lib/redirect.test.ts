import { describe, expect, it } from 'vitest';

import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('默认回到 /chat', () => {
    expect(safeRedirect(null)).toBe('/chat');
    expect(safeRedirect('')).toBe('/chat');
  });

  it('允许站内绝对路径', () => {
    expect(safeRedirect('/settings')).toBe('/settings');
    expect(safeRedirect('/chat/abc?x=1')).toBe('/chat/abc?x=1');
  });

  it('拒绝开放重定向', () => {
    expect(safeRedirect('//evil.com')).toBe('/chat');
    expect(safeRedirect('https://evil.com')).toBe('/chat');
    expect(safeRedirect('javascript:alert(1)')).toBe('/chat');
    expect(safeRedirect('/login?redirect=//evil.com')).toBe('/chat');
  });
});

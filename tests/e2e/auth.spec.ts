import { expect, test } from '@playwright/test';

const ALICE = { email: 'alice@example.com', password: 'password123' };

test.describe.configure({ mode: 'serial' });

test('登录、刷新页面恢复会话、退出登录', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/login');
  await page.fill('#email', ALICE.email);
  await page.fill('#password', ALICE.password);
  await page.getByRole('button', { name: '登录', exact: true }).click();

  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByText('Alice').first()).toBeVisible();

  const refreshToken = await page.evaluate(() => localStorage.getItem('bsw.refreshToken'));
  expect(refreshToken).toBeTruthy();

  await page.reload();
  await expect(page.getByText('Alice').first()).toBeVisible();
  expect(page.url()).toContain('/chat');
  // 刷新后 access token 从内存丢失，必须通过 refresh + /users/me 恢复
  const rotatedToken = await page.evaluate(() => localStorage.getItem('bsw.refreshToken'));
  expect(rotatedToken).toBeTruthy();
  expect(rotatedToken).not.toBe(refreshToken);

  await page.getByRole('button', { name: '退出登录' }).first().click();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem('bsw.refreshToken'))).toBeNull();

  expect(consoleErrors).toEqual([]);
});

test('密码错误时显示错误码且停留在登录页', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', ALICE.email);
  await page.fill('#password', 'wrong-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('邮箱或密码错误');
  await expect(page.getByRole('alert')).toContainText('INVALID_CREDENTIALS');
  await expect(page).toHaveURL(/\/login/);
});

import { expect, test } from '@playwright/test';

test('公开演示入口展示衡鉴平台介绍', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: '衡鉴' })).toBeVisible();
  await expect(
    page.getByText('电子制造采购质量智能体平台', { exact: true }),
  ).toBeVisible();
});

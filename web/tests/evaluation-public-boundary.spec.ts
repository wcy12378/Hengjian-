import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '评测与回归' }).click();
});

test('公开页展示 Agent 评测能力布局与版本回归闭环', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Agent 评测与回归' })).toBeVisible();
  await expect(page.getByText('演示功能布局', { exact: true })).toBeVisible();

  const capabilities = page.getByRole('region', { name: '评测能力布局' });
  for (const title of ['版本实验', '回归门禁', '故障恢复', '数据集管理', '指标口径', '故障分类']) {
    const capability = capabilities.getByRole('article', { name: title });
    await expect(capability).toBeVisible();
    await expect(capability.getByText('演示功能布局 · 合成数据', { exact: true })).toBeVisible();
    for (const label of ['评测对象', '版本维度', '指标口径', '失败分类', '门禁决策', '恢复动作']) {
      await expect(capability.locator('dt').filter({ hasText: new RegExp(`^${label}$`) })).toBeVisible();
    }
  }

  const versionExperiment = capabilities.getByRole('article', { name: '版本实验' });
  for (const version of ['Prompt 版本', 'Harness 版本', '规则版本']) {
    await expect(versionExperiment.getByText(version, { exact: true })).toBeVisible();
  }

  await expect(page.getByText('公开 GitHub 展示边界', { exact: true })).toBeVisible();
  await expect(page.getByText('内部评测边界', { exact: true })).toBeVisible();
});

test('公开页只展示合成能力描述，不泄露内部观测内容或项目成绩', async ({ page }) => {
  const body = page.locator('body');
  await expect(body).toContainText('合成数据');
  const rawText = await body.innerText();
  const normalized = rawText.toLowerCase().replace(/[\s_-]+/g, '');
  for (const forbidden of ['traceid', 'langfuse', '真实链接', '样本原文', '真实评测结果', '底层数据']) {
    expect(normalized).not.toContain(forbidden);
  }
  expect(rawText.replace(/\s+/g, '')).not.toMatch(/(?:96|98|88|99)%?/);
});

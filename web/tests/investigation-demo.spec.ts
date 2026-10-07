import { expect, test } from '@playwright/test';

test('衡鉴公开演示完成调查、记忆、复核审批、评测与工具闭环', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/demo\/investigation$/);
  await page.getByRole('button', { name: /Q-DEMO-001/ }).click();
  await page.getByRole('button', { name: /供应商本批次过程检验记录缺失/ }).click();
  await page.getByRole('region', { name: '证据检查器' }).getByRole('button', { name: '执行合成补查' }).click();
  await expect(page.getByRole('region', { name: '证据检查器' }).getByText('E-FOLLOWUP-GAP-Q-001')).toBeVisible();

  await page.getByRole('button', { name: '业务记忆' }).click();
  await expect(page).toHaveURL(/\/demo\/memory$/);
  await expect(page.getByRole('heading', { name: 'Agent Memory 业务记忆' })).toBeVisible();
  await page.getByRole('button', { name: /来料尺寸异常隔离规则/ }).click();
  await page.getByRole('region', { name: '记忆修订预览' }).getByRole('button', { name: '装配到本次运行' }).click();
  await expect(page.getByText('已装配到本次运行')).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆修订预览' }).getByText('2.2-preview', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '复核与审批' }).click();
  await expect(page).toHaveURL(/\/demo\/review$/);
  const review = page.getByRole('region', { name: '独立复核包' });
  await expect(review.getByText('E-FOLLOWUP-GAP-Q-001')).toBeVisible();
  await expect(review.getByText('2.2-preview', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '完成当前补查' })).toBeDisabled();
  await page.getByRole('button', { name: '通过复核' }).click();
  await page.getByRole('button', { name: '发起业务审批' }).click();
  await page.getByRole('button', { name: '批准动作' }).click();
  await page.getByRole('button', { name: '执行已授权动作' }).click();
  await expect(page.getByRole('region', { name: '动作回执' }).getByText('处置完成', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '业务记忆' }).click();
  await expect(page.getByText('已装配到本次运行')).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆修订预览' }).getByText('2.2-preview', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '评测与回归' }).click();
  await expect(page).toHaveURL(/\/demo\/evaluation$/);
  await expect(page.getByRole('heading', { name: 'Agent 评测与回归' })).toBeVisible();

  await page.getByRole('button', { name: '数据与工具' }).click();
  await expect(page).toHaveURL(/\/demo\/tools$/);
  await expect(page.getByRole('heading', { name: '数据与工具' })).toBeVisible();
  for (const system of ['ERP', 'SRM', 'WMS', 'MES', 'QMS']) {
    await expect(page.getByRole('heading', { name: system, exact: true })).toBeVisible();
  }
  await expect(page.getByText('EvidenceQuery', { exact: true })).toBeVisible();
  await expect(page.getByText('EvidenceRecord', { exact: true })).toBeVisible();
  await expect(page.getByText('PreToolUse：允许', { exact: true })).toBeVisible();
  await expect(page.getByText('PreToolUse：阻断', { exact: true })).toBeVisible();
  await expect(page.getByText('returnedEvidenceIds', { exact: true })).toBeVisible();
  await expect(page.getByText(/Langfuse|Trace ID|真实凭据/i)).toHaveCount(0);

  await page.goto('/demo/investigation', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '调查工作台' })).toBeVisible();
});

const shareRoutes = [
  ['/demo/investigation', '调查工作台'],
  ['/demo/memory', 'Agent Memory 业务记忆'],
  ['/demo/review', '复核与审批闭环'],
  ['/demo/evaluation', '评测与回归能力'],
  ['/demo/tools', '数据与工具'],
] as const;

for (const [path, heading] of shareRoutes) {
  test(`分享 URL 冷启动直达 ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
  });
}

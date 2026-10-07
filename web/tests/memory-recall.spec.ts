import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '业务记忆' }).click();
});

test('业务记忆展示召回、过滤装配、证据验证和修订闭环', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Agent Memory 业务记忆' })).toBeVisible();
  await expect(page.getByText('结构化业务记忆，不是 JSONL 或运行日志')).toBeVisible();
  const flow = page.getByRole('region', { name: 'Memory 工作流' });
  await expect(flow.getByText('召回', { exact: true })).toBeVisible();
  await expect(flow.getByText('过滤 / 装配', { exact: true })).toBeVisible();
  await expect(flow.getByText('当前证据验证', { exact: true })).toBeVisible();
  await expect(page.getByText('修订预览', { exact: true }).first()).toBeVisible();

  await expect(page.getByRole('button', { name: /旧镀层工艺案例/ })).toContainText('已排除');
  await expect(page.getByText('工艺版本不匹配')).toBeVisible();
  await expect(page.getByRole('button', { name: /来料尺寸异常隔离规则/ })).toContainText('已验证');

  await page.getByRole('button', { name: /来料尺寸异常隔离规则/ }).click();
  const detail = page.getByRole('region', { name: '记忆条目详情' });
  await expect(detail.getByText('召回理由', { exact: true })).toBeVisible();
  await expect(detail.getByText('适用边界', { exact: true })).toBeVisible();
  await expect(detail.getByText('Token 占用', { exact: true })).toBeVisible();
  await expect(detail.getByText('合成质量规则库')).toBeVisible();
  await expect(detail.getByText('版本 2.1')).toBeVisible();
  await expect(detail.getByText('E-Q-IQC')).toBeVisible();
  await expect(detail.getByText('E-Q-WMS')).toBeVisible();
});

test('可按类别和记忆层过滤', async ({ page }) => {
  await page.getByRole('button', { name: '规则', exact: true }).click();
  await expect(page.getByRole('button', { name: /来料尺寸异常隔离规则/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /旧镀层工艺案例/ })).toHaveCount(0);

  await page.getByRole('button', { name: '案例', exact: true }).click();
  await page.getByRole('button', { name: '经验', exact: true }).click();
  await expect(page.getByRole('button', { name: /旧镀层工艺案例/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /来料尺寸异常隔离规则/ })).toHaveCount(0);
});

test('事实或未闭环事项为空时清空旧详情与修订', async ({ page }) => {
  await page.getByRole('button', { name: '决策', exact: true }).click();
  await expect(page.getByRole('button', { name: /来料尺寸异常隔离规则/ })).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆条目详情' }).getByText('来料尺寸异常隔离规则')).toBeVisible();

  await page.getByRole('button', { name: '事实', exact: true }).click();
  await expect(page.getByText('当前筛选下没有合成记忆。')).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆条目详情' }).getByText('选择记忆条目')).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆条目详情' }).getByText('来料尺寸异常隔离规则')).toHaveCount(0);
  await expect(page.getByRole('region', { name: '记忆修订预览' }).getByText('该条目没有修订候选，请选择已验证规则。')).toBeVisible();

  await page.getByRole('button', { name: '未闭环事项', exact: true }).click();
  await expect(page.getByText('当前筛选下没有合成记忆。')).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆条目详情' }).getByText('选择记忆条目')).toBeVisible();
  await expect(page.getByRole('region', { name: '记忆条目详情' }).getByText('来料尺寸异常隔离规则')).toHaveCount(0);
});

test('修订预览说明变化来源且仅更新本地演示状态', async ({ page }) => {
  await page.getByRole('button', { name: /来料尺寸异常隔离规则/ }).click();
  const revision = page.getByRole('region', { name: '记忆修订预览' });
  await expect(revision.getByText('变更前')).toBeVisible();
  await expect(revision.getByText('变更后')).toBeVisible();
  await expect(revision.getByText('2.2-preview')).toBeVisible();
  await expect(revision.getByText('独立复核节点')).toBeVisible();
  await expect(revision.getByText('补充隔离前对象确认条件。')).toBeVisible();
  await expect(revision.getByText('质量工程师（演示）')).toBeVisible();

  await revision.getByRole('button', { name: '装配到本次运行' }).click();
  await expect(revision.getByText('本地演示状态已更新')).toBeVisible();
  await expect(revision.getByText('未写入业务系统')).toBeVisible();
});

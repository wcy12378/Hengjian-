import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '复核与审批' }).click();
});

test('独立 Reviewer 展示 ReviewPackage 全量检查项和只读边界', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '独立复核与审批' })).toBeVisible();
  const review = page.getByRole('region', { name: '独立复核包' });
  await expect(review.getByText('SESSION-REVIEW-Q')).toBeVisible();
  await expect(review.getByText('候选结论', { exact: true })).toBeVisible();
  await expect(review.getByText('证据覆盖', { exact: true })).toBeVisible();
  await expect(review.getByText('对象 / 时间一致性', { exact: true })).toBeVisible();
  await expect(review.getByText('反证检查', { exact: true })).toBeVisible();
  await expect(review.getByText('规则边界', { exact: true })).toBeVisible();
  await expect(review.getByText('独立只读 Session')).toBeVisible();
  await expect(review.getByText('包版本', { exact: true })).toBeVisible();
  await expect(review.getByText('证据版本', { exact: true })).toBeVisible();
  await expect(review.getByText('规则版本', { exact: true })).toBeVisible();
  await expect(review.getByText('本批次尺寸异常', { exact: true })).toBeVisible();
  await expect(review.getByText('E-Q-IQC', { exact: true })).toBeVisible();
  await expect(review.getByText('复核时间', { exact: true })).toBeVisible();
  await expect(page.getByText('调查 Agent、Reviewer 与业务审批三方分离')).toBeVisible();
});

test('补齐缺口后 Reviewer pass 仍须显式审批，授权后方可执行', async ({ page }) => {
  await page.getByRole('button', { name: '完成当前补查' }).click();
  await page.getByRole('button', { name: '通过复核' }).click();

  const approval = page.getByRole('region', { name: '业务审批请求' });
  await expect(approval.getByText('待发起', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '执行已授权动作' })).toBeDisabled();
  await approval.getByRole('button', { name: '发起业务审批' }).click();
  await expect(approval.getByText('待审批', { exact: true })).toBeVisible();
  await approval.getByRole('button', { name: '批准动作' }).click();

  const grant = page.getByRole('region', { name: '动作授权' });
  await expect(grant.getByText('REV-Q-001')).toBeVisible();
  await expect(grant.getByText('包版本')).toBeVisible();
  await expect(grant.getByText('证据版本')).toBeVisible();
  await expect(grant.getByText('规则版本')).toBeVisible();
  await expect(grant.getByText('未使用', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '执行已授权动作' }).click();
  const receipt = page.getByRole('region', { name: '动作回执' });
  await expect(receipt.getByText('成功', { exact: true })).toBeVisible();
  await expect(receipt.getByText('处置完成', { exact: true })).toBeVisible();
  await expect(grant.getByText('已使用', { exact: true })).toBeVisible();
});

test('revise 生成结构化缺口并回流 Harness，escalate 转人工', async ({ page }) => {
  await page.getByRole('button', { name: '完成当前补查' }).click();
  await page.getByRole('button', { name: '要求补查' }).click();
  await expect(page.getByText('Reviewer 要求补充反证核验')).toBeVisible();
  await expect(page.getByText('已回到 Harness 定向补查')).toBeVisible();

  await page.getByRole('button', { name: '重置演示' }).click();
  await page.getByRole('button', { name: '转人工' }).click();
  await expect(page.getByText('已转人工调查')).toBeVisible();
  await expect(page.getByText('Agent 补查已停止，已转人工，等待人工结论。')).toBeVisible();
  await expect(page.getByRole('button', { name: '完成当前补查' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '执行已授权动作' })).toBeDisabled();
  await page.getByRole('button', { name: '调查工作台' }).click();
  await expect(page.getByText('下一步：人工调查')).toBeVisible();
  await expect(page.getByText('人工调查', { exact: true }).first()).toBeVisible();
});

test('拒绝与异常授权都禁止执行，结果未知要求先核验回执', async ({ page }) => {
  await page.getByRole('button', { name: '完成当前补查' }).click();
  await page.getByRole('button', { name: '通过复核' }).click();
  await page.getByRole('button', { name: '发起业务审批' }).click();
  await page.getByRole('button', { name: '拒绝动作' }).click();
  await expect(page.getByText('已拒绝', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '执行已授权动作' })).toBeDisabled();

  const safeguards = page.getByRole('region', { name: '授权守卫场景' });
  for (const status of ['已撤销', '已过期', '证据版本不匹配', '规则版本不匹配', '包版本不匹配']) {
    await expect(safeguards.getByText(status, { exact: true })).toBeVisible();
  }
  await expect(safeguards.getByText('禁止执行', { exact: true })).toHaveCount(5);
  await expect(page.getByText('先核验业务系统回执，禁止盲目重试')).toBeVisible();
});

test('回执面板覆盖全部执行状态且不展示 Trace 或真实凭据', async ({ page }) => {
  const receipt = page.getByRole('region', { name: '动作回执' });
  for (const status of ['未执行', '执行中', '成功', '失败', '结果未知']) {
    await expect(receipt.getByText(status, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Langfuse|Trace ID|真实凭据/i)).toHaveCount(0);
});

test('真实结果未知分支消费授权并阻止盲目重试', async ({ page }) => {
  await page.getByRole('button', { name: '完成当前补查' }).click();
  await page.getByRole('button', { name: '通过复核' }).click();
  await page.getByRole('button', { name: '发起业务审批' }).click();
  await page.getByRole('button', { name: '批准动作' }).click();
  await page.getByRole('button', { name: '模拟结果未知' }).click();

  const receipt = page.getByRole('region', { name: '动作回执' });
  await expect(receipt.getByText('当前：结果未知')).toBeVisible();
  await expect(receipt.getByText('下一步：核验执行回执')).toBeVisible();
  await expect(page.getByRole('button', { name: '执行已授权动作' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '模拟结果未知' })).toBeDisabled();
  await expect(page.getByRole('region', { name: '动作授权' }).getByText('已使用', { exact: true })).toBeVisible();
});

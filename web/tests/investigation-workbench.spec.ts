import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
});

test('质量案件展示七步 SOP、证据矩阵和越界工具阻断', async ({ page }) => {
  await page.getByRole('button', { name: /Q-DEMO-001/ }).click();
  await expect(page.locator('[data-testid="sop-step"]')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'EvidenceMatrix' })).toBeVisible();
  await expect(page.getByText('目标对象超出本案 EvidenceQuery 授权范围。')).toBeVisible();
  await expect(page.getByText('PreToolUse：阻断')).toBeVisible();
});

test('点选证据缺口后展示补查依据和范围，补查刷新矩阵', async ({ page }) => {
  const priorSteps = await page.locator('[data-testid="sop-step"]').allTextContents();
  await page.getByRole('button', { name: /供应商本批次过程检验记录缺失/ }).click();
  const inspector = page.getByRole('region', { name: '证据检查器' });
  await expect(inspector.getByText('为什么影响判断')).toBeVisible();
  await expect(inspector.getByText('无法区分来料制造偏差与仓储或检验环节偏差。')).toBeVisible();
  await expect(inspector.getByText('LOT-Q-240916-A', { exact: true }).first()).toBeVisible();
  await expect(inspector.getByText('2026-09-15 至 2026-10-05')).toBeVisible();
  await expect(inspector.getByText('供应商质量档案查询（只读）')).toBeVisible();
  await inspector.getByRole('button', { name: '执行合成补查' }).click();
  expect((await page.locator('[data-testid="sop-step"]').allTextContents()).slice(0, 5)).toEqual(priorSteps.slice(0, 5));
  await expect(inspector.getByText('已补查')).toBeVisible();
  await expect(page.getByRole('button', { name: /供应商本批次过程检验记录缺失（合成补查）/ })).toBeVisible();
  await expect(inspector.getByText('停止条件')).toBeVisible();
  await expect(inspector.getByText('第 1/1 轮')).toBeVisible();
  await expect(inspector.getByText('T-FOLLOWUP-GAP-Q-001')).toBeVisible();
  await expect(inspector.getByText('E-FOLLOWUP-GAP-Q-001')).toBeVisible();
  await expect(inspector.getByText(/判断变化：.*供应商制造尺寸偏差/)).toBeVisible();
  await expect(inspector.getByText('待独立复核')).toBeVisible();
  await inspector.getByRole('button', { name: 'E-FOLLOWUP-GAP-Q-001' }).click();
  await expect(inspector.getByText('2026-10-05T10:00:00.000Z')).toBeVisible();
});

test('采购补查无确认记录时停止并转人工，保留缺口和阻塞下一步', async ({ page }) => {
  await page.getByRole('button', { name: /P-DEMO-001/ }).click();
  await page.getByRole('button', { name: /缺少供应商对订单版本的确认/ }).click();
  const inspector = page.getByRole('region', { name: '证据检查器' });
  await inspector.getByRole('button', { name: '执行合成补查' }).click();
  await expect(inspector.getByText('转人工', { exact: true })).toBeVisible();
  await expect(inspector.getByText('T-FOLLOWUP-GAP-P-001')).toBeVisible();
  await expect(inspector.getByText('未返回证据记录')).toBeVisible();
  await expect(page.getByText('人工调查', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('阻塞原因：供应商未确认订单版本，补查达到停止条件。')).toBeVisible();
  await expect(page.getByRole('button', { name: /缺少供应商对订单版本的确认（合成补查）/ })).toHaveCount(0);
});

test('案件、SOP、工具和证据展示业务口径及关联', async ({ page }) => {
  await expect(page.getByText('高风险')).toBeVisible();
  await expect(page.getByText('等待证据')).toBeVisible();
  await expect(page.getByText('第 1 次运行')).toBeVisible();
  await expect(page.getByText('补查证据')).toBeVisible();
  await expect(page.getByText('交付物').first()).toBeVisible();
  await expect(page.getByText('进入条件').first()).toBeVisible();
  await expect(page.getByText('退出条件').first()).toBeVisible();
  const tool = page.getByRole('region', { name: '工具活动' });
  await expect(tool.getByText('返回证据 ID').first()).toBeVisible();
  await expect(tool.getByText('E-Q-IQC')).toBeVisible();
  await page.getByRole('button', { name: /IQC 尺寸抽检记录/ }).first().click();
  const inspector = page.getByRole('region', { name: '证据检查器' });
  await expect(inspector.getByText('来源记录引用')).toBeVisible();
  await expect(inspector.getByText('业务定义')).toBeVisible();
  await expect(inspector.getByText('观测值')).toBeVisible();
  await expect(inspector.getByText('单位')).toBeVisible();
});

test('点击证据引用显示来源、双时间、对象和领域字段', async ({ page }) => {
  await page.getByRole('button', { name: /IQC 尺寸抽检记录/ }).first().click();
  const inspector = page.getByRole('region', { name: '证据检查器' });
  await expect(inspector.getByText('QMS（合成）')).toBeVisible();
  await expect(inspector.getByText('采集时间')).toBeVisible();
  await expect(inspector.getByText('业务时间')).toBeVisible();
  await expect(inspector.getByText('LOT-Q-240916-A', { exact: true }).first()).toBeVisible();
  await expect(inspector.getByText('CONN-042')).toBeVisible();
  await expect(inspector.getByText(/抽检样本端子间距超出当前图纸公差/)).toBeVisible();
});

test('切换采购案件显示独立对象和采购字段', async ({ page }) => {
  await page.getByRole('button', { name: /P-DEMO-001/ }).click();
  await expect(page.getByRole('heading', { name: /采购异常：报价版本与交期承诺冲突/ })).toBeVisible();
  await expect(page.locator('[data-testid="sop-step"]')).toHaveCount(7);
  await page.getByRole('button', { name: /供应商报价版本 V3/ }).first().click();
  const inspector = page.getByRole('region', { name: '证据检查器' });
  await expect(inspector.getByText('PO-P-260601')).toBeVisible();
  await expect(inspector.getByText('CNY')).toBeVisible();
  await expect(inspector.getByText('V3', { exact: true })).toBeVisible();
});

test('桌面三栏且窄屏按队列、详情、检查器堆叠', async ({ page }) => {
  const queue = page.getByRole('region', { name: '案件队列' });
  const detail = page.getByRole('heading', { name: /来料检测异常：连接器批次尺寸偏差/ });
  const inspector = page.getByRole('region', { name: '证据检查器' });
  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopQueue = await queue.boundingBox();
  const desktopDetail = await detail.boundingBox();
  const desktopInspector = await inspector.boundingBox();
  expect(desktopQueue && desktopDetail && desktopInspector).toBeTruthy();
  expect(desktopQueue!.x).toBeLessThan(desktopDetail!.x);
  expect(desktopDetail!.x).toBeLessThan(desktopInspector!.x);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileQueue = await queue.boundingBox();
  const mobileDetail = await detail.boundingBox();
  const mobileInspector = await inspector.boundingBox();
  expect(mobileQueue && mobileDetail && mobileInspector).toBeTruthy();
  expect(mobileQueue!.y).toBeLessThan(mobileDetail!.y);
  expect(mobileDetail!.y).toBeLessThan(mobileInspector!.y);
});

import { describe, expect, it } from 'vitest';
import { demoCases } from './demo-data';
import {
  selectCaseProgress,
  selectEvidenceCoverage,
  selectNextAction,
  selectOpenGaps,
  isGrantValid,
} from './selectors';
import { createInvestigationStore } from './store';

const at = new Date('2026-10-06T10:00:00.000Z');

function qualityCase() {
  const found = demoCases.find((item) => item.id === 'Q-DEMO-001');
  if (!found) throw new Error('缺少质量演示案件');
  return structuredClone(found);
}

describe('调查领域派生规则', () => {
  it('未解决 EvidenceGap 优先要求补查', () => {
    const item = qualityCase();
    expect(selectOpenGaps(item)).toHaveLength(1);
    expect(selectNextAction(item, at).kind).toBe('investigate_gap');
    expect(selectEvidenceCoverage(item).missing).toBeGreaterThan(0);
  });

  it('Reviewer revise 使下一步回到 Harness', () => {
    const item = qualityCase();
    item.gaps[0].status = 'resolved';
    expect(selectNextAction(item, at).kind).toBe('rerun_harness');
  });

  it('Reviewer pass 仍需独立业务审批', () => {
    const item = qualityCase();
    item.gaps[0].status = 'resolved';
    item.review.decision = 'pass';
    expect(selectNextAction(item, at).kind).toBe('request_approval');
    expect(selectNextAction(item, at).label).toBe('申请业务审批');
    expect(item.approval.status).toBe('draft');
    expect(item.execution.status).toBe('not_started');
  });

  it('授权后仍需执行回执，成功后才计入处置完成', () => {
    const item = qualityCase();
    item.gaps[0].status = 'resolved';
    item.review.decision = 'pass';
    item.approval.status = 'approved';
    item.approval.grant = {
      id: 'G-TEST',
      demoMode: true,
      action: item.approval.action,
      objectId: item.approval.objectId,
      reviewPackageId: item.review.id,
      packageVersion: item.review.packageVersion,
      evidenceVersion: item.review.evidenceVersion,
      ruleVersion: item.review.ruleVersion,
      issuedAt: '2026-10-06T09:00:00.000Z',
      expiresAt: '2026-10-06T11:00:00.000Z',
      usedAt: null,
    };
    expect(selectNextAction(item, at).kind).toBe('execute_action');
    expect(selectCaseProgress(item).caseCompleted).toBe(false);
    item.execution.status = 'succeeded';
    item.execution.receipt = {
      id: 'R-TEST',
      demoMode: true,
      action: item.approval.action,
      objectId: item.approval.objectId,
      completedAt: '2026-10-06T10:01:00.000Z',
      summary: '模拟隔离完成',
    };
    expect(selectCaseProgress(item).caseCompleted).toBe(true);
  });

  it('过期或对象不匹配的授权不可执行', () => {
    const store = createInvestigationStore();
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001');
    store.getState().review('Q-DEMO-001', 'pass');
    store.getState().requestApproval('Q-DEMO-001', at);
    store.getState().approve('Q-DEMO-001', at);
    const approved = store.getState().cases.find((item) => item.id === 'Q-DEMO-001')!;
    expect(approved.execution.status).toBe('not_started');
    expect(store.getState().execute('Q-DEMO-001', new Date('2026-10-07T10:00:01.000Z'))).toBe(false);
    expect(store.getState().cases.find((item) => item.id === 'Q-DEMO-001')!.execution.status).toBe('not_started');
    expect(selectNextAction(approved, new Date('2026-10-07T10:00:01.000Z')).kind).toBe('renew_approval');
    expect(store.getState().execute('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().cases.find((item) => item.id === 'Q-DEMO-001')!.execution.status).toBe('succeeded');
  });

  it('SOP 使用七个业务步骤，进度只计 SOP 状态', () => {
    const item = qualityCase();
    expect(item.sopSteps.map((step) => step.title)).toEqual([
      '异常界定', '影响批次与风险分级', '按料号/批次/时间窗取证',
      '同类正常批次对照与多源交叉核验', '形成根因假设',
      '按缺项或冲突定向补查', '输出处置草案',
    ]);
    expect(selectCaseProgress(item).completedSteps).toBe(item.sopSteps.filter((step) => step.status === 'completed').length);
  });

  it('补查推进调查 SOP 并刷新复核包，动作执行不改变 SOP 进度', () => {
    const store = createInvestigationStore();
    expect(selectCaseProgress(store.getState().cases[0]).completedSteps).toBe(5);
    expect(store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at)).toBe(true);
    let item = store.getState().cases[0];
    expect(selectCaseProgress(item).completedSteps).toBe(6);
    expect(item.sopSteps[6].status).toBe('current');
    expect(item.review.evidenceAssessment).toContain('补查');
    expect(item.review.citationMappings.some((mapping) => mapping.evidenceIds.includes('E-FOLLOWUP-GAP-Q-001'))).toBe(true);
    expect(store.getState().review(item.id, 'pass', undefined, at)).toBe(true);
    item = store.getState().cases[0];
    expect(selectCaseProgress(item).sopCompleted).toBe(true);
    expect(selectCaseProgress(item).caseCompleted).toBe(false);
    expect(selectCaseProgress(item).completedSteps).toBe(7);
    expect(store.getState().requestApproval(item.id, at)).toBe(true);
    expect(store.getState().approve(item.id, at)).toBe(true);
    expect(store.getState().execute(item.id, at)).toBe(true);
    item = store.getState().cases[0];
    expect(selectCaseProgress(item).completedSteps).toBe(7);
    expect(selectCaseProgress(item).caseCompleted).toBe(true);
  });

  it('多轮 revise 每轮产生新 gap，已解决的旧 gap 不阻塞 pass', () => {
    const store = createInvestigationStore();
    const state = () => store.getState();
    expect(state().resolveGap('Q-DEMO-001', 'GAP-Q-001', at)).toBe(true);
    for (let round = 1; round <= 2; round++) {
      expect(state().review('Q-DEMO-001', 'revise', `第 ${round} 轮补查`, at)).toBe(true);
      const item = state().cases[0];
      const open = selectOpenGaps(item);
      expect(open).toHaveLength(1);
      expect(new Set(item.gaps.map((gap) => gap.id)).size).toBe(item.gaps.length);
      expect(state().resolveGap(item.id, open[0].id, at)).toBe(true);
      expect(selectOpenGaps(state().cases[0])).toHaveLength(0);
    }
    expect(state().review('Q-DEMO-001', 'pass', undefined, at)).toBe(true);
  });

  it('两条初始案件均为草稿，审批须在复核通过后申请', () => {
    const store = createInvestigationStore();
    for (const item of store.getState().cases) {
      expect(item.approval.status).toBe('draft');
      expect(item.approval.requestedAt).toBeUndefined();
      expect(store.getState().requestApproval(item.id, at)).toBe(false);
      expect(store.getState().approve(item.id, at)).toBe(false);
    }
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at);
    store.getState().review('Q-DEMO-001', 'pass', undefined, at);
    expect(store.getState().approve('Q-DEMO-001', at)).toBe(false);
    expect(store.getState().requestApproval('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().cases[0].approval.status).toBe('pending');
  });

  it('授权绑定复核包和版本，对象或版本变化立即失效', () => {
    const store = createInvestigationStore();
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at);
    store.getState().review('Q-DEMO-001', 'pass', undefined, at);
    store.getState().requestApproval('Q-DEMO-001', at);
    store.getState().approve('Q-DEMO-001', at);
    const item = store.getState().cases[0];
    const grant = item.approval.grant;
    expect(isGrantValid(item, grant, at)).toBe(true);
    expect(isGrantValid({ ...item, objectId: 'OTHER' }, grant, at)).toBe(false);
    expect(isGrantValid({ ...item, review: { ...item.review, packageVersion: 'next' } }, grant, at)).toBe(false);
    expect(isGrantValid({ ...item, review: { ...item.review, evidenceVersion: 'next' } }, grant, at)).toBe(false);
    expect(isGrantValid({ ...item, review: { ...item.review, ruleVersion: 'next' } }, grant, at)).toBe(false);
    expect(isGrantValid({ ...item, review: { ...item.review, id: 'OTHER' } }, grant, at)).toBe(false);
    store.setState({ cases: store.getState().cases.map((entry) => entry.id === item.id ? { ...entry, review: { ...entry.review, packageVersion: 'next' } } : entry) });
    expect(store.getState().execute('Q-DEMO-001', at)).toBe(false);
    expect(selectNextAction(store.getState().cases[0], at).kind).toBe('renew_approval');
    expect(store.getState().requestApproval('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().approve('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().cases[0].approval.grant?.packageVersion).toBe('next');
  });

  it('拒绝或撤销授权均不能执行，未知和失败执行需人工处理', () => {
    const store = createInvestigationStore();
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at);
    store.getState().review('Q-DEMO-001', 'pass', undefined, at);
    store.getState().requestApproval('Q-DEMO-001', at);
    expect(store.getState().reject('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().execute('Q-DEMO-001', at)).toBe(false);
    const rejected = store.getState().cases[0];
    expect(selectNextAction(rejected, at).kind).toBe('request_approval');
    expect(isGrantValid({ ...rejected, approval: { ...rejected.approval, status: 'revoked' } }, rejected.approval.grant, at)).toBe(false);
    expect(selectNextAction({ ...rejected, execution: { ...rejected.execution, status: 'unknown' } }, at).kind).toBe('verify_receipt');
    expect(selectNextAction({ ...rejected, execution: { ...rejected.execution, status: 'failed' } }, at).kind).toBe('handle_execution_failure');
    expect(store.getState().requestApproval('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().approve('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().revoke('Q-DEMO-001', at)).toBe(true);
    expect(store.getState().execute('Q-DEMO-001', at)).toBe(false);
    expect(store.getState().cases[0].approval.status).toBe('revoked');
  });

  it('Case 与 Run 生命周期独立推进', () => {
    const store = createInvestigationStore();
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at);
    const afterEvidence = store.getState().cases[0];
    expect(afterEvidence.status).toBe('investigating');
    expect(afterEvidence.run.status).toBe('completed');
    expect(afterEvidence.run.checkpoint.status).toBe('restored');
    store.getState().review('Q-DEMO-001', 'pass', undefined, at);
    const afterReview = store.getState().cases[0];
    expect(afterReview.status).toBe('pending_action');
    expect(afterReview.run.status).toBe('completed');
  });

  it('转人工会关闭 Agent 补查分支并让所有页面优先提示人工调查', () => {
    const store = createInvestigationStore();
    expect(store.getState().review('Q-DEMO-001', 'escalate', '证据冲突转人工', at)).toBe(true);
    const item = store.getState().cases[0];
    expect(item.status).toBe('human_investigation');
    expect(item.run.currentStage).toBe('人工调查');
    expect(item.run.status).toBe('completed');
    expect(item.gaps.every((gap) => gap.status !== 'open')).toBe(true);
    expect(selectNextAction(item, at).kind).toBe('escalate_human');
    expect(selectNextAction(item, at).label).toBe('人工调查');
  });

  it('Reviewer 必须使用独立于调查 Run 的只读 Session', () => {
    for (const item of demoCases) {
      expect(item.review.reviewerSessionId).toBeTruthy();
      expect(item.review.reviewerSessionId).not.toBe(item.run.sessionId);
    }
  });

  it('动作不匹配或授权已使用时守卫拒绝再次执行', () => {
    const store = createInvestigationStore();
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at);
    store.getState().review('Q-DEMO-001', 'pass', undefined, at);
    store.getState().requestApproval('Q-DEMO-001', at);
    store.getState().approve('Q-DEMO-001', at);
    const item = store.getState().cases[0];
    const grant = item.approval.grant!;
    expect(isGrantValid({ ...item, approval: { ...item.approval, action: '其他动作' } }, grant, at)).toBe(false);
    expect(isGrantValid(item, { ...grant, action: '其他动作' }, at)).toBe(false);
    expect(isGrantValid(item, { ...grant, usedAt: at.toISOString() }, at)).toBe(false);
    store.setState({ cases: store.getState().cases.map((entry) => entry.id === item.id ? { ...entry, approval: { ...entry.approval, action: '其他动作' } } : entry) });
    expect(store.getState().execute(item.id, at)).toBe(false);
  });

  it('结果未知会消费授权并禁止重试，下一步改为核验回执', () => {
    const store = createInvestigationStore();
    store.getState().resolveGap('Q-DEMO-001', 'GAP-Q-001', at);
    store.getState().review('Q-DEMO-001', 'pass', undefined, at);
    store.getState().requestApproval('Q-DEMO-001', at);
    store.getState().approve('Q-DEMO-001', at);
    expect(store.getState().execute('Q-DEMO-001', at, 'unknown')).toBe(true);
    const item = store.getState().cases[0];
    expect(item.execution.status).toBe('unknown');
    expect(item.approval.grant?.usedAt).toBe(at.toISOString());
    expect(selectNextAction(item, at).kind).toBe('verify_receipt');
    expect(store.getState().execute('Q-DEMO-001', at, 'succeeded')).toBe(false);
  });

  it('Run 保留会话、重试、检查点和当前阶段，证据保留领域字段', () => {
    for (const item of demoCases) {
      expect(item.run.sessionId).toBeTruthy();
      expect(item.run.attempt).toBeGreaterThan(0);
      expect(item.run.checkpoint).toBeTruthy();
      expect(item.run.currentStage).toBeTruthy();
      expect(item.review.packageVersion).toBeTruthy();
      expect(item.review.evidenceVersion).toBeTruthy();
      expect(item.review.ruleVersion).toBeTruthy();
      expect(item.review.citationMappings.length).toBeGreaterThan(0);
      expect(item.evidence.every((record) => record.domainFields)).toBe(true);
    }
    const quote = demoCases[1].evidence[0].domainFields;
    expect(quote?.currency).toBe('CNY');
    expect(quote?.quantityTerms).toBeTruthy();
    expect(quote?.validUntil).toBeTruthy();
    expect(quote?.deliveryUpdatedAt).toBeTruthy();
    expect(quote?.quoteVersion).toBe('V3');
    expect(demoCases[0].evidence[0].domainFields?.materialCode).toBeTruthy();
    expect(demoCases[0].evidence[0].domainFields?.lot).toBeTruthy();
  });

  it('两条公开案件均为合成数据，并保持 Case 与 Run 的独立状态', () => {
    expect(demoCases.map((item) => item.id)).toEqual(['Q-DEMO-001', 'P-DEMO-001']);
    for (const item of demoCases) {
      expect(item.demoMode).toBe(true);
      expect(item.run.demoMode).toBe(true);
      expect(item.review.demoMode).toBe(true);
      expect(item.approval.demoMode).toBe(true);
      expect(item.execution.demoMode).toBe(true);
      expect(item.status).not.toBe(item.run.status);
    }
  });

  it('只允许把已验证且存在修订的 Memory 装配到当前运行', () => {
    const store = createInvestigationStore();
    expect(store.getState().assembleMemoryRevision('Q-DEMO-001', 'M-Q-OLD', at)).toBe(false);
    expect(store.getState().assembleMemoryRevision('Q-DEMO-001', 'M-Q-RULE', at)).toBe(true);
    const item = store.getState().cases[0];
    expect(item.assembledMemoryRevision).toEqual({
      memoryId: 'M-Q-RULE',
      revisionVersion: '2.2-preview',
      assembledAt: at.toISOString(),
      sourceNode: '独立复核节点',
    });
    expect(item.review.ruleVersion).toBe('2.2-preview');
  });

  it('Memory 装配状态由 store 保持并由 resetDemo 清空', () => {
    const store = createInvestigationStore();
    expect(store.getState().assembleMemoryRevision('Q-DEMO-001', 'M-Q-RULE', at)).toBe(true);
    store.getState().selectCase('P-DEMO-001');
    store.getState().selectCase('Q-DEMO-001');
    expect(store.getState().cases[0].assembledMemoryRevision?.revisionVersion).toBe('2.2-preview');
    store.getState().resetDemo();
    expect(store.getState().cases[0].assembledMemoryRevision).toBeUndefined();
  });
});

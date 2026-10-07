import type { ActionGrant, EvidenceGap, InvestigationCase } from './model';

export type NextActionKind =
  | 'investigate_gap' | 'rerun_harness' | 'await_review' | 'escalate_human'
  | 'request_approval' | 'renew_approval' | 'execute_action' | 'verify_receipt'
  | 'handle_execution_failure' | 'close_case';

export interface NextAction {
  kind: NextActionKind;
  label: string;
  reason: string;
}

export function selectOpenGaps(item: InvestigationCase): EvidenceGap[] {
  return item.gaps.filter((gap) => gap.status !== 'resolved');
}

export function selectEvidenceCoverage(item: InvestigationCase) {
  const cells = item.hypotheses.flatMap((hypothesis) => hypothesis.cells);
  const covered = cells.filter((cell) => cell.state === 'supports' || cell.state === 'refutes').length;
  const missing = cells.length - covered;
  return { covered, missing, total: cells.length, percent: cells.length ? Math.round(covered / cells.length * 100) : 0 };
}

export function selectCaseProgress(item: InvestigationCase) {
  const completedSteps = item.sopSteps.filter((step) => step.status === 'completed').length;
  const totalSteps = item.sopSteps.length;
  const sopCompleted = totalSteps > 0 && completedSteps === totalSteps;
  const caseCompleted = item.execution.status === 'succeeded' && Boolean(item.execution.receipt);
  return {
    completed: sopCompleted,
    sopCompleted,
    caseCompleted,
    completedSteps: Math.min(completedSteps, totalSteps),
    totalSteps,
    percent: totalSteps ? Math.round(Math.min(completedSteps, totalSteps) / totalSteps * 100) : 0,
    currentStep: sopCompleted ? totalSteps : item.sopSteps.find((step) => step.status === 'current')?.order ?? totalSteps,
  };
}

export function isGrantValid(item: InvestigationCase, grant: ActionGrant | undefined, now: Date = new Date()): boolean {
  return Boolean(
    grant &&
    item.approval.status === 'approved' &&
    grant.demoMode &&
    grant.action === item.approval.action &&
    grant.objectId === item.approval.objectId &&
    grant.objectId === item.objectId &&
    grant.reviewPackageId === item.review.id &&
    grant.packageVersion === item.review.packageVersion &&
    grant.evidenceVersion === item.review.evidenceVersion &&
    grant.ruleVersion === item.review.ruleVersion &&
    grant.usedAt === null &&
    Date.parse(grant.issuedAt) <= now.getTime() &&
    now.getTime() < Date.parse(grant.expiresAt),
  );
}

export function selectNextAction(item: InvestigationCase, now: Date = new Date()): NextAction {
  if (item.execution.status === 'succeeded' && item.execution.receipt) {
    return { kind: 'close_case', label: '处置完成', reason: '已取得动作执行回执。' };
  }
  if (item.execution.status === 'unknown' || item.execution.status === 'running') {
    return { kind: 'verify_receipt', label: '核验执行回执', reason: '执行结果尚未确认，不应重复发起动作。' };
  }
  if (item.execution.status === 'failed') {
    return { kind: 'handle_execution_failure', label: '处理执行失败', reason: item.execution.error ?? '需人工核查失败原因。' };
  }
  const escalatedGap = item.gaps.find((gap) => gap.status === 'escalated');
  if (escalatedGap) {
    return { kind: 'escalate_human', label: '人工调查', reason: escalatedGap.expectedOutcome.summary };
  }
  const openGap = selectOpenGaps(item)[0];
  if (openGap) {
    return { kind: 'investigate_gap', label: '补查证据', reason: openGap.whyItMatters };
  }
  if (item.review.decision === 'revise') {
    return { kind: 'rerun_harness', label: '回到 Harness 重审', reason: item.review.feedback };
  }
  if (item.review.decision === 'escalate') {
    return { kind: 'escalate_human', label: '人工调查', reason: item.review.feedback };
  }
  if (item.review.decision !== 'pass') {
    return { kind: 'await_review', label: '等待独立复核', reason: '候选结论须由 Reviewer 单独审查。' };
  }
  if (item.approval.status === 'rejected' || item.approval.status === 'revoked') {
    return { kind: 'request_approval', label: '重新申请业务审批', reason: '当前审批未授权该动作。' };
  }
  if (item.approval.status === 'draft') {
    return { kind: 'request_approval', label: '申请业务审批', reason: 'Reviewer 已通过，尚未提交业务审批。' };
  }
  if (item.approval.status !== 'approved') {
    return { kind: 'request_approval', label: '等待业务审批', reason: 'Reviewer 通过不构成业务动作授权。' };
  }
  if (!isGrantValid(item, item.approval.grant, now)) {
    return { kind: 'renew_approval', label: '更新业务授权', reason: '授权缺失、过期、已使用或范围不匹配。' };
  }
  return { kind: 'execute_action', label: '执行已授权动作', reason: '仍需取得执行回执才能确认处置完成。' };
}

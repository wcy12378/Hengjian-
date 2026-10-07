import { create } from 'zustand';
import { createStore, type StateCreator } from 'zustand/vanilla';
import { demoCases } from './demo-data';
import type { InvestigationCase, ReviewDecision } from './model';
import { isGrantValid, selectOpenGaps } from './selectors';

export interface InvestigationStore {
  cases: InvestigationCase[];
  selectedCaseId: string;
  selectedEvidenceId: string | null;
  selectedGapId: string | null;
  selectedMemoryId: string | null;
  selectCase: (caseId: string) => void;
  selectEvidence: (evidenceId: string | null) => void;
  selectGap: (gapId: string | null) => void;
  selectMemory: (memoryId: string | null) => void;
  assembleMemoryRevision: (caseId: string, memoryId: string, now?: Date) => boolean;
  resolveGap: (caseId: string, gapId: string, now?: Date) => boolean;
  review: (caseId: string, decision: ReviewDecision, feedback?: string, now?: Date) => boolean;
  requestApproval: (caseId: string, now?: Date) => boolean;
  approve: (caseId: string, now?: Date) => boolean;
  reject: (caseId: string, now?: Date) => boolean;
  revoke: (caseId: string, now?: Date) => boolean;
  execute: (caseId: string, now?: Date, outcome?: 'succeeded' | 'failed' | 'unknown') => boolean;
  resetDemo: () => void;
}

function initialCases(): InvestigationCase[] {
  return structuredClone(demoCases);
}

function currentHypothesisTitle(item: InvestigationCase, gapId: string): string {
  return item.hypotheses.find((hypothesis) => hypothesis.cells.some((cell) => cell.gapId === gapId))?.title ?? '根因判断';
}

const creator: StateCreator<InvestigationStore> = (set, get) => {
  const updateCase = (caseId: string, change: (item: InvestigationCase) => InvestigationCase): boolean => {
    const current = get().cases.find((item) => item.id === caseId);
    if (!current) return false;
    set((state) => ({ cases: state.cases.map((item) => item.id === caseId ? change(item) : item) }));
    return true;
  };

  return {
    cases: initialCases(),
    selectedCaseId: 'Q-DEMO-001',
    selectedEvidenceId: null,
    selectedGapId: null,
    selectedMemoryId: null,
    selectCase: (caseId) => {
      if (get().cases.some((item) => item.id === caseId)) {
        set({ selectedCaseId: caseId, selectedEvidenceId: null, selectedGapId: null, selectedMemoryId: null });
      }
    },
    selectEvidence: (evidenceId) => set({ selectedEvidenceId: evidenceId, selectedGapId: null, selectedMemoryId: null }),
    selectGap: (gapId) => set({ selectedGapId: gapId, selectedEvidenceId: null, selectedMemoryId: null }),
    selectMemory: (memoryId) => set({ selectedMemoryId: memoryId, selectedEvidenceId: null, selectedGapId: null }),
    assembleMemoryRevision: (caseId, memoryId, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      const memory = item?.memoryUsages.find((candidate) => candidate.id === memoryId);
      if (!item || !memory || memory.disposition !== 'validated' || !memory.revision || item.execution.status !== 'not_started') return false;
      if (item.assembledMemoryRevision?.memoryId === memoryId && item.assembledMemoryRevision.revisionVersion === memory.revision.version) return true;
      return updateCase(caseId, (current) => ({
        ...current,
        updatedAt: now.toISOString(),
        assembledMemoryRevision: {
          memoryId,
          revisionVersion: memory.revision!.version,
          assembledAt: now.toISOString(),
          sourceNode: memory.revision!.sourceNode,
        },
        review: {
          ...current.review,
          packageVersion: String(Number(current.review.packageVersion) + 1),
          ruleVersion: memory.revision!.version,
          decision: 'revise',
          feedback: `Memory 修订 ${memory.revision!.version} 已装配，需按新规则版本重新复核。`,
          reviewedAt: undefined,
        },
        approval: {
          ...current.approval,
          status: 'draft',
          requestedAt: undefined,
          decidedAt: undefined,
          grant: undefined,
        },
      }));
    },
    resolveGap: (caseId, gapId, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      const gap = item?.gaps.find((candidate) => candidate.id === gapId);
      if (!item || !gap || gap.status !== 'open' || item.execution.status !== 'not_started') return false;
      const evidenceId = `E-FOLLOWUP-${gapId}`;
      const round = gap.round + 1;
      const toolActivityId = `T-FOLLOWUP-${gapId}${round > 1 ? `-R${round}` : ''}`;
      const hasEvidence = gap.expectedOutcome.result === 'supports' && Boolean(gap.expectedOutcome.businessAt);
      const reachedStop = !hasEvidence && round >= gap.maxRounds;
      const judgementChange = hasEvidence
        ? `${currentHypothesisTitle(item, gapId)}：过程记录补齐，证据由缺失转为支持，待独立复核。`
        : `${currentHypothesisTitle(item, gapId)}：仍无确认记录，判断保留，${reachedStop ? '转人工调查' : '等待下一轮补查'}。`;
      const queryFields = item.evidence[0]?.domainFields;
      const activity = {
        id: toolActivityId, demoMode: true as const, category: gap.recommendedTool, purpose: gap.title,
        objectId: gap.objectId, timeWindow: gap.timeWindow,
        materialCode: queryFields?.materialCode ?? '未指定', supplier: item.supplier,
        lot: item.domain === 'quality' ? gap.objectId : '不适用（采购订单）',
        returnedEvidenceIds: hasEvidence ? [evidenceId] : [],
        preToolUse: 'allowed' as const, status: 'completed' as const, durationMs: 540,
        evidenceCount: hasEvidence ? 1 : 0, summary: gap.expectedOutcome.summary,
      };
      return updateCase(caseId, (current) => ({
        ...current,
        status: hasEvidence ? 'investigating' : reachedStop ? 'human_investigation' : 'investigating',
        updatedAt: now.toISOString(),
        run: { ...current.run, status: hasEvidence || reachedStop ? 'completed' : 'waiting_for_evidence', attempt: current.run.attempt + 1, currentStage: hasEvidence ? '输出处置草案' : reachedStop ? '人工调查' : '定向补查', checkpoint: { ...current.run.checkpoint, status: 'restored', savedAt: now.toISOString() }, completedAt: hasEvidence || reachedStop ? now.toISOString() : undefined, summary: gap.expectedOutcome.summary },
        review: {
          ...current.review,
          evidenceVersion: hasEvidence ? String(Number(current.review.evidenceVersion) + 1) : current.review.evidenceVersion,
          evidenceAssessment: `${current.review.evidenceAssessment}；补查结果：${gap.expectedOutcome.summary}`,
          citationMappings: hasEvidence ? [
            ...current.review.citationMappings,
            { claim: gap.title, evidenceIds: [evidenceId] },
          ] : current.review.citationMappings,
          feedback: hasEvidence ? '补查已完成，待 Reviewer 重新复核。' : gap.expectedOutcome.summary,
        },
        sopSteps: current.sopSteps.map((step) => step.order === 6 ? { ...step, status: hasEvidence ? 'completed' : 'current', summary: gap.expectedOutcome.summary, round } : step.order === 7 ? { ...step, status: hasEvidence ? 'current' : 'pending', summary: hasEvidence ? '正在生成包含新证据引用的处置草案' : '等待人工调查结论', round } : step),
        gaps: current.gaps.map((entry) => entry.id === gapId ? { ...entry, round, status: hasEvidence ? 'resolved' : reachedStop ? 'escalated' : 'open', toolActivityId, judgementChange, resolvedByEvidenceId: hasEvidence ? evidenceId : undefined } : entry),
        evidence: hasEvidence ? [...current.evidence, { id: evidenceId, demoMode: true, title: `${gap.title}（合成补查）`, category: current.domain === 'quality' ? '工艺' : '确认', sourceSystem: current.domain === 'quality' ? '供应商质量档案（合成）' : 'SRM（合成）', collectedAt: now.toISOString(), businessAt: gap.expectedOutcome.businessAt!, objectId: gap.objectId, sourceRecordRef: `SYNTH-${gapId}-${round}`, businessDefinition: gap.expectedOutcome.businessDefinition ?? gap.title, observedValue: gap.expectedOutcome.observedValue, unit: gap.expectedOutcome.unit, summary: gap.expectedOutcome.summary, state: 'valid' as const, domainFields: current.domain === 'quality' ? { domain: 'quality' as const, lot: gap.objectId, materialCode: queryFields?.materialCode } : { domain: 'procurement' as const, materialCode: queryFields?.materialCode, orderVersion: 'V2' } }] : current.evidence,
        hypotheses: current.hypotheses.map((hypothesis) => ({ ...hypothesis, conclusion: hypothesis.cells.some((cell) => cell.gapId === gapId) ? judgementChange : hypothesis.conclusion, cells: hypothesis.cells.map((cell) => cell.gapId === gapId && hasEvidence ? { ...cell, state: 'supports' as const, evidenceIds: [evidenceId] } : cell) })),
        toolActivities: [...current.toolActivities, activity],
      }));
    },
    review: (caseId, decision, feedback, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      if (!item || item.execution.status !== 'not_started' || (decision === 'pass' && selectOpenGaps(item).length > 0)) return false;
      return updateCase(caseId, (current) => {
        const reviseGapId = `GAP-REVIEW-${current.id}-${current.gaps.length + 1}`;
        const needsGap = decision === 'revise' && selectOpenGaps(current).length === 0;
        const gaps = needsGap
          ? [...current.gaps, { id: reviseGapId, demoMode: true as const, title: 'Reviewer 要求补充反证核验', whyItMatters: feedback ?? '候选结论尚缺独立反证核验。', objectId: current.objectId, timeWindow: '当前案件调查窗口', recommendedTool: '只读证据补查', status: 'open' as const, stopCondition: '取得反证核验记录或完成 1 轮查询', round: 0, maxRounds: 1, expectedOutcome: { result: 'supports' as const, businessAt: current.evidence[0]?.businessAt ?? current.openedAt, summary: '已取得反证核验记录。', businessDefinition: 'Reviewer 反证核验' } }]
          : decision === 'escalate'
            ? current.gaps.map((gap) => gap.status === 'open' ? { ...gap, status: 'escalated' as const, judgementChange: feedback ?? '超出自动调查边界，转人工裁决。' } : gap)
            : current.gaps;
        const sopSteps = current.sopSteps.map((step) => {
          if (decision === 'pass') {
            return { ...step, status: 'completed' as const, summary: '调查产物已进入独立复核并通过' };
          }
          if (decision === 'revise') {
            return {
              ...step,
              status: step.order < 6 ? 'completed' as const : step.order === 6 ? 'current' as const : 'pending' as const,
              summary: step.order === 6 ? 'Reviewer 缺口已回流 Harness，等待定向补查' : step.summary,
            };
          }
          return step;
        });
        return {
          ...current,
          status: decision === 'pass' ? 'pending_action' : 'human_investigation',
          updatedAt: now.toISOString(),
          gaps,
          sopSteps,
          run: {
            ...current.run,
            currentStage: decision === 'pass' ? '输出处置草案' : decision === 'revise' ? '定向补查' : decision === 'escalate' ? '人工调查' : current.run.currentStage,
            status: decision === 'pass' || decision === 'escalate' ? 'completed' : decision === 'revise' ? 'waiting_for_evidence' : current.run.status,
            completedAt: decision === 'pass' || decision === 'escalate' ? now.toISOString() : undefined,
          },
          review: {
            ...current.review,
            packageVersion: String(Number(current.review.packageVersion) + 1),
            decision,
            evidenceAssessment:
              decision === 'pass'
                ? '所有结构化证据缺口已关闭，候选结论与引用映射一致。'
                : current.review.evidenceAssessment,
            feedback: feedback ?? (decision === 'pass' ? '证据与边界检查通过，待业务审批。' : current.review.feedback),
            reviewedAt: now.toISOString(),
          },
          approval: { ...current.approval, status: 'draft', requestedAt: undefined, decidedAt: undefined, grant: undefined },
        };
      });
    },
    requestApproval: (caseId, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      if (!item || item.review.decision !== 'pass' || selectOpenGaps(item).length > 0 || item.execution.status !== 'not_started' || (!['draft', 'rejected', 'revoked', 'expired'].includes(item.approval.status) && !(item.approval.status === 'approved' && !isGrantValid(item, item.approval.grant, now)))) return false;
      return updateCase(caseId, (current) => ({ ...current, approval: { ...current.approval, status: 'pending', requestedAt: now.toISOString(), decidedAt: undefined, grant: undefined }, updatedAt: now.toISOString() }));
    },
    approve: (caseId, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      if (!item || item.review.decision !== 'pass' || selectOpenGaps(item).length > 0 || item.approval.status !== 'pending' || item.execution.status !== 'not_started') return false;
      return updateCase(caseId, (current) => ({
        ...current,
        status: 'pending_action',
        updatedAt: now.toISOString(),
        approval: { ...current.approval, status: 'approved', decidedAt: now.toISOString(), grant: { id: `GRANT-${caseId}-${now.getTime()}`, demoMode: true, action: current.approval.action, objectId: current.approval.objectId, reviewPackageId: current.review.id, packageVersion: current.review.packageVersion, evidenceVersion: current.review.evidenceVersion, ruleVersion: current.review.ruleVersion, issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), usedAt: null } },
      }));
    },
    reject: (caseId, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      if (!item || item.approval.status !== 'pending' || item.execution.status !== 'not_started') return false;
      return updateCase(caseId, (current) => ({ ...current, updatedAt: now.toISOString(), approval: { ...current.approval, status: 'rejected', decidedAt: now.toISOString(), grant: undefined } }));
    },
    revoke: (caseId, now = new Date()) => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      if (!item || item.approval.status !== 'approved' || item.execution.status !== 'not_started') return false;
      return updateCase(caseId, (current) => ({ ...current, updatedAt: now.toISOString(), approval: { ...current.approval, status: 'revoked', decidedAt: now.toISOString(), grant: undefined } }));
    },
    execute: (caseId, now = new Date(), outcome = 'succeeded') => {
      const item = get().cases.find((candidate) => candidate.id === caseId);
      if (!item || item.review.decision !== 'pass' || selectOpenGaps(item).length > 0 || item.execution.status !== 'not_started' || !isGrantValid(item, item.approval.grant, now)) return false;
      return updateCase(caseId, (current) => ({
        ...current,
        status: outcome === 'succeeded' ? 'acted' : 'pending_action',
        updatedAt: now.toISOString(),
        approval: { ...current.approval, grant: { ...current.approval.grant!, usedAt: now.toISOString() } },
        execution: outcome === 'succeeded'
          ? { ...current.execution, status: 'succeeded', startedAt: now.toISOString(), error: undefined, receipt: { id: `RECEIPT-${caseId}-${now.getTime()}`, demoMode: true, action: current.approval.action, objectId: current.approval.objectId, completedAt: now.toISOString(), summary: `${current.approval.action}已在公开演示中模拟完成。` } }
          : { ...current.execution, status: outcome, startedAt: now.toISOString(), receipt: undefined, error: outcome === 'failed' ? '业务系统返回失败，需人工核查后决定是否重新审批。' : '业务系统未返回确定结果，须先核验业务回执。' },
      }));
    },
    resetDemo: () => set({ cases: initialCases(), selectedCaseId: 'Q-DEMO-001', selectedEvidenceId: null, selectedGapId: null, selectedMemoryId: null }),
  };
};

export const createInvestigationStore = () => createStore<InvestigationStore>(creator);
export const useInvestigationStore = create<InvestigationStore>(creator);

import type { InvestigationCase } from '../model';
import { selectCaseProgress, selectEvidenceCoverage, selectNextAction } from '../selectors';

const caseStatusLabel = { new: '新建', investigating: '调查中', human_investigation: '人工调查中', pending_action: '待处置', acted: '已处置', closed: '已关闭' };
const runStatusLabel = { queued: '排队中', running: '运行中', waiting_for_evidence: '等待证据', completed: '已完成', failed: '失败' };
const riskLabel = { high: '高风险', medium: '中风险', low: '低风险' };

export function CaseHeader({ item }: { item: InvestigationCase }) {
  const progress = selectCaseProgress(item);
  const coverage = selectEvidenceCoverage(item);
  const nextAction = selectNextAction(item);
  const blockingGap = item.gaps.find((gap) => gap.status === 'escalated');
  return (
    <header className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium text-primary">{item.id} · 合成{item.domain === 'quality' ? '质量' : '采购'}案件</p>
      <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div><dt className="text-muted-foreground">目标对象</dt><dd className="mt-1 font-medium break-all">{item.objectId}</dd></div>
        <div><dt className="text-muted-foreground">案件状态</dt><dd className="mt-1 font-medium">{caseStatusLabel[item.status]}</dd></div>
        <div><dt className="text-muted-foreground">风险</dt><dd className="mt-1 font-medium">{riskLabel[item.priority]}</dd></div>
        <div><dt className="text-muted-foreground">Run 状态</dt><dd className="mt-1 font-medium">{runStatusLabel[item.run.status]}</dd></div>
        <div><dt className="text-muted-foreground">当前阶段</dt><dd className="mt-1 font-medium">{item.run.currentStage}</dd></div>
        <div><dt className="text-muted-foreground">运行次数</dt><dd className="mt-1 font-medium">第 {item.run.attempt} 次运行</dd></div>
        <div><dt className="text-muted-foreground">SOP 进度</dt><dd className="mt-1 font-medium">{progress.completedSteps}/{progress.totalSteps}</dd></div>
        <div><dt className="text-muted-foreground">证据覆盖</dt><dd className="mt-1 font-medium">{coverage.covered}/{coverage.total}</dd></div>
      </dl>
      <div className="mt-4 rounded-md bg-muted p-3 text-sm"><span className="font-medium">下一步：{nextAction.label}</span><p className="mt-1 text-muted-foreground">判断依据：{nextAction.reason}</p></div>
      {blockingGap && <p className="mt-3 rounded-md border border-warning/20 bg-warning-bg px-3 py-2 text-sm text-warning">阻塞原因：{blockingGap.expectedOutcome.summary}</p>}
    </header>
  );
}

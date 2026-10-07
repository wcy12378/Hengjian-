import { ActionReceiptPanel } from '../features/investigation/components/ActionReceiptPanel';
import { ApprovalRequestPanel } from '../features/investigation/components/ApprovalRequestPanel';
import { ReviewPackagePanel } from '../features/investigation/components/ReviewPackagePanel';
import type { ReviewDecision } from '../features/investigation/model';
import { useInvestigationStore } from '../features/investigation/store';

export function ReviewApprovalPage() {
  const item = useInvestigationStore((state) => state.cases.find((entry) => entry.id === state.selectedCaseId) ?? state.cases[0]);
  const selectCase = useInvestigationStore((state) => state.selectCase);
  const resolveGap = useInvestigationStore((state) => state.resolveGap);
  const review = useInvestigationStore((state) => state.review);
  const requestApproval = useInvestigationStore((state) => state.requestApproval);
  const approve = useInvestigationStore((state) => state.approve);
  const reject = useInvestigationStore((state) => state.reject);
  const revoke = useInvestigationStore((state) => state.revoke);
  const execute = useInvestigationStore((state) => state.execute);
  const resetDemo = useInvestigationStore((state) => state.resetDemo);

  if (!item) return null;
  const openGap = item.gaps.find((gap) => gap.status === 'open');
  const handleReview = (decision: ReviewDecision) => {
    review(item.id, decision, decision === 'revise' ? '请补充独立反证记录并重新提交。' : decision === 'escalate' ? '证据冲突超出自动调查边界，转人工裁决。' : undefined);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">公开演示 · 合成数据</p>
            <h2 className="mt-1 text-2xl font-semibold">独立复核与审批</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">调查 Agent、Reviewer 与业务审批三方分离。Reviewer 只读审查候选结论与证据引用，业务责任人单独签发动作用途、对象和版本均受限的授权。</p>
          </div>
          <button type="button" onClick={resetDemo} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">重置演示</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="复核案件">
          {useInvestigationStore.getState().cases.map((entry) => (
            <button key={entry.id} type="button" onClick={() => selectCase(entry.id)} className={`rounded-md px-3 py-2 text-sm ${entry.id === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{entry.id}</button>
          ))}
        </div>
      </section>

      <ReviewPackagePanel item={item} onResolveGap={() => openGap && resolveGap(item.id, openGap.id)} onReview={handleReview} />
      <ApprovalRequestPanel item={item} onRequest={() => requestApproval(item.id)} onApprove={() => approve(item.id)} onReject={() => reject(item.id)} onRevoke={() => revoke(item.id)} />
      <ActionReceiptPanel item={item} onExecute={(outcome) => execute(item.id, new Date(), outcome)} />
    </div>
  );
}

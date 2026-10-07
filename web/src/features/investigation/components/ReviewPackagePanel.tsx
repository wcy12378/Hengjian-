import type { InvestigationCase, ReviewDecision } from '../model';
import { selectEvidenceCoverage, selectOpenGaps } from '../selectors';

const decisionLabels: Record<ReviewDecision, string> = {
  pending: '待复核',
  revise: '需补查',
  pass: '已通过',
  escalate: '已转人工',
};

interface ReviewPackagePanelProps {
  item: InvestigationCase;
  onResolveGap: () => void;
  onReview: (decision: ReviewDecision) => void;
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

export function ReviewPackagePanel({ item, onResolveGap, onReview }: ReviewPackagePanelProps) {
  const coverage = selectEvidenceCoverage(item);
  const unresolvedGaps = selectOpenGaps(item);
  const actionableGaps = unresolvedGaps.filter((gap) => gap.status === 'open');
  const escalatedGaps = unresolvedGaps.filter((gap) => gap.status === 'escalated');
  const review = item.review;

  return (
    <section aria-label="独立复核包" className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ReviewPackage · {review.id}</p>
          <h3 className="mt-1 text-lg font-semibold">独立 Reviewer 检查</h3>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{decisionLabels[review.decision]}</span>
      </div>

      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <p className="font-medium">独立只读 Session</p>
        <p className="mt-1 text-muted-foreground">{review.reviewerSessionId} · {review.readOnlyScope}</p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">包版本</dt><dd className="mt-1 font-medium">{review.packageVersion}</dd></div>
        <div><dt className="text-muted-foreground">证据版本</dt><dd className="mt-1 font-medium">{review.evidenceVersion}</dd></div>
        <div><dt className="text-muted-foreground">规则版本</dt><dd className="mt-1 font-medium">{review.ruleVersion}</dd></div>
        <div><dt className="text-muted-foreground">复核时间</dt><dd className="mt-1 text-xs">{review.reviewedAt ?? '尚未复核'}</dd></div>
      </dl>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ReviewField label="候选结论" value={review.candidateConclusion} />
        <ReviewField label="证据覆盖" value={`${coverage.covered}/${coverage.total} 个证据单元已覆盖；${review.evidenceAssessment}`} />
        <ReviewField label="对象 / 时间一致性" value={review.objectTimeConsistency} />
        <ReviewField label="反证检查" value={review.counterEvidence} />
        <ReviewField label="规则边界" value={review.ruleBoundary} />
        <ReviewField label="复核反馈" value={review.feedback} />
      </div>

      <div className="mt-4 rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">结构化缺口</p>
            <p className="mt-1 text-xs text-muted-foreground">{actionableGaps.length ? `${actionableGaps.length} 项待补查，完成后才能通过复核。` : escalatedGaps.length ? 'Agent 补查已停止，已转人工，等待人工结论。' : '全部缺口已关闭，可重新复核。'}</p>
          </div>
          <button type="button" disabled={!actionableGaps.length} onClick={onResolveGap} className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40">
            完成当前补查
          </button>
        </div>
        {unresolvedGaps.map((gap) => (
          <div key={gap.id} className="mt-3 rounded-md bg-muted/60 p-3 text-sm">
            <p className="font-medium">{gap.title}</p>
            <p className="mt-1 text-muted-foreground">对象 {gap.objectId} · {gap.timeWindow}</p>
            <p className="mt-1 text-muted-foreground">停止条件：{gap.stopCondition}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border p-3">
        <p className="text-sm font-medium">结论引用映射</p>
        <div className="mt-2 space-y-2">
          {review.citationMappings.map((mapping) => (
            <div key={mapping.claim} className="rounded-md bg-muted/60 p-2 text-sm">
              <p>{mapping.claim}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {mapping.evidenceIds.map((evidenceId) => <span key={evidenceId} className="rounded bg-background px-2 py-1 font-mono text-xs">{evidenceId}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onReview('pass')} disabled={unresolvedGaps.length > 0} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">通过复核</button>
        <button type="button" onClick={() => onReview('revise')} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">要求补查</button>
        <button type="button" onClick={() => onReview('escalate')} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">转人工</button>
      </div>
      {review.decision === 'revise' && actionableGaps.some((gap) => gap.id.startsWith('GAP-REVIEW-')) && (
        <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">已回到 Harness 定向补查</p>
      )}
      {review.decision === 'escalate' && <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">已转人工调查</p>}
    </section>
  );
}

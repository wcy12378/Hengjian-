import type { InvestigationCase } from '../model';
import { isGrantValid } from '../selectors';

const approvalLabels = {
  draft: '待发起',
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  expired: '已过期',
  revoked: '已撤销',
} as const;

interface ApprovalRequestPanelProps {
  item: InvestigationCase;
  onRequest: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
}

export function ApprovalRequestPanel({ item, onRequest, onApprove, onReject, onRevoke }: ApprovalRequestPanelProps) {
  const approval = item.approval;
  const grant = approval.grant;
  const valid = isGrantValid(item, grant);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-label="业务审批请求" className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ApprovalRequest · {approval.id}</p>
            <h3 className="mt-1 text-lg font-semibold">业务审批请求</h3>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{approvalLabels[approval.status]}</span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">动作</dt><dd className="mt-1 font-medium">{approval.action}</dd></div>
          <div><dt className="text-muted-foreground">对象</dt><dd className="mt-1 font-mono text-xs">{approval.objectId}</dd></div>
          <div><dt className="text-muted-foreground">影响</dt><dd className="mt-1 leading-6">{approval.impact}</dd></div>
          <div><dt className="text-muted-foreground">依据</dt><dd className="mt-1 leading-6">{approval.basis}</dd></div>
          <div><dt className="text-muted-foreground">审批责任</dt><dd className="mt-1 font-medium">{approval.approverRole}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {approval.status !== 'pending' && approval.status !== 'approved' && (
            <button type="button" onClick={onRequest} disabled={item.review.decision !== 'pass'} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">发起业务审批</button>
          )}
          {approval.status === 'pending' && <>
            <button type="button" onClick={onApprove} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">批准动作</button>
            <button type="button" onClick={onReject} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">拒绝动作</button>
          </>}
          {approval.status === 'approved' && <button type="button" onClick={onRevoke} disabled={item.execution.status !== 'not_started'} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40">撤销授权</button>}
        </div>
      </section>

      <section aria-label="动作授权" className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ActionGrant</p>
            <h3 className="mt-1 text-lg font-semibold">最小范围动作授权</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${valid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{grant ? (grant.usedAt ? '已使用' : valid ? '未使用' : '不可用') : '未签发'}</span>
        </div>
        {grant ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">ReviewPackage</dt><dd className="mt-1 font-mono text-xs">{grant.reviewPackageId}</dd></div>
            <div><dt className="text-muted-foreground">包版本</dt><dd className="mt-1">{grant.packageVersion}</dd></div>
            <div><dt className="text-muted-foreground">证据版本</dt><dd className="mt-1">{grant.evidenceVersion}</dd></div>
            <div><dt className="text-muted-foreground">规则版本</dt><dd className="mt-1">{grant.ruleVersion}</dd></div>
            <div><dt className="text-muted-foreground">动作</dt><dd className="mt-1">{grant.action}</dd></div>
            <div><dt className="text-muted-foreground">对象</dt><dd className="mt-1 font-mono text-xs">{grant.objectId}</dd></div>
            <div><dt className="text-muted-foreground">有效期</dt><dd className="mt-1 text-xs">{grant.issuedAt} — {grant.expiresAt}</dd></div>
          </dl>
        ) : <p className="mt-4 text-sm leading-6 text-muted-foreground">Reviewer 通过后仍须由业务责任人审批，批准后才签发与版本和对象绑定的授权。</p>}
      </section>
    </div>
  );
}

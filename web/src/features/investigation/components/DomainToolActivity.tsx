import type { ToolActivity } from '../model';

export function DomainToolActivity({ activities, onSelectEvidence }: { activities: ToolActivity[]; onSelectEvidence: (evidenceId: string) => void }) {
  return (
    <section aria-label="工具活动" className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">取证工具活动</h3>
      <div className="mt-4 space-y-3">{activities.map((activity) => (
        <article key={activity.id} className="rounded-lg border border-border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-medium">{activity.category}</h4><span className="text-xs text-muted-foreground">合成演示 · {activity.status === 'blocked' ? '已阻断' : activity.status === 'completed' ? '已完成' : '待执行'}</span></div>
          <p className="mt-2">{activity.purpose}</p>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div><dt className="text-muted-foreground">EvidenceQuery 目标对象</dt><dd className="mt-0.5 break-all">{activity.objectId}</dd></div>
            <div><dt className="text-muted-foreground">EvidenceQuery 时间窗</dt><dd className="mt-0.5">{activity.timeWindow}</dd></div>
            <div><dt className="text-muted-foreground">EvidenceQuery 料号</dt><dd className="mt-0.5">{activity.materialCode}</dd></div>
            <div><dt className="text-muted-foreground">EvidenceQuery 供应商</dt><dd className="mt-0.5">{activity.supplier}</dd></div>
            <div><dt className="text-muted-foreground">EvidenceQuery 批次</dt><dd className="mt-0.5">{activity.lot}</dd></div>
            <div><dt className="text-muted-foreground">PreToolUse 结果</dt><dd className="mt-0.5">PreToolUse：{activity.preToolUse === 'blocked' ? '阻断' : '允许'}</dd></div>
            <div><dt className="text-muted-foreground">耗时 / 证据数量</dt><dd className="mt-0.5">{activity.durationMs} ms · {activity.evidenceCount} 条</dd></div>
          </dl>
          <div className="mt-2 text-xs"><span className="text-muted-foreground">返回证据 ID：</span>{activity.returnedEvidenceIds.length ? activity.returnedEvidenceIds.map((id) => <button key={id} type="button" onClick={() => onSelectEvidence(id)} className="ml-1 text-primary underline">{id}</button>) : '未返回证据记录'}</div>
          {activity.blockReason && <p className="mt-3 rounded-md bg-rose-500/10 p-2 text-xs text-rose-700">阻断原因：{activity.blockReason}</p>}
          {activity.blockReason && <p className="mt-1 text-xs">下一步：核对本案授权对象后重建只读查询。</p>}
          <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">技术记录</summary><p className="mt-1">{activity.id} · {activity.summary}</p></details>
        </article>
      ))}</div>
    </section>
  );
}

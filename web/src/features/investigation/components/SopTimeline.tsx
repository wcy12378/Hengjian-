import type { SopStep } from '../model';

const statusLabel = { completed: '已完成', current: '进行中', pending: '待开始' };

export function SopTimeline({ steps }: { steps: SopStep[] }) {
  return (
    <section aria-label="七步 SOP" className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">七步调查 Harness</h3>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">按退出条件推进</span>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[...steps].sort((a, b) => a.order - b.order).map((step) => (
          <li key={step.id} data-testid="sop-step" className={`min-w-0 rounded-lg border p-3 ${step.status === 'current' ? 'border-primary/40 bg-accent/45' : 'border-border bg-background/70'}`}>
            <div className="flex items-start gap-2">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step.status === 'completed' ? 'bg-primary text-primary-foreground' : step.status === 'current' ? 'border border-primary bg-card text-primary' : 'bg-muted text-muted-foreground'}`}>{step.order}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><span className="text-sm font-medium leading-5">{step.title}</span><span className="text-[11px] text-muted-foreground">{statusLabel[step.status]}</span></div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.summary}</p>
              </div>
            </div>
            <dl className="mt-2 grid gap-1 border-t border-border/70 pt-2 text-xs leading-5 text-muted-foreground">
                <div><dt className="inline font-medium text-foreground/75">交付物：</dt><dd className="inline">{step.deliverable}</dd></div>
                <div className="flex justify-between gap-2"><dt className="font-medium text-foreground/75">调查轮次</dt><dd>第 {step.round} 轮</dd></div>
                <div><dt className="inline font-medium text-foreground/75">进入条件：</dt><dd className="inline">{step.entryCriteria}</dd></div>
                <div><dt className="inline font-medium text-foreground/75">退出条件：</dt><dd className="inline">{step.exitCriteria}</dd></div>
              </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}

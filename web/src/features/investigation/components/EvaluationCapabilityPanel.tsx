import type { EvaluationCapability } from '../model';

interface EvaluationCapabilityPanelProps {
  capabilities: EvaluationCapability[];
}

const detailRows = (capability: EvaluationCapability) => [
  { label: '评测对象', value: capability.evaluationObject },
  { label: '版本维度', values: capability.dimensions },
  { label: '指标口径', value: capability.metricDefinition },
  { label: '失败分类', values: capability.failureClasses },
  { label: '门禁决策', value: capability.gateDecision },
  { label: '恢复动作', value: capability.recoveryAction },
];

export function EvaluationCapabilityPanel({ capabilities }: EvaluationCapabilityPanelProps) {
  return (
    <section aria-label="评测能力布局" className="grid gap-4 lg:grid-cols-2">
      {capabilities.map((capability, index) => (
        <article
          key={capability.id}
          aria-label={capability.title}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="border-b border-border bg-muted/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Capability {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{capability.title}</h3>
              </div>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                演示功能布局 · 合成数据
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{capability.description}</p>
          </div>

          <dl className="divide-y divide-border px-5">
            {detailRows(capability).map((row) => (
              <div key={row.label} className="grid gap-2 py-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
                <dd className="text-sm leading-5">
                  {row.values ? (
                    <div className="flex flex-wrap gap-1.5">
                      {row.values.map((value) => (
                        <span key={value} className="rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                          {value}
                        </span>
                      ))}
                    </div>
                  ) : row.value}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </section>
  );
}

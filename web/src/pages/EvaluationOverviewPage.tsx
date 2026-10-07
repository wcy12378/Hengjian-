import { EvaluationCapabilityPanel } from '../features/investigation/components/EvaluationCapabilityPanel';
import { evaluationCapabilities } from '../features/investigation/demo-data';

const stages = ['版本对比', '数据集', '指标', '故障归类', '门禁决策', '恢复验证'];

export function EvaluationOverviewPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">公开演示 · 合成数据</p>
            <h2 className="mt-1 text-2xl font-semibold">Agent 评测与回归</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              展示从 Prompt、Harness 与规则版本对比，到失败归类、发布门禁和恢复验证的工程闭环。
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            演示功能布局
          </span>
        </div>
        <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="评测流程">
          {stages.map((stage, index) => (
            <li key={stage} className="rounded-lg border border-border bg-muted/30 px-3 py-3">
              <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-1 text-sm font-medium">{stage}</p>
            </li>
          ))}
        </ol>
      </section>

      <EvaluationCapabilityPanel capabilities={evaluationCapabilities} />

      <section className="grid gap-4 md:grid-cols-2" aria-label="公开与内部边界">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">公开 GitHub 展示边界</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            仅呈现能力结构、口径定义、交互流程与合成场景，便于理解系统如何做版本比较和发布判断。
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">内部评测边界</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            执行记录、案例明细和运行产物保留在受控环境，由内部权限与审计策略管理。
          </p>
        </article>
      </section>
    </div>
  );
}

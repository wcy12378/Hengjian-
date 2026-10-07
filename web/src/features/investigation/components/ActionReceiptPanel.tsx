import type { InvestigationCase } from '../model';
import { isGrantValid, selectNextAction } from '../selectors';

interface ActionReceiptPanelProps {
  item: InvestigationCase;
  onExecute: (outcome?: 'succeeded' | 'failed' | 'unknown') => void;
}

const executionLabels = {
  not_started: '未执行',
  running: '执行中',
  succeeded: '成功',
  failed: '失败',
  unknown: '结果未知',
} as const;

export function ActionReceiptPanel({ item, onExecute }: ActionReceiptPanelProps) {
  const executable = item.review.decision === 'pass' && isGrantValid(item, item.approval.grant) && item.execution.status === 'not_started';
  const nextAction = selectNextAction(item);
  const scenarios = [
    { label: '未执行', detail: '尚未消费动作授权。' },
    { label: '执行中', detail: '已提交，等待业务系统返回。' },
    { label: '成功', detail: '取得确定回执后才完成处置。' },
    { label: '失败', detail: '保留失败原因，交由人工决定是否重试。' },
    { label: '结果未知', detail: '先核验业务系统回执，禁止盲目重试。' },
  ];
  const guardScenarios = ['已撤销', '已过期', '证据版本不匹配', '规则版本不匹配', '包版本不匹配'];
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <section aria-label="动作回执" className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ActionReceipt</p>
            <h3 className="mt-1 text-lg font-semibold">执行状态与业务回执</h3>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">当前：{executionLabels[item.execution.status]}</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="回执状态图例">
          {scenarios.map((scenario) => (
            <div key={scenario.label} className="rounded-md border border-border p-2 text-xs">
              <p className="font-medium">{scenario.label}</p>
              <p className="mt-1 text-muted-foreground">{scenario.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onExecute('succeeded')} disabled={!executable} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">执行已授权动作</button>
          <button type="button" onClick={() => onExecute('unknown')} disabled={!executable} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">模拟结果未知</button>
        </div>
        <p className="mt-3 text-sm font-medium">下一步：{nextAction.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{nextAction.reason}</p>
        {item.execution.status === 'succeeded' && item.execution.receipt ? (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">处置完成</p>
            <p className="mt-1">{item.execution.receipt.summary}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{item.execution.receipt.id} · {item.execution.receipt.completedAt}</p>
          </div>
        ) : <p className="mt-4 text-sm text-muted-foreground">只有成功执行并取得业务回执后，案件才能标记为处置完成。</p>}
      </section>

      <section aria-label="授权守卫场景" className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold">授权守卫场景</h3>
        <p className="mt-1 text-sm text-muted-foreground">以下合成状态均在执行前被守卫拦截。</p>
        <div className="mt-4 space-y-2">
          {guardScenarios.map((status) => (
            <div key={status} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{status}</span><span className="font-medium text-red-700 dark:text-red-300">禁止执行</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

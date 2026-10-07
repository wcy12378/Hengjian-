import type { InvestigationCase } from '../model';

interface Props {
  cases: InvestigationCase[];
  selectedCaseId: string;
  onSelect: (caseId: string) => void;
}

export function CaseQueue({ cases, selectedCaseId, onSelect }: Props) {
  return (
    <section aria-label="案件队列" className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="font-semibold">案件队列</h3>
      <p className="mt-1 text-xs text-muted-foreground">公开演示 · 全部为合成案件</p>
      <div className="mt-4 space-y-2">
        {cases.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selectedCaseId === item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted ${selectedCaseId === item.id ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <span className="block text-xs font-semibold text-primary">{item.id} · {item.domain === 'quality' ? '质量' : '采购'}</span>
            <span className="mt-1 block text-sm font-medium">{item.title}</span>
            <span className="mt-2 block text-xs text-muted-foreground">{item.objectId} · {item.supplier}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

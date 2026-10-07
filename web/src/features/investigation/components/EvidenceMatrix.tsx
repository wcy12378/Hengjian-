import type { InvestigationCase, EvidenceCell } from '../model';

const stateLabel = { supports: '支持', refutes: '反证', missing: '缺失', stale: '过期', object_mismatch: '对象不匹配' };
const stateStyle = { supports: 'bg-emerald-500/10 text-emerald-700', refutes: 'bg-rose-500/10 text-rose-700', missing: 'bg-amber-500/10 text-amber-700', stale: 'bg-orange-500/10 text-orange-700', object_mismatch: 'bg-slate-500/10 text-slate-700' };

interface Props {
  item: InvestigationCase;
  onSelectEvidence: (id: string) => void;
  onSelectGap: (id: string) => void;
}

function MatrixCell({ item, cell, onSelectEvidence, onSelectGap }: Props & { cell: EvidenceCell }) {
  const gap = item.gaps.find((entry) => entry.id === cell.gapId);
  return (
    <div className="min-h-20 rounded-md border border-border p-2 text-xs">
      <span className={`inline-block rounded px-1.5 py-0.5 ${stateStyle[cell.state]}`}>{stateLabel[cell.state]}</span>
      {gap && (
        <button type="button" onClick={() => onSelectGap(gap.id)} className="mt-1 block w-full text-left text-primary underline-offset-2 hover:underline">
          {gap.title}{gap.status === 'resolved' ? ' · 已补查' : ''}
        </button>
      )}
      {cell.evidenceIds.map((id) => {
        const evidence = item.evidence.find((entry) => entry.id === id);
        return evidence ? <button type="button" key={id} onClick={() => onSelectEvidence(id)} className="mt-1 block w-full text-left text-primary underline-offset-2 hover:underline">{evidence.title}</button> : null;
      })}
    </div>
  );
}

export function EvidenceMatrix({ item, onSelectEvidence, onSelectGap }: Props) {
  const categories = Array.from(new Set(item.hypotheses.flatMap((hypothesis) => hypothesis.cells.map((cell) => cell.category))));
  return (
    <section aria-label="证据矩阵" className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">EvidenceMatrix</h3>
      <p className="mt-1 text-xs text-muted-foreground">根因假设 × 证据类别 · 合成证据</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-2 text-left">
          <thead><tr><th className="w-36 text-xs font-medium text-muted-foreground">根因假设</th>{categories.map((category) => <th key={category} className="text-xs font-medium text-muted-foreground">{category}</th>)}</tr></thead>
          <tbody>{item.hypotheses.map((hypothesis) => (
            <tr key={hypothesis.id}>
              <th className="align-top text-xs font-medium"><span>{hypothesis.title}</span><span className="mt-1 block font-normal text-muted-foreground">{hypothesis.conclusion}</span></th>
              {categories.map((category) => <td key={category} className="align-top">{hypothesis.cells.find((cell) => cell.category === category) ? <MatrixCell item={item} cell={hypothesis.cells.find((cell) => cell.category === category)!} onSelectEvidence={onSelectEvidence} onSelectGap={onSelectGap} /> : <span className="text-xs text-muted-foreground">—</span>}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { MemoryRecallPanel, type MemoryCategoryFilter, type MemoryLayerFilter } from '../features/investigation/components/MemoryRecallPanel';
import { MemoryRevisionPanel } from '../features/investigation/components/MemoryRevisionPanel';
import { useInvestigationStore } from '../features/investigation/store';

const flow = ['召回', '过滤 / 装配', '当前证据验证', '修订预览'];

export function BusinessMemoryPage() {
  const item = useInvestigationStore((state) => state.cases.find((candidate) => candidate.id === 'Q-DEMO-001'));
  const selectedMemoryId = useInvestigationStore((state) => state.selectedMemoryId);
  const selectMemory = useInvestigationStore((state) => state.selectMemory);
  const assembleMemoryRevision = useInvestigationStore((state) => state.assembleMemoryRevision);
  const [category, setCategory] = useState<MemoryCategoryFilter>('all');
  const [layer, setLayer] = useState<MemoryLayerFilter>('all');
  const filtered = useMemo(() => item?.memoryUsages.filter((memory) => (category === 'all' || memory.category === category) && (layer === 'all' || memory.layer === layer)) ?? [], [item, category, layer]);

  useEffect(() => {
    if (filtered.length === 0) {
      if (selectedMemoryId !== null) selectMemory(null);
      return;
    }
    if (!filtered.some((memory) => memory.id === selectedMemoryId)) selectMemory(filtered[0].id);
  }, [filtered, selectedMemoryId, selectMemory]);

  if (!item) return null;
  const selected = filtered.find((memory) => memory.id === selectedMemoryId) ?? filtered[0];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Memory 工作流">
        <ol className="grid gap-2 sm:grid-cols-4">
          {flow.map((step, index) => <li key={step} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><span>{step}</span></li>)}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">结构化业务记忆，不是 JSONL 或运行日志；当前页面使用纯合成数据。</p>
      </section>
      <MemoryRecallPanel memories={item.memoryUsages} evidence={item.evidence} selectedId={selected?.id ?? null} category={category} layer={layer} onCategoryChange={setCategory} onLayerChange={setLayer} onSelect={selectMemory} />
      <MemoryRevisionPanel memory={selected} assembledRevision={item.assembledMemoryRevision} onAssemble={(memoryId) => assembleMemoryRevision(item.id, memoryId)} />
    </div>
  );
}

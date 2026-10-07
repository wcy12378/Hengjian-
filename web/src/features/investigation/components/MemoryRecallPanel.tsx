import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import type { EvidenceRecord, MemoryUsage } from '../model';

export type MemoryCategoryFilter = 'all' | MemoryUsage['category'];
export type MemoryLayerFilter = 'all' | MemoryUsage['layer'];

const categoryLabels: Record<MemoryCategoryFilter, string> = { all: '全部类别', rule: '规则', case: '案例' };
const layerLabels: Record<MemoryLayerFilter, string> = {
  all: '全部层级', fact: '事实', decision: '决策', experience: '经验', open_item: '未闭环事项',
};

const dispositionLabels = { excluded: '已排除', validated: '已验证', candidate: '待验证' } as const;

interface MemoryRecallPanelProps {
  memories: MemoryUsage[];
  evidence: EvidenceRecord[];
  selectedId: string | null;
  category: MemoryCategoryFilter;
  layer: MemoryLayerFilter;
  onCategoryChange: (value: MemoryCategoryFilter) => void;
  onLayerChange: (value: MemoryLayerFilter) => void;
  onSelect: (id: string) => void;
}

export function MemoryRecallPanel({ memories, evidence, selectedId, category, layer, onCategoryChange, onLayerChange, onSelect }: MemoryRecallPanelProps) {
  const filtered = memories.filter((item) => (category === 'all' || item.category === category) && (layer === 'all' || item.layer === layer));
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <Card>
        <CardHeader>
          <CardTitle>召回与装配候选</CardTitle>
          <CardDescription>先按对象语义召回，再用版本、适用边界和当前证据过滤。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2" aria-label="记忆类别筛选">
            <p className="text-xs font-medium text-muted-foreground">类别</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryLabels) as MemoryCategoryFilter[]).map((value) => (
                <Button key={value} size="sm" variant={category === value ? 'default' : 'outline'} onClick={() => onCategoryChange(value)}>{categoryLabels[value]}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-2" aria-label="记忆层级筛选">
            <p className="text-xs font-medium text-muted-foreground">记忆层</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(layerLabels) as MemoryLayerFilter[]).map((value) => (
                <Button key={value} size="sm" variant={layer === value ? 'default' : 'outline'} onClick={() => onLayerChange(value)}>{layerLabels[value]}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && <p className="rounded-lg border border-dashed p-4 text-muted-foreground">当前筛选下没有合成记忆。</p>}
            {filtered.map((item) => (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{item.title}</span>
                  <Badge variant={item.disposition === 'validated' ? 'success' : item.disposition === 'excluded' ? 'neutral' : 'warning'}>{dispositionLabels[item.disposition]}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.recallReason}</p>
                {item.disposition === 'excluded' && <p className="mt-2 text-xs font-medium text-warning">排除原因：工艺版本不匹配</p>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card role="region" aria-label="记忆条目详情">
        <CardHeader>
          <CardTitle>{selected?.title ?? '选择记忆条目'}</CardTitle>
          <CardDescription>{selected ? `${categoryLabels[selected.category]} · ${layerLabels[selected.layer]}` : '查看召回依据与证据引用'}</CardDescription>
        </CardHeader>
        {selected && <CardContent className="space-y-4">
          <Detail label="召回理由" value={selected.recallReason} />
          <Detail label="适用边界" value={selected.applicability} />
          <Detail label="当前证据验证" value={selected.validation} />
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Token 占用" value={`${selected.tokenCost} tokens`} />
            <Detail label="版本" value={`版本 ${selected.version}`} />
          </div>
          <Detail label="来源" value={selected.source} />
          <div>
            <p className="text-xs font-medium text-muted-foreground">证据引用</p>
            <div className="mt-2 space-y-2">
              {selected.evidenceIds.map((id) => {
                const record = evidence.find((item) => item.id === id);
                return <div key={id} className="rounded-md bg-muted/60 px-3 py-2 text-xs"><span className="font-mono font-medium">{id}</span>{record && <span className="ml-2 text-muted-foreground">{record.title}</span>}</div>;
              })}
            </div>
          </div>
        </CardContent>}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm leading-6">{value}</p></div>;
}

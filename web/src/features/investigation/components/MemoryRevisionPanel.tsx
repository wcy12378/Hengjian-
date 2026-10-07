import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import type { AssembledMemoryRevision, MemoryUsage } from '../model';

interface MemoryRevisionPanelProps {
  memory?: MemoryUsage;
  assembledRevision?: AssembledMemoryRevision;
  onAssemble: (memoryId: string) => void;
}

export function MemoryRevisionPanel({ memory, assembledRevision, onAssemble }: MemoryRevisionPanelProps) {
  const assembled = Boolean(memory?.revision && assembledRevision?.memoryId === memory.id && assembledRevision.revisionVersion === memory.revision.version);

  return (
    <Card role="region" aria-label="记忆修订预览">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>修订预览</CardTitle>
          <Badge variant="info">本地演示</Badge>
        </div>
        <CardDescription>验证通过的记忆只生成候选修订，明确来源后再装配到本次运行。</CardDescription>
      </CardHeader>
      <CardContent>
        {!memory?.revision ? (
          <p className="rounded-lg border border-dashed p-4 text-muted-foreground">该条目没有修订候选，请选择已验证规则。</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <ChangeBlock label="变更前" value={memory.revision.before} />
              <ChangeBlock label="变更后" value={memory.revision.after} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="revision" value={memory.revision.version} />
              <Meta label="来源节点" value={memory.revision.sourceNode} />
              <Meta label="修改原因" value={memory.revision.reason} />
              <Meta label="操作者" value={memory.revision.actor} />
            </dl>
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button onClick={() => memory && onAssemble(memory.id)} disabled={assembled} aria-pressed={assembled}>装配到本次运行</Button>
              <p className="text-xs text-muted-foreground">仅改变浏览器内的演示状态，不提交到规则库。</p>
            </div>
            {assembled && <div className="rounded-lg border border-success/20 bg-success-bg px-3 py-2 text-sm text-success"><span className="font-medium">已装配到本次运行</span><span className="ml-2">· revision {assembledRevision?.revisionVersion} · 本地演示状态已更新 · 未写入业务系统</span></div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeBlock({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 leading-5">{value}</dd></div>;
}

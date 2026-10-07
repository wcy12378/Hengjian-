import type { InvestigationCase } from '../model';

const fieldLabel: Record<string, string> = {
  domain: '业务域', materialCode: '料号', lot: '批次', processVersion: '工艺版本', inspectionStandard: '检验标准',
  currency: '币种', quantityTerms: '数量条款', validUntil: '报价有效期', deliveryUpdatedAt: '交期更新时间', quoteVersion: '报价版本', orderVersion: '订单版本',
};

interface Props {
  item: InvestigationCase;
  evidenceId: string | null;
  gapId: string | null;
  onResolveGap: (gapId: string) => void;
  onSelectEvidence: (evidenceId: string) => void;
}

export function EvidenceInspector({ item, evidenceId, gapId, onResolveGap, onSelectEvidence }: Props) {
  const evidence = item.evidence.find((entry) => entry.id === evidenceId);
  const gap = item.gaps.find((entry) => entry.id === gapId);
  return (
    <section aria-label="证据检查器" className="rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
      <h3 className="font-semibold">证据检查器</h3>
      {gap ? (
        <div className="mt-4 space-y-4 text-sm">
          <div><p className="text-xs text-muted-foreground">证据缺口 · 合成数据</p><h4 className="mt-1 font-medium">{gap.title}</h4></div>
          <div><p className="text-xs text-muted-foreground">状态</p><p>{gap.status === 'resolved' ? '已补查' : gap.status === 'escalated' ? '转人工' : '待补查'}</p></div>
          <div><p className="text-xs text-muted-foreground">为什么影响判断</p><p>{gap.whyItMatters}</p></div>
          <div><p className="text-xs text-muted-foreground">目标对象</p><p className="break-all">{gap.objectId}</p></div>
          <div><p className="text-xs text-muted-foreground">时间窗</p><p>{gap.timeWindow}</p></div>
          <div><p className="text-xs text-muted-foreground">推荐工具</p><p>{gap.recommendedTool}</p></div>
          <div><p className="text-xs text-muted-foreground">停止条件</p><p>{gap.stopCondition}</p></div>
          <div><p className="text-xs text-muted-foreground">补查轮次</p><p>第 {gap.round}/{gap.maxRounds} 轮</p></div>
          <div><p className="text-xs text-muted-foreground">预期结果</p><p>{gap.expectedOutcome.summary}</p></div>
          {gap.toolActivityId && <div><p className="text-xs text-muted-foreground">关联调用</p><p>{gap.toolActivityId}</p></div>}
          {gap.toolActivityId && <div><p className="text-xs text-muted-foreground">返回记录</p>{gap.resolvedByEvidenceId ? <button type="button" onClick={() => onSelectEvidence(gap.resolvedByEvidenceId!)} className="text-primary underline">{gap.resolvedByEvidenceId}</button> : <p>未返回证据记录</p>}</div>}
          {gap.judgementChange && <p>判断变化：{gap.judgementChange}</p>}
          {gap.status === 'open' && <button type="button" onClick={() => onResolveGap(gap.id)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">执行合成补查</button>}
        </div>
      ) : evidence ? (
        <div className="mt-4 space-y-4 text-sm">
          <div><p className="text-xs text-muted-foreground">证据引用 · 合成数据</p><h4 className="mt-1 font-medium">{evidence.title}</h4></div>
          <div><p className="text-xs text-muted-foreground">来源系统</p><p>{evidence.sourceSystem}</p></div>
          <div><p className="text-xs text-muted-foreground">来源记录引用</p><p>{evidence.sourceRecordRef}</p></div>
          <div><p className="text-xs text-muted-foreground">业务定义</p><p>{evidence.businessDefinition}</p></div>
          {evidence.observedValue && <div><p className="text-xs text-muted-foreground">观测值</p><p>{evidence.observedValue}</p></div>}
          {evidence.unit && <div><p className="text-xs text-muted-foreground">单位</p><p>{evidence.unit}</p></div>}
          <div><p className="text-xs text-muted-foreground">采集时间</p><p>{evidence.collectedAt}</p></div>
          <div><p className="text-xs text-muted-foreground">业务时间</p><p>{evidence.businessAt}</p></div>
          <div><p className="text-xs text-muted-foreground">目标对象</p><p className="break-all">{evidence.objectId}</p></div>
          <div><p className="text-xs text-muted-foreground">原始记录摘要</p><p>{evidence.summary}</p></div>
          <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4">{Object.entries(evidence.domainFields).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{fieldLabel[key] ?? key}</dt><dd className="mt-1 break-all">{value}</dd></div>)}</dl>
        </div>
      ) : (
        <div className="mt-4 text-sm">
          <p className="text-muted-foreground">选择矩阵中的证据或缺口查看详情。</p>
          <h4 className="mt-5 font-medium">根因假设</h4>
          {item.hypotheses.map((hypothesis) => <div key={hypothesis.id} className="mt-3 rounded-md bg-muted p-3"><p className="font-medium">{hypothesis.title}</p><p className="mt-1 text-muted-foreground">{hypothesis.conclusion}</p></div>)}
        </div>
      )}
    </section>
  );
}

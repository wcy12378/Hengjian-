const systems = [
  { name: 'ERP', scope: '采购订单、物料主数据、收货状态', tool: 'erp.purchase_order.read' },
  { name: 'SRM', scope: '供应商报价、交期承诺、版本确认', tool: 'srm.supplier_confirmation.read' },
  { name: 'WMS', scope: '入库、库存移动、批次隔离记录', tool: 'wms.lot_movement.read' },
  { name: 'MES', scope: '生产批次、工序版本、过程参数', tool: 'mes.process_record.read' },
  { name: 'QMS', scope: '检验结果、不合格项、处置记录', tool: 'qms.inspection_record.read' },
];

const queryFields = [
  ['料号', 'CONN-042'],
  ['供应商', '华东精密连接器（合成）'],
  ['批次', 'LOT-Q-240916-A'],
  ['对象', 'Q-DEMO-001'],
  ['时间窗', '2026-09-15 至 2026-10-05'],
];

const recordFields = [
  ['evidenceId', 'E-Q-IQC'],
  ['来源记录引用', 'SYNTH-QMS-IQC-240916'],
  ['业务口径', '来料检验尺寸偏差记录'],
  ['业务时间', '2026-09-16T08:30:00.000Z'],
  ['采集时间', '2026-10-05T09:30:00.000Z'],
  ['观测值 / 单位', '0.18 mm'],
];

export function DataToolsPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">公开演示 · 合成数据 · 只读调用</p>
        <h2 className="mt-1 text-2xl font-semibold">MCP Hub 工具目录</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          MCP Hub 将五类业务系统封装为只读工具，统一查询边界与证据返回结构；每次调用先经过 PreToolUse 对业务域、对象、时间窗和权限进行校验。
        </p>
      </section>

      <section aria-label="只读 MCP 工具" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {systems.map((system) => (
          <article key={system.name} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-lg font-semibold">{system.name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{system.scope}</p>
            <code className="mt-3 block break-all rounded-md bg-muted px-2 py-1.5 text-xs">{system.tool}</code>
            <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">只读 MCP Tool</span>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">EvidenceQuery</h3>
          <p className="mt-1 text-sm text-muted-foreground">Harness 生成并由权限层校验的统一查询范围。</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {queryFields.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">EvidenceRecord</h3>
          <p className="mt-1 text-sm text-muted-foreground">不同来源返回同一业务证据口径，保留来源引用与双时间。</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {recordFields.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>

      <section aria-label="工具调用守卫" className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">PreToolUse：允许</h3>
            <span className="text-xs text-muted-foreground">QMS · completed</span>
          </div>
          <p className="mt-2 text-sm leading-6">对象、业务域与时间窗均在本案授权范围内，执行只读检验记录查询。</p>
          <p className="mt-3 text-xs text-muted-foreground">returnedEvidenceIds</p>
          <p className="mt-1 font-mono text-sm">E-Q-IQC</p>
        </article>
        <article className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">PreToolUse：阻断</h3>
            <span className="text-xs text-muted-foreground">ERP · blocked</span>
          </div>
          <p className="mt-2 text-sm leading-6">请求对象不属于 Q-DEMO-001，权限层在调用前阻断，未访问业务系统。</p>
          <p className="mt-3 text-xs text-muted-foreground">下一步</p>
          <p className="mt-1 text-sm font-medium">缩小 EvidenceQuery 到当前案件对象后重新提交</p>
        </article>
      </section>
    </div>
  );
}

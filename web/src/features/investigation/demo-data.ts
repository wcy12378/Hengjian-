import type { EvaluationCapability, InvestigationCase, SopStep } from './model';

function sopSteps(current: number): SopStep[] {
  const deliverables = ['异常对象与现象', '风险与影响批次', '证据清单', '交叉核验结果', '根因假设', '缺口补查记录', '处置草案'];
  return [
    '异常界定', '影响批次与风险分级', '按料号/批次/时间窗取证',
    '同类正常批次对照与多源交叉核验', '形成根因假设',
    '按缺项或冲突定向补查', '输出处置草案',
  ].map((title, index) => ({
    id: `SOP-${index + 1}`,
    order: index + 1,
    title,
    status: index + 1 < current ? 'completed' : index + 1 === current ? 'current' : 'pending',
    summary: index + 1 < current ? '已形成可追溯业务摘要' : index + 1 === current ? '等待当前节点闭环' : '尚未开始',
    deliverable: deliverables[index],
    entryCriteria: index === 0 ? '异常已登记' : `第 ${index} 步交付物已形成`,
    exitCriteria: `${deliverables[index]}完成并可引用`,
    round: 1,
  }));
}

export const demoCases: InvestigationCase[] = [
  {
    id: 'Q-DEMO-001', demoMode: true, domain: 'quality',
    title: '来料检测异常：连接器批次尺寸偏差',
    summary: '合成案例：IQC 抽检发现连接器端子尺寸偏差，需核对批次、工艺版本与库存去向。',
    status: 'human_investigation', priority: 'high', objectId: 'LOT-Q-240916-A', supplier: '华东精密元件（演示）',
    openedAt: '2026-10-06T08:30:00.000Z', updatedAt: '2026-10-06T09:25:00.000Z',
    run: { id: 'RUN-Q-001', demoMode: true, sessionId: 'SESSION-RUN-Q-001', attempt: 1, checkpoint: { id: 'CP-Q-001', status: 'saved', savedAt: '2026-10-06T09:20:00.000Z' }, currentStage: '定向补查', status: 'waiting_for_evidence', startedAt: '2026-10-06T08:31:00.000Z', summary: '已完成对象定位与初步取证，等待复核提出的补查。' },
    sopSteps: sopSteps(6),
    evidence: [
      { id: 'E-Q-IQC', demoMode: true, title: 'IQC 尺寸抽检记录', category: '检验', sourceSystem: 'QMS（合成）', collectedAt: '2026-10-06T08:37:00.000Z', businessAt: '2026-10-05T02:10:00.000Z', objectId: 'LOT-Q-240916-A', sourceRecordRef: 'QMS-IQC-20261005-042', businessDefinition: '按 IQC-CONN-2026 测量连接器端子间距', observedValue: '2.58', unit: 'mm', summary: '抽检样本端子间距超出当前图纸公差；记录包含量具校准状态。', state: 'valid', domainFields: { domain: 'quality', materialCode: 'CONN-042', lot: 'LOT-Q-240916-A', processVersion: 'PV-3', inspectionStandard: 'IQC-CONN-2026' } },
      { id: 'E-Q-PO', demoMode: true, title: '采购订单与收货批次', category: '采购', sourceSystem: 'ERP（合成）', collectedAt: '2026-10-06T08:42:00.000Z', businessAt: '2026-10-04T09:00:00.000Z', objectId: 'LOT-Q-240916-A', sourceRecordRef: 'ERP-RECEIPT-Q-001', businessDefinition: '订单与收货批次映射', summary: '订单、收货单和供应商批次号可互相对应。', state: 'valid', domainFields: { domain: 'quality', materialCode: 'CONN-042', lot: 'LOT-Q-240916-A' } },
      { id: 'E-Q-WMS', demoMode: true, title: '仓库库存与领用记录', category: '库存', sourceSystem: 'WMS（合成）', collectedAt: '2026-10-06T08:48:00.000Z', businessAt: '2026-10-06T07:00:00.000Z', objectId: 'LOT-Q-240916-A', sourceRecordRef: 'WMS-LOT-Q-240916-A', businessDefinition: '批次库存与领用状态', summary: '该批次仍有待检库存，尚未进入产线。', state: 'valid', domainFields: { domain: 'quality', materialCode: 'CONN-042', lot: 'LOT-Q-240916-A' } },
      { id: 'E-Q-OLD', demoMode: true, title: '旧工艺变更记录', category: '工艺', sourceSystem: 'MES（合成）', collectedAt: '2026-10-06T08:50:00.000Z', businessAt: '2025-02-10T03:00:00.000Z', objectId: 'LOT-LEGACY-01', sourceRecordRef: 'MES-CHANGE-LEGACY-01', businessDefinition: '历史工艺变更', summary: '历史批次采用不同镀层工艺，对当前批次对象不适用。', state: 'object_mismatch', domainFields: { domain: 'quality', materialCode: 'CONN-OLD', lot: 'LOT-LEGACY-01', processVersion: 'PV-1' } },
    ],
    gaps: [
      { id: 'GAP-Q-001', demoMode: true, title: '供应商本批次过程检验记录缺失', whyItMatters: '无法区分来料制造偏差与仓储或检验环节偏差。', objectId: 'LOT-Q-240916-A', timeWindow: '2026-09-15 至 2026-10-05', recommendedTool: '供应商质量档案查询（只读）', status: 'open', stopCondition: '取得本批次过程检验记录或完成 1 轮查询', round: 0, maxRounds: 1, expectedOutcome: { result: 'supports', businessAt: '2026-10-05T10:00:00.000Z', summary: '供应商过程检验记录显示本批次尺寸偏差。', businessDefinition: '本批次过程检验端子间距', observedValue: '2.58', unit: 'mm' } },
    ],
    hypotheses: [
      { id: 'H-Q-001', title: '供应商制造尺寸偏差', conclusion: '当前证据倾向支持，仍需过程检验记录确认。', cells: [
        { category: '检验', state: 'supports', evidenceIds: ['E-Q-IQC'] },
        { category: '采购', state: 'supports', evidenceIds: ['E-Q-PO'] },
        { category: '工艺', state: 'missing', evidenceIds: [], gapId: 'GAP-Q-001' },
        { category: '库存', state: 'supports', evidenceIds: ['E-Q-WMS'] },
      ] },
      { id: 'H-Q-002', title: '旧工艺版本误用', conclusion: '历史案例对象不匹配，暂予排除。', cells: [
        { category: '检验', state: 'refutes', evidenceIds: ['E-Q-IQC'] },
        { category: '工艺', state: 'object_mismatch', evidenceIds: ['E-Q-OLD'] },
      ] },
    ],
    toolActivities: [
      { id: 'T-Q-QMS', demoMode: true, category: 'QMS 查询', purpose: '核实抽检异常与量具状态', objectId: 'LOT-Q-240916-A', timeWindow: '2026-10-05', materialCode: 'CONN-042', supplier: '华东精密元件（演示）', lot: 'LOT-Q-240916-A', returnedEvidenceIds: ['E-Q-IQC'], preToolUse: 'allowed', status: 'completed', durationMs: 780, evidenceCount: 1, summary: '获取本批次抽检摘要。' },
      { id: 'T-Q-WMS', demoMode: true, category: 'WMS 查询', purpose: '追踪库存和领用去向', objectId: 'LOT-Q-240916-A', timeWindow: '2026-10-04 至 2026-10-06', materialCode: 'CONN-042', supplier: '华东精密元件（演示）', lot: 'LOT-Q-240916-A', returnedEvidenceIds: ['E-Q-WMS'], preToolUse: 'allowed', status: 'completed', durationMs: 620, evidenceCount: 1, summary: '确认批次尚未进入产线。' },
      { id: 'T-Q-BLOCK', demoMode: true, category: 'MES 查询', purpose: '检查其他供应商批次', objectId: 'LOT-OTHER-99', timeWindow: '2026-10-01 至 2026-10-06', materialCode: 'CONN-OTHER', supplier: '其他供应商（演示）', lot: 'LOT-OTHER-99', returnedEvidenceIds: [], preToolUse: 'blocked', blockReason: '目标对象超出本案 EvidenceQuery 授权范围。', status: 'blocked', durationMs: 0, evidenceCount: 0, summary: 'PreToolUse 阻断越界调用，未读取数据。' },
    ],
    memoryUsages: [
      { id: 'M-Q-OLD', demoMode: true, title: '旧镀层工艺案例', category: 'case', layer: 'experience', disposition: 'excluded', recallReason: '连接器尺寸异常语义相近。', applicability: '仅适用于旧镀层工艺与对应供应商。', validation: '当前批次工艺版本、对象均不匹配，排除。', source: '合成案例库', version: '1.2', tokenCost: 124, evidenceIds: ['E-Q-OLD'] },
      { id: 'M-Q-RULE', demoMode: true, title: '来料尺寸异常隔离规则', category: 'rule', layer: 'decision', disposition: 'validated', recallReason: '当前异常满足规则的来料尺寸偏差条件。', applicability: '适用于未投产且待检的连接器批次。', validation: 'IQC 异常和 WMS 未领用记录共同验证适用边界。', source: '合成质量规则库', version: '2.1', tokenCost: 98, evidenceIds: ['E-Q-IQC', 'E-Q-WMS'], revision: { before: '仅核对 IQC 异常。', after: '同时核对 IQC 异常与库存未领用状态。', reason: '补充隔离前对象确认条件。', actor: '质量工程师（演示）', version: '2.2-preview', sourceNode: '独立复核节点' } },
    ],
    review: { id: 'REV-Q-001', demoMode: true, packageVersion: '1', evidenceVersion: '1', ruleVersion: '2.1', citationMappings: [{ claim: '本批次尺寸异常', evidenceIds: ['E-Q-IQC'] }, { claim: '库存未投产', evidenceIds: ['E-Q-WMS'] }], decision: 'revise', reviewerSessionId: 'SESSION-REVIEW-Q', candidateConclusion: '建议隔离本批次待检库存并发起供应商纠正。', evidenceAssessment: '检验、采购、库存证据已覆盖；供应商过程记录待补。', objectTimeConsistency: '当前证据均指向同一来料批次及本次收货窗口。', counterEvidence: '旧工艺案例对象不匹配，不能作为支持证据。', ruleBoundary: '隔离仅作用于本批次待检库存。', readOnlyScope: '仅可读取证据摘要与候选结论，不可调用执行工具。', feedback: '请补查供应商本批次过程检验记录。', reviewedAt: '2026-10-06T09:20:00.000Z' },
    approval: { id: 'APR-Q-001', demoMode: true, status: 'draft', action: '隔离待检库存', objectId: 'LOT-Q-240916-A', impact: '限制本批次待检物料出库，避免进入产线。', basis: 'IQC 尺寸异常与库存去向证据。', approverRole: '质量负责人' },
    execution: { id: 'EXE-Q-001', demoMode: true, status: 'not_started' },
  },
  {
    id: 'P-DEMO-001', demoMode: true, domain: 'procurement',
    title: '采购异常：报价版本与交期承诺冲突',
    summary: '合成案例：供应商报价单与 SRM 交期承诺不一致，需对齐物料、币种和有效期。',
    status: 'investigating', priority: 'medium', objectId: 'PO-P-260601', supplier: '星桥电子（演示）',
    openedAt: '2026-10-06T06:00:00.000Z', updatedAt: '2026-10-06T08:00:00.000Z',
    run: { id: 'RUN-P-001', demoMode: true, sessionId: 'SESSION-RUN-P-001', attempt: 1, checkpoint: { id: 'CP-P-001', status: 'saved', savedAt: '2026-10-06T06:24:00.000Z' }, currentStage: '多源交叉核验', status: 'running', startedAt: '2026-10-06T06:01:00.000Z', summary: '正在核对报价版本、订单需求日与供应商承诺。' },
    sopSteps: sopSteps(4),
    evidence: [
      { id: 'E-P-QUOTE', demoMode: true, title: '供应商报价版本 V3', category: '报价', sourceSystem: 'SRM（合成）', collectedAt: '2026-10-06T06:15:00.000Z', businessAt: '2026-10-02T03:00:00.000Z', objectId: 'PO-P-260601', sourceRecordRef: 'SRM-QUOTE-V3-260601', businessDefinition: '供应商报价版本与承诺交期', observedValue: '21', unit: '天', summary: '单价按人民币计，报价有效至 10 月底，交期承诺为 21 天。', state: 'valid', domainFields: { domain: 'procurement', materialCode: 'MAT-P-2606', currency: 'CNY', quantityTerms: '最小订量 1000 件', validUntil: '2026-10-31T23:59:59.000Z', deliveryUpdatedAt: '2026-10-02T03:00:00.000Z', quoteVersion: 'V3' } },
      { id: 'E-P-ORDER', demoMode: true, title: '采购订单需求日', category: '订单', sourceSystem: 'ERP（合成）', collectedAt: '2026-10-06T06:20:00.000Z', businessAt: '2026-10-03T08:00:00.000Z', objectId: 'PO-P-260601', sourceRecordRef: 'ERP-PO-P-260601', businessDefinition: '订单版本与需求到货日期', summary: '订单采用报价 V2 单价，需求到货日期早于 V3 承诺交期。', state: 'valid', domainFields: { domain: 'procurement', materialCode: 'MAT-P-2606', currency: 'CNY', quantityTerms: '订购 1000 件', orderVersion: 'V2' } },
      { id: 'E-P-COMMIT', demoMode: true, title: '供应商交期确认', category: '交期', sourceSystem: 'SRM（合成）', collectedAt: '2026-10-06T06:24:00.000Z', businessAt: '2026-10-04T01:00:00.000Z', objectId: 'PO-P-260601', sourceRecordRef: 'SRM-COMMIT-V3-260601', businessDefinition: '报价 V3 对应交付窗口', summary: '供应商确认 V3 报价对应的交付窗口，未确认订单需求日。', state: 'valid', domainFields: { domain: 'procurement', materialCode: 'MAT-P-2606', deliveryUpdatedAt: '2026-10-04T01:00:00.000Z', quoteVersion: 'V3' } },
    ],
    gaps: [{ id: 'GAP-P-001', demoMode: true, title: '缺少供应商对订单版本的确认', whyItMatters: '无法确定报价差异和交期差异是否为同一次版本变更。', objectId: 'PO-P-260601', timeWindow: '2026-10-02 至 2026-10-06', recommendedTool: 'SRM 订单确认记录查询（只读）', status: 'open', stopCondition: '1 轮查询未取得订单版本确认则转人工', round: 0, maxRounds: 1, expectedOutcome: { result: 'unresolved', summary: '供应商未确认订单版本，补查达到停止条件。' } }],
    hypotheses: [{ id: 'H-P-001', title: '报价版本与订单版本未同步', conclusion: 'V2 订单与 V3 报价存在版本冲突。', cells: [
      { category: '报价', state: 'supports', evidenceIds: ['E-P-QUOTE'] },
      { category: '订单', state: 'supports', evidenceIds: ['E-P-ORDER'] },
      { category: '交期', state: 'supports', evidenceIds: ['E-P-COMMIT'] },
      { category: '确认', state: 'missing', evidenceIds: [], gapId: 'GAP-P-001' },
    ] }],
    toolActivities: [{ id: 'T-P-SRM', demoMode: true, category: 'SRM 查询', purpose: '比对报价与交期承诺版本', objectId: 'PO-P-260601', timeWindow: '2026-10-02 至 2026-10-06', materialCode: 'MAT-P-2606', supplier: '星桥电子（演示）', lot: '不适用（采购订单）', returnedEvidenceIds: ['E-P-QUOTE', 'E-P-COMMIT'], preToolUse: 'allowed', status: 'completed', durationMs: 690, evidenceCount: 2, summary: '发现报价版本与订单版本冲突。' }],
    memoryUsages: [{ id: 'M-P-RULE', demoMode: true, title: '采购版本冲突核对规则', category: 'rule', layer: 'decision', disposition: 'candidate', recallReason: '报价版本与订单版本不一致。', applicability: '需先验证物料、币种、报价有效期与订单版本。', validation: '物料和币种一致，供应商订单确认待补。', source: '合成采购规则库', version: '1.0', tokenCost: 76, evidenceIds: ['E-P-QUOTE', 'E-P-ORDER'] }],
    review: { id: 'REV-P-001', demoMode: true, packageVersion: '1', evidenceVersion: '1', ruleVersion: '1.0', citationMappings: [{ claim: '报价与订单版本冲突', evidenceIds: ['E-P-QUOTE', 'E-P-ORDER'] }], decision: 'pending', reviewerSessionId: 'SESSION-REVIEW-P', candidateConclusion: '待确认订单版本后联系供应商修订承诺。', evidenceAssessment: '报价、订单与交期记录已收集，供应商订单确认缺失。', objectTimeConsistency: '证据指向同一采购订单。', counterEvidence: '暂无独立反证。', ruleBoundary: '不得自动修改价格或交期。', readOnlyScope: '仅可读取证据摘要与候选结论。', feedback: '等待调查完成。' },
    approval: { id: 'APR-P-001', demoMode: true, status: 'draft', action: '发送供应商确认请求', objectId: 'PO-P-260601', impact: '向供应商请求确认订单版本与交期，不修改 ERP 订单。', basis: '报价 V3、订单 V2 与交期承诺冲突。', approverRole: '采购负责人' },
    execution: { id: 'EXE-P-001', demoMode: true, status: 'not_started' },
  },
];

export const evaluationCapabilities: EvaluationCapability[] = [
  {
    id: 'EVAL-VERSION', demoMode: true, title: '版本实验',
    description: '让候选版本在同一组合成任务上运行，隔离变更来源并形成可审查差异。',
    evaluationObject: '异常调查结论、证据引用与动作建议',
    dimensions: ['Prompt 版本', 'Harness 版本', '规则版本'],
    metricDefinition: '结论与引用一致性、对象与时间命中、越权动作计数',
    failureClasses: ['引用缺失', '对象串案', '规则边界误判'],
    gateDecision: '差异通过复核后进入回归门禁，否则保留基线版本。',
    recoveryAction: '锁定失败维度，回放同一合成任务并生成修订候选。',
  },
  {
    id: 'EVAL-DATASET', demoMode: true, title: '数据集管理',
    description: '以任务、行业对象和故障类型组织合成案例，保留数据集版本与适用范围。',
    evaluationObject: '采购异常、质量异常与审批守卫场景',
    dimensions: ['数据集版本', '任务类型', '对象类型'],
    metricDefinition: '场景覆盖、边界样例覆盖、案例版本可复现性',
    failureClasses: ['场景缺口', '标签歧义', '对象范围污染'],
    gateDecision: '覆盖范围和标签审查完成后才允许作为发布基线。',
    recoveryAction: '将失败案例归入对应分类，补齐边界说明后重新入集。',
  },
  {
    id: 'EVAL-METRICS', demoMode: true, title: '指标口径',
    description: '将 Agent 质量拆成证据、判断、权限与恢复四类可解释指标。',
    evaluationObject: '调查步骤、Reviewer 判断与授权执行链',
    dimensions: ['任务阶段', '证据状态', '决策节点'],
    metricDefinition: '证据覆盖、反证处理、对象一致性、授权守卫、恢复完成度',
    failureClasses: ['证据不足', '判断漂移', '权限越界', '恢复未闭环'],
    gateDecision: '任一关键守卫失败即阻断，非关键差异进入人工审查。',
    recoveryAction: '定位到阶段与指标口径，生成可复查的失败摘要。',
  },
  {
    id: 'EVAL-TAXONOMY', demoMode: true, title: '故障分类',
    description: '用统一分类连接失败现象、责任环节和修复路径，支持持续回归。',
    evaluationObject: '工具调用、SOP 阶段、Memory 召回与审批动作',
    dimensions: ['发生阶段', '故障来源', '可恢复性'],
    metricDefinition: '分类命中、一致归因、重复故障聚合与处置状态',
    failureClasses: ['工具超时', '证据冲突', '记忆误召回', '审批越权'],
    gateDecision: '高风险类别直接阻断，其余类别按处置策略进入审查。',
    recoveryAction: '路由到重试、定向补查、版本回退或人工接管。',
  },
  {
    id: 'EVAL-GATE', demoMode: true, title: '回归门禁',
    description: '把关键失败条件固化为发布前检查，让版本差异可阻断、可解释。',
    evaluationObject: '候选 Prompt、Harness 与规则组合',
    dimensions: ['基线版本', '候选版本', '风险等级'],
    metricDefinition: '关键故障零容忍、非关键差异可解释、恢复路径完整',
    failureClasses: ['引用断链', '权限绕过', '审批缺失', '恢复失败'],
    gateDecision: '关键项通过且差异已审查才放行，否则阻断候选版本。',
    recoveryAction: '保留稳定基线，创建失败清单并定向回归受影响场景。',
  },
  {
    id: 'EVAL-RECOVERY', demoMode: true, title: '故障恢复',
    description: '验证中断、超时和结果未知时能否恢复任务且避免重复副作用。',
    evaluationObject: '运行检查点、只读工具调用与授权动作',
    dimensions: ['检查点版本', '重试轮次', '回执状态'],
    metricDefinition: '恢复位置正确、幂等守卫生效、未知结果先核验',
    failureClasses: ['检查点失效', '重复执行', '状态未知'],
    gateDecision: '恢复动作无法保持对象与版本绑定时阻断发布。',
    recoveryAction: '从检查点续跑、核验业务回执或转人工处理。',
  },
];

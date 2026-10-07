/** Public demo objects contain synthetic business data only. */
export type CaseStatus = 'new' | 'investigating' | 'human_investigation' | 'pending_action' | 'acted' | 'closed';
export type RunStatus = 'queued' | 'running' | 'waiting_for_evidence' | 'completed' | 'failed';
export type ReviewDecision = 'pending' | 'pass' | 'revise' | 'escalate';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
export type ExecutionStatus = 'not_started' | 'running' | 'succeeded' | 'failed' | 'unknown';
export type EvidenceState = 'supports' | 'refutes' | 'missing' | 'stale' | 'object_mismatch';

export interface AgentRun {
  id: string;
  demoMode: true;
  sessionId: string;
  attempt: number;
  checkpoint: { id: string; status: 'saved' | 'resuming' | 'restored'; savedAt: string };
  currentStage: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  summary: string;
}

export interface SopStep {
  id: string;
  order: number;
  title: string;
  status: 'completed' | 'current' | 'pending';
  summary: string;
  deliverable: string;
  entryCriteria: string;
  exitCriteria: string;
  round: number;
}

export interface EvidenceRecord {
  id: string;
  demoMode: true;
  title: string;
  category: string;
  sourceSystem: string;
  collectedAt: string;
  businessAt: string;
  objectId: string;
  summary: string;
  sourceRecordRef: string;
  businessDefinition: string;
  unit?: string;
  observedValue?: string;
  state: 'valid' | 'stale' | 'object_mismatch';
  domainFields: {
    domain: 'quality' | 'procurement';
    materialCode?: string;
    lot?: string;
    processVersion?: string;
    inspectionStandard?: string;
    currency?: string;
    quantityTerms?: string;
    validUntil?: string;
    deliveryUpdatedAt?: string;
    quoteVersion?: string;
    orderVersion?: string;
  };
}

export interface EvidenceGap {
  id: string;
  demoMode: true;
  title: string;
  whyItMatters: string;
  objectId: string;
  timeWindow: string;
  recommendedTool: string;
  status: 'open' | 'resolved' | 'escalated';
  stopCondition: string;
  round: number;
  maxRounds: number;
  expectedOutcome: {
    result: 'supports' | 'unresolved';
    businessAt?: string;
    summary: string;
    businessDefinition?: string;
    observedValue?: string;
    unit?: string;
  };
  toolActivityId?: string;
  judgementChange?: string;
  resolvedByEvidenceId?: string;
}

export interface EvidenceCell {
  category: string;
  state: EvidenceState;
  evidenceIds: string[];
  gapId?: string;
}

export interface RootCauseHypothesis {
  id: string;
  title: string;
  conclusion: string;
  cells: EvidenceCell[];
}

export interface ToolActivity {
  id: string;
  demoMode: true;
  category: string;
  purpose: string;
  objectId: string;
  timeWindow: string;
  materialCode: string;
  supplier: string;
  lot: string;
  returnedEvidenceIds: string[];
  preToolUse: 'allowed' | 'blocked';
  blockReason?: string;
  status: 'completed' | 'blocked' | 'pending';
  durationMs: number;
  evidenceCount: number;
  summary: string;
}

export interface MemoryUsage {
  id: string;
  demoMode: true;
  title: string;
  category: 'rule' | 'case';
  layer: 'fact' | 'decision' | 'experience' | 'open_item';
  disposition: 'excluded' | 'validated' | 'candidate';
  recallReason: string;
  applicability: string;
  validation: string;
  source: string;
  version: string;
  tokenCost: number;
  evidenceIds: string[];
  revision?: { before: string; after: string; reason: string; actor: string; version: string; sourceNode: string };
}

export interface AssembledMemoryRevision {
  memoryId: string;
  revisionVersion: string;
  assembledAt: string;
  sourceNode: string;
}

export interface ReviewPackage {
  id: string;
  demoMode: true;
  packageVersion: string;
  evidenceVersion: string;
  ruleVersion: string;
  citationMappings: { claim: string; evidenceIds: string[] }[];
  decision: ReviewDecision;
  reviewerSessionId: string;
  candidateConclusion: string;
  evidenceAssessment: string;
  objectTimeConsistency: string;
  counterEvidence: string;
  ruleBoundary: string;
  readOnlyScope: string;
  feedback: string;
  reviewedAt?: string;
}

export interface ActionGrant {
  id: string;
  demoMode: true;
  action: string;
  objectId: string;
  reviewPackageId: string;
  packageVersion: string;
  evidenceVersion: string;
  ruleVersion: string;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface ApprovalRequest {
  id: string;
  demoMode: true;
  status: ApprovalStatus;
  action: string;
  objectId: string;
  impact: string;
  basis: string;
  approverRole: string;
  requestedAt?: string;
  decidedAt?: string;
  grant?: ActionGrant;
}

export interface ActionReceipt {
  id: string;
  demoMode: true;
  action: string;
  objectId: string;
  completedAt: string;
  summary: string;
}

export interface ActionExecution {
  id: string;
  demoMode: true;
  status: ExecutionStatus;
  startedAt?: string;
  receipt?: ActionReceipt;
  error?: string;
}

export interface InvestigationCase {
  id: string;
  demoMode: true;
  domain: 'quality' | 'procurement';
  title: string;
  summary: string;
  status: CaseStatus;
  priority: 'high' | 'medium' | 'low';
  objectId: string;
  supplier: string;
  openedAt: string;
  updatedAt: string;
  run: AgentRun;
  sopSteps: SopStep[];
  evidence: EvidenceRecord[];
  gaps: EvidenceGap[];
  hypotheses: RootCauseHypothesis[];
  toolActivities: ToolActivity[];
  memoryUsages: MemoryUsage[];
  assembledMemoryRevision?: AssembledMemoryRevision;
  review: ReviewPackage;
  approval: ApprovalRequest;
  execution: ActionExecution;
}

export interface EvaluationCapability {
  id: string;
  demoMode: true;
  title: string;
  description: string;
  dimensions: string[];
  evaluationObject: string;
  metricDefinition: string;
  failureClasses: string[];
  gateDecision: string;
  recoveryAction: string;
}

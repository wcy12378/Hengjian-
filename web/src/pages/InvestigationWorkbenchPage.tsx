import { CaseQueue } from '../features/investigation/components/CaseQueue';
import { CaseHeader } from '../features/investigation/components/CaseHeader';
import { SopTimeline } from '../features/investigation/components/SopTimeline';
import { EvidenceMatrix } from '../features/investigation/components/EvidenceMatrix';
import { EvidenceInspector } from '../features/investigation/components/EvidenceInspector';
import { DomainToolActivity } from '../features/investigation/components/DomainToolActivity';
import { useInvestigationStore } from '../features/investigation/store';

export function InvestigationWorkbenchPage() {
  const cases = useInvestigationStore((state) => state.cases);
  const selectedCaseId = useInvestigationStore((state) => state.selectedCaseId);
  const selectedEvidenceId = useInvestigationStore((state) => state.selectedEvidenceId);
  const selectedGapId = useInvestigationStore((state) => state.selectedGapId);
  const selectCase = useInvestigationStore((state) => state.selectCase);
  const selectEvidence = useInvestigationStore((state) => state.selectEvidence);
  const selectGap = useInvestigationStore((state) => state.selectGap);
  const resolveGap = useInvestigationStore((state) => state.resolveGap);
  const item = cases.find((entry) => entry.id === selectedCaseId) ?? cases[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_280px] xl:grid-cols-[240px_minmax(0,1fr)_300px]">
      <CaseQueue cases={cases} selectedCaseId={item.id} onSelect={selectCase} />
      <div className="min-w-0 space-y-4">
        <CaseHeader item={item} />
        <SopTimeline steps={item.sopSteps} />
        <EvidenceMatrix item={item} onSelectEvidence={selectEvidence} onSelectGap={selectGap} />
        <DomainToolActivity activities={item.toolActivities} onSelectEvidence={selectEvidence} />
      </div>
      <EvidenceInspector item={item} evidenceId={selectedEvidenceId} gapId={selectedGapId} onResolveGap={(gapId) => resolveGap(item.id, gapId)} onSelectEvidence={selectEvidence} />
    </div>
  );
}

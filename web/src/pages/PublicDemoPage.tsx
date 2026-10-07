import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { InvestigationWorkbenchPage } from './InvestigationWorkbenchPage';
import { BusinessMemoryPage } from './BusinessMemoryPage';
import { ReviewApprovalPage } from './ReviewApprovalPage';
import { EvaluationOverviewPage } from './EvaluationOverviewPage';
import { DataToolsPage } from './DataToolsPage';

const demoSections = [
  { label: '调查工作台', slug: 'investigation' },
  { label: '业务记忆', slug: 'memory' },
  { label: '复核与审批', slug: 'review' },
  { label: '评测与回归', slug: 'evaluation' },
  { label: '数据与工具', slug: 'tools' },
];

export function PublicDemoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedSlug = location.pathname.replace(/^\/demo\/?/, '').split('/')[0];
  const active = demoSections.find((section) => section.slug === requestedSlug) ?? demoSections[0];
  const activeSection = active.label;
  const isMemory = activeSection === '业务记忆';
  const isReview = activeSection === '复核与审批';
  const isEvaluation = activeSection === '评测与回归';
  const isTools = activeSection === '数据与工具';

  useEffect(() => {
    if (requestedSlug !== active.slug) navigate(`/demo/${active.slug}`, { replace: true });
  }, [active.slug, navigate, requestedSlug]);
  return (
    <main className="hengjian-demo min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              电子制造采购质量智能体平台
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">衡鉴</h1>
          </div>
          <nav aria-label="演示功能" className="flex flex-wrap gap-1">
            {demoSections.map((section) => (
              <button
                type="button"
                key={section.slug}
                onClick={() => navigate(`/demo/${section.slug}`)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === section.label
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section
        id="investigation"
        className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:py-6"
        aria-labelledby="investigation-title"
      >
        <div className="mb-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm sm:px-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">衡鉴质量调查系统 · 公开演示 / 合成数据</p>
          <h2 id="investigation-title" className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">
            {isMemory ? 'Agent Memory 业务记忆' : isReview ? '复核与审批闭环' : isEvaluation ? '评测与回归能力' : isTools ? '数据与工具' : '调查工作台'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {isMemory ? '展示业务记忆如何被召回、按边界过滤、经当前证据验证并生成可审查的修订预览。' : isReview ? '展示独立 Reviewer、业务审批、版本绑定授权与动作回执的完整闭环。' : isEvaluation ? '展示版本实验、指标口径、失败分类、发布门禁与恢复验证的能力结构。' : isTools ? '展示五类业务系统的只读 MCP Tool、统一 EvidenceQuery、EvidenceRecord 与调用前权限校验。' : '从案件线索开始，查看调查阶段、证据摘要与业务处理进展。'}
          </p>
        </div>
        {isMemory ? <BusinessMemoryPage /> : isReview ? <ReviewApprovalPage /> : isEvaluation ? <EvaluationOverviewPage /> : isTools ? <DataToolsPage /> : <InvestigationWorkbenchPage />}
      </section>
    </main>
  );
}

import { useMemo } from "react";
import { useDashboard, useEvaluations } from "../services/hooks";
import PageHero from "../components/PageHero";
import reportsIllustration from "../assets/illustrations/reports-hero.svg";
import { downloadComplianceReport } from "../utils/reportExport";

export default function ReportsPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboard();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();

  // ✅ Hooks must run on every render
  const recentEvaluations = useMemo(() => {
    return [...evaluations]
      .sort((a, b) => new Date(b.last_checked_at) - new Date(a.last_checked_at))
      .slice(0, 8);
  }, [evaluations]);

  const totalPolicies = summary?.summary?.total_policies ?? 0;
  const compliantPolicies = summary?.summary?.compliant ?? 0;
  const nonCompliantPolicies = summary?.summary?.non_compliant ?? 0;
  const pendingPolicies = summary?.summary?.unknown ?? 0;

  if (summaryLoading || evaluationsLoading) {
    return <div>Loading reports…</div>;
  }

  const handleExportReport = () => {
    downloadComplianceReport({ summary, evaluations });
  };

  return (
    <div>
      <PageHero
        title="Reports"
        subtitle="Curated reporting and analytics for leadership and compliance stakeholders."
        badge="Analytics"
        illustration={reportsIllustration}
        actions={
          <button className="button" onClick={handleExportReport}>
            Export report
          </button>
        }
      />

      <section className="report-grid">
        <ReportCard
          heading="Policy coverage"
          value={`${compliantPolicies}/${totalPolicies}`}
          description="Policies currently meeting baseline"
        />
        <ReportCard
          heading="Open violations"
          value={nonCompliantPolicies}
          tone="danger"
          description="Policies with outstanding findings"
        />
        <ReportCard
          heading="Pending scans"
          value={pendingPolicies}
          tone="warning"
          description="Controls awaiting latest evidence"
        />
        <ReportCard
          heading="Compliance rate"
          value={`${totalPolicies
            ? Math.round((compliantPolicies / totalPolicies) * 100)
            : 0}%`}
          description="Compliance across connected providers"
        />
      </section>

      <section className="card">
        <div className="card__title">Most recent findings</div>
        <ul className="timeline">
          {recentEvaluations.map((evaluation) => (
            <li
              key={evaluation.id}
              className={`timeline__item timeline__item--${evaluation.status.replace(
                "_",
                "-"
              )}`}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong>{evaluation.policy?.name ?? "Unnamed policy"}</strong>
                <span className="card__meta">
                  {evaluation.account?.display_name ??
                    evaluation.account?.provider}
                </span>
              </div>
              <div className="timeline__meta">
                <span>{evaluation.findings ?? "No findings provided"}</span>
                <time dateTime={evaluation.last_checked_at}>
                  {new Date(evaluation.last_checked_at).toLocaleString()}
                </time>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReportCard({ heading, value, description, tone = "default" }) {
  return (
    <article className={`card report-card report-card--${tone}`}>
      <h3>{heading}</h3>
      <div className="report-card__value">{value}</div>
      <p className="card__meta">{description}</p>
    </article>
  );
}

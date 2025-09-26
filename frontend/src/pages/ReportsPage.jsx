import { useMemo } from "react";

import { useDashboard, useEvaluations } from "../services/hooks";
import PageHero from "../components/PageHero";
import reportsIllustration from "../assets/illustrations/reports-hero.svg";

export default function ReportsPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboard();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();

  const totalPolicies = summary?.summary.total_policies ?? 0;
  const compliantPolicies = summary?.summary.compliant ?? 0;
  const nonCompliantPolicies = summary?.summary.non_compliant ?? 0;
  const pendingPolicies = summary?.summary.unknown ?? 0;

  const recentEvaluations = useMemo(() => {
    return [...evaluations]
      .sort((a, b) => new Date(b.last_checked_at) - new Date(a.last_checked_at))
      .slice(0, 8);
  }, [evaluations]);

  const handleExportReport = () => {
    const reportData = {
      reportType: "Security Compliance Report",
      generatedAt: new Date().toISOString(),
      summary: {
        totalPolicies,
        compliantPolicies,
        nonCompliantPolicies,
        pendingPolicies,
        complianceRate: totalPolicies ? Math.round((compliantPolicies / totalPolicies) * 100) : 0
      },
      recentFindings: recentEvaluations.map(evaluation => ({
        policyName: evaluation.policy?.name ?? "Unnamed policy",
        account: evaluation.account?.display_name ?? evaluation.account?.provider,
        status: evaluation.status,
        findings: evaluation.findings ?? "No findings provided",
        lastChecked: evaluation.last_checked_at
      })),
      recommendations: [
        "Review and remediate non-compliant policies",
        "Schedule regular compliance checks",
        "Update security policies based on findings"
      ]
    };

    // Generate CSV format
    const csvContent = generateCSVReport(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSVReport = (data) => {
    const headers = ['Policy Name', 'Account', 'Status', 'Findings', 'Last Checked'];
    const rows = data.recentFindings.map(finding => [
      finding.policyName,
      finding.account,
      finding.status,
      `"${finding.findings.replace(/"/g, '""')}"`,
      finding.lastChecked
    ]);

    const csvRows = [
      ['Security Compliance Report'],
      [`Generated: ${new Date(data.generatedAt).toLocaleString()}`],
      [''],
      ['Summary:'],
      [`Total Policies: ${data.summary.totalPolicies}`],
      [`Compliant: ${data.summary.compliantPolicies}`],
      [`Non-Compliant: ${data.summary.nonCompliantPolicies}`],
      [`Pending: ${data.summary.pendingPolicies}`],
      [`Compliance Rate: ${data.summary.complianceRate}%`],
      [''],
      ['Recent Findings:'],
      headers,
      ...rows
    ];

    return csvRows.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
  };

  if (summaryLoading || evaluationsLoading) {
    return <div>Loading reports…</div>;
  }

  return (
    <div>
      <PageHero
        title="Reports"
        subtitle="Curated reporting and analytics for leadership and compliance stakeholders."
        badge="Analytics"
        illustration={reportsIllustration}
        actions={(
          <button className="button" onClick={handleExportReport}>
            Export report
          </button>
        )}
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
          value={`${totalPolicies ? Math.round((compliantPolicies / totalPolicies) * 100) : 0}%`}
          description="Compliance across connected providers"
        />
      </section>

      <section className="card">
        <div className="card__title">Most recent findings</div>
        <ul className="timeline">
          {recentEvaluations.map((evaluation) => (
            <li key={evaluation.id} className={`timeline__item timeline__item--${evaluation.status.replace('_', '-')}`}>
              <div className="card__title-block">
                <strong>{evaluation.policy?.name ?? "Unnamed policy"}</strong>
                <span className="card__meta">{evaluation.account?.display_name ?? evaluation.account?.provider}</span>
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

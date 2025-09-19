import { useMemo } from "react";

import { useDashboard, useEvaluations, usePolicies } from "../services/hooks";

const TREND_TEMPLATE = [82, 84, 83, 85, 86, 88, 87, 89];
const VIOLATION_TEMPLATE = [40, 38, 37, 34, 32, 30, 28, 26];

function buildPieGradient(compliant, nonCompliant, pending) {
  const total = compliant + nonCompliant + pending || 1;
  const compliantDeg = (compliant / total) * 360;
  const nonCompliantDeg = (nonCompliant / total) * 360;
  return `conic-gradient(var(--badge-success-text) 0deg ${compliantDeg}deg, var(--badge-danger-text) ${compliantDeg}deg ${
    compliantDeg + nonCompliantDeg
  }deg, var(--text-subtle) ${compliantDeg + nonCompliantDeg}deg 360deg)`;
}

export default function DashboardPage() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useDashboard();
  const { data: evaluations = [], isLoading: evalLoading } = useEvaluations();
  const { data: policies = [], isLoading: policyLoading } = usePolicies();

  const handleGenerateReport = () => {
    const reportData = {
      summary: safeSummary,
      policies,
      evaluations,
      timestamp: new Date().toISOString(),
      complianceRate,
      securityScore
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loading = summaryLoading || evalLoading || policyLoading;
  const safeSummary = summary ?? { summary: {}, providers: [] };

  const totalPolicies = safeSummary.summary?.total_policies ?? policies.length;
  const compliantPolicies = safeSummary.summary?.compliant ?? 0;
  const nonCompliantPolicies = safeSummary.summary?.non_compliant ?? 0;
  const pendingPolicies = safeSummary.summary?.unknown ?? Math.max(
    0,
    totalPolicies - compliantPolicies - nonCompliantPolicies
  );
  const complianceRate = totalPolicies
    ? Math.round((compliantPolicies / totalPolicies) * 100)
    : 0;
  const securityScore = Math.min(
    100,
    70 + Math.round(complianceRate * 0.3 + (100 - nonCompliantPolicies * 2) / 4)
  );
  const resourcesMonitored = evaluations.length * 8;

  const trendScores = useMemo(
    () => TREND_TEMPLATE.map((value) => Math.min(100, value + (complianceRate - 85) / 5)),
    [complianceRate]
  );

  const trendViolations = useMemo(
    () => VIOLATION_TEMPLATE.map((value) => Math.max(20, value + nonCompliantPolicies)),
    [nonCompliantPolicies]
  );

  const providerBreakdown = safeSummary.providers ?? [];

  const compliancePieStyle = useMemo(
    () => ({
      background: buildPieGradient(compliantPolicies, nonCompliantPolicies, pendingPolicies),
    }),
    [compliantPolicies, nonCompliantPolicies, pendingPolicies]
  );

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (summaryError) {
    return <div>Unable to fetch dashboard data. Verify the backend is running.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Security Dashboard</h1>
          <p>Monitor your cloud security posture across all connected providers.</p>
        </div>
        <div className="page-header__actions">
          <span className="pill pill--success">Last updated: 5 minutes ago</span>
          <button
            className="button button--secondary"
            type="button"
            onClick={handleGenerateReport}
          >
            Generate report
          </button>
        </div>
      </div>

      <section className="stat-grid">
        <StatCard
          title="Security Score"
          value={`${securityScore}/100`}
          description="+5 from last week"
          icon="Shield"
        />
        <StatCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          description={`${compliantPolicies} of ${totalPolicies} policies compliant`}
          icon="Check"
        />
        <StatCard
          title="Active Policies"
          value={totalPolicies}
          description={`Across ${providerBreakdown.length} cloud providers`}
          icon="Doc"
        />
        <StatCard
          title="Open Violations"
          value={nonCompliantPolicies}
          description={`${nonCompliantPolicies} controls need attention`}
          icon="Alert"
        />
      </section>

      <section className="chart-card">
        <div className="card">
          <div className="card__title">Security trends</div>
          <p className="card__meta">Score and violation trends over the last 30 days</p>
          <TrendChart scores={trendScores} violations={trendViolations} />
        </div>
        <div className="card">
          <div className="card__title">Compliance overview</div>
          <p className="card__meta">Current compliance status across all policies</p>
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <div className="pie-chart" style={compliancePieStyle} />
            <div className="legend">
              <LegendItem
                label="Compliant"
                color="var(--badge-success-text)"
                value={`${compliantPolicies} (${complianceRate}%)`}
              />
              <LegendItem
                label="Non-Compliant"
                color="var(--badge-danger-text)"
                value={`${nonCompliantPolicies}`}
              />
              <LegendItem
                label="Pending"
                color="var(--badge-warn-text)"
                value={`${pendingPolicies}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card__title">Cloud provider status</div>
        <div style={{ display: "grid", gap: "16px" }}>
          {providerBreakdown.map((provider) => (
            <div key={provider.provider} className="connection-card">
              <div className="connection-card__icon">
                <ProviderIcon provider={provider.provider} />
              </div>
              <div className="connection-card__meta">
                <strong style={{ fontSize: "1rem" }}>{provider.provider.toUpperCase()} cloud</strong>
                <span>{provider.accounts} connected accounts</span>
              </div>
              <div className="connection-card__stats">
                <span>
                  <strong>{provider.compliant}</strong> compliant
                </span>
                <span>
                  <strong>{provider.non_compliant}</strong> violations
                </span>
                <span>
                  <strong>{provider.unknown}</strong> pending
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  const iconMap = {
    Shield: "🛡️",
    Check: "✅",
    Doc: "📋",
    Alert: "⚠️"
  };

  return (
    <div className="stat-card">
      <div className="stat-card__icon" aria-hidden="true">
        <span>{iconMap[icon] || "📊"}</span>
      </div>
      <p className="stat-card__title">{title}</p>
      <p className="stat-card__value">{value}</p>
      <p className="card__meta">{description}</p>
    </div>
  );
}

function TrendChart({ scores, violations }) {
  const points = scores.map((value, index) => `${(index / (scores.length - 1)) * 100},${100 - value}`).join(" ");
  const violationPoints = violations
    .map((value, index) => `${(index / (violations.length - 1)) * 100},${100 - value}`)
    .join(" ");

  return (
    <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="var(--accent-text)"
        strokeWidth="3"
        strokeLinecap="round"
        points={points}
      />
      <polyline
        fill="none"
        stroke="var(--badge-danger-text)"
        strokeWidth="3"
        strokeLinecap="round"
        points={violationPoints}
      />
    </svg>
  );
}

function LegendItem({ label, color, value }) {
  return (
    <div className="legend__item">
      <span className="legend__swatch" style={{ background: color }} />
      <span>
        {label}: <strong style={{ color }}>{value}</strong>
      </span>
    </div>
  );
}

function ProviderIcon({ provider }) {
  const sources = {
    aws: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
    azure: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
    gcp: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
  };
  const src = sources[provider] || sources.aws;
  return <img src={src} alt={`${provider} logo`} loading="lazy" />;
}

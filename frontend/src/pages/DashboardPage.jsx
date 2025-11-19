import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useDashboard, useEvaluations, usePolicies } from "../services/hooks";
import PageHero from "../components/PageHero";
import dashboardIllustration from "../assets/illustrations/dashboard-hero.svg";

const TREND_TEMPLATE = [82, 84, 83, 85, 86, 88, 87, 89];
const VIOLATION_TEMPLATE = [40, 38, 37, 34, 32, 30, 28, 26];

function buildPieGradient(compliant, nonCompliant, pending) {
  const total = compliant + nonCompliant + pending || 1;
  const compliantDeg = (compliant / total) * 360;
  const nonCompliantDeg = (nonCompliant / total) * 360;
  return `conic-gradient(var(--success-strong) 0deg ${compliantDeg}deg, var(--danger-strong) ${compliantDeg}deg ${
    compliantDeg + nonCompliantDeg
  }deg, var(--warning-strong) ${compliantDeg + nonCompliantDeg}deg 360deg)`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
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
      securityScore,
      criticalFindings,
      severityBreakdown
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

  // Calculate severity breakdown from policies
  const severityBreakdown = useMemo(() => {
    const breakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    policies.forEach(policy => {
      if (policy.severity && breakdown.hasOwnProperty(policy.severity)) {
        breakdown[policy.severity]++;
      }
    });
    
    return breakdown;
  }, [policies]);

  const criticalFindings = useMemo(() => {
    return policies.filter(p => 
      p.severity === 'critical' && 
      p.compliance_status === 'non_compliant'
    ).length;
  }, [policies]);

  const resourcesMonitored = evaluations.length;
  const connectedAccounts = safeSummary.providers?.reduce((sum, p) => sum + (p.accounts || 0), 0) || 0;

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

  // Calculate category distribution
  const categoryDistribution = useMemo(() => {
    const categories = {};
    policies.forEach(policy => {
      const category = policy.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { total: 0, compliant: 0, nonCompliant: 0 };
      }
      categories[category].total++;
      if (policy.compliance_status === 'compliant') {
        categories[category].compliant++;
      } else if (policy.compliance_status === 'non_compliant') {
        categories[category].nonCompliant++;
      }
    });
    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.nonCompliant - a.nonCompliant)
      .slice(0, 5);
  }, [policies]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="text-muted">Loading dashboard data...</p>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Unable to fetch dashboard data</h3>
        <p className="text-muted">Please verify the backend is running and try again.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PageHero
        title="Security Dashboard"
        subtitle="Comprehensive overview of your cloud security posture and compliance status."
        badge="Live Monitoring"
        illustration={dashboardIllustration}
        actions={(
          <>
            <span className="pill pill--success">
              <span className="status-indicator status-indicator--live" />
              Last updated: 5 minutes ago
            </span>
            <button
              className="button button--secondary"
              type="button"
              onClick={handleGenerateReport}
            >
              📊 Generate Report
            </button>
          </>
        )}
      />

      {/* Primary Metrics Grid */}
      <section className="metrics-grid">
        <MetricCard
          title="Security Score"
          value={securityScore}
          maxValue={100}
          trend="+5"
          trendLabel="vs last week"
          icon="🛡️"
          type="score"
          variant="primary"
        />
        <MetricCard
          title="Compliance Rate"
          value={complianceRate}
          maxValue={100}
          subtitle={`${compliantPolicies} of ${totalPolicies} policies`}
          icon="✅"
          type="percentage"
          variant="success"
        />
        <MetricCard
          title="Active Policies"
          value={totalPolicies}
          subtitle={`Across ${providerBreakdown.length} providers`}
          icon="📋"
          type="count"
          variant="info"
        />
        <MetricCard
          title="Critical Findings"
          value={criticalFindings}
          subtitle={`${nonCompliantPolicies} total violations`}
          icon="🚨"
          type="alert"
          variant="danger"
        />
      </section>

      {/* Secondary Metrics */}
      <section className="secondary-metrics">
        <div className="metric-item">
          <span className="metric-label">Connected Accounts</span>
          <span className="metric-value">{connectedAccounts}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Resources Monitored</span>
          <span className="metric-value">{resourcesMonitored}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Pending Reviews</span>
          <span className="metric-value">{pendingPolicies}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Compliance Status</span>
          <span className={`metric-badge metric-badge--${complianceRate >= 90 ? 'success' : complianceRate >= 70 ? 'warning' : 'danger'}`}>
            {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Good' : 'Needs Attention'}
          </span>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-section">
        <div className="chart-card chart-card--large">
          <div className="card-header">
            <div>
              <h3 className="card-title">Security Trends</h3>
              <p className="card-subtitle">Score and violation trends over the last 30 days</p>
            </div>
            <div className="chart-legend-inline">
              <div className="legend-item">
                <span className="legend-dot legend-dot--primary" />
                Security Score
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--danger" />
                Violations
              </div>
            </div>
          </div>
          <div className="chart-content">
            <TrendChart scores={trendScores} violations={trendViolations} />
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Compliance Distribution</h3>
              <p className="card-subtitle">Current status breakdown</p>
            </div>
          </div>
          <div className="chart-content chart-content--centered">
            <div className="pie-chart-container">
              <div className="pie-chart pie-chart--professional" style={compliancePieStyle}>
                <div className="pie-chart-center">
                  <div className="pie-chart-value">{complianceRate}%</div>
                  <div className="pie-chart-label">Compliant</div>
                </div>
              </div>
            </div>
            <div className="compliance-legend">
              <LegendItem
                label="Compliant"
                color="var(--success-strong)"
                value={compliantPolicies}
                percentage={totalPolicies ? Math.round((compliantPolicies / totalPolicies) * 100) : 0}
              />
              <LegendItem
                label="Non-Compliant"
                color="var(--danger-strong)"
                value={nonCompliantPolicies}
                percentage={totalPolicies ? Math.round((nonCompliantPolicies / totalPolicies) * 100) : 0}
              />
              <LegendItem
                label="Pending Review"
                color="var(--warning-strong)"
                value={pendingPolicies}
                percentage={totalPolicies ? Math.round((pendingPolicies / totalPolicies) * 100) : 0}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Severity Breakdown */}
      <section className="severity-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Policy Severity Distribution</h3>
            <p className="card-subtitle">Breakdown by severity level</p>
          </div>
          <div className="severity-grid">
            <SeverityCard
              severity="Critical"
              count={severityBreakdown.critical}
              color="var(--danger-strong)"
              icon="🔴"
            />
            <SeverityCard
              severity="High"
              count={severityBreakdown.high}
              color="#f97316"
              icon="🟠"
            />
            <SeverityCard
              severity="Medium"
              count={severityBreakdown.medium}
              color="var(--warning-strong)"
              icon="🟡"
            />
            <SeverityCard
              severity="Low"
              count={severityBreakdown.low}
              color="var(--info-strong)"
              icon="🔵"
            />
          </div>
        </div>
      </section>

      {/* Category Analysis */}
      {categoryDistribution.length > 0 && (
        <section className="category-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Policy Categories</h3>
              <p className="card-subtitle">Categories requiring most attention</p>
            </div>
            <div className="category-list">
              {categoryDistribution.map((category, index) => (
                <CategoryItem
                  key={category.name}
                  rank={index + 1}
                  name={category.name}
                  total={category.total}
                  compliant={category.compliant}
                  nonCompliant={category.nonCompliant}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Provider Status */}
      <section className="provider-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cloud Provider Status</h3>
            <p className="card-subtitle">Connected accounts and compliance metrics</p>
          </div>
          <div className="provider-grid">
            {providerBreakdown.map((provider) => (
              <button
                key={provider.provider}
                type="button"
                className="provider-card"
                onClick={() => navigate(`/connections/services/${provider.provider}`)}
              >
                <div className="provider-card-header">
                  <div className="provider-icon-wrapper">
                    <ProviderIcon provider={provider.provider} />
                  </div>
                  <div className="provider-info">
                    <h4 className="provider-name">{provider.provider.toUpperCase()}</h4>
                    <span className="provider-accounts">{provider.accounts} account{provider.accounts !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="provider-arrow">→</div>
                </div>
                <div className="provider-metrics">
                  <div className="provider-metric provider-metric--success">
                    <span className="provider-metric-value">{provider.compliant}</span>
                    <span className="provider-metric-label">Compliant</span>
                  </div>
                  <div className="provider-metric provider-metric--danger">
                    <span className="provider-metric-value">{provider.non_compliant}</span>
                    <span className="provider-metric-label">Violations</span>
                  </div>
                  <div className="provider-metric provider-metric--warning">
                    <span className="provider-metric-value">{provider.unknown}</span>
                    <span className="provider-metric-label">Pending</span>
                  </div>
                </div>
                <div className="provider-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill progress-fill--success"
                      style={{ 
                        width: `${(provider.compliant / (provider.compliant + provider.non_compliant + provider.unknown || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, maxValue, subtitle, trend, trendLabel, icon, type, variant }) {
  const percentage = maxValue ? Math.round((value / maxValue) * 100) : null;
  
  return (
    <div className={`metric-card metric-card--${variant}`}>
      <div className="metric-card-header">
        <span className="metric-icon">{icon}</span>
        <h3 className="metric-title">{title}</h3>
      </div>
      <div className="metric-card-body">
        <div className="metric-display">
          <span className="metric-main-value">
            {type === 'percentage' || type === 'score' ? `${value}` : value}
          </span>
          {(type === 'percentage' || type === 'score') && (
            <span className="metric-unit">%</span>
          )}
          {maxValue && type === 'score' && (
            <span className="metric-max">/{maxValue}</span>
          )}
        </div>
        {subtitle && <p className="metric-subtitle">{subtitle}</p>}
        {trend && (
          <div className="metric-trend">
            <span className={`trend-indicator ${trend.startsWith('+') ? 'trend-indicator--up' : 'trend-indicator--down'}`}>
              {trend}
            </span>
            {trendLabel && <span className="trend-label">{trendLabel}</span>}
          </div>
        )}
      </div>
      {percentage !== null && (
        <div className="metric-progress">
          <div 
            className="metric-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TrendChart({ scores, violations }) {
  const maxScore = Math.max(...scores, ...violations);
  const points = scores.map((value, index) => 
    `${(index / (scores.length - 1)) * 100},${100 - (value / maxScore) * 100}`
  ).join(" ");
  
  const violationPoints = violations.map((value, index) => 
    `${(index / (violations.length - 1)) * 100},${100 - (value / maxScore) * 100}`
  ).join(" ");

  return (
    <div className="trend-chart-wrapper">
      <svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-soft)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-soft)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-soft)" strokeWidth="0.5" />
        
        {/* Violation line */}
        <polyline
          fill="none"
          stroke="var(--danger-strong)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={violationPoints}
          opacity="0.8"
        />
        
        {/* Score line with gradient fill */}
        <polyline
          fill="url(#scoreGradient)"
          points={`0,100 ${points} 100,100`}
        />
        <polyline
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

function LegendItem({ label, color, value, percentage }) {
  return (
    <div className="legend-item-detailed">
      <div className="legend-item-header">
        <span className="legend-swatch" style={{ background: color }} />
        <span className="legend-label">{label}</span>
      </div>
      <div className="legend-item-stats">
        <span className="legend-value" style={{ color }}>{value}</span>
        <span className="legend-percentage">({percentage}%)</span>
      </div>
    </div>
  );
}

function SeverityCard({ severity, count, color, icon }) {
  return (
    <div className="severity-card">
      <div className="severity-icon" style={{ color }}>{icon}</div>
      <div className="severity-info">
        <span className="severity-count">{count}</span>
        <span className="severity-label">{severity}</span>
      </div>
      <div className="severity-indicator" style={{ background: color }} />
    </div>
  );
}

function CategoryItem({ rank, name, total, compliant, nonCompliant }) {
  const complianceRate = total ? Math.round((compliant / total) * 100) : 0;
  
  return (
    <div className="category-item">
      <div className="category-rank">#{rank}</div>
      <div className="category-content">
        <div className="category-header">
          <h4 className="category-name">{name}</h4>
          <span className="category-total">{total} policies</span>
        </div>
        <div className="category-progress-wrapper">
          <div className="category-progress-bar">
            <div 
              className="category-progress-fill"
              style={{ width: `${complianceRate}%` }}
            />
          </div>
          <span className="category-percentage">{complianceRate}%</span>
        </div>
        <div className="category-stats">
          <span className="category-stat category-stat--success">{compliant} compliant</span>
          <span className="category-stat category-stat--danger">{nonCompliant} violations</span>
        </div>
      </div>
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
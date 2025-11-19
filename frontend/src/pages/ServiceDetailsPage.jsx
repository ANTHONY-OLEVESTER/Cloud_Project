import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAccounts, useEvaluations, usePolicies, useSyncAccount, useDeleteAccount } from "../services/hooks";
import PageHero from "../components/PageHero";

const PROVIDER_IMAGES = {
  aws: "https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=1600&q=80",
  azure: "https://images.unsplash.com/photo-1524604799799-2b7abd1c0e4b?auto=format&fit=crop&w=1600&q=80",
  gcp: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80",
};

const PROVIDER_INFO = {
  aws: {
    name: "Amazon Web Services",
    shortName: "AWS",
    color: "#FF9900",
  },
  azure: {
    name: "Microsoft Azure",
    shortName: "Azure",
    color: "#0078D4",
  },
  gcp: {
    name: "Google Cloud Platform",
    shortName: "GCP",
    color: "#4285F4",
  },
};

export default function ServiceDetailsPage() {
  const navigate = useNavigate();
  const { providerId } = useParams();
  const provider = providerId ?? "aws";
  const providerInfo = PROVIDER_INFO[provider] ?? PROVIDER_INFO.aws;
  const heroImage = PROVIDER_IMAGES[provider] ?? PROVIDER_IMAGES.aws;
  const [showSettings, setShowSettings] = useState(false);

  const { data: accounts } = useAccounts();
  const { data: policies } = usePolicies();
  const { data: evaluations } = useEvaluations();
  const syncAccount = useSyncAccount();
  const deleteAccount = useDeleteAccount();

  const connectedAccount = useMemo(
    () => accounts?.find((account) => account.provider === provider),
    [accounts, provider]
  );

  const relatedEvaluations = useMemo(
    () => (evaluations ?? []).filter((item) => item.account?.provider === provider),
    [evaluations, provider]
  );

  const controls = useMemo(
    () => (policies ?? []).filter((policy) => policy.provider === provider),
    [policies, provider]
  );

  const complianceStats = useMemo(() => {
    const total = relatedEvaluations.length;
    const compliant = relatedEvaluations.filter(e => e.status === 'compliant').length;
    const nonCompliant = relatedEvaluations.filter(e => e.status === 'non_compliant').length;
    const unknown = relatedEvaluations.filter(e => e.status === 'unknown').length;
    const percentage = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    return { total, compliant, nonCompliant, unknown, percentage };
  }, [relatedEvaluations]);

  const handleSync = () => {
    if (connectedAccount) {
      syncAccount.mutate(connectedAccount.id);
    }
  };

  const handleDelete = () => {
    if (connectedAccount && window.confirm("Are you sure you want to delete this connection? This action cannot be undone.")) {
      deleteAccount.mutate(connectedAccount.id, {
        onSuccess: () => {
          navigate("/connections");
        }
      });
    }
  };

  return (
    <div className="service-details-page">
      <PageHero
        title={`${providerInfo.name} Integration`}
        subtitle={`Monitor and manage your ${providerInfo.name} cloud infrastructure and compliance posture.`}
        badge="Service Workspace"
        illustration={heroImage}
        actions={(
          <div className="hero-actions">
            <button className="button button--secondary" onClick={() => navigate("/connections")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Connections
            </button>
            {connectedAccount && (
              <>
                <button
                  className="button button--primary"
                  onClick={handleSync}
                  disabled={syncAccount.isPending}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 8a8 8 0 0 1 13.66-3.5M20 8V3h-4M20 16a8 8 0 0 1-13.66 3.5M4 16v5h4" />
                  </svg>
                  {syncAccount.isPending ? "Syncing..." : "Sync Now"}
                </button>
                <button
                  className="button button--secondary"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  {showSettings ? "Hide Settings" : "Settings"}
                </button>
              </>
            )}
          </div>
        )}
      />

      {showSettings && connectedAccount && (
        <section className="settings-panel">
          <div className="settings-header">
            <h2>Service Configuration</h2>
            <p>Manage connection settings and service preferences</p>
          </div>
          
          <div className="settings-sections">
            <div className="settings-section">
              <div className="settings-section__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <h3>Connection Details</h3>
                  <p>Review and update connection credentials and configuration</p>
                </div>
              </div>
              <button className="button button--outline">Edit Connection</button>
            </div>

            <div className="settings-section">
              <div className="settings-section__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <div>
                  <h3>Sync Schedule</h3>
                  <p>Configure automatic synchronization intervals and preferences</p>
                </div>
              </div>
              <button className="button button--outline">Configure Schedule</button>
            </div>

            <div className="settings-section">
              <div className="settings-section__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div>
                  <h3>Notification Settings</h3>
                  <p>Manage alerts, notifications, and compliance reporting</p>
                </div>
              </div>
              <button className="button button--outline">Manage Notifications</button>
            </div>

            <div className="settings-section settings-section--danger">
              <div className="settings-section__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3>Danger Zone</h3>
                  <p>Permanently remove this service connection and all associated data</p>
                </div>
              </div>
              <button 
                className="button button--danger" 
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending ? "Deleting..." : "Delete Connection"}
              </button>
            </div>
          </div>
        </section>
      )}

      {connectedAccount ? (
        <>
          <div className="overview-grid">
            <section className="card connection-status-card">
              <div className="card__header">
                <h3 className="card__title">Connection Status</h3>
                <div className="card__actions">
                  <button
                    className="icon-button"
                    title="Refresh"
                    onClick={handleSync}
                    disabled={syncAccount.isPending}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 8a8 8 0 0 1 13.66-3.5M20 8V3h-4M20 16a8 8 0 0 1-13.66 3.5M4 16v5h4" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="connection-info">
                <div className="info-row">
                  <span className="info-label">Account Name</span>
                  <span className="info-value">{connectedAccount.display_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Account ID</span>
                  <span className="info-value info-value--mono">{connectedAccount.external_id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Connection Status</span>
                  <span className={`status-badge status-badge--${statusClass(connectedAccount.status)}`}>
                    {connectedAccount.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Synced</span>
                  <span className="info-value">
                    {connectedAccount.last_synced_at 
                      ? new Date(connectedAccount.last_synced_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Connected Since</span>
                  <span className="info-value">{new Date(connectedAccount.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </section>

            <section className="card compliance-overview-card">
              <div className="card__header">
                <h3 className="card__title">Compliance Overview</h3>
              </div>
              <div className="compliance-score">
                <div className="score-circle">
                  <svg viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="var(--border-soft)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="var(--success-strong)"
                      strokeWidth="10"
                      strokeDasharray={`${complianceStats.percentage * 3.14} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="score-text">
                    <span className="score-number">{complianceStats.percentage}%</span>
                    <span className="score-label">Compliant</span>
                  </div>
                </div>
                <div className="compliance-breakdown">
                  <div className="breakdown-item breakdown-item--success">
                    <span className="breakdown-value">{complianceStats.compliant}</span>
                    <span className="breakdown-label">Compliant</span>
                  </div>
                  <div className="breakdown-item breakdown-item--danger">
                    <span className="breakdown-value">{complianceStats.nonCompliant}</span>
                    <span className="breakdown-label">Non-Compliant</span>
                  </div>
                  <div className="breakdown-item breakdown-item--warning">
                    <span className="breakdown-value">{complianceStats.unknown}</span>
                    <span className="breakdown-label">Unknown</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="card metrics-card">
              <div className="card__header">
                <h3 className="card__title">Resource Metrics</h3>
              </div>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-icon metric-icon--primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="metric-content">
                    <span className="metric-value">{controls.length}</span>
                    <span className="metric-label">Active Policies</span>
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-icon metric-icon--secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="metric-content">
                    <span className="metric-value">{relatedEvaluations.length}</span>
                    <span className="metric-label">Total Evaluations</span>
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-icon metric-icon--success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="metric-content">
                    <span className="metric-value">{complianceStats.compliant}</span>
                    <span className="metric-label">Passing Checks</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="actions-toolbar">
            <button className="action-card" onClick={() => navigate("/policies")}>
              <div className="action-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="action-card__content">
                <h4>Manage Policies</h4>
                <p>View and configure security policies</p>
              </div>
              <svg className="action-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="action-card" onClick={() => navigate("/reports")}>
              <div className="action-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="action-card__content">
                <h4>Generate Reports</h4>
                <p>Create compliance and audit reports</p>
              </div>
              <svg className="action-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              className="action-card" 
              onClick={handleSync} 
              disabled={syncAccount.isPending}
            >
              <div className="action-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 8a8 8 0 0 1 13.66-3.5M20 8V3h-4M20 16a8 8 0 0 1-13.66 3.5M4 16v5h4" />
                </svg>
              </div>
              <div className="action-card__content">
                <h4>Sync Resources</h4>
                <p>Update resource inventory and status</p>
              </div>
              <svg className="action-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="action-card" onClick={() => setShowSettings(true)}>
              <div className="action-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="action-card__content">
                <h4>Configuration</h4>
                <p>Manage service settings and options</p>
              </div>
              <svg className="action-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="data-tables">
            <section className="card table-card">
              <div className="card__header">
                <div>
                  <h3 className="card__title">Active Security Policies</h3>
                  <p className="card__subtitle">{controls.length} policies configured for this provider</p>
                </div>
                <button className="button button--outline button--small" onClick={() => navigate("/policies")}>
                  View All Policies
                </button>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy Name</th>
                      <th>Control ID</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th className="table-actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.slice(0, 8).map((policy) => (
                      <tr key={policy.id}>
                        <td>
                          <div className="table-cell-primary">
                            <strong>{policy.name}</strong>
                            {policy.description && (
                              <span className="table-cell-secondary">{policy.description}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="table-cell-mono">{policy.control_id}</span>
                        </td>
                        <td>{policy.category}</td>
                        <td>
                          <span className={`severity-badge severity-badge--${severityTone(policy.severity)}`}>
                            {policy.severity}
                          </span>
                        </td>
                        <td className="table-actions-column">
                          <button
                            className="icon-button icon-button--small"
                            title="View policy details"
                            onClick={() => navigate(`/policies/${policy.id}`)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {controls.length === 0 && (
                      <tr>
                        <td colSpan={5} className="table-empty">
                          <div className="empty-table-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>No policies configured for this provider</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card table-card">
              <div className="card__header">
                <div>
                  <h3 className="card__title">Recent Policy Evaluations</h3>
                  <p className="card__subtitle">{relatedEvaluations.length} evaluations recorded</p>
                </div>
                <button className="button button--outline button--small" onClick={() => navigate("/reports")}>
                  View Full Report
                </button>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy</th>
                      <th>Compliance Status</th>
                      <th>Resource</th>
                      <th>Last Evaluated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedEvaluations.slice(0, 8).map((evaluation) => (
                      <tr key={evaluation.id}>
                        <td>
                          <div className="table-cell-primary">
                            <strong>{evaluation.policy?.name || 'Unknown Policy'}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-badge--${statusClass(evaluation.status)}`}>
                            {evaluation.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="table-cell-mono">
                            {evaluation.resource_id || evaluation.findings || "—"}
                          </span>
                        </td>
                        <td>
                          {new Date(evaluation.last_checked_at || evaluation.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {relatedEvaluations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="table-empty">
                          <div className="empty-table-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>No evaluations found for this provider</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      ) : (
        <section className="card empty-connection-state">
          <div className="empty-state-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2>No Connection Configured</h2>
            <p>This {providerInfo.name} provider has not been connected yet. Connect your account to begin monitoring and compliance checks.</p>
            <button className="button button--primary button--large" onClick={() => navigate("/connections")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Connect {providerInfo.shortName} Account
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function severityTone(severity) {
  const tones = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low"
  };
  return tones[severity?.toLowerCase()] || "medium";
}

function statusClass(status) {
  if (status === "connected" || status === "compliant") return "success";
  if (status === "error" || status === "non_compliant") return "danger";
  if (status === "pending" || status === "unknown") return "warning";
  return "default";
}
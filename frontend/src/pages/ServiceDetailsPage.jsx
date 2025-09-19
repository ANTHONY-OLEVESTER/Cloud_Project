import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAccounts, useEvaluations, usePolicies, useSyncAccount, useDeleteAccount } from "../services/hooks";

const PROVIDER_IMAGES = {
  aws: "https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=1600&q=80",
  azure: "https://images.unsplash.com/photo-1524604799799-2b7abd1c0e4b?auto=format&fit=crop&w=1600&q=80",
  gcp: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80",
};

export default function ServiceDetailsPage() {
  const navigate = useNavigate();
  const { providerId } = useParams();
  const provider = providerId ?? "aws";
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
    () =>
      (policies ?? []).filter((policy) => policy.provider === provider),
    [policies, provider]
  );

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
      <div className="page-header">
        <div>
          <h1>{provider.toUpperCase()} Service Details</h1>
          <p>Manage your {provider.toUpperCase()} cloud service configuration and monitoring.</p>
        </div>
        <div className="page-header__actions">
          <button className="button" onClick={() => navigate("/connections")}>
            Back to Connections
          </button>
          {connectedAccount && (
            <>
              <button 
                className="button button--primary" 
                onClick={handleSync}
                disabled={syncAccount.isPending}
              >
                {syncAccount.isPending ? "Syncing..." : "Sync Now"}
              </button>
              <button 
                className="button" 
                onClick={() => setShowSettings(!showSettings)}
              >
                {showSettings ? "Hide Settings" : "Settings"}
              </button>
            </>
          )}
        </div>
      </div>

      {showSettings && connectedAccount && (
        <section className="card settings-card">
          <div className="card__title">Service Settings</div>
          <div className="settings-grid">
            <div className="setting-item">
              <h4>Connection Details</h4>
              <p>Review and update connection information</p>
              <button className="button button--secondary">Edit Connection</button>
            </div>
            <div className="setting-item">
              <h4>Sync Schedule</h4>
              <p>Configure automatic synchronization</p>
              <button className="button button--secondary">Configure</button>
            </div>
            <div className="setting-item">
              <h4>Notification Settings</h4>
              <p>Manage alerts and notifications</p>
              <button className="button button--secondary">Manage</button>
            </div>
            <div className="setting-item setting-item--danger">
              <h4>Danger Zone</h4>
              <p>Permanently delete this service connection</p>
              <button 
                className="button button--danger" 
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending ? "Deleting..." : "Delete Service"}
              </button>
            </div>
          </div>
        </section>
      )}
      <div className="service-overview-grid">
        <section className="card connection-overview">
          <div className="card__title">
            Connection Overview
            <div className="card__actions">
              <button 
                className="icon-button" 
                title="View details"
                onClick={() => setShowSettings(!showSettings)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4.5A7.5 7.5 0 1 1 4.5 12A7.5 7.5 0 0 1 12 4.5zm0 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </button>
              {connectedAccount && (
                <button 
                  className="icon-button" 
                  title="Sync now"
                  onClick={handleSync}
                  disabled={syncAccount.isPending}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 4v5h5M20 20v-5h-5M5.64 18.36A9 9 0 0 0 19 15.9l1.44 1.44A11 11 0 0 1 3.2 13.2l2.44 2.44ZM18.36 5.64A9 9 0 0 0 5 8.1L3.56 6.66A11 11 0 0 1 20.8 10.8l-2.44-2.44Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {connectedAccount ? (
            <div className="connection-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Display name</label>
                  <span>{connectedAccount.display_name}</span>
                </div>
                <div className="detail-item">
                  <label>External ID</label>
                  <span>{connectedAccount.external_id}</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className={`badge badge--${statusClass(connectedAccount.status)}`}>
                    {connectedAccount.status.replace("_", " ")}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Created</label>
                  <span>{new Date(connectedAccount.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="connection-stats">
                <div className="stat-item">
                  <span className="stat-value">{controls.length}</span>
                  <span className="stat-label">Policies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{relatedEvaluations.length}</span>
                  <span className="stat-label">Evaluations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{relatedEvaluations.filter(e => e.status === 'compliant').length}</span>
                  <span className="stat-label">Compliant</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No Connection Found</h3>
              <p>This provider is not connected yet.</p>
              <button className="button button--primary" onClick={() => navigate("/connections")}>
                Connect Provider
              </button>
            </div>
          )}
        </section>

        <section className="card quick-actions">
          <div className="card__title">Quick Actions</div>
          <div className="action-grid">
            <button className="action-button" onClick={() => navigate("/policies")}>
              <div className="action-icon">📋</div>
              <div className="action-content">
                <span>Manage Policies</span>
                <small>View and edit security policies</small>
              </div>
            </button>
            <button className="action-button" onClick={() => navigate("/reports")}>
              <div className="action-icon">📊</div>
              <div className="action-content">
                <span>Generate Report</span>
                <small>Create compliance reports</small>
              </div>
            </button>
            <button className="action-button" onClick={handleSync} disabled={!connectedAccount || syncAccount.isPending}>
              <div className="action-icon">🔄</div>
              <div className="action-content">
                <span>Sync Resources</span>
                <small>Update resource inventory</small>
              </div>
            </button>
            <button className="action-button" onClick={() => setShowSettings(true)}>
              <div className="action-icon">⚙️</div>
              <div className="action-content">
                <span>Configure</span>
                <small>Manage service settings</small>
              </div>
            </button>
          </div>
        </section>
      </div>

      <div className="service-tables-grid">
        <section className="card policies-table">
          <div className="card__title">
            Security Policies ({controls.length})
            <button className="button button--small" onClick={() => navigate("/policies")}>
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Control</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {controls.slice(0, 5).map((policy) => (
                  <tr key={policy.id}>
                    <td>
                      <div className="policy-cell">
                        <strong>{policy.name}</strong>
                        <small>{policy.description}</small>
                      </div>
                    </td>
                    <td>{policy.control_id}</td>
                    <td>{policy.category}</td>
                    <td>
                      <span className={`chip chip--${severityTone(policy.severity)}`}>
                        {policy.severity.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="icon-button" 
                          title="View policy"
                          onClick={() => navigate(`/policies/${policy.id}`)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 4.5A7.5 7.5 0 1 1 4.5 12A7.5 7.5 0 0 1 12 4.5zm0 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {controls.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No policies found for this provider
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card evaluations-table">
          <div className="card__title">
            Recent Evaluations ({relatedEvaluations.length})
            <button className="button button--small" onClick={() => navigate("/reports")}>
              View Report
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Status</th>
                  <th>Resource</th>
                  <th>Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {relatedEvaluations.slice(0, 5).map((evaluation) => (
                  <tr key={evaluation.id}>
                    <td>{evaluation.policy?.name || 'Unknown Policy'}</td>
                    <td>
                      <span className={`badge badge--${statusClass(evaluation.status)}`}>
                        {evaluation.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{evaluation.resource_id || evaluation.findings || "—"}</td>
                    <td>{new Date(evaluation.last_checked_at || evaluation.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {relatedEvaluations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      No evaluations found for this provider
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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
  return tones[severity] || "medium";
}

function statusClass(status) {
  if (status === "connected" || status === "compliant") return "compliant";
  if (status === "error" || status === "non_compliant") return "non-compliant";
  return "unknown";
}

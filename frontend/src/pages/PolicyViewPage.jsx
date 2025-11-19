import { useParams, useNavigate, Link } from "react-router-dom";
import { usePolicies, useEvaluations, useDeletePolicy, useUpdatePolicy } from "../services/hooks";
import { useMemo, useState } from "react";

const statusLabels = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  unknown: "Not Assessed",
};

const statusIcons = {
  compliant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  non_compliant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  unknown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const POLICY_TYPES = [
  "SCP (Service Control Policy)",
  "Policy Definition",
  "Organization Control",
  "Other"
];

const SCOPE_LEVELS = {
  aws: ["Root", "Organizational Unit", "Account"],
  azure: ["Root", "Management Group", "Subscription"],
  gcp: ["Organization", "Folder", "Project"]
};

function derivePolicyStatus(evaluations = []) {
  if (evaluations.length === 0) return "unknown";
  
  const nonCompliant = evaluations.some(evaluation => evaluation.status === "non_compliant");
  if (nonCompliant) return "non_compliant";
  
  const allCompliant = evaluations.every(evaluation => evaluation.status === "compliant");
  return allCompliant ? "compliant" : "unknown";
}

function severityTone(severity) {
  const normalized = severity?.toLowerCase() || "medium";
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function statusClass(status) {
  if (status === "compliant") return "success";
  if (status === "non_compliant") return "danger";
  return "warning";
}

function capitalize(value) {
  return value?.charAt(0).toUpperCase() + value?.slice(1) || "";
}

export default function PolicyViewPage() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const { data: policies = [], isLoading: policiesLoading } = usePolicies();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const deletePolicy = useDeletePolicy();
  const updatePolicy = useUpdatePolicy();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    control_id: "",
    category: "",
    provider: "aws",
    severity: "medium",
    description: "",
    policy_type: "",
    scope_level: "",
    scope_name: "",
    scope_id: "",
    compliance_status: "unknown",
    affected_resources: 0,
    last_reviewed: "",
    policy_content: "",
    tags: ""
  });

  const isLoading = policiesLoading || evaluationsLoading;

  const policy = useMemo(() => {
    return policies.find(p => p.id === parseInt(policyId));
  }, [policies, policyId]);

  const policyEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => evaluation.policy_id === parseInt(policyId));
  }, [evaluations, policyId]);

  const status = derivePolicyStatus(policyEvaluations);
  const resourceCount = policyEvaluations.length;
  const violationCount = policyEvaluations.filter(e => e.status === "non_compliant").length;
  const compliantCount = policyEvaluations.filter(e => e.status === "compliant").length;
  const complianceRate = resourceCount > 0 ? Math.round((compliantCount / resourceCount) * 100) : 0;
  
  const lastChecked = policyEvaluations.length > 0 
    ? Math.max(...policyEvaluations.map(e => new Date(e.last_checked_at || e.created_at).getTime()))
    : null;

  const handleEdit = () => {
    if (policy) {
      setFormData({
        name: policy.name,
        control_id: policy.control_id,
        category: policy.category,
        provider: policy.provider,
        severity: policy.severity,
        description: policy.description || "",
        policy_type: policy.policy_type || "",
        scope_level: policy.scope_level || "",
        scope_name: policy.scope_name || "",
        scope_id: policy.scope_id || "",
        compliance_status: policy.compliance_status || "unknown",
        affected_resources: policy.affected_resources || 0,
        last_reviewed: policy.last_reviewed || "",
        policy_content: policy.policy_content || "",
        tags: policy.tags || ""
      });
      setShowEditModal(true);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updatePolicy.mutate({ id: parseInt(policyId), ...formData }, {
      onSuccess: () => {
        setShowEditModal(false);
      }
    });
  };

  const handleDelete = () => {
    deletePolicy.mutate(parseInt(policyId), {
      onSuccess: () => {
        navigate("/policies");
      }
    });
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="policy-view-loading">
        <div className="loading-spinner">
          <svg className="spinner-ring" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
          <p>Loading policy details...</p>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="policy-view-error">
        <div className="error-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1>Policy Not Found</h1>
          <p>The requested policy could not be found or may have been deleted.</p>
          <Link to="/policies" className="button button--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Policies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-view-page">
      {/* Header Section */}
      <div className="policy-view-header">
        <div className="breadcrumb">
          <Link to="/policies">Policies</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span>{policy.name}</span>
        </div>

        <div className="policy-header-content">
          <div className="policy-header-main">
            <div className="policy-title-section">
              <h1 className="policy-title">{policy.name}</h1>
              <div className="policy-meta">
                <span className="policy-control-id">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {policy.control_id}
                </span>
                <span className="policy-category">{policy.category}</span>
                <span className="provider-badge provider-badge--large">
                  {policy.provider?.toUpperCase()}
                </span>
              </div>
              {policy.description && (
                <p className="policy-description">{policy.description}</p>
              )}
            </div>

            <div className="policy-badges">
              <div className={`status-badge-large status-badge-large--${statusClass(status)}`}>
                {statusIcons[status]}
                <div>
                  <span className="status-label">Status</span>
                  <span className="status-value">{statusLabels[status]}</span>
                </div>
              </div>
              <div className={`severity-badge-large severity-badge-large--${severityTone(policy.severity)}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <span className="status-label">Severity</span>
                  <span className="status-value">{capitalize(policy.severity)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="policy-header-actions">
            <button 
              className="icon-button icon-button--large"
              onClick={handleEdit}
              title="Edit policy"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button 
              className="icon-button icon-button--large icon-button--danger"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete policy"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <section className="policy-metrics">
        <div className="metric-box metric-box--primary">
          <div className="metric-box__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="metric-box__content">
            <span className="metric-box__value">{resourceCount}</span>
            <span className="metric-box__label">Monitored Resources</span>
          </div>
        </div>

        <div className="metric-box metric-box--success">
          <div className="metric-box__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="metric-box__content">
            <span className="metric-box__value">{compliantCount}</span>
            <span className="metric-box__label">Compliant Resources</span>
          </div>
        </div>

        <div className="metric-box metric-box--danger">
          <div className="metric-box__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="metric-box__content">
            <span className="metric-box__value">{violationCount}</span>
            <span className="metric-box__label">Violations Found</span>
          </div>
        </div>

        <div className="metric-box metric-box--info">
          <div className="metric-box__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="metric-box__content">
            <span className="metric-box__value">{complianceRate}%</span>
            <span className="metric-box__label">Compliance Rate</span>
          </div>
        </div>
      </section>

      {/* Policy Details Section */}
      <section className="card">
        <div className="card__header">
          <h3 className="card__title">Policy Information</h3>
        </div>
        <div className="policy-info-grid">
          <div className="info-item">
            <span className="info-label">Control ID</span>
            <span className="info-value info-value--mono">{policy.control_id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Category</span>
            <span className="info-value">{policy.category || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cloud Provider</span>
            <span className="info-value">
              <span className="provider-badge">{policy.provider?.toUpperCase()}</span>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Severity Level</span>
            <span className="info-value">
              <span className={`severity-badge severity-badge--${severityTone(policy.severity)}`}>
                {capitalize(policy.severity)}
              </span>
            </span>
          </div>
          {policy.policy_type && (
            <div className="info-item">
              <span className="info-label">Policy Type</span>
              <span className="info-value">{policy.policy_type}</span>
            </div>
          )}
          {policy.scope_level && (
            <div className="info-item">
              <span className="info-label">Scope Level</span>
              <span className="info-value">{policy.scope_level}</span>
            </div>
          )}
          {policy.scope_name && (
            <div className="info-item">
              <span className="info-label">Scope Name</span>
              <span className="info-value">{policy.scope_name}</span>
            </div>
          )}
          {policy.scope_id && (
            <div className="info-item">
              <span className="info-label">Scope ID</span>
              <span className="info-value info-value--mono">{policy.scope_id}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Affected Resources</span>
            <span className="info-value">{policy.affected_resources || 0}</span>
          </div>
          {policy.last_reviewed && (
            <div className="info-item">
              <span className="info-label">Last Reviewed</span>
              <span className="info-value">{new Date(policy.last_reviewed).toLocaleDateString()}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Last Checked</span>
            <span className="info-value">
              {lastChecked ? new Date(lastChecked).toLocaleString() : "Never"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Created</span>
            <span className="info-value">
              {policy.created_at ? new Date(policy.created_at).toLocaleDateString() : "—"}
            </span>
          </div>
          {policy.tags && (
            <div className="info-item info-item--full">
              <span className="info-label">Tags</span>
              <div className="tag-list">
                {policy.tags.split(',').map((tag, index) => (
                  <span key={index} className="tag">{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Policy Content Section */}
      {policy.policy_content && (
        <section className="card">
          <div className="card__header">
            <h3 className="card__title">Policy Definition</h3>
          </div>
          <div className="policy-content-viewer">
            <pre><code>{policy.policy_content}</code></pre>
          </div>
        </section>
      )}

      {/* Evaluation Results Section */}
      {policyEvaluations.length > 0 ? (
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Resource Evaluations</h3>
              <p className="card__subtitle">Compliance status for monitored resources</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource ID</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Last Evaluated</th>
                  <th>Findings</th>
                </tr>
              </thead>
              <tbody>
                {policyEvaluations.map((evaluation) => (
                  <tr key={evaluation.id}>
                    <td>
                      <span className="table-cell-mono">
                        {evaluation.resource_id || `Resource-${evaluation.id}`}
                      </span>
                    </td>
                    <td>Account {evaluation.account_id}</td>
                    <td>
                      <span className={`status-badge status-badge--${statusClass(evaluation.status)}`}>
                        {statusLabels[evaluation.status] || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <span className="table-cell-mono">
                        {new Date(evaluation.last_checked_at || evaluation.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td>{evaluation.findings || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3>No Evaluation Results</h3>
            <p>This policy hasn't been evaluated against any resources yet.</p>
          </div>
        </section>
      )}

      {/* Edit Policy Modal */}
      {showEditModal && (
        <PolicyEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isSubmitting={updatePolicy.isPending}
          error={updatePolicy.error}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3>Delete Policy?</h3>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete <strong>{policy.name}</strong>? 
                This will also delete all {policyEvaluations.length} evaluation{policyEvaluations.length !== 1 ? 's' : ''} 
                associated with this policy.
              </p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="button button--secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="button button--danger"
                onClick={handleDelete}
                disabled={deletePolicy.isPending}
              >
                {deletePolicy.isPending ? "Deleting..." : "Delete Policy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Policy Modal Component
function PolicyEditModal({ isOpen, onClose, formData, setFormData, onSubmit, isSubmitting, error }) {
  if (!isOpen) return null;

  const scopeLevels = SCOPE_LEVELS[formData.provider] || SCOPE_LEVELS.aws;

  return (
    <div className="fullscreen-modal">
      <div className="fullscreen-modal__overlay" onClick={onClose}></div>
      <div className="fullscreen-modal__container">
        <div className="fullscreen-modal__header">
          <div>
            <h2 className="fullscreen-modal__title">Edit Policy</h2>
            <p className="fullscreen-modal__subtitle">
              Update policy configuration and settings
            </p>
          </div>
          <button
            type="button"
            className="fullscreen-modal__close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="fullscreen-modal__form" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="form-section">
              <h3 className="form-section__title">Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="policy_name">
                    Policy Name <span className="required">*</span>
                  </label>
                  <input
                    id="policy_name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Prevent Public S3 Buckets"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cloud_provider">
                    Cloud Provider <span className="required">*</span>
                  </label>
                  <select
                    id="cloud_provider"
                    className="form-select"
                    value={formData.provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value, scope_level: "" }))}
                    required
                  >
                    <option value="aws">AWS</option>
                    <option value="azure">Azure</option>
                    <option value="gcp">GCP</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="policy_type">
                    Policy Type <span className="required">*</span>
                  </label>
                  <select
                    id="policy_type"
                    className="form-select"
                    value={formData.policy_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, policy_type: e.target.value }))}
                    required
                  >
                    <option value="">Select type</option>
                    {POLICY_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="control_id">
                    Control ID <span className="required">*</span>
                  </label>
                  <input
                    id="control_id"
                    className="form-input"
                    value={formData.control_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, control_id: e.target.value }))}
                    placeholder="CIS-AWS-1.2.3"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="category">
                    Category <span className="required">*</span>
                  </label>
                  <input
                    id="category"
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Storage Security"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="severity">
                    Severity
                  </label>
                  <select
                    id="severity"
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section__title">Scope Configuration</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="scope_level">
                    Scope Level
                  </label>
                  <select
                    id="scope_level"
                    className="form-select"
                    value={formData.scope_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, scope_level: e.target.value }))}
                  >
                    <option value="">Where is it applied?</option>
                    {scopeLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="scope_name">
                    Scope Name
                  </label>
                  <input
                    id="scope_name"
                    className="form-input"
                    value={formData.scope_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, scope_name: e.target.value }))}
                    placeholder="e.g., Production OU"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scope_id">
                  Scope ID
                </label>
                <input
                  id="scope_id"
                  className="form-input form-input--mono"
                  value={formData.scope_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, scope_id: e.target.value }))}
                  placeholder="e.g., ou-xxxx-xxxxxxxx"
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section__title">Compliance & Status</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="compliance_status">
                    Compliance Status
                  </label>
                  <select
                    id="compliance_status"
                    className="form-select"
                    value={formData.compliance_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, compliance_status: e.target.value }))}
                  >
                    <option value="compliant">Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                    <option value="warning">Warning</option>
                    <option value="unknown">Not Assessed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="affected_resources">
                    Affected Resources
                  </label>
                  <input
                    type="number"
                    id="affected_resources"
                    className="form-input"
                    value={formData.affected_resources}
                    onChange={(e) => setFormData(prev => ({ ...prev, affected_resources: parseInt(e.target.value) || 0 }))}
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="last_reviewed">
                    Last Reviewed
                  </label>
                  <input
                    type="date"
                    id="last_reviewed"
                    className="form-input"
                    value={formData.last_reviewed}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_reviewed: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="form-section form-section--full">
              <h3 className="form-section__title">Policy Details</h3>
              
              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this policy does and its purpose..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="policy_content">
                  Policy Content (JSON/YAML)
                </label>
                <textarea
                  id="policy_content"
                  className="form-textarea form-textarea--code"
                  value={formData.policy_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_content: e.target.value }))}
                  placeholder={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}`}
                  rows={8}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tags">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  className="form-input"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="security, compliance, s3, storage"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error?.message || "Failed to update policy. Please try again."}
            </div>
          )}

          <div className="fullscreen-modal__footer">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {isSubmitting ? "Updating..." : "Update Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCreatePolicy, useDeletePolicy, useEvaluations, usePolicies, useUpdatePolicy } from "../services/hooks";
import PageHero from "../components/PageHero";
import policiesIllustration from "../assets/illustrations/policies-hero.svg";


// --- Constants ---

const severityOrder = ["critical", "high", "medium", "low"];
const statusLabels = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  unknown: "Not Assessed",
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

// --- Helper Functions ---

function derivePolicyStatus(evaluations = []) {
  if (!evaluations.length) {
    return "unknown";
  }
  if (evaluations.some((evaluation) => evaluation.status === "non_compliant")) {
    return "non_compliant";
  }
  if (evaluations.some((evaluation) => evaluation.status === "compliant")) {
    return "compliant";
  }
  return "unknown";
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
  return value.charAt(0).toUpperCase() + value.slice(1);
}


// --- Main Component ---
export default function PoliciesPage() {
  const navigate = useNavigate();
  const { data: policies = [], isLoading: policiesLoading } = usePolicies();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
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

  const groupedEvaluations = useMemo(() => {
    const map = new Map();
    evaluations.forEach((evaluation) => {
      const arr = map.get(evaluation.policy_id) ?? [];
      arr.push(evaluation);
      map.set(evaluation.policy_id, arr);
    });
    return map;
  }, [evaluations]);

  const summary = useMemo(() => {
    let compliant = 0;
    let nonCompliant = 0;
    let pending = 0;
    policies.forEach((policy) => {
      const status = derivePolicyStatus(groupedEvaluations.get(policy.id));
      if (status === "compliant") compliant += 1;
      else if (status === "non_compliant") nonCompliant += 1;
      else pending += 1;
    });
    return {
      total: policies.length,
      compliant,
      nonCompliant,
      pending,
      complianceRate: policies.length ? Math.round((compliant / policies.length) * 100) : 0
    };
  }, [policies, groupedEvaluations]);

  const filteredPolicies = useMemo(() => {
    return policies
      .filter((policy) => {
        if (search && !policy.name.toLowerCase().includes(search.toLowerCase()) && !policy.control_id.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (severityFilter !== "all" && policy.severity.toLowerCase() !== severityFilter) {
          return false;
        }
        if (providerFilter !== "all" && policy.provider !== providerFilter) {
          return false;
        }
        const status = derivePolicyStatus(groupedEvaluations.get(policy.id));
        if (statusFilter !== "all" && status !== statusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => severityOrder.indexOf(a.severity.toLowerCase()) - severityOrder.indexOf(b.severity.toLowerCase()));
  }, [policies, search, severityFilter, providerFilter, statusFilter, groupedEvaluations]);

  const handleCreatePolicy = () => {
    setFormData({
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
    setEditingPolicy(null);
    setShowCreateModal(true);
  };

  const handleEditPolicy = (policy) => {
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
    setEditingPolicy(policy);
    setShowCreateModal(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editingPolicy) {
      updatePolicy.mutate({ id: editingPolicy.id, ...formData }, {
        onSuccess: () => setShowCreateModal(false)
      });
    } else {
      createPolicy.mutate(formData, {
        onSuccess: () => setShowCreateModal(false)
      });
    }
  };

  const handleDeletePolicy = (policyId) => {
    if (window.confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
      deletePolicy.mutate(policyId);
    }
  };

  return (
    <div className="policies-page">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <svg className="spinner-ring" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
            <p>Loading policies and evaluations...</p>
          </div>
        </div>
      )}

      {/* This wrapper class must match the ReportsPage structure for consistent sizing */}
      <div className="page-container"> 
        <PageHero
          title="Security Policies"
          subtitle="Monitor and manage security policies across your cloud infrastructure."
          badge="Policy Management"
          illustration={policiesIllustration}
          actions={(
            <button className="button button--primary" onClick={handleCreatePolicy}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Create Policy
            </button>
          )}
        />

        <section className="metrics-overview">
          <div className="metric-card metric-card--primary">
            <div className="metric-card__header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="metric-card__body">
              <span className="metric-card__value">{summary.total}</span>
              <span className="metric-card__label">Total Policies</span>
              <span className="metric-card__subtitle">Across all providers</span>
            </div>
          </div>

          <div className="metric-card metric-card--success">
            <div className="metric-card__header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="metric-card__body">
              <span className="metric-card__value">{summary.compliant}</span>
              <span className="metric-card__label">Compliant</span>
              <span className="metric-card__subtitle">{summary.complianceRate}% compliance rate</span>
            </div>
          </div>

          <div className="metric-card metric-card--danger">
            <div className="metric-card__header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="metric-card__body">
              <span className="metric-card__value">{summary.nonCompliant}</span>
              <span className="metric-card__label">Non-Compliant</span>
              <span className="metric-card__subtitle">{summary.nonCompliant} total violations</span>
            </div>
          </div>

          <div className="metric-card metric-card--warning">
            <div className="metric-card__header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="metric-card__body">
              <span className="metric-card__value">{summary.pending}</span>
              <span className="metric-card__label">Pending</span>
              <span className="metric-card__subtitle">Awaiting evaluation</span>
            </div>
          </div>
        </section>

        <section className="card policies-table-card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Policy Library</h3>
              <p className="card__subtitle">Manage and monitor security policies</p>
            </div>
          </div>

          <div className="filter-bar">
            <div className="filter-bar__search">
              <svg className="filter-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="filter-bar__input"
                placeholder="Search policies by name or control ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select className="filter-bar__select" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
              <option value="all">All Severities</option>
              {severityOrder.map((severity) => (
                <option key={severity} value={severity}>
                  {capitalize(severity)}
                </option>
              ))}
            </select>
            <select className="filter-bar__select" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
              <option value="all">All Providers</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
            <select className="filter-bar__select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="unknown">Not Assessed</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy Details</th>
                  <th>Category</th>
                  <th>Provider</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Resources</th>
                  <th>Violations</th>
                  <th>Last Checked</th>
                  <th className="table-actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => {
                  const evaluationsForPolicy = groupedEvaluations.get(policy.id) ?? [];
                  const resources = evaluationsForPolicy.length;
                  const violations = evaluationsForPolicy.filter((evaluation) => evaluation.status === "non_compliant").length;
                  const lastChecked = evaluationsForPolicy.reduce((latest, evaluation) => {
                    const timestamp = new Date(evaluation.last_checked_at).getTime();
                    return timestamp > latest ? timestamp : latest;
                  }, 0);
                  const status = derivePolicyStatus(evaluationsForPolicy);
                  return (
                    <tr key={policy.id}>
                      <td>
                        <div className="table-cell-primary">
                          <strong>{policy.name}</strong>
                          <span className="table-cell-secondary">{policy.control_id}</span>
                        </div>
                      </td>
                      <td>{policy.category}</td>
                      <td>
                        <span className="provider-badge">{policy.provider.toUpperCase()}</span>
                      </td>
                      <td>
                        <span className={`severity-badge severity-badge--${severityTone(policy.severity)}`}>
                          {capitalize(policy.severity)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-badge--${statusClass(status)}`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                      <td>{resources}</td>
                      <td>
                        {violations > 0 ? (
                          <span className="violations-count">{violations}</span>
                        ) : (
                          <span className="table-cell-muted">—</span>
                        )}
                      </td>
                      <td>
                        {lastChecked ? (
                          <span className="table-cell-mono">{new Date(lastChecked).toLocaleString()}</span>
                        ) : (
                          <span className="table-cell-muted">—</span>
                        )}
                      </td>
                      <td className="table-actions-column">
                        <div className="table-actions">
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
                          <button
                            className="icon-button icon-button--small"
                            title="Edit policy"
                            onClick={() => handleEditPolicy(policy)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="icon-button icon-button--small icon-button--danger"
                            title="Delete policy"
                            onClick={() => handleDeletePolicy(policy.id)}
                            disabled={deletePolicy.isPending}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredPolicies.length && !isLoading && (
                  <tr>
                    <td colSpan={9} className="table-empty">
                      <div className="empty-table-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No policies match the current filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div> 
      {/* END page-container */}

      {showCreateModal && (
        <PolicyFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isEditing={!!editingPolicy}
          isSubmitting={createPolicy.isPending || updatePolicy.isPending}
          error={createPolicy.error || updatePolicy.error}
        />
      )}
    </div>
  );
}

function PolicyFormModal({ isOpen, onClose, formData, setFormData, onSubmit, isEditing, isSubmitting, error }) {
  if (!isOpen) return null;

  const scopeLevels = SCOPE_LEVELS[formData.provider] || SCOPE_LEVELS.aws;
    const handleRetrieveCompliance = () => {
        const statuses = ["compliant", "non_compliant", "warning", "unknown"];
    
        const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
    
        const randomAffectedResources =
        Math.floor(Math.random() * 100); // 0–99 because why not
    
        const randomDate = new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        )
        .toISOString()
        .split("T")[0];
    
        setFormData((prev) => ({
        ...prev,
        compliance_status: randomStatus,
        affected_resources: randomAffectedResources,
        last_reviewed: randomDate,
        }));
    };
  
  return (
    <div className="fullscreen-modal">
      <div className="fullscreen-modal__overlay" onClick={onClose}></div>
      <div className="fullscreen-modal__container">
        <div className="fullscreen-modal__header">
          <div>
            <h2 className="fullscreen-modal__title">
              {isEditing ? "Edit Policy" : "Create New Policy"}
            </h2>
            <p className="fullscreen-modal__subtitle">
              {isEditing ? "Update policy configuration and settings" : "Define a new security policy for your cloud infrastructure"}
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
<button
    type="button"
    className="button button--secondary button--small"
    onClick={handleRetrieveCompliance}
  >
    Retrieve
  </button>
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
              {error?.message || "Failed to save policy. Please try again."}
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
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              {isEditing ? (isSubmitting ? "Updating..." : "Update Policy") : (isSubmitting ? "Creating..." : "Create Policy")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCreatePolicy, useDeletePolicy, useEvaluations, usePolicies, useUpdatePolicy } from "../services/hooks";
import PageHero from "../components/PageHero";
import policiesIllustration from "../assets/illustrations/policies-hero.svg";

const severityOrder = ["critical", "high", "medium", "low"];
const statusLabels = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  unknown: "Pending",
};

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    control_id: "",
    category: "",
    provider: "aws",
    severity: "medium",
    description: ""
  });

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
    };
  }, [policies, groupedEvaluations]);

  const categories = useMemo(() => Array.from(new Set(policies.map((policy) => policy.category))).sort(), [policies]);
  const providers = useMemo(() => Array.from(new Set(policies.map((policy) => policy.provider))).sort(), [policies]);

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
      description: ""
    });
    setEditingPolicy(null);
    setShowCreateForm(true);
  };

  const handleEditPolicy = (policy) => {
    setFormData({
      name: policy.name,
      control_id: policy.control_id,
      category: policy.category,
      provider: policy.provider,
      severity: policy.severity,
      description: policy.description || ""
    });
    setEditingPolicy(policy);
    setShowCreateForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editingPolicy) {
      updatePolicy.mutate({ id: editingPolicy.id, ...formData }, {
        onSuccess: () => setShowCreateForm(false)
      });
    } else {
      createPolicy.mutate(formData, {
        onSuccess: () => setShowCreateForm(false)
      });
    }
  };

  const handleDeletePolicy = (policyId) => {
    if (window.confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
      deletePolicy.mutate(policyId);
    }
  };

  if (policiesLoading || evaluationsLoading) {
    return <div>Loading policies…</div>;
  }

  return (
    <div>
      <PageHero
        title="Security Policies"
        subtitle="Monitor and manage security policies across your cloud infrastructure."
        badge="Policy library"
        illustration={policiesIllustration}
        actions={(
          <button className="button" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "Create policy"}
          </button>
        )}
      />

      <section className="stat-grid">
        <StatCard title="Total policies" value={summary.total} description="Across all providers" icon="📚" />
        <StatCard title="Compliant" value={summary.compliant} description={`${summary.total ? Math.round((summary.compliant / summary.total) * 100) : 0}% compliance`} icon="✅" />
        <StatCard title="Non-Compliant" value={summary.nonCompliant} description={`${summary.nonCompliant} total violations`} icon="⚠️" />
        <StatCard title="Pending" value={summary.pending} description="Awaiting latest evidence" icon="⏳" />
      </section>

      {showCreateForm && (
        <section className="card">
          <div className="card__title">
            {editingPolicy ? "Edit Policy" : "Create New Policy"}
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__group">
              <label className="form__label" htmlFor="policy_name">
                Policy Name
              </label>
              <input
                id="policy_name"
                className="form__input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="S3 Bucket Public Read Prohibited"
                required
              />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="control_id">
                Control ID
              </label>
              <input
                id="control_id"
                className="form__input"
                value={formData.control_id}
                onChange={(e) => setFormData(prev => ({ ...prev, control_id: e.target.value }))}
                placeholder="CIS-AWS-1.2.3"
                required
              />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="category">
                Category
              </label>
              <input
                id="category"
                className="form__input"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Storage Security"
                required
              />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="provider">
                Provider
              </label>
              <select
                id="provider"
                className="form__select"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
              >
                <option value="aws">AWS</option>
                <option value="azure">Azure</option>
                <option value="gcp">GCP</option>
              </select>
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="severity">
                Severity
              </label>
              <select
                id="severity"
                className="form__select"
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="form__input"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the policy requirements..."
                rows={3}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="button"
                type="submit"
                disabled={createPolicy.isPending || updatePolicy.isPending}
              >
                {editingPolicy ? (updatePolicy.isPending ? "Updating..." : "Update Policy") : (createPolicy.isPending ? "Creating..." : "Create Policy")}
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
            {(createPolicy.isError || updatePolicy.isError) && (
              <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>
                {createPolicy.error?.message || updatePolicy.error?.message || "Failed to save policy"}
              </div>
            )}
          </form>
        </section>
      )}

      <section className="card">
        <div className="filter-bar">
          <input
            placeholder="Search policies…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            <option value="all">All severities</option>
            {severityOrder.map((severity) => (
              <option key={severity} value={severity}>
                {capitalize(severity)}
              </option>
            ))}
          </select>
          <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
            <option value="all">All providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider.toUpperCase()}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="unknown">Pending</option>
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Category</th>
              <th>Provider</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Resources</th>
              <th>Violations</th>
              <th>Last checked</th>
              <th>Actions</th>
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
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{policy.name}</strong>
                      <span className="card__meta">{policy.control_id}</span>
                    </div>
                  </td>
                  <td>{policy.category}</td>
                  <td>{policy.provider.toUpperCase()}</td>
                  <td>
                    <span className={`chip chip--${severityTone(policy.severity)}`}>{capitalize(policy.severity)}</span>
                  </td>
                  <td>
                    <span className={`badge badge--${status.replace("_", "-")}`}>{statusLabels[status]}</span>
                  </td>
                  <td>{resources}</td>
                  <td>{violations}</td>
                  <td>{lastChecked ? new Date(lastChecked).toLocaleString() : "—"}</td>
                  <td>
                    <div className="connection-card__actions">
                      <button
                        type="button"
                        title="View details"
                        onClick={() => navigate(`/policies/${policy.id}`)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 4.5A7.5 7.5 0 1 1 4.5 12A7.5 7.5 0 0 1 12 4.5zm0 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Edit policy"
                        onClick={() => startEdit(policy)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M16.862 3.487a2.5 2.5 0 0 1 3.651 0 2.5 2.5 0 0 1 0 3.651L8.25 19.4 3 21l1.6-5.25L16.862 3.487z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Delete policy"
                        onClick={() => handleDeletePolicy(policy.id)}
                        disabled={deletePolicy.isPending}
                        style={{ color: "#ef4444" }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 6h12M9 6l.34-1.37A2 2 0 0 1 11.27 3h1.46a2 2 0 0 1 1.93 1.63L15 6m4 0v13.25A2.75 2.75 0 0 1 16.25 22h-8.5A2.75 2.75 0 0 1 5 19.25V6h14Zm-9 4a1 1 0 1 0-2 0v7a1 1 0 1 0 2 0v-7Zm6 0a1 1 0 1 0-2 0v7a1 1 0 1 0 2 0v-7Z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredPolicies.length && (
              <tr>
                <td colSpan={9}>No policies match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" aria-hidden="true">
        <span>{icon}</span>
      </div>
      <p className="stat-card__title">{title}</p>
      <p className="stat-card__value">{value}</p>
      <p className="card__meta">{description}</p>
    </div>
  );
}

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
  const normalized = severity.toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "danger";
  }
  if (normalized === "medium") {
    return "warning";
  }
  return "success";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

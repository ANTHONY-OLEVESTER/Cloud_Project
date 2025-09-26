import { useParams, useNavigate, Link } from "react-router-dom";
import { usePolicies, useEvaluations, useDeletePolicy } from "../services/hooks";
import { useMemo } from "react";

const statusLabels = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  unknown: "Pending",
};

function derivePolicyStatus(evaluations = []) {
  if (evaluations.length === 0) return "unknown";
  
  const nonCompliant = evaluations.some(evaluation => evaluation.status === "non_compliant");
  if (nonCompliant) return "non_compliant";
  
  const allCompliant = evaluations.every(evaluation => evaluation.status === "compliant");
  return allCompliant ? "compliant" : "unknown";
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

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PolicyViewPage() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const { data: policies = [] } = usePolicies();
  const { data: evaluations = [] } = useEvaluations();
  const deletePolicy = useDeletePolicy();

  const policy = useMemo(() => {
    return policies.find(p => p.id === parseInt(policyId));
  }, [policies, policyId]);

  const policyEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => evaluation.policy_id === parseInt(policyId));
  }, [evaluations, policyId]);

  const status = derivePolicyStatus(policyEvaluations);
  const resourceCount = policyEvaluations.length;
  const violationCount = policyEvaluations.filter(e => e.status === "non_compliant").length;
  const lastChecked = policyEvaluations.length > 0 
    ? Math.max(...policyEvaluations.map(e => new Date(e.last_checked || e.created_at).getTime()))
    : null;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
      deletePolicy.mutate(parseInt(policyId), {
        onSuccess: () => {
          navigate("/policies");
        }
      });
    }
  };

  if (!policy) {
    return (
      <div className="page-header">
        <div>
          <h1>Policy Not Found</h1>
          <p>The requested policy could not be found.</p>
        </div>
        <div className="page-header__actions">
          <Link to="/policies" className="button">
            Back to Policies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{policy.name}</h1>
          <p>{policy.description || "No description available"}</p>
        </div>
        <div className="page-header__actions">
          <Link to="/policies" className="button">
            Back to Policies
          </Link>
          <button 
            className="button button--primary"
            onClick={() => navigate(`/policies/${policyId}/edit`)}
          >
            Edit Policy
          </button>
          <button 
            className="button button--danger"
            onClick={handleDelete}
            disabled={deletePolicy.isPending}
          >
            {deletePolicy.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon">📊</div>
          <div className="stat-card__meta">
            <strong>Status</strong>
            <span className={`badge badge--${status.replace("_", "-")}`}>
              {statusLabels[status]}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">🎯</div>
          <div className="stat-card__meta">
            <strong>Severity</strong>
            <span className={`chip chip--${severityTone(policy.severity)}`}>
              {capitalize(policy.severity)}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">📡</div>
          <div className="stat-card__meta">
            <strong>Resources</strong>
            <span>{resourceCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">⚠️</div>
          <div className="stat-card__meta">
            <strong>Violations</strong>
            <span>{violationCount}</span>
          </div>
        </div>
      </section>

      <section className="card" style={{marginBottom: '32px'}}>
        <div className="card__title">Policy Details</div>
        <div className="policy-details">
          <div className="detail-row">
            <label>Control ID:</label>
            <span>{policy.control_id}</span>
          </div>
          <div className="detail-row">
            <label>Category:</label>
            <span>{policy.category || "—"}</span>
          </div>
          <div className="detail-row">
            <label>Provider:</label>
            <span className="provider-badge">{policy.provider?.toUpperCase()}</span>
          </div>
          <div className="detail-row">
            <label>Last Checked:</label>
            <span>{lastChecked ? new Date(lastChecked).toLocaleString() : "—"}</span>
          </div>
        </div>
      </section>

      {policyEvaluations.length > 0 && (
        <section className="card">
          <div className="card__title">Evaluation Results</div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Status</th>
                  <th>Last Checked</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {policyEvaluations.map((evaluation) => (
                  <tr key={evaluation.id}>
                    <td>{evaluation.resource_id || `Resource ${evaluation.id}`}</td>
                    <td>
                      <span className={`badge badge--${evaluation.status?.replace("_", "-") || "unknown"}`}>
                        {statusLabels[evaluation.status] || "Unknown"}
                      </span>
                    </td>
                    <td>{new Date(evaluation.last_checked || evaluation.created_at).toLocaleString()}</td>
                    <td>{evaluation.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
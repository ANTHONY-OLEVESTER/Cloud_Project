import { useParams, useNavigate, Link } from "react-router-dom";
import { usePolicies, useEvaluations, useDeletePolicy } from "../services/hooks";
import { useMemo } from "react";

import PageHeader from "../components/PageHeader";
import { AlertTriangle, ClipboardList, Layers, ShieldCheck } from "lucide-react";

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

const HERO_IMAGES = {
  aws: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1400&q=80",
  azure: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
  gcp: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80",
  default: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80",
};

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
      <PageHeader
        eyebrow="Policies"
        title="Policy not found"
        description="The requested policy could not be located. It may have been removed or reassigned."
        image={HERO_IMAGES.default}
        actions={
          <Link to="/policies" className="button">
            Back to Policies
          </Link>
        }
      />
    );
  }

  const heroImage = HERO_IMAGES[policy.provider] ?? HERO_IMAGES.default;

  return (
    <div>
      <PageHeader
        eyebrow={policy.provider?.toUpperCase() ?? "Policy"}
        title={policy.name}
        description={policy.description || "No description available"}
        image={heroImage}
        actions={
          <div className="page-hero__inline-actions">
            <Link to="/policies" className="button button--secondary">
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
        }
      />

      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">
            <ShieldCheck size={18} />
          </div>
          <div className="stat-card__meta">
            <strong>Status</strong>
            <span className={`badge badge--${status.replace("_", "-")}`}>
              {statusLabels[status]}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">
            <ClipboardList size={18} />
          </div>
          <div className="stat-card__meta">
            <strong>Severity</strong>
            <span className={`chip chip--${severityTone(policy.severity)}`}>
              {capitalize(policy.severity)}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">
            <Layers size={18} />
          </div>
          <div className="stat-card__meta">
            <strong>Resources</strong>
            <span>{resourceCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-card__meta">
            <strong>Violations</strong>
            <span>{violationCount}</span>
          </div>
        </div>
      </section>

      <section className="card">
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
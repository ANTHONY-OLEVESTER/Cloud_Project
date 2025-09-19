import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAccounts, useEvaluations, usePolicies } from "../services/hooks";

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

  const { data: accounts } = useAccounts();
  const { data: policies } = usePolicies();
  const { data: evaluations } = useEvaluations();

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

  return (
    <div className="page-grid" style={{ gap: "32px" }}>
      <section
        className="hero-card"
        style={{
          backgroundImage: `linear-gradient(135deg, var(--hero-overlay-start), var(--hero-overlay-end)), url(${heroImage})`,
        }}
      >
        <div className="hero-card__content">
          <span className="hero-card__eyebrow">Provider deep dive</span>
          <h1>{provider.toUpperCase()} master account</h1>
          <p>
            Review posture metrics, recent evaluations, and compliance coverage for this provider. Use the quick
            links below to retrigger evidence collection or export a tailored report.
          </p>
        </div>
      </section>

      <section className="card provider-card">
        <div className="card__title">Connection overview</div>
        {connectedAccount ? (
          <dl className="definition-grid">
            <div>
              <dt>Display name</dt>
              <dd>{connectedAccount.display_name}</dd>
            </div>
            <div>
              <dt>External ID</dt>
              <dd>{connectedAccount.external_id}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`badge badge--${statusClass(connectedAccount.status)}`}>
                  {connectedAccount.status.replace("_", " ")}
                </span>
              </dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{connectedAccount.owner_id ?? "—"}</dd>
            </div>
            <div>
              <dt>Created at</dt>
              <dd>{new Date(connectedAccount.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        ) : (
          <p>No linked account found for this provider.</p>
        )}
        <button className="button" type="button" onClick={() => navigate("/connections")}
          style={{ alignSelf: "flex-start", marginTop: "8px" }}
        >
          Back to connections
        </button>
      </section>

      <section className="card">
        <div className="card__title">Mapped controls</div>
        <table className="table">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Control</th>
              <th>Category</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((policy) => (
              <tr key={policy.id}>
                <td>{policy.name}</td>
                <td>{policy.control_id}</td>
                <td>{policy.category}</td>
                <td>
                  <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>
                    {policy.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card__title">Recent evaluations</div>
        <table className="table">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Status</th>
              <th>Findings</th>
              <th>Last checked</th>
            </tr>
          </thead>
          <tbody>
            {relatedEvaluations.map((evaluation) => (
              <tr key={evaluation.id}>
                <td>{evaluation.policy?.name}</td>
                <td>
                  <span className={`badge badge--${statusClass(evaluation.status)}`}>
                    {evaluation.status.replace("_", " ")}
                  </span>
                </td>
                <td>{evaluation.findings ?? "—"}</td>
                <td>{new Date(evaluation.last_checked_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function statusClass(status) {
  if (status === "connected" || status === "compliant") return "compliant";
  if (status === "error" || status === "non_compliant") return "non-compliant";
  return "unknown";
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useEvaluations,
  usePolicies,
  useSyncAccount,
  useCreateNotification,
} from "../services/hooks";
import PageHero from "../components/PageHero";
import connectionsIllustration from "../assets/illustrations/connections-hero.svg";

const providerOptions = [
  { value: "all", label: "All Providers" },
  { value: "aws", label: "Amazon Web Services" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "gcp", label: "Google Cloud" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "connected", label: "Connected" },
  { value: "pending", label: "Pending" },
  { value: "error", label: "Error" },
];

const providerIcons = {
  aws: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
  azure: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
  gcp: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
};

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading, isError, error } = useAccounts();
  const { data: policies = [] } = usePolicies();
  const { data: evaluations = [] } = useEvaluations();
  const createAccount = useCreateAccount();
  const syncAccount = useSyncAccount();
  const deleteAccount = useDeleteAccount();
  const { mutate: sendNotification } = useCreateNotification();

  const [query, setQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formState, setFormState] = useState({
    provider: "aws",
    external_id: "",
    display_name: "",
    role_arn: "",
    tenant_id: "",
    region: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [provisioning, setProvisioning] = useState({ active: false, step: 0, account: null });

  const provisioningSteps = useMemo(
    () => [
      {
        title: "Initializing workspace",
        description: "Locking down landing zone configuration and verifying trust relationships.",
        delay: 1200,
        notification: (account) => ({
          title: "Initializing secure workspace",
          message: `Preparing guardrails for ${account.display_name} (${account.provider.toUpperCase()})`,
          type: "provisioning",
        }),
      },
      {
        title: "Building connectors",
        description: "Wiring IAM roles, service principals, and discovery pipelines.",
        delay: 1400,
        notification: (account) => ({
          title: "Building connectors",
          message: `Provisioning APIs and roles for ${account.display_name}.`,
          type: "provisioning",
        }),
      },
      {
        title: "Deploying policies",
        description: "Activating baseline controls and compliance monitors.",
        delay: 1500,
        notification: (account) => ({
          title: "Deploying baseline policies",
          message: `Baseline controls are live for ${account.display_name}.`,
          type: "provisioning",
        }),
      },
      {
        title: "Finished",
        description: "Connection is live and streaming findings.",
        delay: 1300,
        notification: (account) => ({
          title: "Provisioning complete",
          message: `${account.display_name} is ready to sync evidence.`,
          type: "build_complete",
        }),
      },
    ],
    []
  );

  useEffect(() => {
    if (!provisioning.active || !provisioning.account) {
      return undefined;
    }
    if (provisioning.step >= provisioningSteps.length) {
      return undefined;
    }

    const step = provisioningSteps[provisioning.step];
    sendNotification(step.notification(provisioning.account));
    const timer = window.setTimeout(() => {
      setProvisioning((prev) => ({ ...prev, step: prev.step + 1 }));
    }, step.delay);
    return () => window.clearTimeout(timer);
  }, [provisioning, provisioningSteps, sendNotification]);

  const connectedProviders = accounts.filter((account) => account.status === "connected").length;
  const totalPolicies = policies.length;
  const resourcesMonitored = evaluations.length * 8;

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (filterProvider !== "all" && account.provider !== filterProvider) {
        return false;
      }
      if (filterStatus !== "all" && account.status !== filterStatus) {
        return false;
      }
      if (query && !account.display_name.toLowerCase().includes(query.toLowerCase()) && !account.external_id.includes(query)) {
        return false;
      }
      return true;
    });
  }, [accounts, filterProvider, filterStatus, query]);

  const handleSubmit = (event) => {
    event.preventDefault();
    createAccount.mutate(formState, {
      onSuccess: (newAccount) => {
        setFormState({
          provider: "aws",
          external_id: "",
          display_name: "",
          role_arn: "",
          tenant_id: "",
          region: ""
        });
        setShowAddForm(false);
        if (newAccount) {
          setProvisioning({ active: true, step: 0, account: newAccount });
        }
      },
    });
  };

  const handleSync = (accountId) => {
    syncAccount.mutate(accountId);
  };

  const handleDelete = (accountId) => {
    if (window.confirm("Are you sure you want to remove this account? This action cannot be undone.")) {
      deleteAccount.mutate(accountId);
    }
  };

  const handleSettings = (account) => {
    navigate(`/services/${account.provider}`, { state: { account } });
  };

  const closeProvisioning = () => setProvisioning({ active: false, step: 0, account: null });

  return (
    <div>
      <PageHero
        title="Cloud Connections"
        subtitle="Manage cloud provider integrations and monitor their status."
        badge="Account onboarding"
        illustration={connectionsIllustration}
        actions={(
          <button className="button" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add provider"}
          </button>
        )}
      />

      <ProvisioningFlow
        visible={provisioning.active}
        steps={provisioningSteps}
        currentStep={provisioning.step}
        account={provisioning.account}
        onClose={closeProvisioning}
      />

      <section className="stat-grid">
        <StatCard title="Connected providers" value={connectedProviders} description="with healthy sync" icon="☁️" />
        <StatCard title="Total policies" value={totalPolicies} description="Across all providers" icon="📘" />
        <StatCard title="Resources monitored" value={resourcesMonitored} description="Estimated resources" icon="📡" />
      </section>

      {showAddForm && (
        <section className="card onboarding-card">
          <div className="card__title">Connect a master account</div>
          <form className="form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label className="form__label" htmlFor="provider">
              Cloud provider
            </label>
            <select
              id="provider"
              className="form__select"
              value={formState.provider}
              onChange={(event) => setFormState((prev) => ({ ...prev, provider: event.target.value }))}
            >
              {providerOptions.slice(1).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form__group">
            <label className="form__label" htmlFor="external_id">
              Organization ID
            </label>
            <input
              id="external_id"
              className="form__input"
              value={formState.external_id}
              onChange={(event) => setFormState((prev) => ({ ...prev, external_id: event.target.value }))}
              placeholder="123456789012"
              required
            />
          </div>

          <div className="form__group">
            <label className="form__label" htmlFor="display_name">
              Display name
            </label>
            <input
              id="display_name"
              className="form__input"
              value={formState.display_name}
              onChange={(event) => setFormState((prev) => ({ ...prev, display_name: event.target.value }))}
              placeholder="Production AWS"
              required
            />
          </div>

          <button className="button" type="submit" disabled={createAccount.isPending}>
            {createAccount.isPending ? "Connecting…" : "Connect account"}
          </button>
          {createAccount.isError ? (
            <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>
              {createAccount.error?.message ?? "Unable to connect account"}
            </div>
          ) : null}
          </form>
        </section>
      )}

      <section className="card">
        <div className="card__title">Connected organizations</div>
        <div className="filter-bar">
          <input
            placeholder="Search accounts…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={filterProvider} onChange={(event) => setFilterProvider(event.target.value)}>
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <p>Loading accounts…</p>
        ) : isError ? (
          <p style={{ color: "#b91c1c" }}>{error?.message ?? "Failed to load accounts."}</p>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-state">
            <h3>No connections found</h3>
            <p>Add a cloud provider connection to get started.</p>
          </div>
        ) : (
          <div className="connections-grid">
            {filteredAccounts.map((account) => {
              // Better account-to-evaluation mapping
              const accountPolicies = policies.filter(policy => policy.provider === account.provider);
              const accountEvaluations = evaluations.filter(evaluation => 
                evaluation.account_id === account.id || 
                (evaluation.account?.id === account.id) ||
                (evaluation.account?.provider === account.provider && evaluation.account?.external_id === account.external_id)
              );
              const policyCount = accountPolicies.length;
              const resourceCount = accountEvaluations.reduce((acc, evaluation) => 
                acc + (evaluation.resource_count || evaluation.resources || 1), 0
              );
              return (
                <div key={account.id} className="connection-card">
                  <div className="connection-card__icon">
                    <img src={providerIcons[account.provider] ?? providerIcons.aws} alt={`${account.provider} logo`} />
                  </div>
                  <div className="connection-card__meta">
                    <strong>{account.display_name}</strong>
                    <span>
                      Account: {account.external_id} · Connected {new Date(account.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="connection-card__stats">
                    <span>
                      <strong>{policyCount}</strong> policies
                    </span>
                    <span>
                      <strong>{resourceCount}</strong> resources
                    </span>
                  </div>
                  <StatusChip status={account.status} />
                  <div className="connection-card__actions">
                    <button
                      type="button"
                      title="Sync"
                      onClick={() => handleSync(account.id)}
                      disabled={syncAccount.isPending}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 8a8 8 0 0 1 13.66-3.5" />
                        <path d="M20 8V3h-4" />
                        <path d="M20 16a8 8 0 0 1-13.66 3.5" />
                        <path d="M4 16v5h4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => navigate(`/services/${account.provider}`, { state: { account } })}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5-9.75-7.5-9.75-7.5Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => handleSettings(account)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M16.862 3.487a1.875 1.875 0 0 1 2.651 2.651L9.954 15.697a4.5 4.5 0 0 1-1.895 1.13l-3.13.903.903-3.13a4.5 4.5 0 0 1 1.13-1.895l9.908-9.908Z" />
                        <path d="M18 13.5V19.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-9A1.5 1.5 0 0 1 7.5 9h5.25" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => handleDelete(account.id)}
                      disabled={deleteAccount.isPending}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 7h12" />
                        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
                        <path d="M9 10v7" />
                        <path d="M15 10v7" />
                        <path d="M6.5 7h11A1.5 1.5 0 0 1 19 8.5v9A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-9A1.5 1.5 0 0 1 6.5 7Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredAccounts.length && <p>No accounts match the current filters.</p>}
          </div>
        )}
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

function StatusChip({ status }) {
  const map = {
    connected: { label: "Connected", tone: "success" },
    pending: { label: "Pending", tone: "warning" },
    error: { label: "Error", tone: "danger" },
  };
  const details = map[status] ?? { label: status, tone: "warning" };
  return <span className={`chip chip--${details.tone}`}>{details.label}</span>;
}

function ProvisioningFlow({ visible, steps, currentStep, account, onClose }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="provisioning-overlay">
      <div className="provisioning-panel">
        <div className="provisioning-panel__header">
          <div>
            <h3>Provisioning {account?.display_name}</h3>
            <p>Follow the automated onboarding pipeline. Notifications mirror each stage.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close provisioning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6 18 18M6 18 18 6" />
            </svg>
          </button>
        </div>
        <ol className="provisioning-steps">
          {steps.map((step, index) => {
            const status = index < currentStep ? "done" : index === currentStep ? "active" : "pending";
            return (
              <li key={step.title} className={`provisioning-step provisioning-step--${status}`}>
                <span className="provisioning-step__index">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {currentStep >= steps.length && (
          <div className="provisioning-panel__footer">
            <button className="button" type="button" onClick={onClose}>
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

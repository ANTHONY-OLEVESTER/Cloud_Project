import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import {
  useAccounts,
  useCreateAccount,
  useCreateNotification,
  useDeleteAccount,
  useEvaluations,
  usePolicies,
  useSyncAccount,
} from "../services/hooks";
import {
  Building2,
  CheckCircle2,
  Cloud,
  Eye,
  FileText,
  Loader2,
  PencilLine,
  RefreshCcw,
  Rocket,
  Server,
  Trash2,
  Wrench,
} from "lucide-react";

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

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80";

const INITIAL_FORM_STATE = {
  provider: "aws",
  external_id: "",
  display_name: "",
  role_arn: "",
  tenant_id: "",
  region: "",
};

const PROVISIONING_STEPS = [
  {
    key: "initialize",
    label: "Initializing secure foundation",
    description: "Preparing identity federation and baseline roles.",
    icon: Building2,
    duration: 1400,
    notification: {
      title: "Provisioning {name}",
      message: "Starting secure handshake with {name}.",
      type: "service_provision",
      action_path: "/connections",
    },
  },
  {
    key: "build",
    label: "Building compliance baseline",
    description: "Generating guardrails and configuration templates.",
    icon: Wrench,
    duration: 1500,
    notification: {
      title: "Deploying guardrails",
      message: "Baseline controls for {name} are being applied.",
      type: "account_sync",
      action_path: "/connections",
    },
  },
  {
    key: "deploy",
    label: "Deploying telemetry sensors",
    description: "Linking resource inventory and evidence pipelines.",
    icon: Rocket,
    duration: 1600,
    notification: {
      title: "Telemetry enabled",
      message: "Sensors are streaming insights from {name}.",
      type: "account_sync",
      action_path: "/connections",
    },
  },
  {
    key: "finalize",
    label: "Finalizing automation",
    description: "Validating findings routing and alert coverage.",
    icon: CheckCircle2,
    duration: 1700,
    notification: {
      title: "{name} is live",
      message: "Baseline automation is now active for {name}.",
      type: "build_complete",
      action_path: "/connections",
    },
  },
];

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
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [showAddForm, setShowAddForm] = useState(false);
  const [provisioningStage, setProvisioningStage] = useState(-1);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningAccountName, setProvisioningAccountName] = useState("Cloud account");

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
      if (
        query &&
        !account.display_name.toLowerCase().includes(query.toLowerCase()) &&
        !account.external_id.includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [accounts, filterProvider, filterStatus, query]);

  useEffect(() => {
    if (!isProvisioning) {
      return;
    }

    if (provisioningStage === -1) {
      return;
    }

    if (provisioningStage >= PROVISIONING_STEPS.length) {
      const timeout = window.setTimeout(() => {
        setIsProvisioning(false);
        setProvisioningStage(-1);
        setProvisioningAccountName("Cloud account");
      }, 1600);
      return () => window.clearTimeout(timeout);
    }

    const step = PROVISIONING_STEPS[provisioningStage];
    const name = provisioningAccountName || "Cloud account";
    if (step.notification) {
      sendNotification({
        title: fillTemplate(step.notification.title, name),
        message: fillTemplate(step.notification.message, name),
        type: step.notification.type,
        action_path: step.notification.action_path,
      });
    }

    const timer = window.setTimeout(() => {
      setProvisioningStage((prev) => prev + 1);
    }, step.duration ?? 1500);

    return () => window.clearTimeout(timer);
  }, [isProvisioning, provisioningStage, provisioningAccountName, sendNotification]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = { ...formState };

    createAccount.mutate(payload, {
      onSuccess: () => {
        setProvisioningAccountName(payload.display_name || "New integration");
        setFormState(INITIAL_FORM_STATE);
        setShowAddForm(false);
        setIsProvisioning(true);
        setProvisioningStage(0);
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

  return (
    <div>
      <PageHeader
        eyebrow="Integrations"
        title="Cloud Connections"
        description="Orchestrate multi-cloud connectivity, telemetry, and evidence streaming from a single control plane."
        image={HERO_IMAGE}
        actions={
          <button className="button" onClick={() => setShowAddForm((prev) => !prev)}>
            {showAddForm ? "Cancel" : "Add provider"}
          </button>
        }
      />

      <section className="stat-grid">
        <StatCard
          title="Connected providers"
          value={connectedProviders}
          description="With healthy sync"
          icon={Cloud}
        />
        <StatCard
          title="Total policies"
          value={totalPolicies}
          description="Across all providers"
          icon={FileText}
        />
        <StatCard
          title="Resources monitored"
          value={resourcesMonitored}
          description="Estimated resources"
          icon={Server}
        />
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
              <div style={{ color: "var(--danger-500)", fontSize: "0.85rem" }}>
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
          <p style={{ color: "var(--danger-500)" }}>{error?.message ?? "Failed to load accounts."}</p>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-state">
            <h3>No connections found</h3>
            <p>Add a cloud provider connection to get started.</p>
          </div>
        ) : (
          <div className="connections-grid">
            {filteredAccounts.map((account) => {
              const accountPolicies = policies.filter((policy) => policy.provider === account.provider);
              const accountEvaluations = evaluations.filter(
                (evaluation) =>
                  evaluation.account_id === account.id ||
                  evaluation.account?.id === account.id ||
                  (evaluation.account?.provider === account.provider &&
                    evaluation.account?.external_id === account.external_id)
              );
              const policyCount = accountPolicies.length;
              const resourceCount = accountEvaluations.reduce(
                (acc, evaluation) => acc + (evaluation.resource_count || evaluation.resources || 1),
                0
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
                      <RefreshCcw size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="View details"
                      onClick={() => navigate(`/services/${account.provider}`, { state: { account } })}
                    >
                      <Eye size={18} aria-hidden="true" />
                    </button>
                    <button type="button" title="Edit" onClick={() => handleSettings(account)}>
                      <PencilLine size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => handleDelete(account.id)}
                      disabled={deleteAccount.isPending}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredAccounts.length && <p>No accounts match the current filters.</p>}
          </div>
        )}
      </section>

      {isProvisioning && (
        <div className="provisioning-overlay" role="status" aria-live="polite">
          <div className="provisioning-overlay__card">
            <div className="provisioning-overlay__header">
              {provisioningStage >= PROVISIONING_STEPS.length ? (
                <CheckCircle2 className="provisioning-overlay__icon provisioning-overlay__icon--success" size={28} />
              ) : (
                <Loader2 className="provisioning-overlay__icon provisioning-overlay__icon--spin" size={28} />
              )}
              <div>
                <h3>{provisioningStage >= PROVISIONING_STEPS.length ? "Service ready" : "Connecting service"}</h3>
                <p>{provisioningAccountName} integration</p>
              </div>
            </div>
            <ol className="provisioning-steps">
              {PROVISIONING_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const status =
                  index < provisioningStage
                    ? "done"
                    : index === provisioningStage
                    ? "active"
                    : "pending";
                return (
                  <li key={step.key} className={`provisioning-steps__item provisioning-steps__item--${status}`}>
                    <span className="provisioning-steps__icon">
                      <StepIcon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <span>{step.label}</span>
                      <small>{step.description}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
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

function fillTemplate(template, name) {
  return template.replace(/\{name\}/g, name);
}

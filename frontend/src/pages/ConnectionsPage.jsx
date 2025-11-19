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

const syncFrequencyOptions = [
  { value: "Daily", label: "Daily (Recommended)" },
  { value: "Weekly", label: "Weekly" },
  { value: "Hourly", label: "Hourly" },
  { value: "Manual", label: "Manual Only" },
];

const accessMethodOptions = {
  aws: [
    { value: "IAM Role", label: "IAM Role (AWS)" },
    { value: "API Key", label: "API Key" },
  ],
  azure: [
    { value: "Service Principal", label: "Service Principal (Azure)" },
    { value: "API Key", label: "API Key" },
  ],
  gcp: [
    { value: "Service Account", label: "Service Account (GCP)" },
    { value: "API Key", label: "API Key" },
  ],
};

const providerIcons = {
  aws: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
  azure: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
  gcp: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
};

const getCredentialFieldLabel = (provider) => {
  switch (provider) {
    case "aws":
      return "IAM Role ARN";
    case "azure":
      return "Service Principal ID";
    case "gcp":
      return "Service Account Email";
    default:
      return "Credential";
  }
};

const getCredentialPlaceholder = (provider) => {
  switch (provider) {
    case "aws":
      return "arn:aws:iam::123456789012:role/CloudGuardRole";
    case "azure":
      return "12345678-1234-1234-1234-123456789012";
    case "gcp":
      return "service-account@project-id.iam.gserviceaccount.com";
    default:
      return "";
  }
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
    account_name: "",
    provider: "aws",
    subscription_id: "",
    access_method: "",
    credential: "",
    service_email: "",
    tenant_id: "",
    sync_frequency: "Daily",
    auto_sync: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
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
    
    const payload = {
      display_name: formState.account_name,
      provider: formState.provider,
      external_id: formState.subscription_id,
      access_method: formState.access_method,
      credential: formState.credential,
      service_email: formState.service_email,
      tenant_id: formState.tenant_id,
      sync_frequency: formState.sync_frequency,
      auto_sync: formState.auto_sync,
    };

    createAccount.mutate(payload, {
      onSuccess: (newAccount) => {
        setFormState({
          account_name: "",
          provider: "aws",
          subscription_id: "",
          access_method: "",
          credential: "",
          service_email: "",
          tenant_id: "",
          sync_frequency: "Daily",
          auto_sync: true,
        });
        setShowAddModal(false);
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
    navigate(`/connections/services/${account.provider}`, { state: { account } });
  };

  const closeProvisioning = () => setProvisioning({ active: false, step: 0, account: null });

  return (
    <div className="connections-page">
      <PageHero
        title="Cloud Connections"
        subtitle="Manage cloud provider integrations and monitor their status."
        badge="Account onboarding"
        illustration={connectionsIllustration}
        actions={(
          <button className="button button--primary" onClick={() => setShowAddModal(true)}>
            Connect Account
          </button>
        )}
      />

      <ConnectAccountModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        formState={formState}
        setFormState={setFormState}
        onSubmit={handleSubmit}
        isSubmitting={createAccount.isPending}
        error={createAccount.error}
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

      <section className="card connections-card">
        <div className="card__header">
          <h3 className="card__title">Connected Accounts</h3>
          <p className="card__subtitle">Manage your AWS, Azure, and GCP cloud integrations</p>
        </div>
        
        <div className="filter-bar">
          <div className="filter-bar__search">
            <svg className="filter-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="filter-bar__input"
              placeholder="Search by name or ID…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select 
            className="filter-bar__select" 
            value={filterProvider} 
            onChange={(event) => setFilterProvider(event.target.value)}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select 
            className="filter-bar__select" 
            value={filterStatus} 
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="card__content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading accounts…</p>
            </div>
          ) : isError ? (
            <div className="error-state">
              <p>{error?.message ?? "Failed to load accounts."}</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">☁️</div>
              <h3 className="empty-state__title">No connections found</h3>
              <p className="empty-state__description">Add a cloud provider connection to get started.</p>
            </div>
          ) : (
            <div className="connections-grid">
              {filteredAccounts.map((account) => {
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
                    <div className="connection-card__header">
                      <div className="connection-card__icon">
                        <img src={providerIcons[account.provider] ?? providerIcons.aws} alt={`${account.provider} logo`} />
                      </div>
                      <div className="connection-card__meta">
                        <h4 className="connection-card__title">{account.display_name}</h4>
                        <p className="connection-card__subtitle">
                          {account.external_id} · {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusChip status={account.status} />
                    </div>

                    <div className="connection-card__stats">
                      <div className="stat-item">
                        <span className="stat-item__value">{policyCount}</span>
                        <span className="stat-item__label">policies</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item__value">{resourceCount}</span>
                        <span className="stat-item__label">resources</span>
                      </div>
                    </div>

                    <div className="connection-card__actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Sync"
                        onClick={() => handleSync(account.id)}
                        disabled={syncAccount.isPending}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 8a8 8 0 0 1 13.66-3.5" />
                          <path d="M20 8V3h-4" />
                          <path d="M20 16a8 8 0 0 1-13.66 3.5" />
                          <path d="M4 16v5h4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="View Details"
                        onClick={() => navigate(`/connections/services/${account.provider}`, { state: { account } })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5-9.75-7.5-9.75-7.5Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Edit"
                        onClick={() => handleSettings(account)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M16.862 3.487a1.875 1.875 0 0 1 2.651 2.651L9.954 15.697a4.5 4.5 0 0 1-1.895 1.13l-3.13.903.903-3.13a4.5 4.5 0 0 1 1.13-1.895l9.908-9.908Z" />
                          <path d="M18 13.5V19.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-9A1.5 1.5 0 0 1 7.5 9h5.25" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        title="Remove"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteAccount.isPending}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M6 7h12M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M9 10v7M15 10v7M6.5 7h11A1.5 1.5 0 0 1 19 8.5v9A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-9A1.5 1.5 0 0 1 6.5 7Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ConnectAccountModal({ visible, onClose, formState, setFormState, onSubmit, isSubmitting, error }) {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Connect New Cloud Account</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="account_name">
                Account Name <span className="required">*</span>
              </label>
              <input
                id="account_name"
                className="form-input"
                value={formState.account_name}
                onChange={(e) => setFormState((prev) => ({ ...prev, account_name: e.target.value }))}
                placeholder="Production AWS"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="provider">
                Cloud Provider <span className="required">*</span>
              </label>
              <select
                id="provider"
                className="form-select"
                value={formState.provider}
                onChange={(e) => setFormState((prev) => ({ ...prev, provider: e.target.value, access_method: "" }))}
                required
              >
                {providerOptions.slice(1).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="subscription_id">
                Account/Subscription ID <span className="required">*</span>
              </label>
              <input
                id="subscription_id"
                className="form-input"
                value={formState.subscription_id}
                onChange={(e) => setFormState((prev) => ({ ...prev, subscription_id: e.target.value }))}
                placeholder="123456789012"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="access_method">
                Access Method <span className="required">*</span>
              </label>
              <select
                id="access_method"
                className="form-select"
                value={formState.access_method}
                onChange={(e) => setFormState((prev) => ({ ...prev, access_method: e.target.value }))}
                required
              >
                <option value="">Select method</option>
                {accessMethodOptions[formState.provider]?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="credential">
                {getCredentialFieldLabel(formState.provider)}
              </label>
              <input
                id="credential"
                className="form-input"
                value={formState.credential}
                onChange={(e) => setFormState((prev) => ({ ...prev, credential: e.target.value }))}
                placeholder={getCredentialPlaceholder(formState.provider)}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="service_email">
                Service Account Email
              </label>
              <input
                id="service_email"
                className="form-input"
                value={formState.service_email}
                onChange={(e) => setFormState((prev) => ({ ...prev, service_email: e.target.value }))}
                placeholder="service-account@example.com"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="tenant_id">
                Organization/Tenant ID
              </label>
              <input
                id="tenant_id"
                className="form-input"
                value={formState.tenant_id}
                onChange={(e) => setFormState((prev) => ({ ...prev, tenant_id: e.target.value }))}
                placeholder="o-1234567890"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sync_frequency">
                Sync Frequency
              </label>
              <select
                id="sync_frequency"
                className="form-select"
                value={formState.sync_frequency}
                onChange={(e) => setFormState((prev) => ({ ...prev, sync_frequency: e.target.value }))}
              >
                {syncFrequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={formState.auto_sync}
                  onChange={(e) => setFormState((prev) => ({ ...prev, auto_sync: e.target.checked }))}
                />
                <span>Enable automatic sync</span>
              </label>
            </div>

            <div className="form-group full-width">
              <div className="info-box">
                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.2" />
                  <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <strong>Default: Daily sync</strong> - Policies and org structure will be synced once per day. You can also trigger manual syncs anytime.
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error?.message ?? "Unable to connect account. Please try again."}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Connecting…" : "Connect Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">
        <span>{icon}</span>
      </div>
      <div className="stat-card__content">
        <p className="stat-card__title">{title}</p>
        <p className="stat-card__value">{value}</p>
        <p className="stat-card__description">{description}</p>
      </div>
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
  if (!visible) return null;

  return (
    <div className="provisioning-overlay">
      <div className="provisioning-panel">
        <div className="provisioning-panel__header">
          <div className="provisioning-panel__info">
            <h3 className="provisioning-panel__title">Provisioning {account?.display_name}</h3>
            <p className="provisioning-panel__description">Follow the automated onboarding pipeline.</p>
          </div>
          <button type="button" className="icon-button icon-button--ghost" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6 18 18M6 18 18 6" />
            </svg>
          </button>
        </div>
        
        <ol className="provisioning-steps">
          {steps.map((step, index) => {
            const status = index < currentStep ? "done" : index === currentStep ? "active" : "pending";
            return (
              <li key={step.title} className={`provisioning-step provisioning-step--${status}`}>
                <div className="provisioning-step__marker">
                  {status === "done" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : (
                    <span className="provisioning-step__number">{index + 1}</span>
                  )}
                </div>
                <div className="provisioning-step__content">
                  <strong className="provisioning-step__title">{step.title}</strong>
                  <p className="provisioning-step__description">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
        
        {currentStep >= steps.length && (
          <div className="provisioning-panel__footer">
            <button className="button button--primary" type="button" onClick={onClose}>
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
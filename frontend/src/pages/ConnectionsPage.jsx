import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAccounts, useCreateAccount, useDeleteAccount, useEvaluations, usePolicies, useSyncAccount } from "../services/hooks";
import { getProviderIcon } from "../components/CloudProviderIcons";
import { ViewButton, EditButton, DeleteButton, SyncButton, ActionButtonGroup } from "../components/ActionButtons";

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
      onSuccess: () => {
        setFormState({ 
          provider: "aws", 
          external_id: "", 
          display_name: "", 
          role_arn: "", 
          tenant_id: "", 
          region: "" 
        });
        setShowAddForm(false);
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
      <div className="page-header">
        <div>
          <h1>Cloud Connections</h1>
          <p>Manage cloud provider integrations and monitor their status.</p>
        </div>
        <div className="page-header__actions">
          <button className="button" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add provider"}
          </button>
        </div>
      </div>

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
                    {getProviderIcon(account.provider, 32)}
                  </div>
                  <div className="connection-card__meta">
                    <strong>{account.name}</strong>
                    <span>
                      Account: {account.accountId} · {account.status === 'connected' ? 'Connected' : 'Pending'} {new Date(account.lastSync).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="connection-card__stats">
                    <span>
                      <strong>{account.policies || policyCount}</strong> policies
                    </span>
                    <span>
                      <strong>{account.resources || resourceCount}</strong> resources
                    </span>
                  </div>
                  <StatusChip status={account.status} />
                  <div className="connection-card__actions">
                    <ActionButtonGroup>
                      <SyncButton 
                        onClick={() => handleSync(account.id)}
                        isLoading={syncAccount.isPending}
                      />
                      <ViewButton 
                        onClick={() => navigate(`/services/${account.provider}`, { state: { account } })}
                      />
                      <EditButton 
                        onClick={() => handleSettings(account)}
                      />
                      <DeleteButton 
                        onClick={() => handleDelete(account.id)}
                      />
                    </ActionButtonGroup>
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

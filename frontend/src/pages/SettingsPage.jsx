import { useState } from "react";

import PageHero from "../components/PageHero";
import settingsIllustration from "../assets/illustrations/settings-hero.svg";

const tabs = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "team", label: "Team" },
  { id: "api", label: "API & Integration" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@company.com",
    company: "Acme Corporation",
    timezone: "Eastern Time (UTC-5)",
    dateFormat: "MM/DD/YYYY",
    reportFrequency: "Weekly",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
    // Clear save message when user makes changes
    if (saveMessage) setSaveMessage("");
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, this would be an API call:
      // await apiClient.put('/users/profile', profile);

      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <PageHero
        title="Settings"
        subtitle="Manage your account, team, and platform preferences."
        badge="Workspace preferences"
        illustration={settingsIllustration}
      />

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "account" && (
        <section className="card settings-section">
          <div>
            <h2>Profile information</h2>
            <p className="card__meta">Update your personal information and account details.</p>
          </div>
          <div className="form-grid">
            <div className="form__group">
              <label className="form__label" htmlFor="firstName">
                First name
              </label>
              <input id="firstName" className="form__input" value={profile.firstName} onChange={handleChange("firstName")} />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="lastName">
                Last name
              </label>
              <input id="lastName" className="form__input" value={profile.lastName} onChange={handleChange("lastName")} />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="email">
                Email address
              </label>
              <input id="email" className="form__input" value={profile.email} onChange={handleChange("email")} />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="company">
                Company
              </label>
              <input id="company" className="form__input" value={profile.company} onChange={handleChange("company")} />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="timezone">
                Timezone
              </label>
              <select id="timezone" className="form__select" value={profile.timezone} onChange={handleChange("timezone")}>
                <option value="Eastern Time (UTC-5)">Eastern Time (UTC-5)</option>
                <option value="Central Time (UTC-6)">Central Time (UTC-6)</option>
                <option value="Pacific Time (UTC-8)">Pacific Time (UTC-8)</option>
              </select>
            </div>
          </div>
          <div>
            <h3>Account preferences</h3>
            <p className="card__meta">Configure reporting and dashboard defaults.</p>
          </div>
          <div className="form-grid">
            <div className="form__group">
              <label className="form__label" htmlFor="dateFormat">
                Date format
              </label>
              <select id="dateFormat" className="form__select" value={profile.dateFormat} onChange={handleChange("dateFormat")}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="reportFrequency">
                Default report frequency
              </label>
              <select
                id="reportFrequency"
                className="form__select"
                value={profile.reportFrequency}
                onChange={handleChange("reportFrequency")}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="settings-footer">
            <button
              className="button"
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            {saveMessage && (
              <div
                style={{
                  marginLeft: "12px",
                  color: saveMessage.includes("Failed") ? "#ef4444" : "#22c55e",
                  fontSize: "0.875rem"
                }}
              >
                {saveMessage}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "notifications" && (
        <PlaceholderCard
          title="Notification settings"
          body="Configure alerting preferences for email, chat, and incident channels."
        />
      )}
      {activeTab === "security" && (
        <PlaceholderCard title="Security controls" body="Manage MFA requirements, session lifetime, and device trust." />
      )}
      {activeTab === "team" && (
        <PlaceholderCard title="Team management" body="Invite teammates, assign roles, and manage SSO mappings." />
      )}
      {activeTab === "api" && (
        <PlaceholderCard title="API & integrations" body="Generate API tokens and manage webhook destinations." />
      )}
    </div>
  );
}

function PlaceholderCard({ title, body }) {
  return (
    <section className="card settings-section">
      <div>
        <h2>{title}</h2>
        <p className="card__meta">{body}</p>
      </div>
      <div className="chart-placeholder">Coming soon</div>
    </section>
  );
}

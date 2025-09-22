import { useState, useEffect } from "react";

import PageHero from "../components/PageHero";
import settingsIllustration from "../assets/illustrations/settings-hero.svg";
import { useUserProfile, useUpdateUserProfile } from "../services/hooks";

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
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    reportFrequency: "Weekly",
  });
  const [saveMessage, setSaveMessage] = useState("");

  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();

  // Update local profile state when user data loads
  useEffect(() => {
    if (userProfile) {
      setProfile({
        firstName: userProfile.first_name || "",
        lastName: userProfile.last_name || "",
        email: userProfile.email || "",
        company: userProfile.company || "",
        timezone: userProfile.timezone || "UTC",
        dateFormat: userProfile.date_format || "MM/DD/YYYY",
        reportFrequency: userProfile.report_frequency || "Weekly",
      });
    }
  }, [userProfile]);

  const handleChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
    // Clear save message when user makes changes
    if (saveMessage) setSaveMessage("");
  };

  const handleSaveChanges = async () => {
    try {
      const updateData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        company: profile.company,
        timezone: profile.timezone,
        date_format: profile.dateFormat,
        report_frequency: profile.reportFrequency,
        // Update full_name from first and last name
        full_name: `${profile.firstName} ${profile.lastName}`.trim() || userProfile?.full_name
      };

      await updateProfileMutation.mutateAsync(updateData);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to save settings. Please try again.");
      console.error("Profile update error:", error);
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
            <h2>Profile Information</h2>
            <p className="card__meta">Update your personal information and account details.</p>
          </div>
          {profileLoading ? (
            <div>Loading profile...</div>
          ) : profileError ? (
            <div style={{ color: "var(--danger-strong)", padding: "16px", borderRadius: "8px", background: "var(--danger-soft)" }}>
              Error loading profile: {profileError.message || "Failed to load user data. Please try refreshing or logging in again."}
            </div>
          ) : (
            <>
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
                  <input id="email" className="form__input" value={profile.email} disabled />
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
                    <option value="UTC">UTC</option>
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
            </>
          )}
          <div className="settings-footer">
            <button
              className="button"
              type="button"
              onClick={handleSaveChanges}
              disabled={updateProfileMutation.isPending || profileLoading}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
            </button>
            <button
              className="button"
              type="button"
              style={{ marginLeft: "12px", backgroundColor: "#f59e0b" }}
              onClick={async () => {
                try {
                  const response = await fetch('https://cloudproject-production-55e3.up.railway.app/api/auth/migrate-profiles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  setSaveMessage("Profile data migrated! Refreshing...");
                  setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                  setSaveMessage("Migration failed. Try again later.");
                  console.error('Migration error:', error);
                }
              }}
            >
              Fix Profile Data
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

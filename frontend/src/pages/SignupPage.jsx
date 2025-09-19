import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthHero from "../components/AuthHero";
import { useAuth } from "../context/AuthContext";
import { useSignup } from "../services/hooks";
import "../modern-auth.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1400&q=80";

export default function SignupPage() {
  const { login: setAuthToken } = useAuth();
  const signup = useSignup();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedFirst = formState.firstName.trim();
    const trimmedLast = formState.lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    if (!fullName) {
      setErrorMessage("Please provide your name so we can personalize the workspace.");
      return;
    }
    if (formState.password.trim().length < 6) {
      setErrorMessage("Use a password with at least 6 characters.");
      return;
    }

    signup.mutate(
      { full_name: fullName, email: formState.email.trim(), password: formState.password },
      {
        onSuccess: (response) => {
          const token = response?.token ?? "demo-token";
          setAuthToken(token);
          navigate("/", { replace: true });
        },
        onError: (err) => {
          const detail = extractErrorMessage(err);
          setErrorMessage(detail);
        },
      }
    );
  };

  return (
    <div className="auth-layout auth-layout--split auth-layout--reverse">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            🛡️
          </div>
          <div className="auth-brand-text">
            <strong>Cloud Guard</strong>
            <span>Provision multi-cloud guardrails in minutes</span>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-card__header">
            <h1>Create your workspace</h1>
            <p>Invite your security engineers, connect accounts, and launch best-practice guardrails instantly.</p>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div
              className="form__group"
              style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
            >
              <div>
                <label className="form__label" htmlFor="first_name">
                  First name
                </label>
                <input
                  id="first_name"
                  className="form__input"
                  placeholder="Jordan"
                  value={formState.firstName}
                  onChange={handleChange("firstName")}
                  required
                />
              </div>
              <div>
                <label className="form__label" htmlFor="last_name">
                  Last name
                </label>
                <input
                  id="last_name"
                  className="form__input"
                  placeholder="Rivera"
                  value={formState.lastName}
                  onChange={handleChange("lastName")}
                  required
                />
              </div>
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="company">
                Company
              </label>
              <input
                id="company"
                className="form__input"
                placeholder="Acme Cloud Security"
                value={formState.company}
                onChange={handleChange("company")}
              />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="signup_email">
                Work email
              </label>
              <input
                id="signup_email"
                type="email"
                className="form__input"
                placeholder="security.lead@company.com"
                value={formState.email}
                onChange={handleChange("email")}
                required
              />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="signup_password">
                Password
              </label>
              <div className="input-with-toggle">
                <input
                  id="signup_password"
                  type={showPassword ? "text" : "password"}
                  className="form__input"
                  placeholder="Create a strong password"
                  value={formState.password}
                  onChange={handleChange("password")}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-card__link"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button className="button" type="submit" disabled={signup.isPending}>
              {signup.isPending ? "Creating workspace..." : "Create workspace"}
            </button>
            {errorMessage ? (
              <div style={{ color: "#f87171", fontSize: "0.85rem", whiteSpace: "pre-line" }}>{errorMessage}</div>
            ) : null}
          </form>
          <div className="auth-card__footer">
            <span>
              Already onboarded? <Link className="auth-card__link" to="/login">Sign in</Link>
            </span>
            <span>By continuing you agree to our security policies and acceptable use standards.</span>
            <span>Unlimited integrations • Automated evidence capture • Executive-ready analytics</span>
          </div>
        </div>
      </section>
      <AuthHero
        align="left"
        imageUrl={HERO_IMAGE}
        eyebrow="Cloud Guard platform"
        title="Launch secure workspaces in minutes"
        subtitle="Onboard teams with guided guardrails, policy benchmarks, and automated evidence collection."
        bullets={[
          "Multi-cloud policy benchmarks",
          "Real-time compliance monitoring",
          "Automated evidence capture",
        ]}
      />
    </div>
  );
}

function extractErrorMessage(error) {
  const detail = error?.body?.detail ?? error?.message ?? "Registration failed";
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg ?? JSON.stringify(item))
      .join("\n");
  }
  if (typeof detail === "object" && detail !== null) {
    return detail.msg ?? JSON.stringify(detail);
  }
  return detail;
}

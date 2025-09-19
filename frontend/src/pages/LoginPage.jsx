import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthHero from "../components/AuthHero";
import { useAuth } from "../context/AuthContext";
import { useLogin } from "../services/hooks";
import { runAppTransition } from "../lib/transitions";
import "../modern-auth.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1667372283496-893f0b1e7c16?auto=format&fit=crop&w=1400&q=80";

export default function LoginPage() {
  const { login: setAuthToken } = useAuth();
  const login = useLogin();
  const location = useLocation();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (formState.password.trim().length < 6) {
      setErrorMessage("Use a password with at least 6 characters.");
      return;
    }

    login.mutate(
      { email: formState.email.trim(), password: formState.password },
      {
        onSuccess: (response) => {
          const token = response?.token ?? "demo-token";
          setAuthToken(token);
          const redirectTo = location.state?.from?.pathname ?? "/";
          runAppTransition("enter", () => navigate(redirectTo, { replace: true }));
        },
        onError: (err) => {
          const detail = extractErrorMessage(err);
          setErrorMessage(detail);
        },
      }
    );
  };

  return (
    <div className="auth-layout auth-layout--split">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            🛡️
          </div>
          <div className="auth-brand-text">
            <strong>Cloud Guard</strong>
            <span>Cloud security posture management platform</span>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-card__header">
            <h1>Welcome back</h1>
            <p>Sign in to orchestrate remediation and compliance intelligence across every cloud perimeter.</p>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__group">
              <label className="form__label" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                type="email"
                className="form__input"
                placeholder="admin@company.com"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="form__group">
              <label className="form__label" htmlFor="password">
                Password
              </label>
              <div className="input-with-toggle">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form__input"
                  placeholder="Enter your password"
                  value={formState.password}
                  onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
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
            <div className="auth-card__actions">
              <label className="auth-card__checkbox">
                <input
                  type="checkbox"
                  checked={formState.remember}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, remember: event.target.checked }))
                  }
                />
                Remember me
              </label>
              <button type="button" className="auth-card__link">
                Forgot password?
              </button>
            </div>
            <button className="button" type="submit" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign in"}
            </button>
            {errorMessage ? (
              <div style={{ color: "#f87171", fontSize: "0.85rem", whiteSpace: "pre-line" }}>{errorMessage}</div>
            ) : null}
          </form>
          <div className="auth-card__footer">
            <span>
              Need an account? <Link className="auth-card__link" to="/signup">Create one</Link>
            </span>
            <span>Enterprise-grade security for your cloud infrastructure.</span>
            <span>SOC 2 Type II  |  ISO 27001  |  GDPR-ready controls</span>
          </div>
        </div>
      </section>
      <AuthHero
        align="right"
        imageUrl={HERO_IMAGE}
        eyebrow="Unified cloud insights"
        title="Stay ahead of every cloud risk"
        subtitle="Correlate AWS, Azure, and GCP evidence with guided runbooks and proactive automation."
        bullets={[
          "Live incident heatmaps and timelines",
          "Automated compliance gap analysis",
          "Role-based workflows for SecOps teams",
        ]}
      />
    </div>
  );
}

function extractErrorMessage(error) {
  const detail = error?.body?.detail ?? error?.message ?? "Unable to sign in";
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

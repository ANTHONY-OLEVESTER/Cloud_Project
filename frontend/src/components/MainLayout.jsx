import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import ThemeSwitcher from "./ThemeSwitcher";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13.25A2.25 2.25 0 0 1 5.25 11h4.5A2.25 2.25 0 0 1 12 13.25v5.5A2.25 2.25 0 0 1 9.75 21h-4.5A2.25 2.25 0 0 1 3 18.75v-5.5Zm9-8.5A2.25 2.25 0 0 1 14.25 2h4.5A2.25 2.25 0 0 1 21 4.75v3.5A2.25 2.25 0 0 1 18.75 10h-4.5A2.25 2.25 0 0 1 12 7.75v-3Zm0 8.5A2.25 2.25 0 0 1 14.25 11h4.5A2.25 2.25 0 0 1 21 13.25v5.5A2.25 2.25 0 0 1 18.75 21h-4.5A2.25 2.25 0 0 1 12 18.75v-5.5ZM3 4.75A2.75 2.75 0 0 1 5.75 2h3.5A2.75 2.75 0 0 1 12 4.75v3.5A2.75 2.75 0 0 1 9.25 11h-3.5A2.75 2.75 0 0 1 3 8.25v-3.5Z" />
      </svg>
    ),
  },
  {
    to: "/connections",
    label: "Cloud Connections",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4a6 6 0 0 0-6 6v.25a4.5 4.5 0 0 0 .75 8.91h10.5a4.5 4.5 0 0 0 .75-8.91V10a6 6 0 0 0-6-6Zm-4.5 9.5a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H8.25a.75.75 0 0 1-.75-.75Zm3 3a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H11.25a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
  },
  {
    to: "/policies",
    label: "Policies",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3.75A2.75 2.75 0 0 1 7.75 1h8.5A2.75 2.75 0 0 1 19 3.75V20.5a.75.75 0 0 1-1.14.63L12 17.14l-5.86 3.99A.75.75 0 0 1 5 20.5V3.75ZM8.5 7a1 1 0 0 0 0 2h7a1 1 0 1 0 0-2h-7Zm0 4.5a1 1 0 1 0 0 2h7a1 1 0 1 0 0-2h-7Z" />
      </svg>
    ),
  },
  {
    to: "/reports",
    label: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.75 3A2.75 2.75 0 0 0 4 5.75v12.5A2.75 2.75 0 0 0 6.75 21h10.5A2.75 2.75 0 0 0 20 18.25V8.5L14.5 3h-7.75Zm6.75.94 3.56 3.56h-2.06A1.5 1.5 0 0 1 13.5 6V3.94ZM8.5 11a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2h-3Zm0 3.5a1 1 0 1 1 0-2h7a1 1 0 1 1 0 2h-7Zm0 3.5a1 1 0 1 1 0-2h5a1 1 0 1 1 0 2h-5Z" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.21 2.25c.46-1.5 2.54-1.5 3 0l.46 1.5c.18.57.75.94 1.35.84l1.53-.25c1.53-.25 2.5 1.63 1.45 2.78l-1.06 1.16c-.4.44-.4 1.11 0 1.55l1.06 1.16c1.05 1.15.08 3.03-1.45 2.78l-1.53-.25c-.6-.1-1.17.27-1.35.84l-.46 1.5c-.46 1.5-2.54 1.5-3 0l-.46-1.5c-.18-.57-.75-.94-1.35-.84l-1.53.25c-1.53.25-2.5-1.63-1.45-2.78l1.06-1.16c.4-.44.4-1.11 0-1.55L5.42 7.12c-1.05-1.15-.08-3.03 1.45-2.78l1.53.25c.6.1 1.17-.27 1.35-.84l.46-1.5ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      </svg>
    ),
  },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">🛡️</div>
          <div>
            <span className="sidebar__logo-name">SecureCloud</span>
            <span className="sidebar__badge">Enterprise</span>
          </div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              end={item.to === "/"}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__status">
          <span className="status-dot status-dot--online" />
          <div>
            <strong>System Status</strong>
            <span>All systems operational</span>
          </div>
        </div>
        <button className="button sidebar__logout" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <form className="topbar__search" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 3.9 9.4l3.57 3.56a1 1 0 0 0 1.42-1.42l-3.56-3.57A5.5 5.5 0 0 0 10.5 5Z" />
            </svg>
            <input placeholder="Search policies, alerts..." aria-label="Search" />
          </form>
          <div className="topbar__right">
            <ThemeSwitcher />
            <button className="icon-button" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a4 4 0 0 1 4 4v1.26c1.73.83 3 2.6 3 4.74v4l1.2 1.6c.52.7.02 1.66-.84 1.66H4.64c-.86 0-1.36-.96-.84-1.66L5 16v-4c0-2.14 1.27-3.9 3-4.74V6a4 4 0 0 1 4-4Zm0 20a2.5 2.5 0 0 1-2.45-2h4.9A2.5 2.5 0 0 1 12 22Z" />
              </svg>
              <span className="icon-button__badge">3</span>
            </button>
            <div className="topbar__user">
              <div className="topbar__avatar">A</div>
              <div>
                <strong>Admin User</strong>
                <span>Security Ops</span>
              </div>
            </div>
          </div>
        </header>
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

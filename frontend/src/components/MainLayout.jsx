import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  CloudCog,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  RefreshCcw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useRouteTransition } from "../context/TransitionContext";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../services/hooks";
import ThemeSwitcher from "./ThemeSwitcher";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/connections", label: "Cloud Connections", icon: CloudCog },
  { to: "/policies", label: "Policies", icon: ShieldCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const notificationIcons = {
  policy_violation: AlertTriangle,
  account_sync: RefreshCcw,
  build_complete: CheckCircle2,
  service_provision: Sparkles,
  broadcast: Megaphone,
};

const fallbackRoutes = {
  policy_violation: "/policies",
  account_sync: "/connections",
  build_complete: "/",
  service_provision: "/connections",
  broadcast: "/reports",
};

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";
  const delta = Date.now() - timestamp;
  if (delta < 60_000) return "Just now";
  if (delta < 3_600_000) {
    const mins = Math.round(delta / 60_000);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (delta < 86_400_000) {
    const hours = Math.round(delta / 3_600_000);
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(delta / 86_400_000);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { startTransition } = useRouteTransition();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications = [] } = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.is_read),
    [notifications]
  );
  const unreadCount = unreadNotifications.length;
  const displayedNotifications = unreadNotifications.slice(0, 5);

  useEffect(() => {
    setSidebarOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleLogout = () => {
    startTransition("backward", () => {
      logout();
      navigate("/login", { replace: true });
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markNotificationRead.mutate(notification.id);
    }
    setShowNotifications(false);

    const destination = notification.action_path ?? fallbackRoutes[notification.type];
    if (destination) {
      startTransition("forward", () => navigate(destination));
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__meta">
          <button
            className="icon-button sidebar__close"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <div>
              <span className="sidebar__logo-name">SecureCloud</span>
              <span className="sidebar__badge">Enterprise</span>
            </div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                }
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="sidebar__link-icon" size={20} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar__status">
          <span className="status-dot status-dot--online" />
          <div>
            <strong>System Status</strong>
            <span>All systems operational</span>
          </div>
        </div>
      </aside>
      {isSidebarOpen && (
        <div
          className="sidebar__backdrop"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="icon-button topbar__menu"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <form className="topbar__search" role="search">
              <Search size={18} aria-hidden="true" />
              <input placeholder="Search policies, alerts..." aria-label="Search" />
            </form>
          </div>
          <div className="topbar__right">
            <ThemeSwitcher />
            <div className="notification-container">
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && <span className="icon-button__badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown__header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        className="text-button"
                        onClick={() => markAllRead.mutate()}
                        type="button"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-dropdown__list">
                    {displayedNotifications.length === 0 ? (
                      <div className="notification-item notification-item--empty">
                        You&apos;re all caught up.
                      </div>
                    ) : (
                      displayedNotifications.map((notification) => {
                        const Icon = notificationIcons[notification.type] ?? Megaphone;
                        return (
                          <button
                            key={notification.id}
                            className="notification-item notification-item--button notification-item--unread"
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-item__icon" aria-hidden="true">
                              <Icon size={18} strokeWidth={1.8} />
                            </div>
                            <div className="notification-item__content">
                              <div className="notification-item__title">{notification.title}</div>
                              <div className="notification-item__message">{notification.message}</div>
                              <div className="notification-item__time">
                                {formatRelativeTime(notification.created_at)}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {unreadNotifications.length > 5 && (
                    <div className="notification-dropdown__footer">
                      <span>{unreadNotifications.length - 5}+ more alerts</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="topbar__user">
              <div className="topbar__avatar">A</div>
              <div>
                <strong>Admin User</strong>
                <span>Security Ops</span>
              </div>
            </div>
            <button
              className="button topbar__logout"
              type="button"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="topbar__logout-text">Sign out</span>
            </button>
          </div>
        </header>
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

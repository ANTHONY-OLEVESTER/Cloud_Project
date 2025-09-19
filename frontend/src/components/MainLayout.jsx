import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../services/hooks";
import ThemeSwitcher from "./ThemeSwitcher";
import { runAppTransition } from "../lib/transitions";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    to: "/connections",
    label: "Cloud Connections",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6.5 17.5h11a3.5 3.5 0 0 0 .4-6.97 5.5 5.5 0 0 0-10.76-1.3A3.5 3.5 0 0 0 6.5 17.5Z" />
        <circle cx="9" cy="18.5" r="1.3" />
        <circle cx="15" cy="18.5" r="1.3" />
        <path d="M9 18.5v2M15 18.5v2" />
      </svg>
    ),
  },
  {
    to: "/policies",
    label: "Policies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 5 6v6.6c0 3.6 2.6 6.9 7 8.4 4.4-1.5 7-4.8 7-8.4V6l-7-3Z" />
        <path d="m9.5 12.5 1.8 1.8 3.4-3.6" />
      </svg>
    ),
  },
  {
    to: "/reports",
    label: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5h16" />
        <path d="M8 17V9.5" />
        <path d="M12 17v-6" />
        <path d="M16 17v-4" />
        <path d="m8.5 11.5 3.5-3.5 3.5 3.5 2.8-2.8" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.594 3.94c.09-.54.56-.94 1.11-.94h2.59c.55 0 1.02.4 1.11.94l.26 1.5c.04.19.16.36.33.47l1.3.75c.47.27.62.86.33 1.3l-.9 1.3a1.1 1.1 0 0 0-.12.58l.3 1.52a1.12 1.12 0 0 1-.55 1.2l-1.35.78c-.18.11-.31.27-.41.43l-.53 1.32c-.17.42-.58.7-1.04.7h-1.5c-.46 0-.87-.28-1.04-.7l-.53-1.32a1.1 1.1 0 0 0-.41-.43l-1.35-.78a1.12 1.12 0 0 1-.55-1.2l.3-1.52a1.1 1.1 0 0 0-.12-.58l-.9-1.3a1.12 1.12 0 0 1 .33-1.3l1.3-.75c.17-.1.29-.27.33-.47l.26-1.5Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const notificationIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a4 4 0 0 1 4 4v1.1a6 6 0 0 1 2.6 4.9V16l1.2 1.6c.34.46 0 1.1-.57 1.1H4.77c-.57 0-.91-.64-.57-1.1L5.4 16v-3a6 6 0 0 1 2.6-4.9V7a4 4 0 0 1 4-4Z" />
    <path d="M9.5 19.5A2.5 2.5 0 0 0 12 22a2.5 2.5 0 0 0 2.5-2.5" />
  </svg>
);

const logoutIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15.75 6.75V5A2.25 2.25 0 0 0 13.5 2.75h-6A2.25 2.25 0 0 0 5.25 5v14A2.25 2.25 0 0 0 7.5 21.25h6a2.25 2.25 0 0 0 2.25-2.25v-1.75" />
    <path d="m18 8.75 3.25 3.25L18 15.25" />
    <path d="M9.75 12h11.25" />
  </svg>
);

const menuIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7.5h16M4 12h16M4 16.5h16" />
  </svg>
);

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 6 18 18M6 18 18 6" />
  </svg>
);

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(new Set());

  const { data: notifications = [] } = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setDismissedNotificationIds((prev) => {
      const next = new Set();
      notifications.forEach((notification) => {
        if (prev.has(notification.id) && notification.is_read) {
          next.add(notification.id);
        }
      });
      return next;
    });
  }, [notifications]);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => !dismissedNotificationIds.has(notification.id)),
    [notifications, dismissedNotificationIds]
  );

  const unreadCount = visibleNotifications.filter((notification) => !notification.is_read).length;

  const handleLogout = () => {
    runAppTransition("exit", () => {
      logout();
      navigate("/login", { replace: true });
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markNotificationRead.mutate(notification.id);
    }

    setDismissedNotificationIds((prev) => new Set(prev).add(notification.id));
    setShowNotifications(false);

    if (notification.type === "policy_violation") {
      navigate("/policies");
    } else if (notification.type === "account_sync" || notification.type === "provisioning") {
      navigate("/connections");
    } else if (notification.type === "build_complete") {
      navigate("/reports");
    }
  };

  return (
    <div className={`app-shell ${sidebarOpen ? "app-shell--sidebar-open" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">🛡️</div>
          <div className="sidebar__brand">
            <span className="sidebar__logo-name">SecureCloud</span>
            <span className="sidebar__badge">Enterprise</span>
          </div>
          <button
            type="button"
            className="sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            {closeIcon}
          </button>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
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
        <div className="sidebar__footer">
          <ThemeSwitcher />
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Hide navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-area">
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="topbar__menu"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {menuIcon}
            </button>
            <form className="topbar__search" role="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="m16.5 16.5 3 3" />
              </svg>
              <input placeholder="Search policies, alerts..." aria-label="Search" />
            </form>
          </div>
          <div className="topbar__right">
            <div className="notification-container">
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                {notificationIcon}
                {unreadCount > 0 && <span className="icon-button__badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown__header">
                    <h3>Notifications</h3>
                    {visibleNotifications.length > 0 && (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => markAllRead.mutate()}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-dropdown__list">
                    {visibleNotifications.length === 0 ? (
                      <div className="notification-item notification-item--empty">No notifications</div>
                    ) : (
                      visibleNotifications.slice(0, 6).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`notification-item ${!notification.is_read ? "notification-item--unread" : ""}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-item__icon">
                            {notification.type === "policy_violation" && "⚠️"}
                            {notification.type === "account_sync" && "🔄"}
                            {notification.type === "build_complete" && "📈"}
                            {notification.type === "provisioning" && "🚀"}
                            {!["policy_violation", "account_sync", "build_complete", "provisioning"].includes(notification.type) && "📢"}
                          </div>
                          <div className="notification-item__content">
                            <div className="notification-item__title">{notification.title}</div>
                            <div className="notification-item__message">{notification.message}</div>
                            <div className="notification-item__time">
                              {new Date(notification.created_at ?? Date.now()).toLocaleString()}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
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
            <button className="button topbar__logout" type="button" onClick={handleLogout} title="Sign out">
              {logoutIcon}
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

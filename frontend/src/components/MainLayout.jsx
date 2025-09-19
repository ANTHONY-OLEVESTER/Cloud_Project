import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "../services/hooks";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: notifications = [] } = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markNotificationRead.mutate(notification.id);
    }
    setShowNotifications(false);
    
    // Navigate based on notification type
    if (notification.type === 'policy_violation') {
      navigate('/policies');
    } else if (notification.type === 'account_sync') {
      navigate('/connections');
    } else if (notification.type === 'build_complete') {
      navigate('/');
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    // Simple search logic - navigate to relevant pages based on search terms
    const query = searchQuery.toLowerCase();
    
    if (query.includes('aws') || query.includes('azure') || query.includes('gcp') || query.includes('provider') || query.includes('connection')) {
      navigate('/connections');
    } else if (query.includes('policy') || query.includes('policies') || query.includes('compliance') || query.includes('rule')) {
      navigate('/policies');
    } else if (query.includes('report') || query.includes('analytics') || query.includes('dashboard') || query.includes('score')) {
      navigate('/reports');
    } else if (query.includes('setting') || query.includes('config') || query.includes('account') || query.includes('profile')) {
      navigate('/settings');
    } else {
      // Default to dashboard for general searches
      navigate('/');
    }
    
    // Clear search after navigation
    setSearchQuery("");
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
      </aside>
      <div className="main-area">
        <header className="topbar">
          <form className="topbar__search" role="search" onSubmit={handleSearch}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 3.9 9.4l3.57 3.56a1 1 0 0 0 1.42-1.42l-3.56-3.57A5.5 5.5 0 0 0 10.5 5Z" />
            </svg>
            <input 
              placeholder="Search policies, alerts, providers..." 
              aria-label="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="topbar__right">
            <ThemeSwitcher />
            <div className="notification-container">
              <button 
                className="icon-button" 
                type="button" 
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a4 4 0 0 1 4 4v1.26c1.73.83 3 2.6 3 4.74v4l1.2 1.6c.52.7.02 1.66-.84 1.66H4.64c-.86 0-1.36-.96-.84-1.66L5 16v-4c0-2.14 1.27-3.9 3-4.74V6a4 4 0 0 1 4-4Zm0 20a2.5 2.5 0 0 1-2.45-2h4.9A2.5 2.5 0 0 1 12 22Z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="icon-button__badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown__header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        className="text-button"
                        onClick={() => markAllRead.mutate()}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-dropdown__list">
                    {notifications.length === 0 ? (
                      <div className="notification-item notification-item--empty">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.is_read ? 'notification-item--unread' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-item__icon">
                            {notification.type === 'policy_violation' && '⚠️'}
                            {notification.type === 'account_sync' && '🔄'}
                            {notification.type === 'build_complete' && '✅'}
                            {!['policy_violation', 'account_sync', 'build_complete'].includes(notification.type) && '📢'}
                          </div>
                          <div className="notification-item__content">
                            <div className="notification-item__title">{notification.title}</div>
                            <div className="notification-item__message">{notification.message}</div>
                            <div className="notification-item__time">
                              {new Date(notification.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <div className="notification-dropdown__footer">
                      <button className="text-button">View all notifications</button>
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
            <button className="button topbar__logout" type="button" onClick={handleLogout} title="Sign out">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 17l5-5-5-5v3H9v4h7v3zM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z" />
              </svg>
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

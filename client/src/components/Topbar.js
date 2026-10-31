import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings as SettingsIcon,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  RefreshCw,
  FileText,
  CreditCard,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import api from "../services/api";
import "./Topbar.css";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "customer":
      return <Users size={16} />;
    case "subscription":
      return <RefreshCw size={16} />;
    case "invoice":
      return <FileText size={16} />;
    case "payment":
      return <CreditCard size={16} />;
    default:
      return <Bell size={16} />;
  }
};

const getSearchPlaceholder = (pathname) => {
  switch (pathname) {
    case "/":
      return "Search dashboard records & summaries...";
    case "/customers":
      return "Search customers by name, email, phone, company...";
    case "/products":
      return "Search products by name, description, category...";
    case "/plans":
      return "Search plans by name, interval, price...";
    case "/subscriptions":
      return "Search subscriptions by customer, plan, status...";
    case "/invoices":
      return "Search invoices by number, customer, status, amount...";
    case "/payments":
      return "Search payments by transaction, customer, method...";
    case "/notifications":
      return "Search notification titles, messages, categories...";
    case "/staff":
      return "Search staff by name, email, role...";
    case "/settings":
    case "/profile":
      return "Search profile & account settings...";
    default:
      return "Search current page...";
  }
};

function Topbar() {
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  const searchInputRef = useRef(null);

  // Profile Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notification Dropdown state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const notifRef = useRef(null);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  // Global keyboard shortcuts: ⌘K / Ctrl+K and Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current || searchTerm) {
          clearSearch();
          searchInputRef.current?.blur();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [clearSearch, searchTerm]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      if (res.data?.success) {
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Non-blocking background fetch error
    }
  }, []);

  // Fetch full notification list
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifError(null);
    try {
      const res = await api.get("/notifications?limit=15");
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      } else {
        setNotifError("Unable to load notifications");
      }
    } catch (err) {
      setNotifError(err.message || "Failed to load notifications");
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  // Periodic polling for unread count while authenticated
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Handle outside click & Escape key for both dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleNotifDropdown = () => {
    if (!notifOpen) {
      setNotifOpen(true);
      setDropdownOpen(false);
      fetchNotifications();
    } else {
      setNotifOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err.message);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read:", err.message);
      }
    }

    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <header className="topbar">
      <div
        className="topbar-search"
        onClick={() => searchInputRef.current?.focus()}
        role="search"
      >
        <input
          ref={searchInputRef}
          type="text"
          placeholder={getSearchPlaceholder(location.pathname)}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search current page"
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              clearSearch();
              searchInputRef.current?.focus();
            }}
            title="Clear search (Esc)"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
        <button
          type="button"
          className="search-right-btn"
          onClick={(e) => {
            e.stopPropagation();
            searchInputRef.current?.focus();
          }}
          title="Click to search"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>

      <div className="topbar-actions">
        {/* Notifications */}
        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button
            className={`notification-button ${unreadCount > 0 ? "has-unread" : ""}`}
            type="button"
            aria-label="Notifications"
            onClick={toggleNotifDropdown}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="topbar-notif-dropdown">
              <div className="notif-dropdown-header">
                <div>
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="notif-unread-tag">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all-btn"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {loadingNotifs ? (
                  <div className="notif-loading">
                    <Loader2 size={20} className="spinning" />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifError ? (
                  <div className="notif-error">
                    <AlertCircle size={18} />
                    <span>{notifError}</span>
                    <button type="button" onClick={fetchNotifications}>
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">
                    <CheckCircle2 size={30} color="#10b981" />
                    <p>All caught up!</p>
                    <span>No notifications at the moment.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`notif-item ${!notif.isRead ? "unread" : ""}`}
                      onClick={() => handleNotificationClick(notif)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={`notif-icon-box ${notif.level || "info"}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title-row">
                          <span className="notif-title">{notif.title}</span>
                          <span className="notif-time">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="notif-message">{notif.message}</p>
                      </div>
                      {!notif.isRead && <span className="notif-unread-dot" />}
                    </div>
                  ))
                )}
              </div>

              <div className="notif-dropdown-footer">
                <button
                  type="button"
                  className="notif-view-all-btn"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate("/notifications");
                  }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-divider"></div>

        {/* User Profile */}
        <div className="topbar-user-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="topbar-user"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="topbar-avatar">{initial}</div>

            <div className="topbar-user-info">
              <h4>{displayName}</h4>
              <span>{displayRole}</span>
            </div>

            <ChevronDown
              size={17}
              className={`topbar-chevron ${dropdownOpen ? "open" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="topbar-dropdown" role="menu">
              <div className="topbar-dropdown-header">
                <p className="topbar-dropdown-name">{displayName}</p>
                {displayEmail && <p className="topbar-dropdown-email">{displayEmail}</p>}
                <span className="topbar-dropdown-badge">{displayRole}</span>
              </div>

              <div className="topbar-dropdown-divider"></div>

              <div className="topbar-dropdown-menu">
                <button
                  type="button"
                  className="topbar-dropdown-item"
                  role="menuitem"
                  onClick={() => handleNavigate("/settings")}
                >
                  <User size={16} />
                  <span>Profile / My Account</span>
                </button>

                <button
                  type="button"
                  className="topbar-dropdown-item"
                  role="menuitem"
                  onClick={() => handleNavigate("/settings")}
                >
                  <SettingsIcon size={16} />
                  <span>Settings</span>
                </button>

                <div className="topbar-dropdown-divider"></div>

                <button
                  type="button"
                  className="topbar-dropdown-item logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;

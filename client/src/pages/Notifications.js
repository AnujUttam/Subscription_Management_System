import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  RefreshCw,
  FileText,
  CreditCard,
  Check,
} from "lucide-react";
import api from "../services/api";
import { useSearch } from "../context/SearchContext";
import "./Notifications.css";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "customer":
      return <Users size={18} />;
    case "subscription":
      return <RefreshCw size={18} />;
    case "invoice":
      return <FileText size={18} />;
    case "payment":
      return <CreditCard size={18} />;
    default:
      return <Bell size={18} />;
  }
};

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all' or 'unread'

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === "unread" ? "/notifications?unreadOnly=true" : "/notifications";
      const res = await api.get(url);
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
      } else {
        setError("Unable to load notifications");
      }
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notif, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${notif._id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
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
      } catch (err) {
        console.error("Failed to mark as read:", err.message);
      }
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const { searchTerm, clearSearch } = useSearch();
  const effectiveSearch = (searchTerm || "").trim().toLowerCase();

  const filteredNotifications = useMemo(() => {
    if (!effectiveSearch) return notifications;
    return notifications.filter((notif) => {
      const title = (notif.title || "").toLowerCase();
      const message = (notif.message || "").toLowerCase();
      const type = (notif.type || "").toLowerCase();
      const level = (notif.level || "").toLowerCase();
      return (
        title.includes(effectiveSearch) ||
        message.includes(effectiveSearch) ||
        type.includes(effectiveSearch) ||
        level.includes(effectiveSearch)
      );
    });
  }, [notifications, effectiveSearch]);

  const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Real-time activity logs, billing alerts, and system notifications.</p>
        </div>

        <div className="notifications-actions">
          <div className="notifications-filter-pills">
            <button
              type="button"
              className={`pill-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`pill-btn ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              <Check size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      <div className="notifications-card">
        {loading ? (
          <div className="notif-page-state">
            <Loader2 size={28} className="spinning" />
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="notif-page-state error">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button type="button" onClick={fetchNotifications}>
              Retry
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notif-page-state empty">
            <CheckCircle2 size={40} color="#10b981" />
            <h3>{effectiveSearch ? "No matching notifications" : "No notifications found"}</h3>
            <p>
              {effectiveSearch
                ? `No notifications match "${effectiveSearch}".`
                : filter === "unread"
                ? "You have marked all notifications as read."
                : "No activity logs or alerts recorded yet."}
            </p>
            {effectiveSearch && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  marginTop: 8,
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-full-list">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                className={`notif-row ${!notif.isRead ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`notif-icon-circle ${notif.level || "info"}`}>
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="notif-row-body">
                  <div className="notif-row-header">
                    <h4>{notif.title}</h4>
                    <span className="notif-row-time">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="notif-row-desc">{notif.message}</p>
                </div>

                <div className="notif-row-actions">
                  {!notif.isRead && (
                    <button
                      type="button"
                      className="mark-single-read-btn"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(notif, e)}
                    >
                      <Check size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

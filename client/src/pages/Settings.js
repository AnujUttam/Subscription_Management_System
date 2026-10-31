import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, LogOut, CheckCircle, Bell, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Settings.css";

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "No email available";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>My Account & Settings</h1>
          <p>Manage your account profile, credentials, and system preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card profile-hero-card">
          <div className="profile-hero-top">
            <div className="profile-hero-avatar">{initial}</div>
            <div className="profile-hero-meta">
              <h2>{displayName}</h2>
              <p className="profile-hero-email">{displayEmail}</p>
              <span className="profile-role-tag">{displayRole}</span>
            </div>
          </div>
          <div className="profile-status-bar">
            <CheckCircle size={16} color="#10b981" />
            <span>Account Active & Authenticated</span>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="settings-card">
          <div className="card-header">
            <User size={20} className="card-icon" />
            <h3>Personal Information</h3>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={16} />
                <input type="text" readOnly value={displayName} />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} />
                <input type="email" readOnly value={displayEmail} />
              </div>
            </div>

            <div className="form-group">
              <label>Account Role</label>
              <div className="input-with-icon">
                <Shield size={16} />
                <input type="text" readOnly value={displayRole} />
              </div>
            </div>
          </div>
        </div>

        {/* System & Workspace Preferences */}
        <div className="settings-card">
          <div className="card-header">
            <Globe size={20} className="card-icon" />
            <h3>Preferences & Defaults</h3>
          </div>
          <div className="preference-list">
            <div className="preference-item">
              <div>
                <h4>Default Currency</h4>
                <p>Standard currency for subscription pricing and invoices.</p>
              </div>
              <span className="pref-badge">INR (₹)</span>
            </div>

            <div className="preference-item">
              <div>
                <h4>Notifications</h4>
                <p>Billing reminders and invoice generated alerts.</p>
              </div>
              <span className="pref-badge active">
                <Bell size={13} style={{ marginRight: 4 }} /> Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Session & Sign Out Card */}
        <div className="settings-card danger-card">
          <div className="card-header">
            <LogOut size={20} className="card-icon danger" />
            <h3>Session Management</h3>
          </div>
          <p className="danger-description">
            Sign out of your active session on this device. You will need your email and password to log in again.
          </p>
          <button
            type="button"
            className="settings-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Log Out of Subscriptify</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;

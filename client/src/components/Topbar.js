import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Topbar.css";

function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

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
      <div className="topbar-search">
        <Search size={19} />
        <input type="text" placeholder="Search anything..." />
        <span className="search-shortcut">⌘ K</span>
      </div>

      <div className="topbar-actions">
        <button className="notification-button" type="button" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-divider"></div>

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

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  RefreshCw,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Repeat,
} from "lucide-react";

import "./Sidebar.css";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
    },
    {
      name: "Plans",
      path: "/plans",
      icon: ClipboardList,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
    },
    {
      name: "Subscriptions",
      path: "/subscriptions",
      icon: RefreshCw,
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: FileText,
    },
    {
      name: "Payments",
      path: "/payments",
      icon: CreditCard,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Top: Logo and Application Name */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Repeat size={24} />
        </div>

        <div>
          <h2>Subscribly</h2>
          <span>Management Portal</span>
        </div>
      </div>

      {/* Middle: Navigation Menu with Independent Scroll */}
      <div className="sidebar-menu">
        <p className="menu-heading">MAIN MENU</p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              to={item.path}
              key={item.name}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "menu-link active" : "menu-link"
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Admin Only: Staff Management */}
        {user?.role === "admin" && (
          <NavLink
            to="/staff"
            className={({ isActive }) =>
              isActive ? "menu-link active" : "menu-link"
            }
          >
            <Users size={19} />
            <span>Staff</span>
          </NavLink>
        )}
      </div>

      {/* Bottom: Settings, Logout, Divider, and User Profile */}
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "menu-link active" : "menu-link"
          }
        >
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>

        <button
          className="menu-link logout-button"
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>

        <div className="sidebar-divider" />

        <div
          className="sidebar-profile"
          onClick={() => navigate("/settings")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/settings");
            }
          }}
          title="Click to view My Account / Settings"
        >
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="profile-details">
            <h4>{user?.name || "User"}</h4>
            <span>{user?.role || "Staff"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

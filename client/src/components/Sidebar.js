
import React from "react";
import { NavLink } from "react-router-dom";
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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Repeat size={24} />
        </div>

        <div>
          <h2>Subscribly</h2>
          <span>Management Portal</span>
        </div>
      </div>

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
      </div>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className="menu-link">
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>

        <button className="menu-link logout-button">
          <LogOut size={19} />
          <span>Logout</span>
        </button>

        <div className="sidebar-profile">
          <div className="profile-avatar">A</div>
          <div>
            <h4>Admin User</h4>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

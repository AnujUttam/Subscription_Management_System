
import React from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import "./Topbar.css";

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search anything..."
        />
        <span className="search-shortcut">⌘ K</span>
      </div>

      <div className="topbar-actions">
        <button className="notification-button">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-divider"></div>

        <div className="topbar-user">
          <div className="topbar-avatar">A</div>

          <div className="topbar-user-info">
            <h4>Anuj Uttam</h4>
            <span>Administrator</span>
          </div>

          <ChevronDown size={17} />
        </div>
      </div>
    </header>
  );
}

export default Topbar;

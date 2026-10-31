import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { SearchProvider } from "../context/SearchContext";

import "./DashboardLayout.css";

function DashboardLayout() {
  return (
    <SearchProvider>
      <div className="dashboard-layout">
        <Sidebar />

        <div className="dashboard-main">
          <Topbar />

          <main className="dashboard-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}

export default DashboardLayout;

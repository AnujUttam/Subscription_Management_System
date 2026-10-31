
import React from "react";
import {
  RefreshCw,
  Wallet,
  FileText,
  AlertCircle,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";

import "./Dashboard.css";

function Dashboard() {
  const stats = [
    {
      title: "Active Subscriptions",
      value: "--",
      icon: RefreshCw,
      color: "stat-blue",
    },
    {
      title: "Collected Revenue",
      value: "--",
      icon: Wallet,
      color: "stat-green",
    },
    {
      title: "Outstanding Invoices",
      value: "--",
      icon: FileText,
      color: "stat-orange",
    },
    {
      title: "Overdue Invoices",
      value: "--",
      icon: AlertCircle,
      color: "stat-red",
    },
  ];

  return (
    <div className="dashboard-page">

      {/* Dashboard Header */}
      <div className="dashboard-welcome">
        <div>
          <h1>Dashboard Overview</h1>
          <p>
            Welcome back! Here's what's happening with
            your subscriptions.
          </p>
        </div>

        <button className="dashboard-date">
          Last 30 Days
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div className="stat-card" key={item.title}>
              <div className="stat-card-top">
                <div className={`stat-icon ${item.color}`}>
                  <Icon size={21} />
                </div>

                <ArrowUpRight size={18} color="#9ca3af" />
              </div>

              <h2>{item.value}</h2>
              <p>{item.title}</p>
            </div>
          );
        })}
      </div>

      {/* Dashboard Bottom Sections */}
      <div className="dashboard-bottom">

        {/* Recent Payments */}
        <div className="dashboard-panel">
          <div className="panel-heading">
            <h3>Recent Payments</h3>
            <span>View All</span>
          </div>

          <div className="empty-state">
            <CreditCard size={35} />
            <p>No payment records available yet.</p>
          </div>
        </div>

        {/* Subscription Overview */}
        <div className="dashboard-panel">
          <div className="panel-heading">
            <h3>Subscription Overview</h3>
          </div>

          <div className="empty-state">
            <RefreshCw size={35} />
            <p>No subscription data available yet.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;

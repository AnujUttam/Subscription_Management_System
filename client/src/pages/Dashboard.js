
import React, { useMemo } from "react";
import {
  Users,
  CreditCard,
  IndianRupee,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import "./Dashboard.css";

const customers = [
  { id: 1, name: "Rahul Sharma" },
  { id: 2, name: "Priya Verma" },
  { id: 3, name: "Amit Singh" },
  { id: 4, name: "Neha Gupta" },
  { id: 5, name: "Rohit Kumar" },
];

const subscriptions = [
  { id: 1, customer: "Rahul Sharma", plan: "Professional", status: "Active" },
  { id: 2, customer: "Priya Verma", plan: "Basic", status: "Confirmed" },
  { id: 3, customer: "Amit Singh", plan: "Weekly Starter", status: "Quotation" },
  { id: 4, customer: "Neha Gupta", plan: "Professional", status: "Active" },
  { id: 5, customer: "Rohit Kumar", plan: "Basic", status: "Closed" },
];

const invoices = [
  { id: "INV-2026-001", customer: "Rahul Sharma", total: 1650.82, paid: 1650.82, status: "Paid" },
  { id: "INV-2026-002", customer: "Priya Verma", total: 588.82, paid: 0, status: "Unpaid" },
  { id: "INV-2026-003", customer: "Amit Singh", total: 234.82, paid: 100, status: "Partial" },
  { id: "INV-2026-004", customer: "Neha Gupta", total: 1768.82, paid: 0, status: "Overdue" },
];

const payments = [
  {
    id: "TXN-2026-001",
    customer: "Rahul Sharma",
    date: "10 Oct 2026",
    method: "UPI",
    amount: 1650.82,
    status: "Completed",
  },
  {
    id: "TXN-2026-002",
    customer: "Priya Verma",
    date: "20 Oct 2026",
    method: "Credit Card",
    amount: 300,
    status: "Completed",
  },
  {
    id: "TXN-2026-003",
    customer: "Amit Singh",
    date: "21 Oct 2026",
    method: "Net Banking",
    amount: 100,
    status: "Pending",
  },
];

function Dashboard() {
  const metrics = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(
      (item) => item.status === "Active"
    ).length;

    const collectedRevenue = payments
      .filter((item) => item.status === "Completed")
      .reduce((sum, item) => sum + item.amount, 0);

    const outstandingInvoices = invoices.reduce(
      (sum, item) => sum + Math.max(item.total - item.paid, 0),
      0
    );

    const overdueInvoices = invoices.filter(
      (item) => item.status === "Overdue"
    ).length;

    return {
      totalCustomers: customers.length,
      activeSubscriptions,
      collectedRevenue,
      outstandingInvoices,
      overdueInvoices,
    };
  }, []);

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (status) =>
    `dashboard-status dashboard-${status.toLowerCase()}`;

  const subscriptionStatusCounts = [
    { name: "Active", color: "active", count: subscriptions.filter((s) => s.status === "Active").length },
    { name: "Confirmed", color: "confirmed", count: subscriptions.filter((s) => s.status === "Confirmed").length },
    { name: "Quotation", color: "quotation", count: subscriptions.filter((s) => s.status === "Quotation").length },
    { name: "Draft", color: "draft", count: subscriptions.filter((s) => s.status === "Draft").length },
    { name: "Closed", color: "closed", count: subscriptions.filter((s) => s.status === "Closed").length },
  ];

  const totalSubscriptions = subscriptions.length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your business.</p>
        </div>

        <div className="dashboard-date">
          <Clock size={16} />
          <span>Business Overview</span>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Total Customers</span>
            <div className="dashboard-stat-icon purple">
              <Users size={20} />
            </div>
          </div>
          <h2>{metrics.totalCustomers}</h2>
          <p className="dashboard-stat-note">Registered customers</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Active Subscriptions</span>
            <div className="dashboard-stat-icon green">
              <CreditCard size={20} />
            </div>
          </div>
          <h2>{metrics.activeSubscriptions}</h2>
          <p className="dashboard-stat-note">Currently active</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Collected Revenue</span>
            <div className="dashboard-stat-icon blue">
              <IndianRupee size={20} />
            </div>
          </div>
          <h2>{formatAmount(metrics.collectedRevenue)}</h2>
          <p className="dashboard-stat-note">From completed payments</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Outstanding Invoices</span>
            <div className="dashboard-stat-icon orange">
              <FileText size={20} />
            </div>
          </div>
          <h2>{formatAmount(metrics.outstandingInvoices)}</h2>
          <p className="dashboard-stat-note">Remaining balance</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Overdue Invoices</span>
            <div className="dashboard-stat-icon red">
              <AlertCircle size={20} />
            </div>
          </div>
          <h2>{metrics.overdueInvoices}</h2>
          <p className="dashboard-stat-note">Require attention</p>
        </div>
      </div>

      <div className="dashboard-chart-section">
        <DashboardCharts />
      </div>

      <div className="dashboard-lower-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Recent Payments</h3>
              <p>Latest recorded transactions</p>
            </div>
            <ArrowUpRight size={19} />
          </div>

          <div className="dashboard-recent-list">
            {payments.map((payment) => (
              <div className="dashboard-payment-row" key={payment.id}>
                <div className="dashboard-payment-icon">
                  <CheckCircle size={18} />
                </div>

                <div className="dashboard-payment-info">
                  <strong>{payment.customer}</strong>
                  <span>{payment.id} · {payment.method}</span>
                </div>

                <div className="dashboard-payment-amount">
                  <strong>{formatAmount(payment.amount)}</strong>
                  <span className={statusClass(payment.status)}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Subscription Overview</h3>
              <p>Current subscription lifecycle</p>
            </div>
            <CreditCard size={19} />
          </div>

          <div className="dashboard-subscription-total">
            <strong>{totalSubscriptions}</strong>
            <span>Total Subscriptions</span>
          </div>

          <div className="dashboard-subscription-list">
            {subscriptionStatusCounts.map((item) => (
              <div className="dashboard-subscription-row" key={item.name}>
                <div className="dashboard-subscription-label">
                  <span className={`dashboard-dot ${item.color}`} />
                  <span>{item.name}</span>
                </div>

                <div className="dashboard-subscription-progress">
                  <div
                    className={`dashboard-subscription-fill ${item.color}`}
                    style={{
                      width: `${totalSubscriptions ? (item.count / totalSubscriptions) * 100 : 0}%`,
                    }}
                  />
                </div>

                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

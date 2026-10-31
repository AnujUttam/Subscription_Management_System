import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Users,
  CreditCard,
  IndianRupee,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import { fetchDashboardData } from "../services/dashboardService";
import "./Dashboard.css";

const formatPaymentMethod = (method) => {
  if (!method) return "UPI";
  switch (method.toLowerCase()) {
    case "credit_card":
    case "card":
      return "Credit Card";
    case "bank_transfer":
      return "Net Banking";
    case "upi":
      return "UPI";
    case "cash":
      return "Cash";
    case "demo":
      return "Demo";
    default:
      return method.toUpperCase();
  }
};

function Dashboard() {
  const [data, setData] = useState({
    summary: null,
    customers: [],
    totalCustomers: 0,
    payments: [],
    subscriptions: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      console.error("[Dashboard] Error fetching backend data:", err);
      setError(err.message || "Failed to load dashboard data from backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const summary = data.summary;

    const totalCustomers = data.totalCustomers || data.customers.length || 0;

    const activeSubscriptions =
      summary?.activeSubscriptions !== undefined
        ? summary.activeSubscriptions
        : data.subscriptions.filter(
            (item) => item.status?.toLowerCase() === "active"
          ).length;

    // Backend provides totalCollectedRevenue in integer paise -> divide by 100 for INR
    const collectedRevenue =
      summary?.totalCollectedRevenue !== undefined
        ? summary.totalCollectedRevenue / 100
        : data.payments.reduce((sum, item) => sum + (item.amount || 0) / 100, 0);

    // Backend provides totalOutstandingAmount in integer paise -> divide by 100 for INR
    const outstandingInvoices =
      summary?.totalOutstandingAmount !== undefined
        ? summary.totalOutstandingAmount / 100
        : data.invoices.reduce(
            (sum, item) => sum + (item.outstandingAmount || 0) / 100,
            0
          );

    const overdueInvoices =
      summary?.overdueInvoices !== undefined
        ? summary.overdueInvoices
        : data.invoices.filter((item) => {
            const isUnpaid = item.status !== "paid";
            const isOverdue =
              item.dueAt && new Date(item.dueAt) < new Date();
            return isUnpaid && isOverdue;
          }).length;

    return {
      totalCustomers,
      activeSubscriptions,
      collectedRevenue,
      outstandingInvoices,
      overdueInvoices,
    };
  }, [data]);

  const formattedPayments = useMemo(() => {
    if (!data.payments || data.payments.length === 0) {
      return [];
    }

    return data.payments.slice(0, 5).map((p) => {
      const customerName =
        p.customerId?.name || p.customerId?.email || "Customer";
      const paymentDate = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      return {
        id: p.transactionReference || p._id?.slice(-8) || "TXN",
        customer: customerName,
        date: paymentDate,
        method: formatPaymentMethod(p.paymentMethod),
        amount: (p.amount || 0) / 100,
        status: "Completed",
      };
    });
  }, [data.payments]);

  const subscriptionStatusCounts = useMemo(() => {
    const list = data.subscriptions || [];
    const getCount = (statusName) =>
      list.filter((s) => s.status?.toLowerCase() === statusName.toLowerCase())
        .length;

    return [
      { name: "Active", color: "active", count: getCount("active") },
      { name: "Confirmed", color: "confirmed", count: getCount("confirmed") },
      { name: "Quotation", color: "quotation", count: getCount("quotation") },
      { name: "Draft", color: "draft", count: getCount("draft") },
      { name: "Closed", color: "closed", count: getCount("closed") },
    ];
  }, [data.subscriptions]);

  const totalSubscriptions = useMemo(() => {
    return data.subscriptions.length || 0;
  }, [data.subscriptions]);

  const chartData = useMemo(() => {
    if (!data.payments || data.payments.length === 0) {
      return null;
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        month: monthNames[d.getMonth()],
        revenue: 0,
      });
    }

    data.payments.forEach((payment) => {
      if (!payment.createdAt) return;
      const pDate = new Date(payment.createdAt);
      const slot = months.find(
        (m) =>
          m.year === pDate.getFullYear() && m.monthIndex === pDate.getMonth()
      );
      if (slot) {
        slot.revenue += (payment.amount || 0) / 100;
      }
    });

    return months.map(({ month, revenue }) => ({ month, revenue }));
  }, [data.payments]);

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (status) =>
    `dashboard-status dashboard-${status.toLowerCase()}`;

  if (loading) {
    return (
      <div className="dashboard-page">
        <Loading message="Connecting to backend and loading metrics..." />
      </div>
    );
  }

  if (error && !data.summary && data.payments.length === 0) {
    return (
      <div className="dashboard-page">
        <ErrorState
          message={`Unable to connect to backend server: ${error}`}
          onRetry={() => loadData(false)}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your business.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh live data from backend"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 13px",
              border: "1px solid #ececf2",
              borderRadius: "9px",
              background: "white",
              color: "#6366f1",
              fontSize: "12px",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <div className="dashboard-date">
            <Clock size={16} />
            <span>Business Overview</span>
          </div>
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
        <DashboardCharts data={chartData} />
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
            {formattedPayments.length > 0 ? (
              formattedPayments.map((payment) => (
                <div className="dashboard-payment-row" key={payment.id}>
                  <div className="dashboard-payment-icon">
                    <CheckCircle size={18} />
                  </div>

                  <div className="dashboard-payment-info">
                    <strong>{payment.customer}</strong>
                    <span>
                      {payment.id} · {payment.method} · {payment.date}
                    </span>
                  </div>

                  <div className="dashboard-payment-amount">
                    <strong>{formatAmount(payment.amount)}</strong>
                    <span className={statusClass(payment.status)}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  color: "#85899b",
                  fontSize: "13px",
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                No payments recorded yet.
              </p>
            )}
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
                      width: `${
                        totalSubscriptions
                          ? (item.count / totalSubscriptions) * 100
                          : 0
                      }%`,
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

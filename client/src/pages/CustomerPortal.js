
import React, { useState } from "react";
import {
  LayoutDashboard, CreditCard, FileText, Receipt,
  User, LogOut, CalendarDays, CheckCircle,
  Clock, AlertCircle, Download
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./CustomerPortal.css";

const subscriptionData = [
  {
    id: 1,
    plan: "Professional",
    amount: 1499,
    cycle: "Monthly",
    startDate: "01 Oct 2026",
    endDate: "01 Nov 2026",
    status: "Active",
  },
  {
    id: 2,
    plan: "Basic",
    amount: 499,
    cycle: "Monthly",
    startDate: "01 Sep 2026",
    endDate: "01 Oct 2026",
    status: "Closed",
  },
];

const invoiceData = [
  {
    id: "INV-2026-001",
    date: "01 Oct 2026",
    dueDate: "10 Oct 2026",
    amount: 1650.82,
    status: "Paid",
  },
  {
    id: "INV-2026-002",
    date: "15 Oct 2026",
    dueDate: "25 Oct 2026",
    amount: 588.82,
    status: "Unpaid",
  },
];

const paymentData = [
  {
    id: "TXN-2026-001",
    invoice: "INV-2026-001",
    date: "10 Oct 2026",
    method: "UPI",
    amount: 1650.82,
    status: "Completed",
  },
];

function CustomerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  const customerName = user?.name || "Customer";
  const customerEmail = user?.email || "customer@example.com";

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const statusClass = (status) =>
    `portal-status portal-${status.toLowerCase()}`;

  const downloadInvoice = (invoice) => {
    const content = [
      "SUBSCRIPTION MANAGEMENT SYSTEM",
      "INVOICE",
      "------------------------------",
      `Invoice Number: ${invoice.id}`,
      `Invoice Date: ${invoice.date}`,
      `Due Date: ${invoice.dueDate}`,
      `Customer: ${customerName}`,
      `Email: ${customerEmail}`,
      `Amount: ${formatAmount(invoice.amount)}`,
      `Status: ${invoice.status}`,
      "------------------------------",
      "Demo invoice - not a tax invoice.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${invoice.id}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const activeSubscription = subscriptionData.find(
    (item) => item.status === "Active"
  );

  const outstanding = invoiceData
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="customer-portal">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div className="portal-brand-icon">
            <CreditCard size={23} />
          </div>
          <span>Subscript<span>Pro</span></span>
        </div>

        <div className="portal-menu-label">CUSTOMER MENU</div>

        <nav className="portal-navigation">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>

          <button
            className={activeTab === "subscriptions" ? "active" : ""}
            onClick={() => setActiveTab("subscriptions")}
          >
            <CreditCard size={18} />
            My Subscriptions
          </button>

          <button
            className={activeTab === "invoices" ? "active" : ""}
            onClick={() => setActiveTab("invoices")}
          >
            <FileText size={18} />
            My Invoices
          </button>

          <button
            className={activeTab === "payments" ? "active" : ""}
            onClick={() => setActiveTab("payments")}
          >
            <Receipt size={18} />
            Payment History
          </button>

          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            <User size={18} />
            My Profile
          </button>
        </nav>

        <div className="portal-sidebar-bottom">
          <div className="portal-user">
            <div className="portal-avatar">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{customerName}</strong>
              <span>Customer Account</span>
            </div>
          </div>

          <button className="portal-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div>
            <h2>
              {activeTab === "overview" && "My Dashboard"}
              {activeTab === "subscriptions" && "My Subscriptions"}
              {activeTab === "invoices" && "My Invoices"}
              {activeTab === "payments" && "Payment History"}
              {activeTab === "profile" && "My Profile"}
            </h2>
            <p>Welcome back, {customerName}!</p>
          </div>

          <div className="portal-topbar-avatar">
            {customerName.charAt(0).toUpperCase()}
          </div>
        </header>

        {activeTab === "overview" && (
          <section className="portal-content">
            <div className="portal-welcome">
              <div>
                <h1>Hello, {customerName.split(" ")[0]}!</h1>
                <p>Here's an overview of your subscription account.</p>
              </div>
              <div className="portal-welcome-icon">
                <CreditCard size={40} />
              </div>
            </div>

            <div className="portal-summary-grid">
              <div className="portal-summary-card">
                <span className="portal-summary-icon purple">
                  <CreditCard size={21} />
                </span>
                <div>
                  <p>Active Subscription</p>
                  <h3>{activeSubscription ? "1" : "0"}</h3>
                </div>
              </div>

              <div className="portal-summary-card">
                <span className="portal-summary-icon green">
                  <CheckCircle size={21} />
                </span>
                <div>
                  <p>Completed Payments</p>
                  <h3>{paymentData.length}</h3>
                </div>
              </div>

              <div className="portal-summary-card">
                <span className="portal-summary-icon orange">
                  <Clock size={21} />
                </span>
                <div>
                  <p>Outstanding Amount</p>
                  <h3>{formatAmount(outstanding)}</h3>
                </div>
              </div>
            </div>

            <div className="portal-overview-grid">
              <div className="portal-panel">
                <div className="portal-panel-heading">
                  <h3>Current Subscription</h3>
                  <button onClick={() => setActiveTab("subscriptions")}>
                    View All
                  </button>
                </div>

                {activeSubscription ? (
                  <div className="portal-current-plan">
                    <div className="portal-plan-top">
                      <div>
                        <span className="portal-plan-label">YOUR PLAN</span>
                        <h2>{activeSubscription.plan}</h2>
                      </div>
                      <span className={statusClass(activeSubscription.status)}>
                        {activeSubscription.status}
                      </span>
                    </div>

                    <h2 className="portal-plan-price">
                      {formatAmount(activeSubscription.amount)}
                      <small> / {activeSubscription.cycle}</small>
                    </h2>

                    <div className="portal-plan-dates">
                      <span>
                        <CalendarDays size={16} />
                        Started: {activeSubscription.startDate}
                      </span>
                      <span>
                        <CalendarDays size={16} />
                        Ends: {activeSubscription.endDate}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p>No active subscription found.</p>
                )}
              </div>

              <div className="portal-panel">
                <div className="portal-panel-heading">
                  <h3>Recent Payments</h3>
                  <button onClick={() => setActiveTab("payments")}>
                    View All
                  </button>
                </div>

                {paymentData.map((payment) => (
                  <div className="portal-recent-payment" key={payment.id}>
                    <div className="portal-payment-symbol">
                      <CheckCircle size={19} />
                    </div>
                    <div>
                      <strong>{payment.invoice}</strong>
                      <span>{payment.date} · {payment.method}</span>
                    </div>
                    <strong>{formatAmount(payment.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "subscriptions" && (
          <section className="portal-content">
            <div className="portal-section-heading">
              <h2>My Subscriptions</h2>
              <p>View your current and previous subscription plans.</p>
            </div>

            <div className="portal-panel portal-table-panel">
              <div className="portal-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Billing Cycle</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionData.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.plan}</strong></td>
                        <td>{formatAmount(item.amount)}</td>
                        <td>{item.cycle}</td>
                        <td>{item.startDate}</td>
                        <td>{item.endDate}</td>
                        <td>
                          <span className={statusClass(item.status)}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "invoices" && (
          <section className="portal-content">
            <div className="portal-section-heading">
              <h2>My Invoices</h2>
              <p>View and download your invoice records.</p>
            </div>

            <div className="portal-panel portal-table-panel">
              <div className="portal-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.map((invoice) => (
                      <tr key={invoice.id}>
                        <td><strong>{invoice.id}</strong></td>
                        <td>{invoice.date}</td>
                        <td>{invoice.dueDate}</td>
                        <td>{formatAmount(invoice.amount)}</td>
                        <td>
                          <span className={statusClass(invoice.status)}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="portal-download-btn"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "payments" && (
          <section className="portal-content">
            <div className="portal-section-heading">
              <h2>Payment History</h2>
              <p>Review your previous transactions.</p>
            </div>

            <div className="portal-panel portal-table-panel">
              <div className="portal-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentData.map((payment) => (
                      <tr key={payment.id}>
                        <td><strong>{payment.id}</strong></td>
                        <td>{payment.invoice}</td>
                        <td>{payment.date}</td>
                        <td>{payment.method}</td>
                        <td>{formatAmount(payment.amount)}</td>
                        <td>
                          <span className={statusClass(payment.status)}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="portal-content">
            <div className="portal-section-heading">
              <h2>My Profile</h2>
              <p>Your account information.</p>
            </div>

            <div className="portal-panel portal-profile-panel">
              <div className="portal-profile-avatar">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="portal-profile-fields">
                <div>
                  <label>Full Name</label>
                  <p>{customerName}</p>
                </div>
                <div>
                  <label>Email Address</label>
                  <p>{customerEmail}</p>
                </div>
                <div>
                  <label>Account Type</label>
                  <p>Customer</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default CustomerPortal;

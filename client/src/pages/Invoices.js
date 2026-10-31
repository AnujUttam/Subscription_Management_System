import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import api from "../services/api";
import "./Invoices.css";

const initialInvoices = [
  {
    id: 1,
    invoiceNumber: "INV-2026-001",
    customer: "Rahul Sharma",
    email: "rahul@gmail.com",
    plan: "Professional",
    issueDate: "2026-10-01",
    dueDate: "2026-10-10",
    subtotal: 1499,
    discount: 100,
    tax: 251.82,
    total: 1650.82,
    paidAmount: 1650.82,
    status: "Paid",
  },
  {
    id: 2,
    invoiceNumber: "INV-2026-002",
    customer: "Priya Verma",
    email: "priya@gmail.com",
    plan: "Basic",
    issueDate: "2026-10-15",
    dueDate: "2026-10-25",
    subtotal: 499,
    discount: 0,
    tax: 89.82,
    total: 588.82,
    paidAmount: 0,
    status: "Unpaid",
  },
  {
    id: 3,
    invoiceNumber: "INV-2026-003",
    customer: "Amit Singh",
    email: "amit@gmail.com",
    plan: "Weekly Starter",
    issueDate: "2026-10-10",
    dueDate: "2026-10-17",
    subtotal: 199,
    discount: 0,
    tax: 35.82,
    total: 234.82,
    paidAmount: 100,
    status: "Partial",
  },
  {
    id: 4,
    invoiceNumber: "INV-2026-004",
    customer: "Neha Gupta",
    email: "neha@gmail.com",
    plan: "Professional",
    issueDate: "2026-09-01",
    dueDate: "2026-09-10",
    subtotal: 1499,
    discount: 0,
    tax: 269.82,
    total: 1768.82,
    paidAmount: 0,
    status: "Overdue",
  },
];

function Invoices() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get("/invoices");
        const list = response.data?.data?.invoices;
        if (Array.isArray(list) && list.length > 0) {
          setInvoices(
            list.map((inv) => {
              const customerName = inv.customerId?.name || "Customer";
              const customerEmail = inv.customerId?.email || "";
              const planName =
                inv.subscriptionId?.planId?.name || "Subscription Plan";
              const issueDate = inv.createdAt
                ? inv.createdAt.slice(0, 10)
                : "2026-10-01";
              const dueDate = inv.dueAt
                ? inv.dueAt.slice(0, 10)
                : "2026-10-15";
              const isOverdue =
                inv.status !== "paid" &&
                inv.dueAt &&
                new Date(inv.dueAt) < new Date();
              const status = isOverdue
                ? "Overdue"
                : inv.status.charAt(0).toUpperCase() + inv.status.slice(1);

              return {
                id: inv._id,
                invoiceNumber: inv.invoiceNumber,
                customer: customerName,
                email: customerEmail,
                plan: planName,
                issueDate,
                dueDate,
                subtotal: (inv.subtotal || 0) / 100,
                discount: 0,
                tax: (inv.taxAmount || 0) / 100,
                total: (inv.totalAmount || 0) / 100,
                paidAmount: (inv.paidAmount || 0) / 100,
                status,
              };
            })
          );
        }
      } catch (err) {
        console.warn("Backend invoices fetch error:", err.message);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const query = search.toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customer.toLowerCase().includes(query) ||
        invoice.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalInvoiced = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );

  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0
  );

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Math.max(invoice.total - invoice.paidAmount, 0),
    0
  );

  const overdueCount = invoices.filter(
    (invoice) => invoice.status === "Overdue"
  ).length;

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatusClass = (status) => {
    const classes = {
      Paid: "invoice-paid",
      Unpaid: "invoice-unpaid",
      Partial: "invoice-partial",
      Overdue: "invoice-overdue",
    };
    return classes[status] || "";
  };

  const updateInvoiceStatus = (invoice, newStatus) => {
    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      paidAmount:
        newStatus === "Paid"
          ? invoice.total
          : newStatus === "Unpaid" || newStatus === "Overdue"
          ? 0
          : invoice.paidAmount,
    };

    setInvoices((prev) =>
      prev.map((item) =>
        item.id === invoice.id ? updatedInvoice : item
      )
    );

    setSelectedInvoice(updatedInvoice);
  };

  return (
    <div className="invoices-page">
      <div className="invoices-heading">
        <div>
          <h1>Invoices</h1>
          <p>Track invoices, outstanding balances and payments.</p>
        </div>
      </div>

      <div className="invoice-stats">
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon">
            <FileText size={22} />
          </div>
          <div>
            <p>Total Invoiced</p>
            <h2>{formatAmount(totalInvoiced)}</h2>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon invoice-paid-icon">
            <CheckCircle size={22} />
          </div>
          <div>
            <p>Amount Collected</p>
            <h2>{formatAmount(totalPaid)}</h2>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon invoice-pending-icon">
            <Clock size={22} />
          </div>
          <div>
            <p>Outstanding</p>
            <h2>{formatAmount(outstanding)}</h2>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon invoice-overdue-icon">
            <AlertCircle size={22} />
          </div>
          <div>
            <p>Overdue Invoices</p>
            <h2>{overdueCount}</h2>
          </div>
        </div>
      </div>

      <div className="invoices-table-card">
        <div className="invoices-table-header">
          <div>
            <h3>All Invoices</h3>
            <p>{filteredInvoices.length} invoices found</p>
          </div>

          <div className="invoice-filters">
            <div className="invoice-search">
              <Search size={18} />
              <input
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description="Try changing your search or status filter."
          />
        ) : (
          <div className="invoices-table-wrapper">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong className="invoice-number">
                        {invoice.invoiceNumber}
                      </strong>
                      <span className="invoice-plan">{invoice.plan}</span>
                    </td>

                    <td>
                      <div className="invoice-customer">
                        <strong>{invoice.customer}</strong>
                        <span>{invoice.email}</span>
                      </div>
                    </td>

                    <td>{formatDate(invoice.issueDate)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td className="invoice-money">
                      {formatAmount(invoice.total)}
                    </td>
                    <td className="invoice-money">
                      {formatAmount(invoice.paidAmount)}
                    </td>

                    <td>
                      <span
                        className={`invoice-status ${getStatusClass(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="invoice-view-btn"
                        title="View invoice"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="invoice-modal-overlay">
          <div className="invoice-detail-modal">
            <div className="invoice-modal-header">
              <div>
                <h2>Invoice Details</h2>
                <p>{selectedInvoice.invoiceNumber}</p>
              </div>

              <button onClick={() => setSelectedInvoice(null)}>
                <X size={21} />
              </button>
            </div>

            <div className="invoice-detail-customer">
              <div>
                <small>Bill To</small>
                <h3>{selectedInvoice.customer}</h3>
                <p>{selectedInvoice.email}</p>
              </div>

              <span
                className={`invoice-status ${getStatusClass(
                  selectedInvoice.status
                )}`}
              >
                {selectedInvoice.status}
              </span>
            </div>

            <div className="invoice-detail-meta">
              <div>
                <small>Invoice Date</small>
                <strong>{formatDate(selectedInvoice.issueDate)}</strong>
              </div>
              <div>
                <small>Due Date</small>
                <strong>{formatDate(selectedInvoice.dueDate)}</strong>
              </div>
              <div>
                <small>Subscription Plan</small>
                <strong>{selectedInvoice.plan}</strong>
              </div>
            </div>

            <div className="invoice-breakdown">
              <h3>Amount Breakdown</h3>

              <div className="invoice-breakdown-row">
                <span>Subtotal</span>
                <strong>{formatAmount(selectedInvoice.subtotal)}</strong>
              </div>

              <div className="invoice-breakdown-row">
                <span>Discount</span>
                <strong>- {formatAmount(selectedInvoice.discount)}</strong>
              </div>

              <div className="invoice-breakdown-row">
                <span>Tax</span>
                <strong>{formatAmount(selectedInvoice.tax)}</strong>
              </div>

              <div className="invoice-breakdown-row invoice-total-row">
                <span>Total Amount</span>
                <strong>{formatAmount(selectedInvoice.total)}</strong>
              </div>

              <div className="invoice-breakdown-row invoice-paid-row">
                <span>Amount Paid</span>
                <strong>{formatAmount(selectedInvoice.paidAmount)}</strong>
              </div>

              <div className="invoice-breakdown-row invoice-balance-row">
                <span>Balance Due</span>
                <strong>
                  {formatAmount(
                    Math.max(
                      selectedInvoice.total - selectedInvoice.paidAmount,
                      0
                    )
                  )}
                </strong>
              </div>
            </div>

            <div className="invoice-status-control">
              <label>Update Invoice Status (Demo)</label>
              <select
                value={selectedInvoice.status}
                onChange={(e) =>
                  updateInvoiceStatus(selectedInvoice, e.target.value)
                }
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <button
              className="invoice-close-btn"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;

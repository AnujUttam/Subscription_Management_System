
import React, { useMemo, useState } from "react";
import {
  Search, Plus, Eye, X, CreditCard,
  Wallet, CheckCircle, Clock, IndianRupee
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import "./Payments.css";

const initialPayments = [
  {
    id: 1,
    transactionId: "TXN-2026-001",
    invoiceNumber: "INV-2026-001",
    customer: "Rahul Sharma",
    email: "rahul@gmail.com",
    amount: 1650.82,
    method: "UPI",
    paymentDate: "2026-10-10",
    status: "Completed",
    reference: "UPI123456789",
    notes: "Monthly subscription payment",
  },
  {
    id: 2,
    transactionId: "TXN-2026-002",
    invoiceNumber: "INV-2026-002",
    customer: "Priya Verma",
    email: "priya@gmail.com",
    amount: 300,
    method: "Credit Card",
    paymentDate: "2026-10-20",
    status: "Completed",
    reference: "CARD987654",
    notes: "Partial invoice payment",
  },
  {
    id: 3,
    transactionId: "TXN-2026-003",
    invoiceNumber: "INV-2026-003",
    customer: "Amit Singh",
    email: "amit@gmail.com",
    amount: 100,
    method: "Net Banking",
    paymentDate: "2026-10-21",
    status: "Pending",
    reference: "NB123456",
    notes: "Payment processing",
  },
];

const emptyForm = {
  invoiceNumber: "",
  customer: "",
  email: "",
  amount: "",
  method: "UPI",
  paymentDate: new Date().toISOString().slice(0, 10),
  status: "Completed",
  reference: "",
  notes: "",
};

function Payments() {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filteredPayments = useMemo(() => {
    const query = search.toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        payment.transactionId.toLowerCase().includes(query) ||
        payment.customer.toLowerCase().includes(query) ||
        payment.invoiceNumber.toLowerCase().includes(query) ||
        payment.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      const matchesMethod =
        methodFilter === "All" || payment.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const completedPayments = payments.filter(
    (payment) => payment.status === "Completed"
  );

  const totalCollected = completedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((sum, payment) => sum + payment.amount, 0);

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

  const openAddModal = () => {
    setFormData({
      ...emptyForm,
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(emptyForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required";
    }

    if (!formData.customer.trim()) {
      newErrors.customer = "Customer name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (
      formData.amount === "" ||
      !Number.isFinite(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      newErrors.amount = "Enter a valid payment amount";
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const newPayment = {
      id: Date.now(),
      transactionId: `TXN-${Date.now()}`,
      ...formData,
      amount: Number(formData.amount),
    };

    setPayments((prev) => [newPayment, ...prev]);
    closeModal();
  };

  const getStatusClass = (status) => {
    if (status === "Completed") return "payment-completed";
    if (status === "Pending") return "payment-pending";
    return "payment-failed";
  };

  return (
    <div className="payments-page">
      <div className="payments-heading">
        <div>
          <h1>Payments</h1>
          <p>Manage transactions and track payment history.</p>
        </div>

        <button className="payment-add-btn" onClick={openAddModal}>
          <Plus size={18} />
          Record Payment
        </button>
      </div>

      <div className="payment-stats">
        <div className="payment-stat-card">
          <div className="payment-stat-icon">
            <IndianRupee size={22} />
          </div>
          <div>
            <p>Total Transactions</p>
            <h2>{payments.length}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon payment-collected-icon">
            <CheckCircle size={22} />
          </div>
          <div>
            <p>Amount Collected</p>
            <h2>{formatAmount(totalCollected)}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon payment-pending-icon">
            <Clock size={22} />
          </div>
          <div>
            <p>Pending Amount</p>
            <h2>{formatAmount(pendingAmount)}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon payment-method-icon">
            <Wallet size={22} />
          </div>
          <div>
            <p>Payment Methods</p>
            <h2>{new Set(payments.map((p) => p.method)).size}</h2>
          </div>
        </div>
      </div>

      <div className="payments-table-card">
        <div className="payments-table-header">
          <div>
            <h3>Payment History</h3>
            <p>{filteredPayments.length} transactions found</p>
          </div>

          <div className="payment-filters">
            <div className="payment-search">
              <Search size={18} />
              <input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Try changing your search or filters, or record a payment."
            actionLabel="Record Payment"
            onAction={openAddModal}
          />
        ) : (
          <div className="payments-table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong className="payment-transaction-id">
                        {payment.transactionId}
                      </strong>
                    </td>

                    <td>
                      <div className="payment-customer">
                        <strong>{payment.customer}</strong>
                        <span>{payment.email}</span>
                      </div>
                    </td>

                    <td>{payment.invoiceNumber}</td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{payment.method}</td>
                    <td className="payment-amount">
                      {formatAmount(payment.amount)}
                    </td>

                    <td>
                      <span className={`payment-status ${getStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="payment-view-btn"
                        title="View payment details"
                        onClick={() => setSelectedPayment(payment)}
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

      {showModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <div>
                <h2>Record Payment</h2>
                <p>Enter transaction details below.</p>
              </div>

              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="payment-form-grid">
                <div className="payment-form-group">
                  <label>Invoice Number</label>
                  <input
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    placeholder="e.g. INV-2026-005"
                  />
                  {errors.invoiceNumber && <small>{errors.invoiceNumber}</small>}
                </div>

                <div className="payment-form-group">
                  <label>Customer Name</label>
                  <input
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                  />
                  {errors.customer && <small>{errors.customer}</small>}
                </div>

                <div className="payment-form-group">
                  <label>Customer Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                  {errors.email && <small>{errors.email}</small>}
                </div>

                <div className="payment-form-group">
                  <label>Payment Amount (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                  />
                  {errors.amount && <small>{errors.amount}</small>}
                </div>

                <div className="payment-form-group">
                  <label>Payment Method</label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleChange}
                  >
                    <option>UPI</option>
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                    <option>Net Banking</option>
                    <option>Cash</option>
                  </select>
                </div>

                <div className="payment-form-group">
                  <label>Payment Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>Failed</option>
                  </select>
                </div>

                <div className="payment-form-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                  />
                  {errors.paymentDate && <small>{errors.paymentDate}</small>}
                </div>

                <div className="payment-form-group">
                  <label>Reference Number</label>
                  <input
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Optional transaction reference"
                  />
                </div>
              </div>

              <div className="payment-form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Add payment notes..."
                />
              </div>

              <div className="payment-modal-actions">
                <button
                  type="button"
                  className="payment-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="payment-save-btn">
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="payment-modal-overlay">
          <div className="payment-modal payment-detail-modal">
            <div className="payment-modal-header">
              <div>
                <h2>Payment Details</h2>
                <p>{selectedPayment.transactionId}</p>
              </div>

              <button onClick={() => setSelectedPayment(null)}>
                <X size={21} />
              </button>
            </div>

            <div className="payment-detail-amount">
              <div className="payment-detail-icon">
                <CreditCard size={25} />
              </div>
              <h2>{formatAmount(selectedPayment.amount)}</h2>
              <span className={`payment-status ${getStatusClass(selectedPayment.status)}`}>
                {selectedPayment.status}
              </span>
            </div>

            <div className="payment-detail-list">
              <div><span>Customer</span><strong>{selectedPayment.customer}</strong></div>
              <div><span>Email</span><strong>{selectedPayment.email}</strong></div>
              <div><span>Invoice Number</span><strong>{selectedPayment.invoiceNumber}</strong></div>
              <div><span>Payment Method</span><strong>{selectedPayment.method}</strong></div>
              <div><span>Payment Date</span><strong>{formatDate(selectedPayment.paymentDate)}</strong></div>
              <div><span>Reference</span><strong>{selectedPayment.reference || "-"}</strong></div>
              <div><span>Notes</span><strong>{selectedPayment.notes || "-"}</strong></div>
            </div>

            <button
              className="payment-save-btn payment-detail-close"
              onClick={() => setSelectedPayment(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;

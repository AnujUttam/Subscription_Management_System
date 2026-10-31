import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  CalendarDays,
  CreditCard,
  Users,
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import api from "../services/api";
import "./Subscriptions.css";

const STATUSES = ["Draft", "Quotation", "Confirmed", "Active", "Closed"];

const initialSubscriptions = [
  {
    id: 1,
    customer: "Rahul Sharma",
    email: "rahul@gmail.com",
    plan: "Professional",
    amount: 1499,
    billingCycle: "Monthly",
    startDate: "2026-10-01",
    endDate: "2026-11-01",
    status: "Active",
  },
  {
    id: 2,
    customer: "Priya Verma",
    email: "priya@gmail.com",
    plan: "Basic",
    amount: 499,
    billingCycle: "Monthly",
    startDate: "2026-10-15",
    endDate: "2026-11-15",
    status: "Confirmed",
  },
  {
    id: 3,
    customer: "Amit Singh",
    email: "amit@gmail.com",
    plan: "Weekly Starter",
    amount: 199,
    billingCycle: "Weekly",
    startDate: "2026-10-20",
    endDate: "2026-10-27",
    status: "Quotation",
  },
];

const emptyForm = {
  customer: "",
  email: "",
  plan: "",
  amount: "",
  billingCycle: "Monthly",
  startDate: "",
  endDate: "",
  status: "Draft",
};

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions");
        const list = response.data?.data?.subscriptions;
        if (Array.isArray(list) && list.length > 0) {
          setSubscriptions(
            list.map((s) => {
              const customerName = s.customerId?.name || "Customer";
              const customerEmail = s.customerId?.email || "";
              const planName = s.planId?.name || "Subscription Plan";
              const amount =
                (s.unitPriceSnapshot || s.planId?.price || 0) / 100;
              const billingCycle =
                s.billingIntervalSnapshot ||
                s.planId?.billingInterval ||
                "monthly";
              const cycleLabel =
                billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1);
              const startDate = s.startDate
                ? s.startDate.slice(0, 10)
                : "2026-10-01";
              const endDate = s.nextBillingDate
                ? s.nextBillingDate.slice(0, 10)
                : "2026-11-01";
              const status =
                s.status.charAt(0).toUpperCase() + s.status.slice(1);

              return {
                id: s._id,
                customer: customerName,
                email: customerEmail,
                plan: planName,
                amount,
                billingCycle: cycleLabel,
                startDate,
                endDate,
                status,
              };
            })
          );
        }
      } catch (err) {
        console.warn("Backend subscriptions fetch error:", err.message);
      }
    };
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const query = search.toLowerCase();

    return subscriptions.filter((item) => {
      const matchesSearch =
        item.customer.toLowerCase().includes(query) ||
        item.plan.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const activeCount = subscriptions.filter(
    (item) => item.status === "Active"
  ).length;

  const draftCount = subscriptions.filter(
    (item) => item.status === "Draft"
  ).length;

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      customer: item.customer,
      email: item.email,
      plan: item.plan,
      amount: String(item.amount),
      billingCycle: item.billingCycle,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer.trim()) {
      newErrors.customer = "Customer name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Customer email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.plan.trim()) {
      newErrors.plan = "Plan name is required";
    }

    if (
      formData.amount === "" ||
      Number(formData.amount) <= 0 ||
      !Number.isFinite(Number(formData.amount))
    ) {
      newErrors.amount = "Enter a valid amount";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (
      formData.startDate &&
      formData.endDate <= formData.startDate
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const subscriptionData = {
      ...formData,
      amount: Number(formData.amount),
    };

    if (editingId) {
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, ...subscriptionData }
            : item
        )
      );
    } else {
      setSubscriptions((prev) => [
        ...prev,
        { id: Date.now(), ...subscriptionData },
      ]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      setSubscriptions((prev) =>
        prev.filter((item) => item.id !== id)
      );
    }
  };

  const updateStatus = async (id, status) => {
    // If the id is a valid Mongo ObjectId, update backend
    if (typeof id === "string" && id.length === 24) {
      try {
        await api.patch(`/subscriptions/${id}`, {
          status: status.toLowerCase(),
        });
      } catch (err) {
        console.warn("Backend status update error:", err.message);
      }
    }

    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    setSelectedSubscription((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-heading">
        <div>
          <h1>Subscriptions</h1>
          <p>Manage customer subscriptions and their lifecycle.</p>
        </div>

        <button className="subscription-add-btn" onClick={openAddModal}>
          <Plus size={18} />
          Create Subscription
        </button>
      </div>

      <div className="subscription-stats">
        <div className="subscription-stat-card">
          <div className="subscription-stat-icon">
            <CreditCard size={22} />
          </div>
          <div>
            <p>Total Subscriptions</p>
            <h2>{subscriptions.length}</h2>
          </div>
        </div>

        <div className="subscription-stat-card">
          <div className="subscription-stat-icon subscription-active-icon">
            <Users size={22} />
          </div>
          <div>
            <p>Active Subscriptions</p>
            <h2>{activeCount}</h2>
          </div>
        </div>

        <div className="subscription-stat-card">
          <div className="subscription-stat-icon subscription-draft-icon">
            <CalendarDays size={22} />
          </div>
          <div>
            <p>Draft Subscriptions</p>
            <h2>{draftCount}</h2>
          </div>
        </div>
      </div>

      <div className="subscription-lifecycle">
        <h3>Subscription Lifecycle</h3>
        <div className="lifecycle-steps">
          {STATUSES.map((status, index) => (
            <React.Fragment key={status}>
              <div className="lifecycle-step">
                <span>{index + 1}</span>
                <p>{status}</p>
              </div>
              {index !== STATUSES.length - 1 && (
                <div className="lifecycle-line" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="subscriptions-table-card">
        <div className="subscriptions-table-header">
          <div>
            <h3>All Subscriptions</h3>
            <p>{filteredSubscriptions.length} subscriptions found</p>
          </div>

          <div className="subscription-filters">
            <div className="subscription-search">
              <Search size={18} />
              <input
                placeholder="Search customer or plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions found"
            description="Try changing your filters or create a subscription."
            actionLabel="Create Subscription"
            onAction={openAddModal}
          />
        ) : (
          <div className="subscriptions-table-wrapper">
            <table className="subscriptions-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Start Date</th>
                  <th>Next End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubscriptions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="subscription-customer">
                        <strong>{item.customer}</strong>
                        <span>{item.email}</span>
                      </div>
                    </td>

                    <td>
                      <strong>{item.plan}</strong>
                      <span className="subscription-cycle">
                        {item.billingCycle}
                      </span>
                    </td>

                    <td className="subscription-amount">
                      {formatAmount(item.amount)}
                    </td>

                    <td>{formatDate(item.startDate)}</td>
                    <td>{formatDate(item.endDate)}</td>

                    <td>
                      <span
                        className={`subscription-status status-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="subscription-actions">
                        <button
                          title="View details"
                          onClick={() => setSelectedSubscription(item)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          title="Edit subscription"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Delete subscription"
                          className="subscription-delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="subscription-modal-overlay">
          <div className="subscription-modal">
            <div className="subscription-modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Subscription" : "Create Subscription"}
                </h2>
                <p>Fill in the subscription details.</p>
              </div>
              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="subscription-form-grid">
                <div className="subscription-form-group">
                  <label>Customer Name</label>
                  <input
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                  />
                  {errors.customer && <small>{errors.customer}</small>}
                </div>

                <div className="subscription-form-group">
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

                <div className="subscription-form-group">
                  <label>Plan Name</label>
                  <input
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    placeholder="Enter plan name"
                  />
                  {errors.plan && <small>{errors.plan}</small>}
                </div>

                <div className="subscription-form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                  />
                  {errors.amount && <small>{errors.amount}</small>}
                </div>

                <div className="subscription-form-group">
                  <label>Billing Cycle</label>
                  <select
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                <div className="subscription-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="subscription-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {errors.startDate && <small>{errors.startDate}</small>}
                </div>

                <div className="subscription-form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                  {errors.endDate && <small>{errors.endDate}</small>}
                </div>
              </div>

              <div className="subscription-modal-actions">
                <button
                  type="button"
                  className="subscription-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="subscription-save-btn">
                  {editingId ? "Update Subscription" : "Create Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSubscription && (
        <div className="subscription-modal-overlay">
          <div className="subscription-modal subscription-detail-modal">
            <div className="subscription-modal-header">
              <div>
                <h2>Subscription Details</h2>
                <p>View and update subscription status.</p>
              </div>
              <button onClick={() => setSelectedSubscription(null)}>
                <X size={21} />
              </button>
            </div>

            <div className="subscription-detail-grid">
              <div>
                <small>Customer</small>
                <strong>{selectedSubscription.customer}</strong>
              </div>
              <div>
                <small>Email</small>
                <strong>{selectedSubscription.email}</strong>
              </div>
              <div>
                <small>Plan</small>
                <strong>{selectedSubscription.plan}</strong>
              </div>
              <div>
                <small>Amount</small>
                <strong>{formatAmount(selectedSubscription.amount)}</strong>
              </div>
              <div>
                <small>Billing Cycle</small>
                <strong>{selectedSubscription.billingCycle}</strong>
              </div>
              <div>
                <small>Start Date</small>
                <strong>{formatDate(selectedSubscription.startDate)}</strong>
              </div>
              <div>
                <small>End Date</small>
                <strong>{formatDate(selectedSubscription.endDate)}</strong>
              </div>
            </div>

            <div className="subscription-form-group">
              <label>Update Subscription Status</label>
              <select
                value={selectedSubscription.status}
                onChange={(e) =>
                  updateStatus(selectedSubscription.id, e.target.value)
                }
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <button
              className="subscription-save-btn subscription-detail-close"
              onClick={() => setSelectedSubscription(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;

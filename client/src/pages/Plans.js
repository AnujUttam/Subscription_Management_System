import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ClipboardList,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Clock,
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import api from "../services/api";
import "./Plans.css";

const emptyForm = {
  name: "",
  description: "",
  billingFrequency: "Monthly",
  price: "",
  minQuantity: "1",
  startDate: "",
  endDate: "",
};

const initialPlans = [
  {
    id: 1,
    name: "Basic Plan",
    description: "Essential subscription package",
    billingFrequency: "Monthly",
    price: "499",
    minQuantity: "1",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
  },
  {
    id: 2,
    name: "Professional Plan",
    description: "Advanced features for professionals",
    billingFrequency: "Yearly",
    price: "4999",
    minQuantity: "1",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
  },
  {
    id: 3,
    name: "Weekly Starter",
    description: "Short-term subscription package",
    billingFrequency: "Weekly",
    price: "199",
    minQuantity: "2",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
  },
];

function Plans() {
  const [plans, setPlans] = useState(initialPlans);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/plans");
        const list = response.data?.data?.plans;
        if (Array.isArray(list) && list.length > 0) {
          setPlans(
            list.map((p) => {
              const frequency =
                p.billingInterval.charAt(0).toUpperCase() +
                p.billingInterval.slice(1);
              return {
                id: p._id,
                name: p.name,
                description: `${p.productId?.name || "Product"} Plan`,
                billingFrequency: frequency,
                price: (p.price / 100).toString(),
                minQuantity: (p.minimumQuantity || 1).toString(),
                startDate: "2026-01-01",
                endDate: "2027-12-31",
              };
            })
          );
        }
      } catch (err) {
        console.warn("Backend plans fetch error:", err.message);
      }
    };
    fetchPlans();
  }, []);

  const openAddModal = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setFormData({
      name: plan.name,
      description: plan.description,
      billingFrequency: plan.billingFrequency,
      price: plan.price,
      minQuantity: plan.minQuantity,
      startDate: plan.startDate,
      endDate: plan.endDate,
    });

    setEditingId(plan.id);
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    }

    if (formData.price === "" || Number(formData.price) < 0) {
      newErrors.price = "Enter a valid price";
    }

    if (
      formData.minQuantity === "" ||
      Number(formData.minQuantity) < 1 ||
      !Number.isInteger(Number(formData.minQuantity))
    ) {
      newErrors.minQuantity = "Minimum quantity must be at least 1";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (editingId !== null) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingId
            ? { ...plan, ...formData }
            : plan
        )
      );
    } else {
      setPlans((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...formData,
        },
      ]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this plan?"
    );

    if (confirmed) {
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="plans-page">
      {/* Header */}
      <div className="page-header plans-header">
        <div>
          <h1>Subscription Plans</h1>
          <p>Create and manage your subscription pricing plans.</p>
        </div>

        <button className="add-plan-btn" onClick={openAddModal}>
          <Plus size={18} />
          Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="plans-summary">
        <div className="plan-summary-card">
          <div className="plan-summary-icon">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Total Plans</span>
            <h2>{plans.length}</h2>
          </div>
        </div>

        <div className="plan-summary-card">
          <div className="plan-summary-icon purple">
            <Clock size={21} />
          </div>
          <div>
            <span>Monthly Plans</span>
            <h2>
              {plans.filter((p) => p.billingFrequency === "Monthly").length}
            </h2>
          </div>
        </div>

        <div className="plan-summary-card">
          <div className="plan-summary-icon green">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Yearly Plans</span>
            <h2>
              {plans.filter((p) => p.billingFrequency === "Yearly").length}
            </h2>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="plans-toolbar">
        <div className="plan-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span>{filteredPlans.length} Plans</span>
      </div>

      {/* Table */}
      <div className="plans-table-container">
        <table className="plans-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Billing</th>
              <th>Price</th>
              <th>Min Quantity</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <div className="plan-name-cell">
                      <div className="plan-icon">
                        <ClipboardList size={19} />
                      </div>
                      <div>
                        <strong>{plan.name}</strong>
                        <small>{plan.description || "No description"}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="billing-badge">
                      {plan.billingFrequency}
                    </span>
                  </td>

                  <td className="plan-price">
                    ₹{Number(plan.price).toLocaleString("en-IN")}
                  </td>

                  <td>{plan.minQuantity}</td>

                  <td>
                    <div className="availability-cell">
                      <span>{plan.startDate || "Not set"}</span>
                      <small>to {plan.endDate || "No end date"}</small>
                    </div>
                  </td>

                  <td>
                    <div className="plan-actions">
                      <button
                        type="button"
                        title="Edit Plan"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        title="Delete Plan"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <EmptyState
                    title="No plans found"
                    description="Create a subscription plan to get started."
                    actionLabel="Create Plan"
                    onAction={openAddModal}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="plan-modal-overlay">
          <div className="plan-modal">
            <div className="plan-modal-header">
              <div>
                <h2>
                  {editingId !== null ? "Edit Plan" : "Create New Plan"}
                </h2>
                <p>Configure your subscription plan details.</p>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="plan-form-group">
                <label>Plan Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Premium Plan"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <small className="plan-error">{errors.name}</small>
                )}
              </div>

              <div className="plan-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="2"
                  placeholder="Describe this plan..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="plan-form-row">
                <div className="plan-form-group">
                  <label>Billing Frequency *</label>
                  <select
                    name="billingFrequency"
                    value={formData.billingFrequency}
                    onChange={handleChange}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div className="plan-form-group">
                  <label>Plan Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    value={formData.price}
                    onChange={handleChange}
                  />
                  {errors.price && (
                    <small className="plan-error">{errors.price}</small>
                  )}
                </div>
              </div>

              <div className="plan-form-group">
                <label>Minimum Quantity *</label>
                <input
                  type="number"
                  name="minQuantity"
                  min="1"
                  step="1"
                  value={formData.minQuantity}
                  onChange={handleChange}
                />
                {errors.minQuantity && (
                  <small className="plan-error">{errors.minQuantity}</small>
                )}
              </div>

              <div className="plan-form-row">
                <div className="plan-form-group">
                  <label>Availability Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="plan-form-group">
                  <label>Availability End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    min={formData.startDate || undefined}
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                  {errors.endDate && (
                    <small className="plan-error">{errors.endDate}</small>
                  )}
                </div>
              </div>

              <div className="plan-modal-actions">
                <button
                  type="button"
                  className="cancel-plan-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="save-plan-btn">
                  {editingId !== null ? "Update Plan" : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Plans;

import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import api from "../services/api";
import "./Customers.css";

const initialCustomers = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@gmail.com",
    phone: "9876543210",
    address: "Lucknow, Uttar Pradesh",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Verma",
    email: "priya@gmail.com",
    phone: "9876501234",
    address: "Kanpur, Uttar Pradesh",
    status: "Active",
  },
  {
    id: 3,
    name: "Amit Singh",
    email: "amit@gmail.com",
    phone: "9123456780",
    address: "Delhi, India",
    status: "Inactive",
  },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  status: "Active",
};

function Customers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers");
        const list = response.data?.data?.customers;
        if (Array.isArray(list) && list.length > 0) {
          setCustomers(
            list.map((c) => ({
              id: c._id,
              name: c.name,
              email: c.email,
              phone: c.phone || "9876543210",
              address: c.address || "India",
              status: "Active",
            }))
          );
        }
      } catch (err) {
        console.warn("Backend customer fetch error:", err.message);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const value = search.toLowerCase();

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(value) ||
        customer.email.toLowerCase().includes(value) ||
        customer.phone.includes(value)
    );
  }, [customers, search]);

  const activeCount = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status,
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

    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    const duplicateEmail = customers.some(
      (customer) =>
        customer.email.toLowerCase() === formData.email.toLowerCase() &&
        customer.id !== editingId
    );

    if (duplicateEmail) {
      newErrors.email = "This email already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (!editingId) {
        const res = await api.post("/customers", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        });
        const created = res.data?.data?.customer;
        if (created) {
          setCustomers((prev) => [
            {
              id: created._id,
              name: created.name,
              email: created.email,
              phone: created.phone || formData.phone,
              address: created.address || formData.address,
              status: "Active",
            },
            ...prev,
          ]);
          closeModal();
          return;
        }
      }
    } catch (err) {
      console.warn("Backend customer creation error:", err.message);
      if (err.response?.data?.error?.code === "DUPLICATE_EMAIL") {
        setErrors((prev) => ({
          ...prev,
          email: "A customer with this email already exists in database.",
        }));
        return;
      }
    }

    if (editingId) {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === editingId
            ? { ...customer, ...formData }
            : customer
        )
      );
    } else {
      setCustomers((prev) => [{ id: Date.now(), ...formData }, ...prev]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (confirmed) {
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== id)
      );
    }
  };

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <h1>Customers</h1>
          <p>Manage and organize your customer information.</p>
        </div>

        <button className="customer-add-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      <div className="customer-stats">
        <div className="customer-stat-card">
          <div className="customer-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <p>Total Customers</p>
            <h2>{customers.length}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon active-icon">
            <Users size={22} />
          </div>
          <div>
            <p>Active Customers</p>
            <h2>{activeCount}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon inactive-icon">
            <Users size={22} />
          </div>
          <div>
            <p>Inactive Customers</p>
            <h2>{customers.length - activeCount}</h2>
          </div>
        </div>
      </div>

      <div className="customers-table-card">
        <div className="customers-table-header">
          <div>
            <h3>All Customers</h3>
            <p>{filteredCustomers.length} customers found</p>
          </div>

          <div className="customer-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try another search or add a new customer."
            actionLabel="Add Customer"
            onAction={openAddModal}
          />
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{customer.name}</strong>
                          <span>{customer.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>

                    <td>
                      <span
                        className={`customer-status ${
                          customer.status === "Active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td>
                      <div className="customer-actions">
                        <button
                          title="View details"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Users size={17} />
                        </button>

                        <button
                          title="Edit customer"
                          onClick={() => openEditModal(customer)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Delete customer"
                          className="delete-action"
                          onClick={() => handleDelete(customer.id)}
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
        <div className="customer-modal-overlay">
          <div className="customer-modal">
            <div className="customer-modal-header">
              <div>
                <h2>{editingId ? "Edit Customer" : "Add Customer"}</h2>
                <p>Enter customer information below.</p>
              </div>

              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-group">
                <label>Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
                {errors.name && <small>{errors.name}</small>}
              </div>

              <div className="customer-form-group">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
                {errors.email && <small>{errors.email}</small>}
              </div>

              <div className="customer-form-group">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="10"
                  placeholder="10-digit phone number"
                />
                {errors.phone && <small>{errors.phone}</small>}
              </div>

              <div className="customer-form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  rows="3"
                />
                {errors.address && <small>{errors.address}</small>}
              </div>

              <div className="customer-form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="customer-modal-actions">
                <button
                  type="button"
                  className="customer-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="customer-save-btn">
                  {editingId ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="customer-modal-overlay">
          <div className="customer-modal customer-detail-modal">
            <div className="customer-modal-header">
              <div>
                <h2>Customer Details</h2>
                <p>Customer profile information</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)}>
                <X size={21} />
              </button>
            </div>

            <div className="customer-detail-profile">
              <div className="customer-detail-avatar">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <h3>{selectedCustomer.name}</h3>
              <span>{selectedCustomer.status}</span>
            </div>

            <div className="customer-detail-item">
              <Mail size={18} />
              <div>
                <small>Email Address</small>
                <p>{selectedCustomer.email}</p>
              </div>
            </div>

            <div className="customer-detail-item">
              <Phone size={18} />
              <div>
                <small>Phone Number</small>
                <p>{selectedCustomer.phone}</p>
              </div>
            </div>

            <div className="customer-detail-item">
              <MapPin size={18} />
              <div>
                <small>Address</small>
                <p>{selectedCustomer.address}</p>
              </div>
            </div>

            <button
              className="customer-save-btn customer-detail-close"
              onClick={() => setSelectedCustomer(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;

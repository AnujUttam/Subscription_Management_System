import React, { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Users, UserCheck } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import "./Staff.css";

const initialStaff = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@example.com",
    role: "staff",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Verma",
    email: "priya@example.com",
    role: "staff",
    status: "Active",
  },
  {
    id: 3,
    name: "Amit Singh",
    email: "amit@example.com",
    role: "staff",
    status: "Inactive",
  },
];

const emptyForm = {
  name: "",
  email: "",
  role: "staff",
  status: "Active",
};

function Staff() {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const { searchTerm, clearSearch } = useSearch();
  const effectiveSearch = (searchTerm || search || "").trim().toLowerCase();

  const filteredStaff = useMemo(() => {
    if (!effectiveSearch) return staff;
    return staff.filter((member) => {
      const name = (member.name || "").toLowerCase();
      const email = (member.email || "").toLowerCase();
      const role = (member.role || "").toLowerCase();
      return name.includes(effectiveSearch) || email.includes(effectiveSearch) || role.includes(effectiveSearch);
    });
  }, [staff, effectiveSearch]);

  const activeCount = staff.filter(
    (member) => member.status === "Active"
  ).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
    });
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailExists = staff.some(
      (member) =>
        member.email.toLowerCase() === form.email.toLowerCase() &&
        member.id !== editingId
    );

    if (emailExists) {
      setError("This email address already exists.");
      return;
    }

    if (editingId) {
      setStaff((prev) =>
        prev.map((member) =>
          member.id === editingId
            ? { ...member, ...form }
            : member
        )
      );
    } else {
      setStaff((prev) => [
        ...prev,
        { id: Date.now(), ...form },
      ]);
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      setStaff((prev) => prev.filter((member) => member.id !== id));
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-heading">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your team members and their access roles.</p>
        </div>

        <button className="staff-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      <div className="staff-stats">
        <div className="staff-stat-card">
          <div className="staff-stat-icon">
            <Users size={21} />
          </div>
          <div>
            <span>Total Staff</span>
            <h2>{staff.length}</h2>
          </div>
        </div>

        <div className="staff-stat-card">
          <div className="staff-stat-icon green">
            <UserCheck size={21} />
          </div>
          <div>
            <span>Active Staff</span>
            <h2>{activeCount}</h2>
          </div>
        </div>
      </div>

      <div className="staff-table-card">
        <div className="staff-table-header">
          <div>
            <h2>Team Members</h2>
            <p>{filteredStaff.length} members found</p>
          </div>

          <div className="staff-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="staff-name-cell">
                        <div className="staff-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <strong>{member.name}</strong>
                      </div>
                    </td>

                    <td>{member.email}</td>

                    <td>
                      <span className="staff-role">
                        {member.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`staff-status ${
                          member.status === "Active" ? "active" : "inactive"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td>
                      <div className="staff-actions">
                        <button
                          className="staff-icon-btn edit"
                          onClick={() => openEditModal(member)}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="staff-icon-btn delete"
                          onClick={() => handleDelete(member.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="staff-empty" style={{ textAlign: "center", padding: "24px" }}>
                    {effectiveSearch
                      ? `No staff members match "${effectiveSearch}".`
                      : "No staff members found."}
                    {effectiveSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          clearSearch();
                        }}
                        style={{
                          marginLeft: 10,
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#ffffff",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <div className="staff-modal-header">
              <div>
                <h2>{editingId ? "Edit Staff Member" : "Add Staff Member"}</h2>
                <p>Enter staff member details below.</p>
              </div>

              <button
                className="staff-close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="staff-form-group">
                <label>Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>

              <div className="staff-form-group">
                <label>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>

              <div className="staff-form-row">
                <div className="staff-form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="staff-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {error && <p className="staff-error">{error}</p>}

              <div className="staff-modal-actions">
                <button
                  type="button"
                  className="staff-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="staff-primary-btn">
                  {editingId ? "Save Changes" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;

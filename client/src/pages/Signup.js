import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, UserPlus, CheckCircle } from "lucide-react";
import api from "../services/api";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

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
    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    const password = formData.password;

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must contain at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions while request is processing
    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const response = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data && response.data.success) {
        // Confirmation confirmed by backend
        setLoading(false);
        setSuccessMessage("Account created successfully! Redirecting to login...");
        const registeredEmail = formData.email.trim();

        // Automatically redirect to /login without automatically logging in
        setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: {
              successMessage: "Account created successfully! Please sign in with your credentials.",
              prefilledEmail: registeredEmail,
            },
          });
        }, 1200);
      } else {
        setServerError(response.data?.message || "Registration failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      setServerError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">S</div>
          <span>Subscriptify</span>
        </div>

        <div className="auth-heading">
          <h1>Create an Account</h1>
          <p>Start managing your subscriptions effortlessly.</p>
        </div>

        {successMessage && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {serverError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>Full Name</label>

            <div className="auth-input">
              <User size={18} />
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="auth-input-group">
            <label>Email Address</label>

            <div className="auth-input">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="auth-input-group">
            <label>Password</label>

            <div className="auth-input">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}

            <small>Must be at least 6 characters long</small>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || Boolean(successMessage)}
            style={{
              opacity: loading || successMessage ? 0.7 : 1,
              cursor: loading || successMessage ? "not-allowed" : "pointer",
            }}
          >
            <UserPlus size={18} />
            {loading ? "Creating Account..." : successMessage ? "Redirecting..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Login.css";
import "./Signup.css";

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.prefilledEmail || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBanner, setSuccessBanner] = useState(
    location.state?.successMessage || ""
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccessBanner("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loading) return;

    if (!formData.email.trim() || !formData.password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const { user, token } = response.data?.data || {};

      if (user && token) {
        // Store JWT token and user profile in context and localStorage
        login(user, token);
        // Navigate to dashboard
        navigate("/", { replace: true });
      } else {
        setError("Invalid response format received from server.");
      }
    } catch (err) {
      if (err.response) {
        const backendMsg =
          err.response.data?.error?.message ||
          err.response.data?.message;

        if (err.response.status === 401) {
          setError(backendMsg || "Invalid email or password. Please try again.");
        } else {
          setError(backendMsg || "An error occurred during sign in.");
        }
      } else if (err.request) {
        setError(
          "Unable to connect to the backend server. Please verify the backend is running."
        );
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
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
          <h1>Welcome Back!</h1>
          <p>Sign in to manage your subscriptions.</p>
        </div>

        {successBanner && (
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
            <span>{successBanner}</span>
          </div>
        )}

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
          </div>

          <div className="auth-input-group">
            <label>Password</label>

            <div className="auth-input">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>

            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <LogIn size={18} />
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

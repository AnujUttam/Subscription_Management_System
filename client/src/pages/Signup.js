
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

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
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    const password = formData.password;

    if (password.length < 9) {
      newErrors.password = "Password must contain at least 9 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Include at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Include at least one lowercase letter";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Include at least one special character";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log("Signup Data:", formData);
    alert("Validation successful! API integration will be added later.");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">S</div>
          <span>Subscriptify</span>
        </div>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Get started with your subscription management.</p>
        </div>

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
                required
              />
            </div>
            {errors.name && <small className="field-error">{errors.name}</small>}
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
                required
              />
            </div>
            {errors.email && <small className="field-error">{errors.email}</small>}
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
                required
              />
            </div>
            {errors.password && (
              <small className="field-error">{errors.password}</small>
            )}
            <small>Minimum 9 characters, uppercase, lowercase and special character.</small>
          </div>

          <button type="submit" className="auth-submit-btn">
            <UserPlus size={18} />
            Create Account
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

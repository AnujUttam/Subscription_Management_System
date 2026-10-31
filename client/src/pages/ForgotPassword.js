
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import "./ForgetPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="forgot-icon">
          <Mail size={30} />
        </div>

        <div className="auth-heading">
          <h1>Forgot Password?</h1>
          <p>
            Enter your registered email address.
            We'll help you reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="forgot-success">
            <h3>Request Submitted!</h3>
            <p>
              Password reset functionality will be available
              once the backend API is integrated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label>Email Address</label>

              <div className="auth-input">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              <Send size={18} />
              Continue
            </button>
          </form>
        )}

        <Link to="/login" className="back-to-login">
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import "./ErrorState.css";

function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}) {
  return (
    <div className="error-state">
      <AlertCircle size={36} className="error-icon" />

      <h3>Unable to load data</h3>
      <p>{message}</p>

      {onRetry && (
        <button className="error-retry-button" onClick={onRetry}>
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
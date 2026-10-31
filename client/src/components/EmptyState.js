import React from "react";
import { PackageOpen } from "lucide-react";
import "./EmptyState.css";

function EmptyState({
  title = "No data found",
  description = "There is nothing to display right now.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <PackageOpen size={32} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      {actionLabel && onAction && (
        <button className="empty-state-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
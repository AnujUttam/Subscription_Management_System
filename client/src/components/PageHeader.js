
import React from "react";

function PageHeader({ title, description }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default PageHeader;

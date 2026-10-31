import React from "react";
import { LoaderCircle } from "lucide-react";
import "./Loading.css";

function Loading({ message = "Loading..." }) {
  return (
    <div className="loading-container">
      <LoaderCircle className="loading-spinner" size={32} />
      <p>{message}</p>
    </div>
  );
}

export default Loading;
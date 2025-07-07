import React from "react";
import { Link } from "react-router-dom";
import "./PageNotFound.css";

function PageNotFound() {
  return (
    <div className="page-not-found">
      <div className="content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="https://studio.officeiq.ai/dashboard" className="back-btn">
          <i className="fas fa-arrow-left"></i>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default PageNotFound;

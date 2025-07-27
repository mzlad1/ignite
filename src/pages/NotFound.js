import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  return (
    <div className="not-found-page">
      {/* Character Decorations */}
      <div className="not-found-enzo-main"></div>
      <div className="not-found-zoe-main"></div>

      <div className="container">
        <div className="not-found-content">
          <div className="error-number">404</div>
          <h1>Oops! Page Not Found</h1>
          <p className="error-message">
            The page you're looking for seems to have vanished into the cosmic
            void! Don't worry, our galactic crew is here to help you navigate
            back to safety.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

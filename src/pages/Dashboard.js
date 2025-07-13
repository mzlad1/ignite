import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="container">
        <h1>Dashboard</h1>
        <div className="dashboard-grid">
          <Link to="/menu" className="dashboard-card">
            <h3>☕ Menu Café</h3>
            <p>Explore our delicious food and drinks</p>
          </Link>

          <Link to="/offers" className="dashboard-card">
            <h3>🎁 Offers</h3>
            <p>Check out our bundles, points, and prices</p>
          </Link>

          <Link to="/booking" className="dashboard-card">
            <h3>🎳 Bowling Booking</h3>
            <p>Reserve your bowling session</p>
          </Link>

          <Link to="/birthday-packages" className="dashboard-card">
            <h3>🎉 Birthday Packages</h3>
            <p>Celebrate your special day with us</p>
          </Link>

          <Link to="/feedback" className="dashboard-card">
            <h3>💬 Feedback</h3>
            <p>Share your experience</p>
          </Link>

          <Link to="/faq" className="dashboard-card">
            <h3>❓ FAQ</h3>
            <p>Frequently asked questions</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

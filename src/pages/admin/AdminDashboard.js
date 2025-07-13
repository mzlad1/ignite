import React from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>

        <div className="admin-grid">
          <Link to="/admin/calendar" className="admin-card">
            <h3>📅 Reception Calendar</h3>
            <p>View all bookings and manage schedule</p>
          </Link>

          <Link to="/admin/jana" className="admin-card">
            <h3>👩‍💼 Jana's Dashboard</h3>
            <p>Complete management access</p>
          </Link>

          <Link to="/admin/add-user" className="admin-card">
            <h3>👤 Add User</h3>
            <p>Create new user accounts with roles</p>
          </Link>

          <Link to="/admin/manage-users" className="admin-card">
            <h3>👥 Manage Users</h3>
            <p>View and manage existing user accounts</p>
          </Link>

          <Link to="/admin/settings" className="admin-card">
            <h3>⚙️ Settings</h3>
            <p>System configuration</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

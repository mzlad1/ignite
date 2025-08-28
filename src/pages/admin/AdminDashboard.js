import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
          if (adminDoc.exists()) {
            setUserRole(adminDoc.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>
          {userRole === "reception" ? "Reception Dashboard" : "Admin Dashboard"}
        </h1>

        <div className="admin-grid">
          <Link to="/admin/calendar" className="admin-card">
            <h3>📅 Reception Calendar</h3>
            <p>View all bookings and manage schedule</p>
          </Link>

          <Link to="/admin/jana" className="admin-card">
            <h3>👩‍💼 Jana's Dashboard</h3>
            <p>
              {userRole === "reception"
                ? "Manage bookings"
                : "Complete management access"}
            </p>
          </Link>

          {userRole === "jana" && (
            <>
              <Link to="/admin/add-user" className="admin-card">
                <h3>👤 Add User</h3>
                <p>Create new user accounts with roles</p>
              </Link>

              <Link to="/admin/manage-users" className="admin-card">
                <h3>👥 Manage Users</h3>
                <p>View and manage existing user accounts</p>
              </Link>

              <Link to="/admin/media-management" className="admin-card">
                <h3>🎬 Media Management</h3>
                <p>Manage images and videos for gaming zones</p>
              </Link>

              <Link to="/admin/tournament-management" className="admin-card">
                <h3>🏆 Tournament Management</h3>
                <p>Manage tournament registrations and participants</p>
              </Link>
            </>
          )}

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

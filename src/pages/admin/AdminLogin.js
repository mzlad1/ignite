import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import "./AdminLogin.css";

const AdminLogin = () => {
  const { showError } = useToast();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Get user role from Firestore
      const adminDoc = await getDoc(doc(db, "admins", userCredential.user.uid));

      if (adminDoc.exists()) {
        const userData = adminDoc.data();

        // If user came from a specific page, try to redirect there
        if (from && from.startsWith("/admin/")) {
          // Check if user has permission for the requested route
          if (from === "/admin/jana" && userData.role !== "jana") {
            navigate("/admin/dashboard"); // Redirect reception users to calendar
          } else if (
            from === "/admin/dashboard" &&
            userData.role !== "reception"
          ) {
            navigate("/admin/dashboard"); // Redirect jana to admin dashboard
          } else if (
            from.includes("/admin/add-user") &&
            userData.role !== "jana"
          ) {
            navigate("/admin/calendar"); // Only jana can add users
          } else if (
            from.includes("/admin/manage-users") &&
            userData.role !== "jana"
          ) {
            navigate("/admin/calendar"); // Only jana can manage users
          } else {
            navigate(from); // Go to originally requested page
          }
        } else {
          // Default redirect based on role
          if (userData.role === "jana") {
            navigate("/admin/dashboard");
          } else {
            navigate("/admin/calendar");
          }
        }
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      showError("Login failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) =>
              setCredentials({ ...credentials, email: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

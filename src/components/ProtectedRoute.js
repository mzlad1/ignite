import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get user role from Firestore
        try {
          const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
          if (adminDoc.exists()) {
            setUserRole(adminDoc.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #0a0b1a, #1a1b2e)",
          color: "#ffffff",
          fontFamily: "Fredoka, sans-serif",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Check if requiredRole is an array and if user role is included
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole)
      : userRole === requiredRole;

    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (userRole === "jana") {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (userRole === "reception") {
        return <Navigate to="/admin/calendar" replace />;
      } else {
        return <Navigate to="/admin" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;

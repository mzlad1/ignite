import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { ToastProvider } from "./contexts/ToastContext";
import { validateEnvironment } from "./config/env";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Offers from "./pages/Offers";
import Booking from "./pages/Booking";
import Feedback from "./pages/Feedback";
import BirthdayPackages from "./pages/BirthdayPackages";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReceptionCalendar from "./pages/admin/ReceptionCalendar";
import JanaDashboard from "./pages/admin/JanaDashboard";
import AddUser from "./pages/admin/AddUser";
import ManageUsers from "./pages/admin/ManageUsers";
import Settings from "./pages/admin/Settings";
import MediaManagement from "./pages/admin/MediaManagement";

// Validate environment variables on app startup
try {
  validateEnvironment();
} catch (error) {
  console.error("Environment validation failed:", error.message);
  // In development, you might want to show a user-friendly error
  if (process.env.NODE_ENV === "development") {
    // You could render an error component here instead of throwing
  }
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/birthday-packages" element={<BirthdayPackages />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Public route - redirects authenticated users */}
            <Route
              path="/admin"
              element={
                <PublicRoute>
                  <AdminLogin />
                </PublicRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole={["jana", "reception"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/calendar"
              element={
                <ProtectedRoute requiredRole={["reception", "jana"]}>
                  <ReceptionCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jana"
              element={
                <ProtectedRoute requiredRole={["jana", "reception"]}>
                  <JanaDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-user"
              element={
                <ProtectedRoute requiredRole="jana">
                  <AddUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-users"
              element={
                <ProtectedRoute requiredRole="jana">
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/media-management"
              element={
                <ProtectedRoute requiredRole="jana">
                  <MediaManagement />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route for 404 - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;

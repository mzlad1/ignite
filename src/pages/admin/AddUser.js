import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import "./AddUser.css";

const AddUser = () => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "reception",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Add user data to Firestore
      await setDoc(doc(db, "admins", userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.email || "Unknown",
      });

      showSuccess(
        `User ${formData.name} created successfully with role: ${formData.role}`
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "reception",
      });
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle specific Firebase errors
      let errorMessage = "Failed to create user. ";
      if (error.code === "auth/email-already-in-use") {
        errorMessage += "Email is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage += "Password is too weak.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage += "Invalid email address.";
      } else {
        errorMessage += error.message;
      }

      showError(errorMessage);
    }

    setLoading(false);
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="add-user">
      <div className="container">
        <h1>Add New User</h1>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="add-user-form">
            <h2>Create User Account</h2>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                className={errors.name ? "error" : ""}
                disabled={loading}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className={errors.email ? "error" : ""}
                disabled={loading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password (min. 6 characters)"
                className={errors.password ? "error" : ""}
                disabled={loading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">User Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={errors.role ? "error" : ""}
                disabled={loading}
              >
                <option value="reception">Reception Staff</option>
                <option value="jana">Jana (Manager)</option>
              </select>
              {errors.role && (
                <span className="error-message">{errors.role}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating User..." : "Create User"}
              </button>
            </div>
          </form>

          <div className="info-panel">
            <h3>User Roles Information</h3>
            <div className="role-info">
              <div className="role-item">
                <div className="role-icon">👥</div>
                <div className="role-details">
                  <h4>Reception Staff</h4>
                  <p>Access to calendar and booking management</p>
                  <ul>
                    <li>View reception calendar</li>
                    <li>Manage daily bookings</li>
                    <li>Search customer bookings</li>
                  </ul>
                </div>
              </div>

              <div className="role-item">
                <div className="role-icon">👩‍💼</div>
                <div className="role-details">
                  <h4>Jana (Manager)</h4>
                  <p>Complete system management access</p>
                  <ul>
                    <li>Manage all bookings</li>
                    <li>Menu and bundle management</li>
                    <li>Feedback moderation</li>
                    <li>Full administrative control</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;

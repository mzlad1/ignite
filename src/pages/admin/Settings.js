import React, { useState } from "react";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../firebase";
import "./Settings.css";

const Settings = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
    // Clear messages when user starts typing
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords don't match!");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError("Password must be at least 8 characters long!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("No user logged in!");
        return;
      }

      // Create credential with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        passwords.currentPassword
      );

      // Reauthenticate user
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwords.newPassword);

      setSuccess("Password updated successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password update error:", error);
      switch (error.code) {
        case "auth/wrong-password":
          setError("Current password is incorrect!");
          break;
        case "auth/weak-password":
          setError("New password is too weak!");
          break;
        case "auth/requires-recent-login":
          setError("Please log out and log back in before changing password!");
          break;
        default:
          setError("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="settings-admin-page">
      <div className="settings-zoe-helper"></div>
      <div className="settings-security-icon-1"></div>
      <div className="settings-security-icon-2"></div>

      <div className="settings-container">
        <h1>Admin Settings</h1>

        <div className="settings-content">
          <h2>Change Password</h2>

          {error && <div className="settings-error-message">{error}</div>}
          {success && <div className="settings-success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="settings-password-form">
            <div className="settings-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="settings-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleInputChange}
                required
                minLength="8"
              />
            </div>

            <div className="settings-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleInputChange}
                required
                minLength="8"
              />
            </div>

            <div className="settings-actions">
              <button
                type="submit"
                className="settings-btn-save"
                disabled={loading}
              >
                {loading ? "Updating..." : "Change Password"}
              </button>
              <button
                type="button"
                className="settings-btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

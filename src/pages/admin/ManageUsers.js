import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import "./ManageUsers.css";

const ManageUsers = () => {
  const { showSuccess, showError, showConfirm } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "admins"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      showError("Error fetching users: " + error.message);
    }
    setLoading(false);
  };

  const startEditing = (user) => {
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({
      name: "",
      email: "",
      role: "",
    });
  };

  const saveUser = async (userId) => {
    try {
      await updateDoc(doc(db, "admins", userId), {
        name: editForm.name,
        role: editForm.role,
        updatedAt: new Date().toISOString(),
      });

      setUsers(
        users.map((user) =>
          user.id === userId
            ? { ...user, name: editForm.name, role: editForm.role }
            : user
        )
      );

      setEditingUser(null);
      showSuccess("User updated successfully!");
    } catch (error) {
      showError("Error updating user: " + error.message);
    }
  };

  const deleteUserAccount = async (userId, userName) => {
    const confirmed = await showConfirm({
      title: "Delete User Account",
      message: `Are you sure you want to delete ${userName}'s account? This action cannot be undone and will remove all their access.`,
      confirmText: "Delete User",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "admins", userId));

        // Update local state
        setUsers(users.filter((user) => user.id !== userId));

        showSuccess(`${userName}'s account has been deleted successfully!`);
      } catch (error) {
        showError("Error deleting user: " + error.message);
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "jana":
        return "#e74c3c";
      case "reception":
        return "#3498db";
      default:
        return "#95a5a6";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "jana":
        return "Manager";
      case "reception":
        return "Reception Staff";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="manage-users-page">
        <div className="manage-users-enzo-helper"></div>
        <div className="manage-users-icon-1"></div>
        <div className="manage-users-icon-2"></div>

        <div className="manage-users-container">
          <div className="manage-users-loading">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users-page">
      <div className="manage-users-enzo-helper"></div>
      <div className="manage-users-icon-1"></div>
      <div className="manage-users-icon-2"></div>

      <div className="manage-users-container">
        <div className="manage-users-page-header">
          <h1>Manage Users</h1>
          <p>View and manage all admin user accounts</p>
        </div>

        <div className="manage-users-stats">
          <div className="manage-users-stat-card">
            <div className="manage-users-stat-number">{users.length}</div>
            <div className="manage-users-stat-label">Total Users</div>
          </div>
          <div className="manage-users-stat-card">
            <div className="manage-users-stat-number">
              {users.filter((user) => user.role === "jana").length}
            </div>
            <div className="manage-users-stat-label">Managers</div>
          </div>
          <div className="manage-users-stat-card">
            <div className="manage-users-stat-number">
              {users.filter((user) => user.role === "reception").length}
            </div>
            <div className="manage-users-stat-label">Reception Staff</div>
          </div>
        </div>

        <div className="manage-users-list">
          {users.length === 0 ? (
            <div className="manage-users-no-users">
              <h3>No users found</h3>
              <p>Add some users to get started.</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="manage-users-user-card">
                {editingUser === user.id ? (
                  <div className="manage-users-edit-form">
                    <div className="manage-users-edit-fields">
                      <div className="manage-users-field-group">
                        <label>Name:</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="manage-users-field-group">
                        <label>Email:</label>
                        <input
                          type="email"
                          value={editForm.email}
                          disabled
                          className="manage-users-disabled-field"
                        />
                        <small>Email cannot be changed</small>
                      </div>
                      <div className="manage-users-field-group">
                        <label>Role:</label>
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                        >
                          <option value="reception">Reception Staff</option>
                          <option value="jana">Manager</option>
                        </select>
                      </div>
                    </div>
                    <div className="manage-users-edit-actions">
                      <button
                        onClick={() => saveUser(user.id)}
                        className="manage-users-save-btn"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="manage-users-cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="manage-users-user-info">
                    <div className="manage-users-user-header">
                      <div className="manage-users-user-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="manage-users-user-details">
                        <h3>{user.name}</h3>
                        <p className="manage-users-user-email">{user.email}</p>
                        <div
                          className="manage-users-user-role"
                          style={{ color: getRoleColor(user.role) }}
                        >
                          {getRoleLabel(user.role)}
                        </div>
                      </div>
                    </div>

                    <div className="manage-users-user-meta">
                      <div className="manage-users-meta-item">
                        <span className="manage-users-meta-label">
                          Created:
                        </span>
                        <span className="manage-users-meta-value">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                      {user.createdBy && (
                        <div className="manage-users-meta-item">
                          <span className="manage-users-meta-label">
                            Created by:
                          </span>
                          <span className="manage-users-meta-value">
                            {user.createdBy}
                          </span>
                        </div>
                      )}
                      {user.updatedAt && (
                        <div className="manage-users-meta-item">
                          <span className="manage-users-meta-label">
                            Last updated:
                          </span>
                          <span className="manage-users-meta-value">
                            {formatDate(user.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="manage-users-user-actions">
                      <button
                        onClick={() => startEditing(user)}
                        className="manage-users-edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUserAccount(user.id, user.name)}
                        className="manage-users-delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;

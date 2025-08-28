import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import "./TournamentManagement.css";

const TournamentManagement = () => {
  const { showSuccess, showError, showConfirm } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, accepted, rejected
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("registrationDate"); // registrationDate, teamName, status
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc

  useEffect(() => {
    const q = query(
      collection(db, "tournamentRegistrations"),
      orderBy("registrationDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const registrationsData = [];
      querySnapshot.forEach((doc) => {
        registrationsData.push({
          id: doc.id,
          ...doc.data(),
          registrationDate:
            doc.data().registrationDate?.toDate?.() || new Date(),
        });
      });
      setRegistrations(registrationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (registrationId, newStatus) => {
    const statusText = newStatus === "accepted" ? "accept" : "reject";
    const confirmed = await showConfirm({
      title: `${newStatus === "accepted" ? "Accept" : "Reject"} Registration`,
      message: `Are you sure you want to ${statusText} this team's registration?`,
      confirmText: newStatus === "accepted" ? "Accept" : "Reject",
      cancelText: "Cancel",
      type: newStatus === "accepted" ? "info" : "warning",
    });

    if (confirmed) {
      try {
        await updateDoc(doc(db, "tournamentRegistrations", registrationId), {
          status: newStatus,
          updatedAt: new Date(),
        });
        showSuccess(`Registration ${newStatus} successfully`);
      } catch (error) {
        console.error("Error updating status:", error);
        showError("Failed to update registration status");
      }
    }
  };

  const handleDelete = async (registrationId) => {
    const confirmed = await showConfirm({
      title: "Delete Registration",
      message:
        "Are you sure you want to delete this registration? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "tournamentRegistrations", registrationId));
        showSuccess("Registration deleted successfully");
      } catch (error) {
        console.error("Error deleting registration:", error);
        showError("Failed to delete registration");
      }
    }
  };

  const filteredRegistrations = registrations.filter((registration) => {
    const matchesFilter = filter === "all" || registration.status === filter;
    const matchesSearch =
      registration.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.player1Name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      registration.player2Name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      registration.contactNumber.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  // Sort registrations
  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "teamName":
        aValue = a.teamName.toLowerCase();
        bValue = b.teamName.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "registrationDate":
      default:
        aValue = a.registrationDate;
        bValue = b.registrationDate;
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "accepted":
        return "status-accepted";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  const getStatusBadgeText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="tournament-management">
        <div className="tournament-container">
          <div className="loading">Loading tournament registrations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-management">
      <div className="tournament-container">
        <div className="tournament-header">
          <h1>🏆 Tournament Management</h1>
          <p>Manage tournament registrations and participants</p>
        </div>

        <div className="tournament-controls">
          <div className="search-filter-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by team name, player names, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-sort-section">
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All ({registrations.length})
                </button>
                <button
                  className={`filter-btn ${
                    filter === "pending" ? "active" : ""
                  }`}
                  onClick={() => setFilter("pending")}
                >
                  Pending (
                  {registrations.filter((r) => r.status === "pending").length})
                </button>
                <button
                  className={`filter-btn ${
                    filter === "accepted" ? "active" : ""
                  }`}
                  onClick={() => setFilter("accepted")}
                >
                  Accepted (
                  {registrations.filter((r) => r.status === "accepted").length})
                </button>
                <button
                  className={`filter-btn ${
                    filter === "rejected" ? "active" : ""
                  }`}
                  onClick={() => setFilter("rejected")}
                >
                  Rejected (
                  {registrations.filter((r) => r.status === "rejected").length})
                </button>
              </div>

              <div className="sort-controls">
                <label htmlFor="sortBy">Sort by:</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="registrationDate">Registration Date</option>
                  <option value="teamName">Team Name</option>
                  <option value="status">Status</option>
                </select>

                <button
                  className={`sort-btn ${sortOrder === "asc" ? "active" : ""}`}
                  onClick={() => setSortOrder("asc")}
                  title="Ascending"
                >
                  ↑
                </button>
                <button
                  className={`sort-btn ${sortOrder === "desc" ? "active" : ""}`}
                  onClick={() => setSortOrder("desc")}
                  title="Descending"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="tournament-stats">
          <div className="stat-card">
            <h3>Total Registrations</h3>
            <p className="stat-number">{registrations.length}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Review</h3>
            <p className="stat-number pending">
              {registrations.filter((r) => r.status === "pending").length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Accepted</h3>
            <p className="stat-number accepted">
              {registrations.filter((r) => r.status === "accepted").length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Rejected</h3>
            <p className="stat-number rejected">
              {registrations.filter((r) => r.status === "rejected").length}
            </p>
          </div>
        </div>

        <div className="registrations-list">
          {filteredRegistrations.length === 0 ? (
            <div className="no-registrations">
              <p>No registrations found matching your criteria.</p>
            </div>
          ) : (
            sortedRegistrations.map((registration) => (
              <div key={registration.id} className="registration-card">
                <div className="registration-header">
                  <div className="team-info">
                    <h3>{registration.teamName}</h3>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        registration.status
                      )}`}
                    >
                      {getStatusBadgeText(registration.status)}
                    </span>
                  </div>
                  <div className="registration-date">
                    Registered: {formatDate(registration.registrationDate)}
                  </div>
                </div>

                <div className="players-info">
                  <div className="player">
                    <strong>Player 1:</strong> {registration.player1Name} (Age:{" "}
                    {registration.player1Age})
                  </div>
                  <div className="player">
                    <strong>Player 2:</strong> {registration.player2Name} (Age:{" "}
                    {registration.player2Age})
                  </div>
                </div>

                <div className="contact-info">
                  <div className="contact-item">
                    <strong>Contact:</strong> {registration.contactNumber}
                  </div>
                  <div className="contact-item">
                    <strong>How they heard:</strong>{" "}
                    {registration.howDidYouHear}
                  </div>
                  <div className="contact-item">
                    <strong>Total Fee:</strong> {registration.totalFee} شيكل
                  </div>
                </div>

                <div className="registration-actions">
                  {registration.status === "pending" && (
                    <>
                      <button
                        className="action-btn accept-btn"
                        onClick={() =>
                          handleStatusUpdate(registration.id, "accepted")
                        }
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() =>
                          handleStatusUpdate(registration.id, "rejected")
                        }
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}

                  {registration.status === "accepted" && (
                    <button
                      className="action-btn reject-btn"
                      onClick={() =>
                        handleStatusUpdate(registration.id, "rejected")
                      }
                    >
                      ✗ Reject
                    </button>
                  )}

                  {registration.status === "rejected" && (
                    <button
                      className="action-btn accept-btn"
                      onClick={() =>
                        handleStatusUpdate(registration.id, "accepted")
                      }
                    >
                      ✓ Accept
                    </button>
                  )}

                  <button
                    className="action-btn tournament-delete-btn"
                    onClick={() => handleDelete(registration.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentManagement;

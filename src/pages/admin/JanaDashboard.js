import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./JanaDashboard.css";
import { useToast } from "../../contexts/ToastContext";
import {
  sendApprovalEmail,
  sendRejectionEmail,
} from "../../services/emailService";

const JanaDashboard = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [birthdayPackages, setBirthdayPackages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("all"); // all, pending, approved, rejected

  // Form states
  const [newMenuItem, setNewMenuItem] = useState({ name: "", image: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newBirthdayPackage, setNewBirthdayPackage] = useState({
    title: "",
    price: "",
    items: [""],
    maxPeople: "",
    duration: "",
  });
  const [newOffer, setNewOffer] = useState({
    spend: "",
    get: "",
  });
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editPackageData, setEditPackageData] = useState({
    title: "",
    price: "",
    items: [""],
    maxPeople: "",
    duration: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      setBookings(
        bookingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch menu items
      const menuSnapshot = await getDocs(collection(db, "menu"));
      setMenuItems(
        menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch feedback
      const feedbackSnapshot = await getDocs(
        query(collection(db, "feedback"), orderBy("createdAt", "desc"))
      );
      setFeedback(
        feedbackSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch birthday packages
      const birthdayPackagesSnapshot = await getDocs(
        collection(db, "birthdayPackages")
      );
      setBirthdayPackages(
        birthdayPackagesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

      // Fetch offers
      const offersSnapshot = await getDocs(collection(db, "offers"));
      setOffers(
        offersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch FAQs
      const faqsSnapshot = await getDocs(collection(db, "faqs"));
      setFaqs(faqsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // Booking management
  const updateBooking = async (bookingId, updates) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), updates);
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, ...updates } : booking
        )
      );
      setEditingBooking(null);
      showSuccess("Booking updated successfully!");
    } catch (error) {
      showError("Error updating booking: " + error.message);
    }
  };

  const cancelBooking = async (bookingId) => {
    const confirmed = await showConfirm({
      title: "Cancel Booking",
      message:
        "Are you sure you want to cancel this booking? This action cannot be undone.",
      confirmText: "Cancel Booking",
      cancelText: "Keep Booking",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "bookings", bookingId));
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
        showSuccess("Booking cancelled successfully!");
      } catch (error) {
        showError("Error cancelling booking: " + error.message);
      }
    }
  };

  // Image upload to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ignite"); // Replace with your Cloudinary upload preset

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dxfonorpp/image/upload", // Replace with your cloud name
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Menu management
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setNewMenuItem({ ...newMenuItem, image: imageUrl });
    } catch (error) {
      showError("Error uploading image: " + error.message);
    }
    setUploadingImage(false);
  };

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.image) {
      showWarning("Please fill all fields and upload an image");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "menu"), newMenuItem);
      setMenuItems([...menuItems, { id: docRef.id, ...newMenuItem }]);
      setNewMenuItem({ name: "", image: "" });
      showSuccess("Menu item added successfully!");
    } catch (error) {
      showError("Error adding menu item: " + error.message);
    }
  };

  const deleteMenuItem = async (itemId) => {
    const confirmed = await showConfirm({
      title: "Delete Menu Item",
      message:
        "Are you sure you want to delete this menu item? This action cannot be undone.",
      confirmText: "Delete Item",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "menu", itemId));
        setMenuItems(menuItems.filter((item) => item.id !== itemId));
        showSuccess("Menu item deleted successfully!");
      } catch (error) {
        showError("Error deleting menu item: " + error.message);
      }
    }
  };

  // Feedback management
  const deleteFeedback = async (feedbackId) => {
    const confirmed = await showConfirm({
      title: "Delete Feedback",
      message:
        "Are you sure you want to delete this feedback? This action cannot be undone.",
      confirmText: "Delete Feedback",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "feedback", feedbackId));
        setFeedback(feedback.filter((item) => item.id !== feedbackId));
        showSuccess("Feedback deleted successfully!");
      } catch (error) {
        showError("Error deleting feedback: " + error.message);
      }
    }
  };

  // Birthday package management
  const addBirthdayPackage = async () => {
    if (!newBirthdayPackage.title || !newBirthdayPackage.price) {
      showWarning("Please fill all required fields");
      return;
    }

    try {
      const packageData = {
        ...newBirthdayPackage,
        items: newBirthdayPackage.items.filter((item) => item.trim() !== ""),
        maxPeople: newBirthdayPackage.maxPeople, // Keep as string, don't parse to int
        duration: parseInt(newBirthdayPackage.duration),
      };
      const docRef = await addDoc(
        collection(db, "birthdayPackages"),
        packageData
      );
      setBirthdayPackages([
        ...birthdayPackages,
        { id: docRef.id, ...packageData },
      ]);
      setNewBirthdayPackage({
        title: "",
        price: "",
        items: [""],
        maxPeople: "",
        duration: "",
      });
      showSuccess("Birthday package added successfully!");
    } catch (error) {
      showError("Error adding birthday package: " + error.message);
    }
  };

  const deleteBirthdayPackage = async (packageId) => {
    const confirmed = await showConfirm({
      title: "Delete Birthday Package",
      message:
        "Are you sure you want to delete this birthday package? This action cannot be undone.",
      confirmText: "Delete Package",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "birthdayPackages", packageId));
        setBirthdayPackages(
          birthdayPackages.filter((pkg) => pkg.id !== packageId)
        );
        showSuccess("Birthday package deleted successfully!");
      } catch (error) {
        showError("Error deleting birthday package: " + error.message);
      }
    }
  };

  const startEditingPackage = (pkg) => {
    setEditingPackage(pkg.id);
    setEditPackageData({
      title: pkg.title,
      price: pkg.price,
      items: [...pkg.items],
      maxPeople: pkg.maxPeople,
      duration: pkg.duration,
    });
  };

  const updateBirthdayPackage = async () => {
    if (!editPackageData.title || !editPackageData.price) {
      showWarning("Please fill all required fields");
      return;
    }

    try {
      const packageData = {
        ...editPackageData,
        items: editPackageData.items.filter((item) => item.trim() !== ""),
        maxPeople: editPackageData.maxPeople, // Keep as string, don't parse to int
        duration: parseInt(editPackageData.duration),
      };

      await updateDoc(doc(db, "birthdayPackages", editingPackage), packageData);

      setBirthdayPackages(
        birthdayPackages.map((pkg) =>
          pkg.id === editingPackage
            ? { id: editingPackage, ...packageData }
            : pkg
        )
      );

      setEditingPackage(null);
      setEditPackageData({
        title: "",
        price: "",
        items: [""],
        maxPeople: "",
        duration: "",
      });

      showSuccess("Birthday package updated successfully!");
    } catch (error) {
      showError("Error updating birthday package: " + error.message);
    }
  };

  const cancelEditingPackage = () => {
    setEditingPackage(null);
    setEditPackageData({
      title: "",
      price: "",
      items: [""],
      maxPeople: "",
      duration: "",
    });
  };

  // Offers management
  const addOffer = async () => {
    if (!newOffer.spend || !newOffer.get) {
      showWarning("Please fill all required fields");
      return;
    }

    if (parseInt(newOffer.spend) <= 0 || parseInt(newOffer.get) <= 0) {
      showWarning("Please enter valid positive numbers");
      return;
    }

    try {
      const offerData = {
        spend: parseInt(newOffer.spend),
        get: parseInt(newOffer.get),
      };
      const docRef = await addDoc(collection(db, "offers"), offerData);
      setOffers([...offers, { id: docRef.id, ...offerData }]);
      setNewOffer({ spend: "", get: "" });
      showSuccess("Offer added successfully!");
    } catch (error) {
      showError("Error adding offer: " + error.message);
    }
  };

  const deleteOffer = async (offerId) => {
    const confirmed = await showConfirm({
      title: "Delete Offer",
      message:
        "Are you sure you want to delete this offer? This action cannot be undone.",
      confirmText: "Delete Offer",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "offers", offerId));
        setOffers(offers.filter((offer) => offer.id !== offerId));
        showSuccess("Offer deleted successfully!");
      } catch (error) {
        showError("Error deleting offer: " + error.message);
      }
    }
  };

  // FAQ management
  const addFaq = async () => {
    if (!newFaq.question || !newFaq.answer) {
      showWarning("Please fill all required fields");
      return;
    }

    try {
      const faqData = {
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "faqs"), faqData);
      setFaqs([...faqs, { id: docRef.id, ...faqData }]);
      setNewFaq({ question: "", answer: "" });
      showSuccess("FAQ added successfully!");
    } catch (error) {
      showError("Error adding FAQ: " + error.message);
    }
  };

  const deleteFaq = async (faqId) => {
    const confirmed = await showConfirm({
      title: "Delete FAQ",
      message:
        "Are you sure you want to delete this FAQ? This action cannot be undone.",
      confirmText: "Delete FAQ",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "faqs", faqId));
        setFaqs(faqs.filter((faq) => faq.id !== faqId));
        showSuccess("FAQ deleted successfully!");
      } catch (error) {
        showError("Error deleting FAQ: " + error.message);
      }
    }
  };

  // Booking approval functions
  const approveBooking = async (bookingId) => {
    const confirmed = await showConfirm({
      title: "Approve Booking",
      message:
        "Are you sure you want to approve this booking? The customer will be notified via email.",
      confirmText: "Approve & Send Email",
      cancelText: "Cancel",
      type: "info",
    });

    if (confirmed) {
      try {
        const booking = bookings.find((b) => b.id === bookingId);

        // Check if booking has email
        if (!booking.email || booking.email.trim() === "") {
          showWarning(
            "This booking doesn't have an email address. Approving without sending email."
          );
        }

        await updateDoc(doc(db, "bookings", bookingId), {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: "admin",
        });

        setBookings(
          bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "approved", approvedAt: new Date() }
              : booking
          )
        );

        // Send approval email only if email exists
        if (booking.email && booking.email.trim() !== "") {
          console.log("Attempting to send approval email to:", booking.email); // Debug log
          const emailResult = await sendApprovalEmail(booking);
          if (emailResult.success) {
            showSuccess("Booking approved and confirmation email sent!");
          } else {
            console.error("Email sending failed:", emailResult.error); // Debug log
            showWarning(
              `Booking approved but email failed to send: ${emailResult.error}`
            );
          }
        } else {
          showSuccess("Booking approved! (No email on file)");
        }
      } catch (error) {
        showError("Error approving booking: " + error.message);
      }
    }
  };

  const startRejectBooking = (bookingId) => {
    setBookingToReject(bookingId);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const confirmRejectBooking = async () => {
    if (!bookingToReject) return;

    try {
      const booking = bookings.find((b) => b.id === bookingToReject);

      // Check if booking has email
      if (!booking.email || booking.email.trim() === "") {
        showWarning(
          "This booking doesn't have an email address. Rejecting without sending email."
        );
      }

      await updateDoc(doc(db, "bookings", bookingToReject), {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: "admin",
        rejectionReason: rejectionReason,
      });

      setBookings(
        bookings.map((booking) =>
          booking.id === bookingToReject
            ? {
                ...booking,
                status: "rejected",
                rejectedAt: new Date(),
                rejectionReason: rejectionReason,
              }
            : booking
        )
      );

      // Send rejection email only if email exists
      if (booking.email && booking.email.trim() !== "") {
        console.log("Attempting to send rejection email to:", booking.email); // Debug log
        const emailResult = await sendRejectionEmail(booking, rejectionReason);
        if (emailResult.success) {
          showSuccess("Booking rejected and notification email sent!");
        } else {
          console.error("Email sending failed:", emailResult.error); // Debug log
          showWarning(
            `Booking rejected but email failed to send: ${emailResult.error}`
          );
        }
      } else {
        showSuccess("Booking rejected! (No email on file)");
      }

      setShowRejectionModal(false);
      setBookingToReject(null);
      setRejectionReason("");
    } catch (error) {
      showError("Error rejecting booking: " + error.message);
    }
  };

  const cancelRejectBooking = () => {
    setShowRejectionModal(false);
    setBookingToReject(null);
    setRejectionReason("");
  };

  const addContactAttempt = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      const newAttempts = (booking.contactAttempts || 0) + 1;

      await updateDoc(doc(db, "bookings", bookingId), {
        contactAttempts: newAttempts,
        lastContactAttempt: new Date(),
      });

      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                contactAttempts: newAttempts,
                lastContactAttempt: new Date(),
              }
            : booking
        )
      );

      showSuccess(`Contact attempt #${newAttempts} recorded`);
    } catch (error) {
      showError("Error recording contact attempt: " + error.message);
    }
  };

  // Filter bookings based on status
  const getFilteredBookings = () => {
    if (bookingFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === bookingFilter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "approved":
        return "#22c55e";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <div className="jana-dashboard">
      <div className="container">
        <h1>Jana's Management Dashboard</h1>

        <div className="tab-navigation">
          <button
            className={activeTab === "bookings" ? "active" : ""}
            onClick={() => setActiveTab("bookings")}
          >
            📅 Manage Bookings
          </button>
          <button
            className={activeTab === "menu" ? "active" : ""}
            onClick={() => setActiveTab("menu")}
          >
            🍽️ Manage Menu
          </button>
          <button
            className={activeTab === "feedback" ? "active" : ""}
            onClick={() => setActiveTab("feedback")}
          >
            💬 Manage Feedback
          </button>
          <button
            className={activeTab === "birthday" ? "active" : ""}
            onClick={() => setActiveTab("birthday")}
          >
            🎉 Manage Birthday Packages
          </button>
          <button
            className={activeTab === "offers" ? "active" : ""}
            onClick={() => setActiveTab("offers")}
          >
            💰 Manage Offers
          </button>
          <button
            className={activeTab === "faqs" ? "active" : ""}
            onClick={() => setActiveTab("faqs")}
          >
            ❓ Manage FAQs
          </button>
        </div>

        {loading && <div className="loading">Loading...</div>}

        {/* Bookings Management */}
        {activeTab === "bookings" && (
          <div className="tab-content">
            <div className="bookings-header">
              <h2>Manage Bookings</h2>
              <div className="booking-filters">
                <button
                  className={`filter-btn ${
                    bookingFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("all")}
                >
                  All ({bookings.length})
                </button>
                <button
                  className={`filter-btn ${
                    bookingFilter === "pending" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("pending")}
                >
                  Pending (
                  {bookings.filter((b) => b.status === "pending").length})
                </button>
                <button
                  className={`filter-btn ${
                    bookingFilter === "approved" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("approved")}
                >
                  Approved (
                  {bookings.filter((b) => b.status === "approved").length})
                </button>
                <button
                  className={`filter-btn ${
                    bookingFilter === "rejected" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("rejected")}
                >
                  Rejected (
                  {bookings.filter((b) => b.status === "rejected").length})
                </button>
              </div>
            </div>

            <div className="bookings-list">
              {getFilteredBookings().map((booking) => (
                <div key={booking.id} className="booking-card">
                  {editingBooking === booking.id ? (
                    <div className="edit-form">
                      <input
                        type="date"
                        defaultValue={
                          new Date(booking.date).toISOString().split("T")[0]
                        }
                        onChange={(e) => (booking.newDate = e.target.value)}
                      />
                      <input
                        type="time"
                        defaultValue={booking.time}
                        onChange={(e) => (booking.newTime = e.target.value)}
                      />
                      <button
                        onClick={() =>
                          updateBooking(booking.id, {
                            date: booking.newDate || booking.date,
                            time: booking.newTime || booking.time,
                          })
                        }
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingBooking(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="booking-info">
                      <div className="booking-status-header">
                        <div
                          className="booking-status"
                          style={{ color: getStatusColor(booking.status) }}
                        >
                          {getStatusIcon(booking.status)}{" "}
                          {booking.status?.toUpperCase() || "PENDING"}
                        </div>
                        <div className="booking-date-created">
                          Created:{" "}
                          {booking.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString() || "N/A"}
                        </div>
                      </div>

                      <h3>{booking.name}</h3>
                      <p>
                        📅 {booking.date} at {booking.time}
                      </p>
                      <p>
                        👥 {booking.people} people | 🎳 {booking.rounds} rounds
                      </p>
                      <p>📞 {booking.phone}</p>
                      {booking.email && <p>📧 {booking.email}</p>}

                      {booking.type === "birthday" && booking.bundleName && (
                        <p>🎉 Package: {booking.bundleName}</p>
                      )}

                      {booking.contactAttempts > 0 && (
                        <p className="contact-attempts">
                          📞 Contact attempts: {booking.contactAttempts}
                        </p>
                      )}

                      <div className="booking-actions">
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => addContactAttempt(booking.id)}
                              className="contact-btn"
                            >
                              Mark Contact Attempt
                            </button>
                            <button
                              onClick={() => approveBooking(booking.id)}
                              className="approve-btn"
                            >
                              Approve & Email
                            </button>
                            <button
                              onClick={() => startRejectBooking(booking.id)}
                              className="reject-btn"
                            >
                              Reject & Email
                            </button>
                          </>
                        )}

                        {booking.status === "approved" && (
                          <button onClick={() => setEditingBooking(booking.id)}>
                            Edit
                          </button>
                        )}

                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="cancel"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Management */}
        {activeTab === "menu" && (
          <div className="tab-content">
            <h2>Manage Menu</h2>

            <div className="add-form">
              <h3>Add New Menu Item</h3>
              <input
                type="text"
                placeholder="Item Name"
                value={newMenuItem.name}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, name: e.target.value })
                }
              />
              <div className="image-upload-section">
                <label>Upload Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p>Uploading image...</p>}
                {newMenuItem.image && (
                  <div className="image-preview">
                    <img
                      src={newMenuItem.image}
                      alt="Preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
              <button onClick={addMenuItem} disabled={uploadingImage}>
                {uploadingImage ? "Uploading..." : "Add Item"}
              </button>
            </div>

            <div className="menu-list">
              {menuItems.map((item) => (
                <div key={item.id} className="menu-card">
                  <div className="item-image">
                    {item.image.startsWith("http") ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span>{item.image}</span>
                    )}
                  </div>
                  <span className="item-name">{item.name}</span>
                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="delete"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Management */}
        {activeTab === "feedback" && (
          <div className="tab-content">
            <h2>Manage Feedback</h2>
            <div className="feedback-list">
              {feedback.map((item) => (
                <div key={item.id} className="feedback-card">
                  <div className="feedback-header">
                    <strong>{item.name}</strong>
                    <span>{"⭐".repeat(item.rating)}</span>
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </div>
                  <p>{item.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Birthday Packages Management */}
        {activeTab === "birthday" && (
          <div className="tab-content">
            <h2>Manage Birthday Packages</h2>

            <div className="add-form">
              <h3>Add New Birthday Package</h3>
              <input
                type="text"
                placeholder="Package Title (e.g., ✨ Spark Package)"
                value={newBirthdayPackage.title}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    title: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Price (e.g., 80 ILS/person)"
                value={newBirthdayPackage.price}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    price: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Max People"
                value={newBirthdayPackage.maxPeople}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    maxPeople: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Duration in minutes"
                value={newBirthdayPackage.duration}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    duration: e.target.value,
                  })
                }
              />

              <div className="items-section">
                <label>Package Items:</label>
                {newBirthdayPackage.items.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Package item (e.g., 1 VR session)"
                    value={item}
                    onChange={(e) => {
                      const items = [...newBirthdayPackage.items];
                      items[index] = e.target.value;
                      setNewBirthdayPackage({ ...newBirthdayPackage, items });
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setNewBirthdayPackage({
                      ...newBirthdayPackage,
                      items: [...newBirthdayPackage.items, ""],
                    })
                  }
                >
                  + Add Item
                </button>
              </div>

              <button onClick={addBirthdayPackage}>Add Birthday Package</button>
            </div>

            <div className="packages-list">
              {birthdayPackages.map((pkg) => (
                <div key={pkg.id} className="package-card">
                  {editingPackage === pkg.id ? (
                    <div className="edit-package-form">
                      <input
                        type="text"
                        placeholder="Package Title"
                        value={editPackageData.title}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            title: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Price"
                        value={editPackageData.price}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            price: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Max People"
                        value={editPackageData.maxPeople}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            maxPeople: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Duration in minutes"
                        value={editPackageData.duration}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            duration: e.target.value,
                          })
                        }
                      />

                      <div className="edit-items-section">
                        <label>Package Items:</label>
                        {editPackageData.items.map((item, index) => (
                          <input
                            key={index}
                            type="text"
                            placeholder="Package item"
                            value={item}
                            onChange={(e) => {
                              const items = [...editPackageData.items];
                              items[index] = e.target.value;
                              setEditPackageData({ ...editPackageData, items });
                            }}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setEditPackageData({
                              ...editPackageData,
                              items: [...editPackageData.items, ""],
                            })
                          }
                        >
                          + Add Item
                        </button>
                      </div>

                      <div className="edit-package-actions">
                        <button onClick={updateBirthdayPackage}>Save</button>
                        <button onClick={cancelEditingPackage}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{pkg.title}</h3>
                      <p className="price">{pkg.price}</p>
                      <p className="package-details">
                        👥 Max: {pkg.maxPeople} people | ⏱️ Duration:{" "}
                        {pkg.duration} minutes
                      </p>
                      <ul>
                        {pkg.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                      <div className="package-actions">
                        <button
                          onClick={() => startEditingPackage(pkg)}
                          className="edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteBirthdayPackage(pkg.id)}
                          className="delete"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offers Management */}
        {activeTab === "offers" && (
          <div className="tab-content">
            <h2>Manage Points Offers</h2>

            <div className="add-form">
              <h3>Add New Offer</h3>
              <div className="offer-input-group">
                <input
                  type="number"
                  placeholder="Spend Amount (ILS)"
                  value={newOffer.spend}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, spend: e.target.value })
                  }
                  min="1"
                />
                <span className="arrow-text">&rarr;</span>
                <input
                  type="number"
                  placeholder="Points to Get"
                  value={newOffer.get}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, get: e.target.value })
                  }
                  min="1"
                />
              </div>
              <button onClick={addOffer}>Add Offer</button>
            </div>

            <div className="offers-list">
              {offers
                .sort((a, b) => a.spend - b.spend)
                .map((offer) => (
                  <div key={offer.id} className="offer-card">
                    <div className="offer-display">
                      <div className="spend-section">
                        <span className="currency">&#8362;</span>
                        <span className="amount">{offer.spend}</span>
                        <span className="label">Spend</span>
                      </div>
                      <div className="arrow-section">
                        <span>&rarr;</span>
                      </div>
                      <div className="get-section">
                        <span className="points">{offer.get}</span>
                        <span className="label">Points</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* FAQs Management */}
        {activeTab === "faqs" && (
          <div className="tab-content">
            <h2>Manage Frequently Asked Questions</h2>

            <div className="add-form">
              <h3>Add New FAQ</h3>
              <input
                type="text"
                placeholder="Question"
                value={newFaq.question}
                onChange={(e) =>
                  setNewFaq({ ...newFaq, question: e.target.value })
                }
              />
              <textarea
                placeholder="Answer"
                value={newFaq.answer}
                onChange={(e) =>
                  setNewFaq({ ...newFaq, answer: e.target.value })
                }
                rows="4"
              />
              <button onClick={addFaq}>Add FAQ</button>
            </div>

            <div className="faqs-list">
              {faqs.map((faq) => (
                <div key={faq.id} className="faq-card">
                  <div className="faq-question">
                    <h4>❓ {faq.question}</h4>
                  </div>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                  <button onClick={() => deleteFaq(faq.id)} className="delete">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="rejection-modal-overlay" onClick={cancelRejectBooking}>
          <div className="rejection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rejection-modal-header">
              <h3>Reject Booking</h3>
            </div>

            <div className="rejection-modal-body">
              <p>
                Please provide a reason for rejecting this booking. This will be
                included in the email to the customer.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., 'The requested time slot is no longer available', 'Capacity is full for that date', etc.)"
                rows="4"
                className="rejection-reason-input"
              />

              <div className="rejection-reason-suggestions">
                <p>
                  <strong>Common reasons:</strong>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason(
                      "The requested time slot is no longer available."
                    )
                  }
                  className="suggestion-btn"
                >
                  Time slot unavailable
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason(
                      "We are at full capacity for the requested date."
                    )
                  }
                  className="suggestion-btn"
                >
                  Full capacity
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason(
                      "Unable to accommodate the requested party size."
                    )
                  }
                  className="suggestion-btn"
                >
                  Party size issue
                </button>
              </div>
            </div>

            <div className="rejection-modal-actions">
              <button onClick={cancelRejectBooking} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={confirmRejectBooking}
                className="confirm-reject-btn"
                disabled={!rejectionReason.trim()}
              >
                Reject & Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add styles for the new features */}
      <style jsx>{`
        .bookings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .booking-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .filter-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .filter-btn:hover:not(.active) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .booking-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .booking-status {
          font-weight: bold;
          font-size: 14px;
        }

        .booking-date-created {
          font-size: 12px;
          color: #6b7280;
        }

        .contact-attempts {
          color: #f59e0b;
          font-weight: 500;
        }

        .booking-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .approve-btn {
          background: #22c55e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .approve-btn:hover {
          background: #16a34a;
        }

        .reject-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .reject-btn:hover {
          background: #dc2626;
        }

        .contact-btn {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .contact-btn:hover {
          background: #d97706;
        }

        .rejection-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10002;
        }

        .rejection-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .rejection-modal-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .rejection-modal-header h3 {
          margin: 0;
          color: #ef4444;
        }

        .rejection-modal-body {
          padding: 24px;
        }

        .rejection-modal-body p {
          margin-bottom: 16px;
          color: #6b7280;
          line-height: 1.5;
        }

        .rejection-reason-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
        }

        .rejection-reason-input:focus {
          outline: none;
          border-color: #ef4444;
        }

        .rejection-reason-suggestions {
          margin-bottom: 16px;
        }

        .rejection-reason-suggestions p {
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .suggestion-btn {
          display: inline-block;
          margin: 4px 8px 4px 0;
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-btn:hover {
          background: #e5e7eb;
        }

        .rejection-modal-actions {
          padding: 16px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
        }

        .confirm-reject-btn {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .confirm-reject-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .confirm-reject-btn:hover:not(:disabled) {
          background: #dc2626;
        }

        @media (max-width: 768px) {
          .bookings-header {
            flex-direction: column;
            align-items: stretch;
          }

          .booking-filters {
            justify-content: center;
          }

          .booking-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default JanaDashboard;

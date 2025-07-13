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

const JanaDashboard = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [birthdayPackages, setBirthdayPackages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newMenuItem, setNewMenuItem] = useState({ name: "", image: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newBirthdayPackage, setNewBirthdayPackage] = useState({
    title: "",
    price: "",
    items: [""],
    maxPeople: 10,
    duration: 90,
  });
  const [newOffer, setNewOffer] = useState({
    spend: "",
    get: "",
  });
  const [editingBooking, setEditingBooking] = useState(null);

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
      alert("Booking updated successfully!");
    } catch (error) {
      alert("Error updating booking: " + error.message);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await deleteDoc(doc(db, "bookings", bookingId));
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
        alert("Booking cancelled successfully!");
      } catch (error) {
        alert("Error cancelling booking: " + error.message);
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
      alert("Please select an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setNewMenuItem({ ...newMenuItem, image: imageUrl });
    } catch (error) {
      alert("Error uploading image: " + error.message);
    }
    setUploadingImage(false);
  };

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.image) {
      alert("Please fill all fields and upload an image");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "menu"), newMenuItem);
      setMenuItems([...menuItems, { id: docRef.id, ...newMenuItem }]);
      setNewMenuItem({ name: "", image: "" });
      alert("Menu item added successfully!");
    } catch (error) {
      alert("Error adding menu item: " + error.message);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteDoc(doc(db, "menu", itemId));
        setMenuItems(menuItems.filter((item) => item.id !== itemId));
        alert("Menu item deleted successfully!");
      } catch (error) {
        alert("Error deleting menu item: " + error.message);
      }
    }
  };

  // Feedback management
  const deleteFeedback = async (feedbackId) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        await deleteDoc(doc(db, "feedback", feedbackId));
        setFeedback(feedback.filter((item) => item.id !== feedbackId));
        alert("Feedback deleted successfully!");
      } catch (error) {
        alert("Error deleting feedback: " + error.message);
      }
    }
  };

  // Birthday package management
  const addBirthdayPackage = async () => {
    if (!newBirthdayPackage.title || !newBirthdayPackage.price) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const packageData = {
        ...newBirthdayPackage,
        items: newBirthdayPackage.items.filter((item) => item.trim() !== ""),
        maxPeople: parseInt(newBirthdayPackage.maxPeople),
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
        maxPeople: 10,
        duration: 90,
      });
      alert("Birthday package added successfully!");
    } catch (error) {
      alert("Error adding birthday package: " + error.message);
    }
  };

  const deleteBirthdayPackage = async (packageId) => {
    if (
      window.confirm("Are you sure you want to delete this birthday package?")
    ) {
      try {
        await deleteDoc(doc(db, "birthdayPackages", packageId));
        setBirthdayPackages(
          birthdayPackages.filter((pkg) => pkg.id !== packageId)
        );
        alert("Birthday package deleted successfully!");
      } catch (error) {
        alert("Error deleting birthday package: " + error.message);
      }
    }
  };

  // Offers management
  const addOffer = async () => {
    if (!newOffer.spend || !newOffer.get) {
      alert("Please fill all required fields");
      return;
    }

    if (parseInt(newOffer.spend) <= 0 || parseInt(newOffer.get) <= 0) {
      alert("Please enter valid positive numbers");
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
      alert("Offer added successfully!");
    } catch (error) {
      alert("Error adding offer: " + error.message);
    }
  };

  const deleteOffer = async (offerId) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        await deleteDoc(doc(db, "offers", offerId));
        setOffers(offers.filter((offer) => offer.id !== offerId));
        alert("Offer deleted successfully!");
      } catch (error) {
        alert("Error deleting offer: " + error.message);
      }
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
        </div>

        {loading && <div className="loading">Loading...</div>}

        {/* Bookings Management */}
        {activeTab === "bookings" && (
          <div className="tab-content">
            <h2>Manage Bookings</h2>
            <div className="bookings-list">
              {bookings.map((booking) => (
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
                      <h3>{booking.name}</h3>
                      <p>
                        📅 {booking.date} at {booking.time}
                      </p>
                      <p>
                        👥 {booking.people} people | 🎳 {booking.rounds} rounds
                      </p>
                      <p>📞 {booking.phone}</p>
                      <div className="booking-actions">
                        <button onClick={() => setEditingBooking(booking.id)}>
                          Edit
                        </button>
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="cancel"
                        >
                          Cancel
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
                type="number"
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
                type="number"
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
                  <h3>{pkg.title}</h3>
                  <p className="price">{pkg.price}</p>
                  <p className="package-details">
                    👥 Max: {pkg.maxPeople} people | ⏱️ Duration: {pkg.duration}{" "}
                    minutes
                  </p>
                  <ul>
                    {pkg.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => deleteBirthdayPackage(pkg.id)}
                    className="delete"
                  >
                    Delete
                  </button>
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
                <span className="arrow-text">→</span>
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
                        <span className="currency">₪</span>
                        <span className="amount">{offer.spend}</span>
                        <span className="label">Spend</span>
                      </div>
                      <div className="arrow-section">
                        <span>→</span>
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
      </div>
    </div>
  );
};

export default JanaDashboard;

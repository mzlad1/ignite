import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./Booking.css";
import { useToast } from "../contexts/ToastContext";

const Booking = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useToast();
  const [bookingType, setBookingType] = useState("regular");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "", // Add email field
    people: 1,
    rounds: 1,
    date: new Date(),
    time: "",
    bundleId: "",
    bundleName: "",
    bundlePrice: "",
    duration: 45, // default 45 minutes
  });
  const [slotAvailability, setSlotAvailability] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [birthdayPackages, setBirthdayPackages] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const timeSlots = [
    "15:00",
    "15:45",
    "16:30",
    "17:15",
    "18:00",
    "18:45",
    "19:30",
    "20:15",
    "21:00",
    "21:45",
    "22:30",
  ];

  const MAX_LANES = 6; // Total number of bowling lanes

  useEffect(() => {
    fetchSlotAvailability();
    fetchBirthdayPackages();
  }, [formData.date]);

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes back to time string
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Get all time slots that would be occupied by a booking
  const getOccupiedSlots = (startTime, duration) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const occupiedSlots = [];

    timeSlots.forEach((slot) => {
      const slotMinutes = timeToMinutes(slot);
      const slotEndMinutes = slotMinutes + 45; // Each regular slot is 45 minutes

      // Check if there's any overlap
      if (!(endMinutes <= slotMinutes || startMinutes >= slotEndMinutes)) {
        occupiedSlots.push(slot);
      }
    });

    return occupiedSlots;
  };

  const fetchSlotAvailability = async () => {
    const dateStr = formData.date.toDateString();
    const q = query(collection(db, "bookings"), where("date", "==", dateStr));
    const querySnapshot = await getDocs(q);

    // Count lane usage for each time slot considering duration
    const laneUsage = {};
    timeSlots.forEach((slot) => {
      laneUsage[slot] = 0;
    });

    querySnapshot.docs.forEach((doc) => {
      const booking = doc.data();
      const startTime = booking.time;
      const duration = booking.duration || 45; // Default to 45 minutes if not specified

      const occupiedSlots = getOccupiedSlots(startTime, duration);
      occupiedSlots.forEach((slot) => {
        if (laneUsage[slot] !== undefined) {
          laneUsage[slot] += 1;
        }
      });
    });

    setSlotAvailability(laneUsage);
  };

  const fetchBirthdayPackages = async () => {
    try {
      const packagesSnapshot = await getDocs(
        collection(db, "birthdayPackages")
      );
      setBirthdayPackages(
        packagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching birthday packages:", error);
    }
  };

  const getAvailableSlots = (timeSlot) => {
    const usedLanes = slotAvailability[timeSlot] || 0;
    return MAX_LANES - usedLanes;
  };

  const isSlotAvailable = (startTime, duration) => {
    const occupiedSlots = getOccupiedSlots(startTime, duration);
    return occupiedSlots.every((slot) => getAvailableSlots(slot) > 0);
  };

  const isSlotFull = (timeSlot) => {
    return getAvailableSlots(timeSlot) <= 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if all required slots are available for the booking duration
    if (!isSlotAvailable(formData.time, formData.duration)) {
      showWarning(
        "Sorry, this time slot conflicts with existing bookings. Please select another time."
      );
      return;
    }

    try {
      const bookingData = {
        ...formData,
        date: formData.date.toDateString(),
        createdAt: new Date(),
        type: bookingType,
        status: "pending", // Add pending status
        contactAttempts: 0,
        notes: "",
      };

      const docRef = await addDoc(collection(db, "bookings"), bookingData);

      // Store booking details for the modal
      setBookingDetails({
        id: docRef.id,
        ...bookingData,
      });

      // Show booking confirmation modal
      setShowBookingModal(true);

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "", // Reset email
        people: 1,
        rounds: 1,
        date: new Date(),
        time: "",
        bundleId: "",
        bundleName: "",
        bundlePrice: "",
        duration: 45,
      });
      setBookingType("regular");
    } catch (error) {
      showError("Error submitting booking: " + error.message);
    }
  };

  const getBookingTypeLabel = () => {
    switch (bookingType) {
      case "birthday":
        return "Birthday Package";
      default:
        return "Regular";
    }
  };

  const handleBirthdaySelect = (pkg) => {
    setFormData({
      ...formData,
      bundleId: pkg.id,
      bundleName: pkg.title,
      bundlePrice: pkg.price,
      duration: pkg.duration,
      people: pkg.maxPeople, // Automatically set people count to package max
    });
  };

  // Custom Calendar Functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const changeMonth = (increment) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + increment,
        1
      )
    );
  };

  const selectDate = (day) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (!isPastDate(selectedDate)) {
      setFormData({ ...formData, date: selectedDate, time: "" });
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isSelected = isSameDay(date, formData.date);
      const isPast = isPastDate(date);
      const isTodayDate = isToday(date);

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? "selected" : ""} ${
            isPast ? "past" : ""
          } ${isTodayDate ? "today" : ""}`}
          onClick={() => selectDate(day)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="custom-calendar">
        <div className="calendar-header">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="month-nav"
          >
            ‹
          </button>
          <h3>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="month-nav"
          >
            ›
          </button>
        </div>

        <div className="calendar-weekdays">
          {dayNames.map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">{days}</div>
      </div>
    );
  };

  // Booking Confirmation Modal Component
  const BookingConfirmationModal = () => {
    if (!showBookingModal || !bookingDetails) return null;

    return (
      <div
        className="booking-modal-overlay"
        onClick={() => setShowBookingModal(false)}
      >
        <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
          <div className="booking-modal-header">
            <div className="success-icon">🎉</div>
            <h2>Booking Submitted Successfully!</h2>
          </div>

          <div className="booking-modal-body">
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="booking-detail">
                <span className="label">Name:</span>
                <span className="value">{bookingDetails.name}</span>
              </div>
              <div className="booking-detail">
                <span className="label">Date & Time:</span>
                <span className="value">
                  {bookingDetails.date} at {bookingDetails.time}
                </span>
              </div>
              <div className="booking-detail">
                <span className="label">People:</span>
                <span className="value">{bookingDetails.people}</span>
              </div>
              {bookingDetails.type === "regular" ? (
                <div className="booking-detail">
                  <span className="label">Rounds:</span>
                  <span className="value">{bookingDetails.rounds}</span>
                </div>
              ) : (
                <div className="booking-detail">
                  <span className="label">Package:</span>
                  <span className="value">{bookingDetails.bundleName}</span>
                </div>
              )}
              <div className="booking-detail">
                <span className="label">Phone:</span>
                <span className="value">{bookingDetails.phone}</span>
              </div>
            </div>

            <div className="status-message">
              <div className="status-icon">⏳</div>
              <h4>Your booking is pending confirmation</h4>
              <p>
                We have received your booking request. Our team will contact you
                via WhatsApp at <strong>{bookingDetails.phone}</strong> within
                the next few hours to confirm your booking details and
                availability.
              </p>
              <div className="next-steps">
                <h5>What happens next?</h5>
                <ul>
                  <li>📞 We'll call or WhatsApp you to confirm</li>
                  <li>✅ Once confirmed, your booking will be secured</li>
                  <li>📧 You'll receive final confirmation details</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="booking-modal-footer">
            <button
              className="modal-close-btn"
              onClick={() => setShowBookingModal(false)}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="booking">
      <div className="container">
        <h1>🎳 Bowling Booking</h1>

        <div className="booking-type-selector">
          <button
            type="button"
            className={`type-btn ${bookingType === "regular" ? "active" : ""}`}
            onClick={() => {
              setBookingType("regular");
              setFormData({
                ...formData,
                duration: 45,
                bundleId: "",
                bundleName: "",
                bundlePrice: "",
              });
            }}
          >
            🎳 Regular Booking
          </button>
          <button
            type="button"
            className={`type-btn ${bookingType === "birthday" ? "active" : ""}`}
            onClick={() => {
              setBookingType("birthday");
              setFormData({
                ...formData,
                bundleId: "",
                bundleName: "",
                bundlePrice: "",
              });
            }}
          >
            🎉 Birthday Package
          </button>
        </div>

        <div className="booking-content">
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-top-section">
              <div className="form-left-column">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    required
                  />
                  <small className="field-note">
                    We'll send confirmation emails to this address
                  </small>
                </div>

                <div className="form-group">
                  <label>WhatsApp Phone:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+970XXXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="form-right-column">
                {bookingType === "regular" && (
                  <div className="form-group">
                    <label>Number of People (max 6):</label>
                    <div className="number-selector">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`number-box ${
                            formData.people === num ? "selected" : ""
                          }`}
                          onClick={() =>
                            setFormData({ ...formData, people: num })
                          }
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bookingType === "regular" && (
                  <div className="form-group">
                    <label>Number of Rounds (max 3):</label>
                    <div className="number-selector">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`number-box ${
                            formData.rounds === num ? "selected" : ""
                          }`}
                          onClick={() =>
                            setFormData({ ...formData, rounds: num })
                          }
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {bookingType === "birthday" && (
              <div className="bundle-selection">
                <label>Select Birthday Package:</label>
                <div className="bundles-grid">
                  {birthdayPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`bundle-option ${
                        formData.bundleId === pkg.id ? "selected" : ""
                      }`}
                      onClick={() => handleBirthdaySelect(pkg)}
                    >
                      <h4>{pkg.title}</h4>
                      <p className="bundle-price">{pkg.price}</p>
                      <p className="duration-info">
                        Duration: {pkg.duration} minutes
                      </p>
                      <ul>
                        {pkg.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                      <p className="max-people">Max: {pkg.maxPeople} people</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="date-time-section">
              <div className="calendar-section">
                <label>Select Date:</label>
                {renderCalendar()}
                <p className="selected-date">
                  Selected:{" "}
                  {formData.date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="time-slots">
                <label>Available Time Slots:</label>
                {formData.duration > 45 && (
                  <p className="duration-warning">
                    ⚠️ This booking is {formData.duration} minutes long and may
                    conflict with multiple time slots
                  </p>
                )}
                <div className="slots-grid">
                  {timeSlots.map((slot) => {
                    const isAvailable = isSlotAvailable(
                      slot,
                      formData.duration
                    );
                    const occupiedSlots = getOccupiedSlots(
                      slot,
                      formData.duration
                    );

                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot ${!isAvailable ? "conflicted" : ""} ${
                          formData.time === slot ? "selected" : ""
                        }`}
                        disabled={!isAvailable}
                        onClick={() => setFormData({ ...formData, time: slot })}
                        title={
                          formData.duration > 45
                            ? `Will occupy slots: ${occupiedSlots.join(", ")}`
                            : `Single 45-minute slot`
                        }
                      >
                        <div className="slot-time">{slot}</div>
                        <div className="slot-availability">
                          {isAvailable ? "Available" : "Conflicted"}
                        </div>
                        {formData.duration > 45 && formData.time === slot && (
                          <div className="slot-duration">
                            {formData.duration}min
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="submit-section">
              <button
                type="submit"
                className="submit-btn"
                disabled={
                  !formData.time ||
                  (bookingType === "birthday" && !formData.bundleId)
                }
              >
                Book {getBookingTypeLabel()}
              </button>
            </div>
          </form>

          <div className="booking-info">
            <h3>Booking Information</h3>
            {bookingType === "regular" ? (
              <ul>
                <li>📅 Each session is 45 minutes</li>
                <li>🎳 6 lanes available per time slot</li>
                <li>👥 Maximum 6 people per booking</li>
                <li>🔄 Maximum 3 rounds per booking</li>
                <li>📞 For cancellation: 0566164488</li>
              </ul>
            ) : (
              <ul>
                <li>🎉 Birthday packages include multiple activities</li>
                <li>🎳 Extended bowling sessions</li>
                <li>🥽 VR gaming sessions included</li>
                <li>📞 For cancellation: 0566164488</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <BookingConfirmationModal />

      {/* Add styles for the modal */}
      <style jsx>{`
        .booking-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          animation: fadeIn 0.3s ease-out;
        }

        .booking-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease-out;
        }

        .booking-modal-header {
          text-align: center;
          padding: 24px 24px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .booking-modal-header h2 {
          margin: 0;
          color: #22c55e;
          font-size: 24px;
        }

        .booking-modal-body {
          padding: 24px;
        }

        .booking-summary {
          margin-bottom: 24px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .booking-summary h3 {
          margin: 0 0 16px 0;
          color: #334155;
        }

        .booking-detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .booking-detail .label {
          font-weight: 500;
          color: #64748b;
        }

        .booking-detail .value {
          color: #334155;
        }

        .status-message {
          text-align: center;
        }

        .status-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }

        .status-message h4 {
          margin: 0 0 16px 0;
          color: #f59e0b;
        }

        .status-message p {
          margin-bottom: 24px;
          line-height: 1.6;
          color: #64748b;
        }

        .next-steps {
          text-align: left;
          background: #fefce8;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .next-steps h5 {
          margin: 0 0 12px 0;
          color: #92400e;
        }

        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }

        .next-steps li {
          margin-bottom: 8px;
          color: #78716c;
        }

        .booking-modal-footer {
          padding: 16px 24px 24px;
          text-align: center;
        }

        .modal-close-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 32px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: scale(0.9) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .booking-modal {
            margin: 20px;
            width: calc(100% - 40px);
          }
        }

        .field-note {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default Booking;

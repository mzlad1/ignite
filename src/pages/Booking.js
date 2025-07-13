import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./Booking.css";

const Booking = () => {
  const [bookingType, setBookingType] = useState("regular");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
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
      alert(
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
      };

      await addDoc(collection(db, "bookings"), bookingData);
      alert(`${getBookingTypeLabel()} booking submitted successfully!`);

      fetchSlotAvailability();

      setFormData({
        name: "",
        phone: "",
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
      alert("Error submitting booking: " + error.message);
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
                    required
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp Phone:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-right-column">
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
                <li>🍕 Food & drinks included in some packages</li>
                <li>📞 For cancellation: 0566164488</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;

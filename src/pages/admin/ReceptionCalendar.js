import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./ReceptionCalendar.css";

const ReceptionCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    const dateStr = selectedDate.toDateString();
    const q = query(collection(db, "bookings"), where("date", "==", dateStr));
    const querySnapshot = await getDocs(q);
    const bookingsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBookings(bookingsList);
  };

  // Filter bookings based on search name
  const filteredBookings = bookings.filter((booking) =>
    booking.name.toLowerCase().includes(searchName.toLowerCase())
  );

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
    const selectedDateNew = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(selectedDateNew);
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
      const isSelected = isSameDay(date, selectedDate);
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

        <p className="selected-date">
          Selected:{" "}
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    );
  };

  return (
    <div className="reception-calendar">
      {/* Add character decorations */}
      <div className="reception-calendar-zoe-organizer"></div>
      <div className="reception-calendar-enzo-scheduler"></div>
      <div className="reception-calendar-zoe-assistant"></div>

      <div className="container">
        <h1>Reception Calendar</h1>

        <div className="calendar-content">
          <div className="calendar-section">
            <label>Select Date to view bookings:</label>
            {renderCalendar()}
          </div>

          <div className="bookings-section">
            <h3>Bookings for {selectedDate.toDateString()}</h3>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search by customer name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>

            {filteredBookings.length === 0 ? (
              <p>
                {searchName
                  ? `No bookings found for "${searchName}"`
                  : "No bookings for this date"}
              </p>
            ) : (
              <div className="bookings-list">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-time">{booking.time}</div>
                    <div className="booking-details">
                      <strong>{booking.name}</strong>
                      <p>
                        People: {booking.people} | Rounds: {booking.rounds}
                      </p>
                      <p>Phone: {booking.phone}</p>
                      {booking.email && <p>Email: {booking.email}</p>}
                      {booking.status && (
                        <p>
                          Status:{" "}
                          <span className={`status-${booking.status}`}>
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionCalendar;

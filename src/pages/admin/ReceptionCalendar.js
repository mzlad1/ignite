import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./ReceptionCalendar.css";

const ReceptionCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [searchName, setSearchName] = useState("");

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

  return (
    <div className="reception-calendar">
      <div className="container">
        <h1>Reception Calendar</h1>

        <div className="calendar-content">
          <div className="calendar-section">
            <Calendar value={selectedDate} onChange={setSelectedDate} />
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

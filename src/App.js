import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Offers from "./pages/Offers";
import Booking from "./pages/Booking";
import Feedback from "./pages/Feedback";
import BirthdayPackages from "./pages/BirthdayPackages";
import FAQ from "./pages/FAQ";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReceptionCalendar from "./pages/admin/ReceptionCalendar";
import JanaDashboard from "./pages/admin/JanaDashboard";
import AddUser from "./pages/admin/AddUser";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/birthday-packages" element={<BirthdayPackages />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/calendar" element={<ReceptionCalendar />} />
          <Route path="/admin/jana" element={<JanaDashboard />} />
          <Route path="/admin/add-user" element={<AddUser />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

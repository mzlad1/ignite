import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Navbar.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get user role from Firestore
        try {
          const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
          if (adminDoc.exists()) {
            setUserRole(adminDoc.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getAdminDashboardLink = () => {
    if (userRole === "jana") {
      return "/admin/dashboard";
    } else if (userRole === "reception") {
      return "/admin/calendar";
    }
    return "/admin/dashboard";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleSupportDropdown = () => {
    setSupportDropdownOpen(!supportDropdownOpen);
  };

  const closeSupportDropdown = () => {
    setSupportDropdownOpen(false);
  };

  return (
    <nav
      className={`navbar ${
        isHomePage && !scrolled ? "navbar-transparent" : "navbar-solid"
      }`}
    >
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <img
            src="https://res.cloudinary.com/dxqxjaruh/image/upload/f_auto,q_auto,c_scale,w_400/v1753546487/logo_gdmnno.png"
            alt="Ignite Arcade"
            className="nav-logo-img"
          />
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span
            className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`}
          ></span>
          <span
            className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`}
          ></span>
          <span
            className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`}
          ></span>
        </button>

        <div className={`nav-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>
            Home
          </Link>
          <Link to="/menu" className="nav-link" onClick={closeMobileMenu}>
            Cafe
          </Link>
          <Link to="/offers" className="nav-link" onClick={closeMobileMenu}>
            Offers
          </Link>
          <Link to="/tournament" className="nav-link" onClick={closeMobileMenu}>
            Tournament
          </Link>
          <Link to="/booking" className="nav-link" onClick={closeMobileMenu}>
            Book Now
          </Link>

          {/* Mobile: Show as regular links */}
          <div className="mobile-only">
            <Link
              to="/tournament"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              Tournament
            </Link>
            <Link to="/feedback" className="nav-link" onClick={closeMobileMenu}>
              Feedback
            </Link>
            <Link to="/faq" className="nav-link" onClick={closeMobileMenu}>
              FAQ
            </Link>
          </div>

          {/* Desktop: Show as dropdown */}
          <div
            className="support-dropdown desktop-only"
            onMouseEnter={() => setSupportDropdownOpen(true)}
            onMouseLeave={() => setSupportDropdownOpen(false)}
          >
            <button
              className="nav-link support-toggle"
              onClick={toggleSupportDropdown}
            >
              Support
              <span className="dropdown-arrow">▼</span>
            </button>
            <div
              className={`dropdown-menu ${supportDropdownOpen ? "show" : ""}`}
            >
              <Link
                to="/feedback"
                className="dropdown-item"
                onClick={closeMobileMenu}
              >
                Feedback
              </Link>
              <Link
                to="/faq"
                className="dropdown-item"
                onClick={closeMobileMenu}
              >
                FAQ
              </Link>
            </div>
          </div>

          {user ? (
            <div className="admin-section">
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="nav-link logout-btn"
                type="button"
              >
                🔓 Logout
              </button>
            </div>
          ) : null}
        </div>

        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

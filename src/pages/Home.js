import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import MediaViewer from "../components/MediaViewer";
import "./Home.css";

const Home = () => {
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // Refs for scroll animation
  const zonesRef = useRef(null);
  const infoRef = useRef(null);
  const socialRef = useRef(null);
  const zoneCardsRef = useRef([]);
  const footerRef = useRef(null);

  const titleText = "Welcome to IGNITE";
  const subtitleTexts = [
    "Where Fun Meets Adventure!",
    "Your Ultimate Entertainment Destination",
    "Strike Up Some Fun!",
    "Level Up Your Game Experience!",
    "Create Unforgettable Memories!",
  ];

  // Scroll animation hook
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        } else {
          entry.target.classList.remove("animate-in");
        }
      });
    }, observerOptions);

    // Observe elements
    const elementsToObserve = [
      zonesRef.current,
      infoRef.current,
      socialRef.current,
      footerRef.current,
      ...zoneCardsRef.current.filter(Boolean),
    ];

    elementsToObserve.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let titleIndex = 0;

    const typeTitle = () => {
      if (titleIndex < titleText.length) {
        setDisplayedTitle(titleText.slice(0, titleIndex + 1));
        titleIndex++;
        setTimeout(typeTitle, 100);
      } else {
        setTitleComplete(true);
        setTimeout(startSubtitleCycle, 500);
      }
    };

    const startSubtitleCycle = () => {
      setShowCursor(true);
      typeSubtitle(0);
    };

    const typeSubtitle = (textIndex) => {
      const currentText = subtitleTexts[textIndex];
      let charIndex = 0;
      setIsTyping(true);
      setDisplayedSubtitle("");

      const typeChar = () => {
        if (charIndex < currentText.length) {
          setDisplayedSubtitle(currentText.slice(0, charIndex + 1));
          charIndex++;
          setTimeout(typeChar, 80);
        } else {
          setIsTyping(false);
          setTimeout(() => eraseSubtitle(textIndex), 2000); // Pause before erasing
        }
      };

      typeChar();
    };

    const eraseSubtitle = (textIndex) => {
      const currentText = subtitleTexts[textIndex];
      let charIndex = currentText.length;
      setIsTyping(true);

      const eraseChar = () => {
        if (charIndex > 0) {
          setDisplayedSubtitle(currentText.slice(0, charIndex - 1));
          charIndex--;
          setTimeout(eraseChar, 50);
        } else {
          setIsTyping(false);
          const nextIndex = (textIndex + 1) % subtitleTexts.length;
          setSubtitleIndex(nextIndex);
          setTimeout(() => typeSubtitle(nextIndex), 300); // Pause before typing next
        }
      };

      eraseChar();
    };

    setTimeout(typeTitle, 1500); // Start typing after logo animation
  }, []);

  const openMediaViewer = (zoneName) => {
    setSelectedZone(zoneName);
    setMediaViewerOpen(true);
  };

  const closeMediaViewer = () => {
    setMediaViewerOpen(false);
    setSelectedZone(null);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-background">
          <div className="hero-content">
            <div className="logo-container">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546487/logo_gdmnno.png"
                alt="Ignite Arcade Logo"
                className="hero-logo"
              />
            </div>
            <h1 className="typing-title">
              {displayedTitle}
              <span className="cursor">{!titleComplete ? "|" : ""}</span>
            </h1>
            <p className="typing-subtitle">
              {displayedSubtitle}
              <span className="cursor subtitle-cursor">
                {showCursor && (isTyping || displayedSubtitle.length > 0)
                  ? "|"
                  : ""}
              </span>
            </p>
            <div className={`cta-container ${titleComplete ? "show" : ""}`}>
              <Link to="/booking" className="cta-button">
                Book Your Session
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="zones scroll-animate" ref={zonesRef}>
        <div className="container">
          <h2 className="scroll-animate-child">Our Gaming Zones</h2>
          <p >
            Click on any zone card to view the gallery and explore more!
          </p>

          <div
            className="zone-card scroll-animate-child clickable-zone"
            ref={(el) => (zoneCardsRef.current[0] = el)}
            onClick={() => openMediaViewer("vr")}
          >
            <div className="zone-image">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546803/VRhome_ms1faz.jpg"
                alt="VR Games Zone"
              />
              <div className="zone-overlay">
                <span className="view-gallery">📸 View Gallery</span>
              </div>
            </div>
            <div className="zone-content">
              <h3>🥽 VR Games Zone</h3>
              <p>
                Step into the future of fun with our cutting-edge VR
                experiences! Powered by advanced technology, our VR zone lets
                you explore new worlds, challenge your reflexes, and make
                unforgettable memories with friends—no controllers, just pure
                immersion.
              </p>
            </div>
          </div>

          <div
            className="zone-card scroll-animate-child clickable-zone"
            ref={(el) => (zoneCardsRef.current[1] = el)}
            onClick={() => openMediaViewer("bowling")}
          >
            <div className="zone-image">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546486/bowlingHome_zbbdgm.jpg"
                alt="Bowling Zone"
              />
              <div className="zone-overlay">
                <span className="view-gallery">📸 View Gallery</span>
              </div>
            </div>
            <div className="zone-content">
              <h3>🎳 Bowling Zone</h3>
              <p>
                Step into a space full of energy, colorful lights, and good
                vibes! With music, glowing lanes, and a lively atmosphere, our
                bowling zone is perfect for parties, friendly matches, or just
                having fun with your friends and family.
              </p>
            </div>
          </div>

          <div
            className="zone-card scroll-animate-child clickable-zone"
            ref={(el) => (zoneCardsRef.current[2] = el)}
            onClick={() => openMediaViewer("cafe")}
          >
            <div className="zone-image">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546486/CafeHome_ouvnt9.jpg"
                alt="Grab & Giggle Café"
              />
              <div className="zone-overlay">
                <span className="view-gallery">📸 View Gallery</span>
              </div>
            </div>
            <div className="zone-content">
              <h3>☕ IGNITE Cafe</h3>
              <p>
                Need a break from the action? Whether you're grabbing a
                refreshing drink on the go or taking a moment to unwind, our
                indoor and outdoor seating has you covered. Sit back, relax, and
                enjoy views of the bowling lanes—perfect for recharging,
                socializing, and soaking in the fun between rounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="info scroll-animate" ref={infoRef}>
        <div className="container">
          <div className="info-content">
            <div className="info-text scroll-animate-child">
              <h2>Get to Know Us</h2>
              <p>
                At IGNITE, we're built on four core pillars: Safety, Technology,
                Inclusion, and Amusement. These values set us apart and shape
                everything we do — from the games we offer to the experience
                you'll have. Every message we share and every moment you enjoy
                is powered by at least one of these principles. Together, they
                create an experience that's exciting, meaningful, and built to
                last.
              </p>
            </div>
            <div className="info-image scroll-animate-child">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546487/GetToKnowUs_x3wsox.jpg"
                alt="Get to Know Us"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="social-media scroll-animate" ref={socialRef}>
        <div className="container">
          <h2 className="scroll-animate-child">Follow Us</h2>
          <p className="social-description scroll-animate-child">
            Stay connected and never miss the fun! Follow us on social media for
            the latest updates, behind-the-scenes content, and exclusive offers.
          </p>

          <div className="social-links scroll-animate-child">
            <a
              href="https://www.instagram.com/ignite_ps"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link instagram"
            >
              <div className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div className="social-content">
                <h3>Instagram</h3>
                <p>@ignite_ps</p>
              </div>
            </a>

            <a
              href="https://www.tiktok.com/@ignite_ps"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link tiktok"
            >
              <div className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </div>
              <div className="social-content">
                <h3>TikTok</h3>
                <p>@ignite_ps</p>
              </div>
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61565061638459"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link facebook"
            >
              <div className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="social-content">
                <h3>Facebook</h3>
                <p>IGNITE Arcade</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <footer className="footer scroll-animate" ref={footerRef}>
        <div className="container">
          <div className="footer-content">
            <div className="footer-left scroll-animate-child">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546487/logo_gdmnno.png"
                alt="Ignite Arcade"
                className="footer-logo"
              />
            </div>
            <div className="footer-right scroll-animate-child">
              <div className="footer-info">
                <div className="footer-contact">
                  <h4>Contact Info</h4>
                  <p>
                    📧{" "}
                    <a
                      href="mailto:info@ignitearcade.com"
                      className="footer-link"
                    >
                      info@ignitearcade.com
                    </a>
                  </p>
                  <p>
                    📞{" "}
                    <a href="tel:0566164488" className="footer-link">
                      0566164488
                    </a>
                  </p>
                  <p>📍 Ramallah - Al-Tireh, Al-Bazzar Building - Floor 2</p>
                </div>
                <div className="footer-hours">
                  <h4>Opening Hours</h4>
                  <p>Daily: 3:00 PM - 11:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom scroll-animate-child">
            <p>&copy; 2025 Ignite Arcade. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <MediaViewer
        isOpen={mediaViewerOpen}
        onClose={closeMediaViewer}
        zoneName={selectedZone}
      />
    </div>
  );
};

export default Home;

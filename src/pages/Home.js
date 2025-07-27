import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);

  // Refs for scroll animation
  const zonesRef = useRef(null);
  const infoRef = useRef(null);
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

          <div
            className="zone-card scroll-animate-child"
            ref={(el) => (zoneCardsRef.current[0] = el)}
          >
            <div className="zone-image">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546803/VRhome_ms1faz.jpg"
                alt="VR Games Zone"
              />
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
            className="zone-card scroll-animate-child"
            ref={(el) => (zoneCardsRef.current[1] = el)}
          >
            <div className="zone-image">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546486/bowlingHome_zbbdgm.jpg"
                alt="Bowling Zone"
              />
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
            className="zone-card scroll-animate-child"
            ref={(el) => (zoneCardsRef.current[2] = el)}
          >
            <div className="zone-image">
              <img
                src="https://res.cloudinary.com/dxqxjaruh/image/upload/v1753546486/CafeHome_ouvnt9.jpg"
                alt="Grab & Giggle Café"
              />
            </div>
            <div className="zone-content">
              <h3>☕ IGNITE Cafe</h3>
              <p>
                Need a break from the action? Whether you’re grabbing a
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
                At IGNITE, we’re built on four core pillars: Safety, Technology,
                Inclusion, and Amusement. These values set us apart and shape
                everything we do — from the games we offer to the experience
                you’ll have. Every message we share and every moment you enjoy
                is powered by at least one of these principles. Together, they
                create an experience that’s exciting, meaningful, and built to
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
    </div>
  );
};

export default Home;

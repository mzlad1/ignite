import React, { useState, useRef } from "react";
import "./Menu.css";

const Menu = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const imageRef = useRef(null);

  const menuPages = [
    "images/menu-page-1.jpg",
    "images/menu-page-2.jpg",
    "images/menu-page-3.jpg",
    "images/menu-page-4.jpg",
    "images/menu-page-5.jpg",
  ];

  // Minimum swipe distance (in px) to trigger page change
  const minSwipeDistance = 50;

  const nextPage = () => {
    if (currentPage < menuPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (index) => {
    setCurrentPage(index);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      prevPage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setTouchStart(e.clientX);
    setTouchEnd(e.clientX);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
    const distance = e.clientX - touchStart;
    setDragOffset(distance);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      prevPage();
    }

    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  return (
    <div className="menu">
      <div className="container">
        <h1>IGNITE Menu</h1>
        <p>Delicious food and refreshing drinks to fuel your gaming session!</p>

        {/* Menu Image Viewer */}
        <div
          style={{
            background: "rgba(26, 27, 46, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "25px",
            padding: "clamp(1.5rem, 3vw, 2rem)",
            border: "2px solid rgba(255, 127, 0, 0.3)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
            position: "relative",
            zIndex: 10,
            marginBottom: "2rem",
          }}
        >
          {/* Swipe Instruction */}
          <div
            style={{
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.95rem",
              marginBottom: "1rem",
              fontWeight: "500",
            }}
          >
            👆 Swipe or drag to browse pages
          </div>

          {/* Main Image Display */}
          <div
            ref={imageRef}
            style={{
              position: "relative",
              borderRadius: "15px",
              overflow: "hidden",
              background: "white",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
              marginBottom: "2rem",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
              touchAction: "pan-y pinch-zoom",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              style={{
                transform: isDragging ? `translateX(${dragOffset}px)` : "none",
                transition: isDragging ? "none" : "transform 0.3s ease",
              }}
            >
              <img
                src={menuPages[currentPage]}
                alt={`Menu page ${currentPage + 1}`}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  maxHeight: "900px",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
                draggable="false"
              />
            </div>

            {/* Side indicators for swipe direction */}
            {currentPage > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255, 127, 0, 0.4)",
                  fontSize: "2rem",
                  pointerEvents: "none",
                  animation: "slideHintLeft 2s ease-in-out infinite",
                }}
              >
                ‹
              </div>
            )}
            {currentPage < menuPages.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255, 127, 0, 0.4)",
                  fontSize: "2rem",
                  pointerEvents: "none",
                  animation: "slideHintRight 2s ease-in-out infinite",
                }}
              >
                ›
              </div>
            )}
          </div>

          {/* Page Dots Indicator */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              padding: "1.5rem 0",
              marginBottom: "1rem",
            }}
          >
            {menuPages.map((_, index) => (
              <div
                key={index}
                style={{
                  width: currentPage === index ? "32px" : "10px",
                  height: "10px",
                  borderRadius: "5px",
                  background:
                    currentPage === index
                      ? "linear-gradient(135deg, #ff7f00, #ffa500)"
                      : "rgba(255, 127, 0, 0.3)",
                  transition: "all 0.3s ease",
                  boxShadow:
                    currentPage === index
                      ? "0 2px 8px rgba(255, 127, 0, 0.5)"
                      : "none",
                  cursor: "pointer",
                }}
                onClick={() => goToPage(index)}
              />
            ))}
          </div>

          {/* Thumbnail Navigation */}
          {menuPages.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
                padding: "0 1rem",
              }}
            >
              {menuPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  aria-label={`Go to page ${index + 1}`}
                  style={{
                    border:
                      currentPage === index
                        ? "3px solid #ff7f00"
                        : "3px solid rgba(255, 127, 0, 0.3)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background: "white",
                    padding: "0",
                    opacity: currentPage === index ? 1 : 0.6,
                    transform:
                      currentPage === index ? "scale(1.05)" : "scale(1)",
                    boxShadow:
                      currentPage === index
                        ? "0 6px 20px rgba(255, 127, 0, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = "1";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== index) {
                      e.target.style.opacity = "0.6";
                      e.target.style.transform = "scale(1)";
                    }
                  }}
                >
                  <img
                    src={page}
                    alt={`Thumbnail ${index + 1}`}
                    style={{
                      width: "80px",
                      height: "100px",
                      objectFit: "cover",
                      display: "block",
                    }}
                    draggable="false"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Download Button */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          <a
            href="/ignite-menu.pdf"
            download
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #ff7f00, #ffa500)",
              color: "white",
              textDecoration: "none",
              padding: "1rem 2rem",
              borderRadius: "12px",
              fontSize: "1.1rem",
              fontWeight: "600",
              boxShadow: "0 6px 20px rgba(255, 127, 0, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 10px 30px rgba(255, 127, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "none";
              e.target.style.boxShadow = "0 6px 20px rgba(255, 127, 0, 0.3)";
            }}
          >
            📥 Download Full Menu (PDF)
          </a>
        </div>
      </div>

      {/* Animations and Mobile Styles */}
      <style>{`
        @keyframes slideHintLeft {
          0%, 100% {
            opacity: 0.2;
            transform: translateY(-50%) translateX(0);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-50%) translateX(-5px);
          }
        }
        
        @keyframes slideHintRight {
          0%, 100% {
            opacity: 0.2;
            transform: translateY(-50%) translateX(0);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-50%) translateX(5px);
          }
        }
        
        @media (max-width: 768px) {
          .menu [style*="Swipe or drag"] {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Menu;

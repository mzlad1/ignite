import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Updated to use existing firebase.js
import "./MediaViewer.css";

const MediaViewer = ({ isOpen, onClose, zoneName }) => {
  const [mediaData, setMediaData] = useState({ images: [], videos: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentType, setCurrentType] = useState("images");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const zoneMapping = {
    bowling: "bowling",
    vr: "vr",
    cafe: "cafe",
  };

  useEffect(() => {
    if (isOpen && zoneName) {
      loadZoneMedia();
    }
  }, [isOpen, zoneName]);

  const loadZoneMedia = async () => {
    setLoading(true);
    try {
      const zoneKey = zoneMapping[zoneName];
      const mediaDoc = await getDoc(doc(db, "zoneMedia", "mediaCollection"));

      if (mediaDoc.exists()) {
        const allMediaData = mediaDoc.data();
        const zoneData = allMediaData[zoneKey] || { images: [], videos: [] };
        setMediaData(zoneData);
        setCurrentIndex(0);
        setCurrentType(zoneData.images.length > 0 ? "images" : "videos");
      }
    } catch (error) {
      console.error("Error loading zone media:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMedia = () => {
    return mediaData[currentType] || [];
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    console.error("Failed to load image");
  };

  // Reset image loading when switching images or media type
  useEffect(() => {
    if (currentType === "images") {
      setImageLoading(true);
    }
  }, [currentIndex, currentType]);

  const currentMedia = getCurrentMedia();
  const totalItems = currentMedia.length;

  const nextMedia = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Switch to other type if available
      const otherType = currentType === "images" ? "videos" : "images";
      if (mediaData[otherType] && mediaData[otherType].length > 0) {
        setCurrentType(otherType);
        setCurrentIndex(0);
      }
    }
  };

  const prevMedia = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Switch to other type if available
      const otherType = currentType === "images" ? "videos" : "images";
      if (mediaData[otherType] && mediaData[otherType].length > 0) {
        setCurrentType(otherType);
        setCurrentIndex(mediaData[otherType].length - 1);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "ArrowRight") nextMedia();
    if (e.key === "ArrowLeft") prevMedia();
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, currentIndex, currentType]);

  if (!isOpen) return null;

  const hasMedia = mediaData.images.length > 0 || mediaData.videos.length > 0;

  return (
    <div className="media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="media-header">
          <h2>{zoneName} Gallery</h2>
          <div className="media-tabs">
            {mediaData.images.length > 0 && (
              <button
                className={`tab ${currentType === "images" ? "active" : ""}`}
                onClick={() => {
                  setCurrentType("images");
                  setCurrentIndex(0);
                }}
              >
                Images ({mediaData.images.length})
              </button>
            )}
            {mediaData.videos.length > 0 && (
              <button
                className={`tab ${currentType === "videos" ? "active" : ""}`}
                onClick={() => {
                  setCurrentType("videos");
                  setCurrentIndex(0);
                }}
              >
                Videos ({mediaData.videos.length})
              </button>
            )}
          </div>
        </div>

        <div className="media-content">
          {loading ? (
            <div className="loading">Loading media...</div>
          ) : !hasMedia ? (
            <div className="no-media">No media available for this zone</div>
          ) : (
            <>
              <div className="media-display">
                {currentMedia[currentIndex] &&
                  (currentType === "images" ? (
                    <div className="image-container">
                      {imageLoading && (
                        <div className="media-image-loading">
                          <div className="media-loading-spinner"></div>
                          <span>Loading image...</span>
                        </div>
                      )}
                      <img
                        src={currentMedia[currentIndex].url}
                        alt={`${zoneName} ${currentIndex + 1}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ display: imageLoading ? "none" : "block" }}
                      />
                    </div>
                  ) : (
                    <video
                      src={currentMedia[currentIndex].url}
                      controls
                      autoPlay
                    />
                  ))}
              </div>

              {totalItems > 1 && (
                <div className="media-controls">
                  <button className="nav-btn prev" onClick={prevMedia}>
                    ‹
                  </button>
                  <span className="media-counter">
                    {currentIndex + 1} of {totalItems} {currentType}
                  </span>
                  <button className="nav-btn next" onClick={nextMedia}>
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;

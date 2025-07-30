import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../firebase"; // Updated to use existing firebase.js
import Toast from "../../components/Toast/Toast";
import "./MediaManagement.css";

const MediaManagement = () => {
  const [selectedZone, setSelectedZone] = useState("bowling");
  const [mediaData, setMediaData] = useState({
    bowling: { images: [], videos: [], mainImage: null },
    vr: { images: [], videos: [], mainImage: null },
    cafe: { images: [], videos: [], mainImage: null },
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);

  const zones = {
    bowling: "🎳 Bowling Zone",
    vr: "🥽 VR Games Zone",
    cafe: "☕ IGNITE Cafe",
  };

  useEffect(() => {
    loadMediaData();
  }, []);

  const loadMediaData = async () => {
    try {
      const mediaDoc = await getDoc(doc(db, "zoneMedia", "mediaCollection"));
      if (mediaDoc.exists()) {
        setMediaData(mediaDoc.data());
      } else {
        // Initialize document if it doesn't exist
        const initialData = {
          bowling: { images: [], videos: [], mainImage: null },
          vr: { images: [], videos: [], mainImage: null },
          cafe: { images: [], videos: [], mainImage: null },
        };
        await setDoc(doc(db, "zoneMedia", "mediaCollection"), initialData);
        setMediaData(initialData);
      }
    } catch (error) {
      console.error("Error loading media data:", error);
    }
  };

  const uploadToCloudinary = async (file, resourceType = "auto") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append("resource_type", resourceType);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const isVideo = file.type.startsWith("video/");
        const resourceType = isVideo ? "video" : "image";

        const result = await uploadToCloudinary(file, resourceType);

        setUploadProgress(((index + 1) / files.length) * 100);

        return {
          id: result.public_id,
          url: result.secure_url,
          type: isVideo ? "video" : "image",
          name: file.name,
          createdAt: new Date().toISOString(),
        };
      });

      const uploadedMedia = await Promise.all(uploadPromises);

      // Save to Firebase
      await saveMediaToFirebase(selectedZone, uploadedMedia);

      // Update local state
      setMediaData((prev) => ({
        ...prev,
        [selectedZone]: {
          ...prev[selectedZone],
          images: [
            ...prev[selectedZone].images,
            ...uploadedMedia.filter((m) => m.type === "image"),
          ],
          videos: [
            ...prev[selectedZone].videos,
            ...uploadedMedia.filter((m) => m.type === "video"),
          ],
        },
      }));

      // Show success toast
      const fileCount = files.length;
      const fileText = fileCount === 1 ? "file" : "files";
      showToast(`${fileCount} ${fileText} uploaded successfully!`, "success");
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleMainImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      showToast("Please upload only image files for the main image.", "error");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadToCloudinary(file, "image");
      setUploadProgress(100);

      const imageData = {
        id: result.public_id,
        url: result.secure_url,
        type: "image",
        name: file.name,
        createdAt: new Date().toISOString(),
      };

      await setMainImage(imageData);
      showToast("Main image uploaded successfully!", "success");
    } catch (error) {
      console.error("Main image upload error:", error);
      showToast("Main image upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Clear the input
      event.target.value = "";
    }
  };

  const saveMediaToFirebase = async (zone, media) => {
    try {
      const mediaDocRef = doc(db, "zoneMedia", "mediaCollection");

      // Separate images and videos
      const images = media.filter((m) => m.type === "image");
      const videos = media.filter((m) => m.type === "video");

      // Update Firebase document
      const updates = {};
      if (images.length > 0) {
        updates[`${zone}.images`] = arrayUnion(...images);
      }
      if (videos.length > 0) {
        updates[`${zone}.videos`] = arrayUnion(...videos);
      }

      await updateDoc(mediaDocRef, updates);
    } catch (error) {
      console.error("Error saving media:", error);
    }
  };

  const setMainImage = async (imageData) => {
    try {
      const mediaDocRef = doc(db, "zoneMedia", "mediaCollection");

      await updateDoc(mediaDocRef, {
        [`${selectedZone}.mainImage`]: imageData,
      });

      setMediaData((prev) => ({
        ...prev,
        [selectedZone]: {
          ...prev[selectedZone],
          mainImage: imageData,
        },
      }));
    } catch (error) {
      console.error("Error setting main image:", error);
      alert("Failed to set main image. Please try again.");
    }
  };

  const deleteMedia = async (mediaId, mediaType) => {
    try {
      const mediaDocRef = doc(db, "zoneMedia", "mediaCollection");

      // Find the media item to delete
      const mediaArray =
        mediaData[selectedZone][mediaType === "image" ? "images" : "videos"];
      const mediaItem = mediaArray.find((item) => item.id === mediaId);

      if (mediaItem) {
        // Remove from Firebase
        await updateDoc(mediaDocRef, {
          [`${selectedZone}.${mediaType === "image" ? "images" : "videos"}`]:
            arrayRemove(mediaItem),
        });

        // Delete from Cloudinary (optional - you might want to keep files)
        await deleteFromCloudinary(mediaId, mediaType);

        // Update local state
        setMediaData((prev) => ({
          ...prev,
          [selectedZone]: {
            ...prev[selectedZone],
            [mediaType === "image" ? "images" : "videos"]: prev[selectedZone][
              mediaType === "image" ? "images" : "videos"
            ].filter((item) => item.id !== mediaId),
          },
        }));
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed. Please try again.");
    }
  };

  const deleteMainImage = async () => {
    try {
      const mediaDocRef = doc(db, "zoneMedia", "mediaCollection");

      await updateDoc(mediaDocRef, {
        [`${selectedZone}.mainImage`]: null,
      });

      setMediaData((prev) => ({
        ...prev,
        [selectedZone]: {
          ...prev[selectedZone],
          mainImage: null,
        },
      }));
    } catch (error) {
      console.error("Error deleting main image:", error);
      alert("Failed to delete main image. Please try again.");
    }
  };

  const deleteFromCloudinary = async (publicId, mediaType) => {
    try {
      const resourceType = mediaType === "image" ? "image" : "video";

      // You'll need to implement this through a cloud function or keep the files
      // Cloudinary deletion requires server-side implementation for security
      console.log(`Would delete ${resourceType} with ID: ${publicId}`);
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
    }
  };

  return (
    <div className="media-management">
      <div className="container">
        <h1>Media Management</h1>

        <div className="zone-selector">
          {Object.entries(zones).map(([key, name]) => (
            <button
              key={key}
              className={`zone-btn ${selectedZone === key ? "active" : ""}`}
              onClick={() => setSelectedZone(key)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="main-image-section">
          <h3>Main Zone Image</h3>
          <div className="main-image-container">
            {mediaData[selectedZone].mainImage ? (
              <div className="current-main-image">
                <img
                  src={mediaData[selectedZone].mainImage.url}
                  alt={`${zones[selectedZone]} main image`}
                />
                <p>
                  Current main image: {mediaData[selectedZone].mainImage.name}
                </p>
                <button
                  className="delete-main-btn"
                  onClick={deleteMainImage}
                  title="Delete main image"
                >
                  🗑️ Remove Main Image
                </button>
              </div>
            ) : (
              <div className="no-main-image">
                <p>No main image set for {zones[selectedZone]}</p>
              </div>
            )}
          </div>

          <div className="main-image-upload">
            <input
              type="file"
              id="main-image-upload"
              accept="image/*"
              onChange={handleMainImageUpload}
              disabled={uploading}
            />
            <label
              htmlFor="main-image-upload"
              className={`main-upload-label ${uploading ? "disabled" : ""}`}
            >
              <span className="upload-icon">🖼️</span>
              <span>Upload Main Zone Image</span>
              <span className="upload-info">JPG, PNG supported</span>
            </label>
          </div>
        </div>

        <div className="upload-section">
          <div className="upload-area">
            <input
              type="file"
              id="media-upload"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label
              htmlFor="media-upload"
              className={`upload-label ${uploading ? "disabled" : ""}`}
            >
              <span className="upload-icon">📁</span>
              <span>Click to upload images and videos</span>
              <span className="upload-info">Supports JPG, PNG, MP4, MOV</span>
            </label>
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span>{Math.round(uploadProgress)}% uploaded</span>
            </div>
          )}
        </div>

        <div className="media-grid">
          <div className="media-section">
            <h3>Gallery Images ({mediaData[selectedZone].images.length})</h3>
            <div className="media-items">
              {mediaData[selectedZone].images.map((image) => (
                <div key={image.id} className="media-item">
                  <img src={image.url} alt={image.name} />
                  <div className="media-overlay">
                    <button
                      className="delete-btn"
                      onClick={() => deleteMedia(image.id, "image")}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="media-section">
            <h3>Videos ({mediaData[selectedZone].videos.length})</h3>
            <div className="media-items">
              {mediaData[selectedZone].videos.map((video) => (
                <div key={video.id} className="media-item">
                  <video src={video.url} controls />
                  <div className="media-overlay">
                    <button
                      className="delete-btn"
                      onClick={() => deleteMedia(video.id, "video")}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={4000}
        />
      )}
    </div>
  );
};

export default MediaManagement;

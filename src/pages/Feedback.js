import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Feedback.css";
import { useToast } from "../contexts/ToastContext";

const Feedback = () => {
  const { showSuccess, showError } = useToast();
  const [feedback, setFeedback] = useState({
    name: "",
    rating: 5,
    comment: "",
  });
  const [feedbackList, setFeedbackList] = useState([]);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [userInteractions, setUserInteractions] = useState({}); // Track user likes/dislikes

  const INITIAL_DISPLAY_COUNT = 5;

  useEffect(() => {
    fetchFeedback();
    // Load user interactions from localStorage
    const savedInteractions = localStorage.getItem("userFeedbackInteractions");
    if (savedInteractions) {
      setUserInteractions(JSON.parse(savedInteractions));
    }
  }, []);

  const fetchFeedback = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "feedback"));
      const feedbacks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        likes: doc.data().likes || 0,
        dislikes: doc.data().dislikes || 0,
      }));
      // Sort by creation date (newest first)
      feedbacks.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setFeedbackList(feedbacks);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "feedback"), {
        ...feedback,
        createdAt: new Date(),
        likes: 0,
        dislikes: 0,
      });
      showSuccess("Thank you for your feedback! 🌟");
      setFeedback({ name: "", rating: 5, comment: "" });
      setHoveredRating(0);
      fetchFeedback();
    } catch (error) {
      showError("Error submitting feedback: " + error.message);
    }
  };

  const handleStarClick = (rating) => {
    setFeedback({ ...feedback, rating });
    setHoveredRating(0);
  };

  const handleStarHover = (rating) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleLike = async (feedbackId) => {
    const userKey = `${feedbackId}_like`;
    const dislikeKey = `${feedbackId}_dislike`;

    // Check if user already liked this feedback
    if (userInteractions[userKey]) {
      return; // Already liked
    }

    try {
      const feedbackDoc = doc(db, "feedback", feedbackId);
      const currentFeedback = feedbackList.find(
        (item) => item.id === feedbackId
      );

      let newLikes = (currentFeedback.likes || 0) + 1;
      let newDislikes = currentFeedback.dislikes || 0;

      // If user previously disliked, remove the dislike
      if (userInteractions[dislikeKey]) {
        newDislikes = Math.max(0, newDislikes - 1);
      }

      await updateDoc(feedbackDoc, {
        likes: newLikes,
        dislikes: newDislikes,
      });

      // Update local state
      const newInteractions = {
        ...userInteractions,
        [userKey]: true,
      };

      // Remove dislike if it existed
      if (userInteractions[dislikeKey]) {
        delete newInteractions[dislikeKey];
      }

      setUserInteractions(newInteractions);
      localStorage.setItem(
        "userFeedbackInteractions",
        JSON.stringify(newInteractions)
      );

      fetchFeedback();
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleDislike = async (feedbackId) => {
    const userKey = `${feedbackId}_dislike`;
    const likeKey = `${feedbackId}_like`;

    // Check if user already disliked this feedback
    if (userInteractions[userKey]) {
      return; // Already disliked
    }

    try {
      const feedbackDoc = doc(db, "feedback", feedbackId);
      const currentFeedback = feedbackList.find(
        (item) => item.id === feedbackId
      );

      let newDislikes = (currentFeedback.dislikes || 0) + 1;
      let newLikes = currentFeedback.likes || 0;

      // If user previously liked, remove the like
      if (userInteractions[likeKey]) {
        newLikes = Math.max(0, newLikes - 1);
      }

      await updateDoc(feedbackDoc, {
        likes: newLikes,
        dislikes: newDislikes,
      });

      // Update local state
      const newInteractions = {
        ...userInteractions,
        [userKey]: true,
      };

      // Remove like if it existed
      if (userInteractions[likeKey]) {
        delete newInteractions[likeKey];
      }

      setUserInteractions(newInteractions);
      localStorage.setItem(
        "userFeedbackInteractions",
        JSON.stringify(newInteractions)
      );

      fetchFeedback();
    } catch (error) {
      console.error("Error updating dislike:", error);
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  const getDisplayedFeedback = () => {
    return showAll
      ? feedbackList
      : feedbackList.slice(0, INITIAL_DISPLAY_COUNT);
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "Recently";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="feedback-page">
      <div className="container">
        <h1>💬 Feedback</h1>

        <div className="feedback-content">
          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="feedback-form">
            <h2>Share Your Experience</h2>

            <input
              type="text"
              placeholder="Your Name"
              value={feedback.name}
              onChange={(e) =>
                setFeedback({ ...feedback, name: e.target.value })
              }
              required
            />

            <div className="rating-section">
              <label>Rating:</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${
                      (hoveredRating || feedback.rating) >= star ? "active" : ""
                    } ${hoveredRating >= star ? "hover" : ""}`}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <div className="rating-display">
                {hoveredRating || feedback.rating} out of 5 stars
              </div>
            </div>

            <textarea
              placeholder="Tell us about your experience..."
              value={feedback.comment}
              onChange={(e) =>
                setFeedback({ ...feedback, comment: e.target.value })
              }
              required
            />

            <button type="submit">Submit Feedback</button>
          </form>

          {/* Feedback List */}
          <div className="feedback-list">
            <h2>What Others Say</h2>

            <div className="feedback-container">
              {getDisplayedFeedback().map((item, index) => (
                <div
                  key={item.id}
                  className="feedback-item"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="feedback-header">
                    <strong>{item.name}</strong>
                    <span className="stars">{renderStars(item.rating)}</span>
                  </div>

                  <p>{item.comment}</p>

                  <div className="feedback-actions">
                    <div className="like-dislike">
                      <button
                        className={`action-btn ${
                          userInteractions[`${item.id}_like`] ? "liked" : ""
                        }`}
                        onClick={() => handleLike(item.id)}
                        disabled={userInteractions[`${item.id}_like`]}
                        title={
                          userInteractions[`${item.id}_like`]
                            ? "You liked this"
                            : "Like this feedback"
                        }
                      >
                        <span className="icon">👍</span>
                        <span>{item.likes || 0}</span>
                      </button>

                      <button
                        className={`action-btn ${
                          userInteractions[`${item.id}_dislike`]
                            ? "disliked"
                            : ""
                        }`}
                        onClick={() => handleDislike(item.id)}
                        disabled={userInteractions[`${item.id}_dislike`]}
                        title={
                          userInteractions[`${item.id}_dislike`]
                            ? "You disliked this"
                            : "Dislike this feedback"
                        }
                      >
                        <span className="icon">👎</span>
                        <span>{item.dislikes || 0}</span>
                      </button>
                    </div>

                    <span className="feedback-date">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))}

              {feedbackList.length === 0 && (
                <div className="feedback-item">
                  <p style={{ textAlign: "center", opacity: 0.7 }}>
                    No feedback yet. Be the first to share your experience! 🌟
                  </p>
                </div>
              )}
            </div>

            {/* Show More/Less Button */}
            {feedbackList.length > INITIAL_DISPLAY_COUNT && (
              <button
                className="show-more-btn"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? `Show Less ▲`
                  : `Show More (${
                      feedbackList.length - INITIAL_DISPLAY_COUNT
                    } more) ▼`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

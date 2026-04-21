import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../api";

function Feedback() {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [eventName, setEventName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const loadFeedback = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/feedback`);
      setFeedbackList(res.data);
    } catch (err) {
      console.log("❌ Error loading feedback");
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const submitFeedback = async () => {
    if (!userName || !userId || !eventName || !comment) {
      alert("⚠️ Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/feedback`, {
        user_name: userName,
        user_id: Number(userId),
        event_name: eventName,
        rating: Number(rating),
        comment: comment,
      });

      if (res.data.success) {
        setSubmitted(true);
        setUserName("");
        setUserId("");
        setEventName("");
        setRating(5);
        setComment("");
        loadFeedback();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        alert("❌ Failed to submit feedback");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("🚫 Server error");
    }
  };

  const starLabels = {
    5: "⭐⭐⭐⭐⭐ Excellent",
    4: "⭐⭐⭐⭐ Good",
    3: "⭐⭐⭐ Average",
    2: "⭐⭐ Poor",
    1: "⭐ Bad",
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <h2 style={styles.heading}>💬 Event Feedback</h2>
        <p style={styles.subheading}>Share your experience with us</p>

        {submitted && (
          <div style={styles.successBanner}>
            ✅ Feedback submitted successfully! Thank you.
          </div>
        )}

        <div style={styles.card}>
          <label style={styles.label}>Your Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>User ID</label>
          <input
            type="number"
            placeholder="Enter your User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Event Name</label>
          <input
            type="text"
            placeholder="Which event did you attend?"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={styles.input}
          >
            {Object.entries(starLabels).reverse().map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <label style={styles.label}>Comment</label>
          <textarea
            placeholder="Write your feedback here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={styles.textarea}
          />

          <button onClick={submitFeedback} style={styles.button}>
            Submit Feedback
          </button>
        </div>

        {feedbackList.length > 0 && (
          <div style={styles.listSection}>
            <h3 style={styles.listHeading}>📋 All Feedback ({feedbackList.length})</h3>
            {feedbackList.map((fb, index) => (
              <div key={index} style={styles.feedbackCard}>
                <div style={styles.feedbackHeader}>
                  <span style={styles.feedbackName}>👤 {fb.user_name}</span>
                  <span style={styles.feedbackRating}>⭐ {fb.rating}/5</span>
                </div>
                <p style={styles.feedbackEvent}>🎯 {fb.event_name}</p>
                <p style={styles.feedbackComment}>"{fb.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fa",
  },
  container: {
    width: "100%",
    maxWidth: "520px",
    margin: "0 auto",
    padding: "24px 16px",
    boxSizing: "border-box",
  },
  heading: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "4px",
  },
  subheading: {
    textAlign: "center",
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  successBanner: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "16px",
    color: "#166534",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    marginBottom: "16px",
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#fafafa",
    appearance: "auto",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    marginBottom: "16px",
    height: "100px",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#fafafa",
    fontFamily: "inherit",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  listSection: {
    marginBottom: "32px",
  },
  listHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "16px",
  },
  feedbackCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #f3f4f6",
  },
  feedbackHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  feedbackName: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#111827",
  },
  feedbackRating: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#d97706",
    background: "#fef9c3",
    padding: "2px 8px",
    borderRadius: "20px",
  },
  feedbackEvent: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "6px",
  },
  feedbackComment: {
    fontSize: "14px",
    color: "#374151",
    fontStyle: "italic",
    margin: 0,
  },
};

export default Feedback;
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

/**
 * Feedback Page
 * Refactored for Bento Design System with Mobile Optimization.
 */
function Feedback() {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [eventName, setEventName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!userName || !userId || !eventName || !comment) {
      alert("⚠️ Please fill all fields");
      return;
    }

    setLoading(true);
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
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const starLabels = useMemo(() => ({
    5: "⭐⭐⭐⭐⭐ Excellent",
    4: "⭐⭐⭐⭐ Good",
    3: "⭐⭐⭐ Average",
    2: "⭐⭐ Poor",
    1: "⭐ Bad",
  }), []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ paddingTop: "20px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 className="gradient-text" style={{ fontSize: "clamp(2rem, 8vw, 3.5rem)" }}>Community Pulse</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontWeight: "600" }}>Your experience matters to us</p>
        </div>

        <div className="grid-bento">
          
          {/* Form Section */}
          <div className="glass-card" style={{ gridColumn: "span 5", padding: "clamp(20px, 5vw, 40px)" }}>
            <h2 style={{ marginBottom: "8px", fontSize: "24px" }}>Share Feedback</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "14px" }}>
              Help us improve SympoTech for the future.
            </p>

            <form onSubmit={submitFeedback} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {submitted && (
                <div className="camera-overlay success" style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "12px" }}>
                  Feedback submitted!
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>FULL NAME</label>
                <input
                  className="premium-input"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>USER ID</label>
                  <input
                    className="premium-input"
                    type="number"
                    placeholder="ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>EVENT</label>
                  <input
                    className="premium-input"
                    placeholder="Event"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>RATING</label>
                <select
                  className="premium-input"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {Object.entries(starLabels).reverse().map(([val, label]) => (
                    <option key={val} value={val} style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>THOUGHTS</label>
                <textarea
                  className="premium-input"
                  placeholder="Tell us what you think..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ minHeight: "120px", resize: "none", paddingTop: "16px" }}
                />
              </div>

              <button 
                type="submit" 
                className={loading ? "secondary-button" : "primary-button"} 
                disabled={loading}
                style={{ marginTop: "12px" }}
              >
                {loading ? "Sending..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* List Section */}
          <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
              <h2 style={{ fontSize: "24px" }}>Community Reviews</h2>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", background: "var(--primary-glow)", padding: "6px 16px", borderRadius: "20px" }}>
                {feedbackList.length} TOTAL
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {feedbackList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)", background: "var(--glass-bg)", borderRadius: "var(--radius-lg)" }}>
                  <p style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>💬</p>
                  <p style={{ fontWeight: "600" }}>No reviews yet. Be the first!</p>
                </div>
              ) : (
                feedbackList.map((fb, i) => (
                  <div key={i} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: "40px", height: "40px", background: "var(--primary)", color: "#fff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "16px", boxShadow: "var(--shadow-md)", flexShrink: 0 }}>
                          {fb.user_name.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "800", fontSize: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fb.user_name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>{fb.event_name}</div>
                        </div>
                      </div>
                      <div style={{ color: "var(--warning)", fontSize: "14px", letterSpacing: "1px", background: "var(--glass-bg)", padding: "4px 10px", borderRadius: "8px" }}>
                        {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", opacity: 0.85, lineHeight: "1.6", fontStyle: "italic", borderLeft: "2px solid var(--primary)", paddingLeft: "16px" }}>
                      "{fb.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import Toast from "../components/Toast";
import API_BASE_URL from "../api";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/**
 * Feedback Page
 * Features a dynamic submission form and community pulse chart.
 */
function Feedback() {
  const [userName,     setUserName]     = useState("");
  const [userId,       setUserId]       = useState("");
  const [eventName,    setEventName]    = useState("");
  const [rating,       setRating]       = useState(5);
  const [comment,      setComment]      = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [submitted,    setSubmitted]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/feedback`);
      setFeedbackList(res.data);
    } catch {
      console.warn("Could not load feedback.");
    }
  }, []);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!userName || !userId || !eventName || !comment) {
      showToast("Please fill in all fields before submitting.", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/feedback`, {
        user_name: userName,
        user_id:   Number(userId),
        event_name: eventName,
        rating:    Number(rating),
        comment,
      });
      if (res.data.success) {
        setSubmitted(true);
        setUserName(""); setUserId(""); setEventName(""); setRating(5); setComment("");
        loadFeedback();
        showToast("Thank you! Your feedback was submitted successfully. 🎉", "success");
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        showToast(res.data.message || "Submission failed.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
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

  const ratingCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackList.forEach((fb) => { if (counts[fb.rating] !== undefined) counts[fb.rating]++; });
    return counts;
  }, [feedbackList]);

  const avgRating = useMemo(() => {
    if (feedbackList.length === 0) return 0;
    return (feedbackList.reduce((s, fb) => s + fb.rating, 0) / feedbackList.length).toFixed(1);
  }, [feedbackList]);

  const chartData = {
    labels: ["1 ⭐", "2 ⭐", "3 ⭐", "4 ⭐", "5 ⭐"],
    datasets: [{
      label: "Responses",
      data: [ratingCounts[1], ratingCounts[2], ratingCounts[3], ratingCounts[4], ratingCounts[5]],
      backgroundColor: ["#f43f5e", "#f97316", "#f59e0b", "#10b981", "#6366f1"],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} responses` } } },
    scales: {
      y: { ticks: { color: "#71717a", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" } },
      x: { ticks: { color: "#a1a1aa" }, grid: { display: false } },
    },
  };

  return (
    <div className="feedback-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="container feedback-container fade-in">
        <div className="feedback-hero">
          <h1 className="gradient-text hero-title">Community Pulse</h1>
          <p className="hero-subtitle">Your experience matters to us</p>
        </div>

        <div className="grid-bento">

          {/* ── Form ── */}
          <div className="glass-card feedback-form-card">
            <h2 className="section-title">Share Feedback</h2>
            <p className="section-desc">Help us improve SympoTech.</p>

            <form onSubmit={submitFeedback} className="feedback-form">
              {submitted && (
                <div className="camera-overlay success status-overlay">
                  ✅ Feedback submitted!
                </div>
              )}

              <div className="form-group">
                <label>FULL NAME</label>
                <input className="premium-input" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>USER ID</label>
                  <input className="premium-input" type="number" placeholder="ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>EVENT</label>
                  <input className="premium-input" placeholder="Event Name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>RATING</label>
                <select className="premium-input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {Object.entries(starLabels).reverse().map(([val, label]) => (
                    <option key={val} value={val} style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>THOUGHTS</label>
                <textarea
                  className="premium-input feedback-textarea"
                  placeholder="Tell us what you think..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
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

            {/* Rating Chart */}
            {feedbackList.length > 0 && (
              <div className="chart-section">
                <div className="chart-header">
                  <h3 className="chart-title">Rating Breakdown</h3>
                  <div className="chart-badge">
                    ⭐ {avgRating} avg
                  </div>
                </div>
                <div className="chart-container-small">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>

          {/* ── Reviews List ── */}
          <div className="reviews-section">
            <div className="reviews-header">
              <h2 className="section-title">Community Reviews</h2>
              <span className="reviews-count">
                {feedbackList.length} TOTAL
              </span>
            </div>

            <div className="reviews-list">
              {feedbackList.length === 0 ? (
                <div className="empty-reviews">
                  <p className="empty-icon">💬</p>
                  <p>No reviews yet. Be the first!</p>
                </div>
              ) : (
                feedbackList.map((fb, i) => (
                  <div key={i} className="glass-card review-card">
                    <div className="review-header">
                      <div className="review-user">
                        <div className="user-avatar">
                          {fb.user_name.charAt(0)}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{fb.user_name}</div>
                          <div className="user-event">{fb.event_name}</div>
                        </div>
                      </div>
                      <div className="star-rating">
                        {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                      </div>
                    </div>
                    <p className="review-comment">
                      "{fb.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .feedback-page { min-height: 100vh; background: var(--bg-app); padding-bottom: 80px; }
        .feedback-container { padding-top: 20px; }
        .feedback-hero { text-align: center; margin-bottom: 40px; }
        .hero-title { font-size: clamp(2rem, 8vw, 3.5rem); }
        .hero-subtitle { color: var(--text-secondary); margin-top: 8px; font-weight: 600; }
        
        .feedback-form-card { grid-column: span 5; padding: clamp(20px, 5vw, 40px); }
        .section-title { margin-bottom: 8px; font-size: 24px; font-weight: 900; }
        .section-desc { color: var(--text-secondary); margin-bottom: 32px; font-size: 14px; }
        
        .feedback-form { display: flex; flex-direction: column; gap: 20px; }
        .status-overlay { width: 100%; justify-content: center; padding: 12px; border-radius: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 11px; font-weight: 800; color: var(--text-muted); margin-left: 4px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .feedback-textarea { min-height: 120px; resize: none; padding-top: 16px; }
        
        .chart-section { margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--border); }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .chart-title { font-size: 16px; font-weight: 900; }
        .chart-badge { background: var(--primary-glow); color: var(--primary); padding: 6px 14px; border-radius: 100px; font-size: 14px; font-weight: 900; }
        .chart-container-small { height: 200px; position: relative; }
        
        .reviews-section { grid-column: span 7; display: flex; flex-direction: column; gap: 24px; }
        .reviews-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
        .reviews-count { font-size: 12px; font-weight: 800; color: var(--primary); background: var(--primary-glow); padding: 6px 16px; border-radius: 20px; }
        .reviews-list { display: flex; flex-direction: column; gap: 16px; }
        
        .empty-reviews { text-align: center; padding: 80px 20px; color: var(--text-muted); background: var(--glass-bg); border-radius: var(--radius-lg); }
        .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }
        
        .review-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .review-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
        .review-user { display: flex; gap: 12px; align-items: center; }
        .user-avatar { width: 40px; height: 40px; background: var(--primary); color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; flex-shrink: 0; }
        .user-name { font-weight: 800; font-size: 16px; }
        .user-event { font-size: 11px; color: var(--text-secondary); font-weight: 700; }
        .star-rating { color: var(--warning); font-size: 14px; letter-spacing: 1px; background: var(--glass-bg); padding: 4px 10px; border-radius: 8px; }
        .review-comment { margin: 0; font-size: 14px; color: var(--text-primary); opacity: 0.85; line-height: 1.6; font-style: italic; border-left: 2px solid var(--primary); padding-left: 16px; }

        @media (max-width: 1024px) {
          .feedback-form-card, .reviews-section { grid-column: span 2 !important; }
        }

        @media (max-width: 640px) {
          .feedback-form-card, .reviews-section { grid-column: span 1 !important; }
          .form-row { grid-template-columns: 1fr; }
          .chart-badge { font-size: 12px; padding: 4px 10px; }
        }
      `}</style>
    </div>
  );
}

export default Feedback;
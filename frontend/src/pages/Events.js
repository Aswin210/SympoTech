import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Events Category Selection Page
 * Allows users to choose between Technical and Non-Technical events.
 */
function Events() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ display: "flex", justifyContent: "center", paddingTop: "60px" }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: "500px", textAlign: "center", padding: "48px" }}>
          <h1 className="gradient-text" style={{ marginBottom: "16px", fontSize: "36px" }}>Event Arena</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "40px", fontSize: "16px" }}>
            Choose your domain and showcase your brilliance.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <button 
              className="primary-button" 
              style={{ width: "100%", padding: "24px", justifyContent: "flex-start", gap: "24px", borderRadius: "var(--radius-md)" }}
              onClick={() => navigate("/technical")}
            >
              <div style={{ fontSize: "32px", background: "rgba(255,255,255,0.2)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>💻</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: "800", fontSize: "20px" }}>Technical</div>
                <div style={{ fontSize: "13px", opacity: 0.9, fontWeight: "500" }}>Coding, AI, Cyber Security</div>
              </div>
            </button>

            <button 
              className="secondary-button" 
              style={{ width: "100%", padding: "24px", justifyContent: "flex-start", gap: "24px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}
              onClick={() => navigate("/non-technical")}
            >
              <div style={{ fontSize: "32px", background: "var(--glass-bg)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>🎭</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: "800", fontSize: "20px" }}>Non-Technical</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>Art, Quiz, Fun Events</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Events;
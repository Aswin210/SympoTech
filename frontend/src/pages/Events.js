import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Events() {
  const navigate = useNavigate();

  const [hoverTech, setHoverTech] = useState(false);
  const [hoverNonTech, setHoverNonTech] = useState(false);

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const navWrapper = {
    width: "100%",
  };

  const cardStyle = {
    marginTop: "80px",
    marginBottom: "24px",
    padding: "clamp(20px, 5vw, 40px)",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    textAlign: "center",
    color: "#fff",
    width: "min(350px, calc(100vw - 32px))",
    boxSizing: "border-box",
  };

  const headingStyle = {
    fontSize: "clamp(20px, 5vw, 28px)",
    marginBottom: "30px",
    fontWeight: "bold",
  };

  const buttonBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "clamp(12px, 3vw, 15px)",
    margin: "15px 0",
    fontSize: "clamp(15px, 4vw, 18px)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <div style={pageStyle}>
      <div style={navWrapper}>
        <Navbar />
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>✨ Select Event Category</h2>

        {/* 💻 Technical */}
        <button
          style={{
            ...buttonBase,
            background: hoverTech
              ? "linear-gradient(135deg, #ff7eb3, #ff758c)"
              : "#ffffff",
            color: hoverTech ? "#fff" : "#333",
            transform: hoverTech ? "scale(1.05)" : "scale(1)",
          }}
          onMouseEnter={() => setHoverTech(true)}
          onMouseLeave={() => setHoverTech(false)}
          onTouchStart={() => setHoverTech(true)}
          onTouchEnd={() => setHoverTech(false)}
          onClick={() => navigate("/technical")}
        >
          💻 Technical Events
        </button>

        {/* 🎭 Non-Technical */}
        <button
          style={{
            ...buttonBase,
            background: hoverNonTech
              ? "linear-gradient(135deg, #42e695, #3bb2b8)"
              : "#ffffff",
            color: hoverNonTech ? "#fff" : "#333",
            transform: hoverNonTech ? "scale(1.05)" : "scale(1)",
          }}
          onMouseEnter={() => setHoverNonTech(true)}
          onMouseLeave={() => setHoverNonTech(false)}
          onTouchStart={() => setHoverNonTech(true)}
          onTouchEnd={() => setHoverNonTech(false)}
          onClick={() => navigate("/non-technical")}
        >
          🎭 Non-Technical Events
        </button>
      </div>
    </div>
  );
}

export default Events;
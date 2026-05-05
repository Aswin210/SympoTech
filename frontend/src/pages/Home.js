import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bgVideo from "../assets/background.mp4";

/**
 * Home Page Component
 * Features a hero section with background video and a live event countdown timer.
 */

// ── Set your event date here ──────────────────────────────────────────────────
const EVENT_DATE = new Date("2026-06-15T09:00:00");
// ─────────────────────────────────────────────────────────────────────────────

function useCountdown(target) {
  const calc = () => {
    const diff = target - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return time;
}

function CountdownUnit({ value, label }) {
  return (
    <div className="countdown-unit">
      <span className="unit-value">
        {String(value).padStart(2, "0")}
      </span>
      <span className="unit-label">
        {label}
      </span>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const countdown = useCountdown(EVENT_DATE);

  return (
    <div className="home-container" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      <div className="container">

        {/* Hero Section */}
        <section className="hero-section fade-in">
          {/* Background Video */}
          <video autoPlay loop muted playsInline className="hero-video">
            <source src={bgVideo} type="video/mp4" />
          </video>

          {/* Gradient Overlay */}
          <div className="hero-overlay" />

          {/* Content */}
          <div className="hero-content">
            <h1 className="gradient-text hero-title">
              SympoTech
            </h1>
            <p className="hero-subtitle">
              The next generation of college event management. Seamless, secure, and powered by innovation.
            </p>

            {/* Countdown */}
            {!countdown.expired ? (
              <div style={{ marginBottom: "40px" }}>
                <p className="countdown-header">
                  🗓️ Event Starts In
                </p>
                <div className="countdown-grid">
                  <CountdownUnit value={countdown.days}    label="Days" />
                  <CountdownUnit value={countdown.hours}   label="Hrs" />
                  <CountdownUnit value={countdown.minutes} label="Min" />
                  <CountdownUnit value={countdown.seconds} label="Sec" />
                </div>
              </div>
            ) : (
              <div className="event-live-badge">
                <span>🎉 Event is Live Now!</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="hero-buttons mobile-flex-column">
              <button onClick={() => navigate("/events")} className="primary-button mobile-w-full" style={{ padding: "16px 36px", fontSize: "16px" }}>
                Get Started
              </button>
              <button onClick={() => navigate("/my-ticket")} className="secondary-button mobile-w-full" style={{ padding: "16px 36px", fontSize: "16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                🎫 My Ticket
              </button>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          SYMPOTECH • THE FUTURE OF EVENTS
        </footer>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          height: min(85vh, 780px);
          border-radius: var(--radius-xl);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          margin-top: 20px;
        }
        .hero-video {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover; z-index: -2;
        }
        .hero-overlay {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(9,9,11,0.3), rgba(9,9,11,0.85));
          z-index: -1;
        }
        .hero-content { text-align: center; max-width: 800px; padding: 0 24px; z-index: 1; }
        .hero-title { font-size: clamp(2.5rem,10vw,5rem); margin-bottom: 16px; }
        .hero-subtitle { font-size: clamp(1rem,2vw,1.3rem); color: rgba(255,255,255,0.7); margin-bottom: 40px; font-weight: 500; max-width: 560px; margin: 0 auto 40px; }
        
        .countdown-header { color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
        .countdown-grid { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .countdown-unit {
          display: flex; flex-direction: column; align-items: center;
          background: rgba(255,255,255,0.08); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
          padding: 16px 20px; min-width: 70px;
        }
        .unit-value { font-size: clamp(28px,6vw,44px); font-weight: 900; line-height: 1; color: #fff; }
        .unit-label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; }
        
        .event-live-badge { margin-bottom: 40px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 16px 32px; display: inline-block; }
        .event-live-badge span { color: #10b981; font-weight: 900; font-size: 16px; }
        
        .hero-buttons { display: flex; gap: 16px; justify-content: center; position: relative; z-index: 10; }
        
        .home-footer { text-align: center; margin-top: 80px; padding-bottom: 20px; color: var(--text-muted); font-size: 12px; font-weight: 700; letter-spacing: 2px; }

        @media (max-width: 640px) {
          .hero-section { height: auto; min-height: 600px; padding: 100px 0; border-radius: var(--radius-lg); }
          .countdown-grid { gap: 8px; }
          .countdown-unit { padding: 12px 14px; min-width: 60px; }
          .hero-buttons { flex-direction: column; width: 100%; padding: 0 20px; }
        }
      `}</style>
    </div>
  );
}

export default Home;


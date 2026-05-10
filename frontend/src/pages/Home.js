import React from "react";
import { useNavigate } from "react-router-dom";
import bgVideo from "../assets/background.mp4";

/**
 * Home Page Component
 * Features a hero section with background video and a live event countdown timer.
 */

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <div className="container home-flex-container">
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

            {/* CTA Buttons */}
            <div className="hero-buttons">
              <button onClick={() => navigate("/events")} className="primary-button hero-btn">
                Get Started
              </button>
              <button onClick={() => navigate("/my-ticket")} className="secondary-button hero-btn glass-btn">
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
        .home-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-bottom: 20px;
        }
        .home-flex-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        .hero-section {
          position: relative;
          flex: 1;
          max-height: calc(100vh - 220px);
          min-height: 500px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          margin-top: 10px;
        }
        .hero-video {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover; z-index: -2;
        }
        .hero-overlay {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(9,9,11,0.2), rgba(9,9,11,0.85));
          z-index: -1;
        }
        .hero-content { text-align: center; max-width: 800px; padding: 0 24px; z-index: 1; }
        .hero-title { font-size: clamp(3rem, 12vw, 6rem); margin-bottom: 12px; line-height: 1; }
        .hero-subtitle { font-size: clamp(1rem, 2vw, 1.25rem); color: rgba(255,255,255,0.8); margin-bottom: 40px; font-weight: 500; max-width: 580px; margin: 0 auto 40px; line-height: 1.5; }
        
        .hero-buttons { display: flex; gap: 20px; justify-content: center; position: relative; z-index: 10; }
        .hero-btn { padding: 18px 40px; font-size: 16px; min-width: 180px; }
        .glass-btn { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); }
        .glass-btn:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }
        
        .home-footer { text-align: center; padding: 20px 0; color: var(--text-muted); font-size: 11px; font-weight: 700; letter-spacing: 3px; opacity: 0.6; }

        @media (max-width: 1024px) {
          .home-wrapper { overflow: auto; height: auto; }
          .hero-section { max-height: none; height: auto; padding: 120px 20px; }
        }

        @media (max-width: 640px) {
          .hero-section { min-height: 550px; border-radius: var(--radius-lg); margin-top: 0; }
          .hero-buttons { flex-direction: column; width: 100%; max-width: 300px; margin: 0 auto; gap: 12px; }
          .hero-btn { width: 100%; padding: 16px; min-width: 0; }
          .hero-title { font-size: 3.5rem; }
          .home-footer { margin-top: 40px; }
        }
      `}</style>
    </div>
  );
}

export default Home;


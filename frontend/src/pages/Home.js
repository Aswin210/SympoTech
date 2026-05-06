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
        
        .hero-buttons { display: flex; gap: 16px; justify-content: center; position: relative; z-index: 10; }
        
        .home-footer { text-align: center; margin-top: 80px; padding-bottom: 20px; color: var(--text-muted); font-size: 12px; font-weight: 700; letter-spacing: 2px; }

        @media (max-width: 640px) {
          .hero-section { height: auto; min-height: 600px; padding: 100px 0; border-radius: var(--radius-lg); }
          .hero-buttons { flex-direction: column; width: 100%; padding: 0 20px; }
        }
      `}</style>
    </div>
  );
}

export default Home;


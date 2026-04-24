import React from "react";
import { useNavigate } from "react-router-dom";
import bgVideo from "../assets/background.mp4";

/**
 * Home Page Component
 * Features a Bento-style hero section with a background video.
 */
function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container" style={{ minHeight: "100vh", padding: "0 0 80px" }}>
      <div className="container">
        {/* Hero Section */}
        <section className="fade-in" style={{ 
          position: "relative", 
          height: "min(80vh, 700px)", 
          borderRadius: "var(--radius-xl)", 
          overflow: "hidden", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          boxShadow: "var(--shadow-lg)",
          marginTop: "20px"
        }}>
          {/* Background Video */}
          <video autoPlay loop muted playsInline style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            zIndex: -2 
          }}>
            <source src={bgVideo} type="video/mp4" />
          </video>

          {/* Overlay */}
          <div style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            background: "linear-gradient(to bottom, transparent, var(--bg-app))", 
            zIndex: -1 
          }} />

          <div style={{ textAlign: "center", maxWidth: "800px", padding: "0 24px" }}>
            <h1 className="gradient-text" style={{ fontSize: "clamp(2.5rem, 10vw, 5rem)", marginBottom: "20px" }}>
              SympoTech
            </h1>
            <p style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", color: "var(--text-secondary)", marginBottom: "32px", fontWeight: "500", maxWidth: "600px", margin: "0 auto 32px" }}>
              The next generation of college event management. Seamless, secure, and powered by innovation.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/events")} className="primary-button">
                Get Started
              </button>
              <button onClick={() => navigate("/about")} className="secondary-button">
                View Info
              </button>
            </div>
          </div>
        </section>

        <footer style={{ textAlign: "center", marginTop: "80px", paddingBottom: "20px", color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", letterSpacing: "2px" }}>
          SYMPOTECH • THE FUTURE OF EVENTS
        </footer>
      </div>
    </div>
  );
}

export default Home;

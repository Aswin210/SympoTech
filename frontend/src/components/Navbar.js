import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Navbar Component
 * Refactored for Proper Design & Mobile Responsiveness.
 */
function Navbar({ theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="sympo-navbar fade-in">
        <Link to="/" className="sympo-logo" onClick={closeMenu} style={{ fontSize: "clamp(14px, 2vw, 18px)" }}>
          SympoTech Event Management System
        </Link>

        {/* Desktop Links */}
        <div className="sympo-links">
          <Link to="/" className="sympo-link">Home</Link>
          <Link to="/events" className="sympo-link">Events</Link>
          <Link to="/winners" className="sympo-link" style={{ color: "#FFD700", fontWeight: "800" }}>Winners 🏆</Link>
          <Link to="/feedback" className="sympo-link">Feedback</Link>
          <Link to="/about" className="sympo-link">About</Link>
          <Link to="/admin-login" className="sympo-link" style={{ background: "var(--glass-bg)", borderRadius: "10px" }}>Admin</Link>
          
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Mobile Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }} className="mobile-only-flex">
          <button 
            className="theme-toggle mobile-theme-btn" 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          <button
            className={"sympo-hamburger " + (menuOpen ? "open" : "")}
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            style={{ marginLeft: "4px" }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={"sympo-mobile-menu " + (menuOpen ? "is-open" : "")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
          <Link to="/" onClick={closeMenu} className="secondary-button" style={{ justifyContent: "center", padding: "18px", fontSize: "16px" }}>🏠 Home</Link>
          <Link to="/events" onClick={closeMenu} className="secondary-button" style={{ justifyContent: "center", padding: "18px", fontSize: "16px" }}>🎉 Events</Link>
          <Link to="/winners" onClick={closeMenu} className="secondary-button" style={{ justifyContent: "center", padding: "18px", fontSize: "16px", color: "#FFD700", borderColor: "rgba(255, 215, 0, 0.3)" }}>🏆 Winners</Link>
          <Link to="/feedback" onClick={closeMenu} className="secondary-button" style={{ justifyContent: "center", padding: "18px", fontSize: "16px" }}>💬 Feedback</Link>
          <Link to="/about" onClick={closeMenu} className="secondary-button" style={{ justifyContent: "center", padding: "18px", fontSize: "16px" }}>ℹ️ About Us</Link>
          <Link to="/admin-login" onClick={closeMenu} className="primary-button" style={{ marginTop: "20px", padding: "18px" }}>🔐 Admin Portal</Link>
          
          <button onClick={closeMenu} className="secondary-button" style={{ marginTop: "40px", border: "none", opacity: 0.6 }}>
            Close Menu
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 1025px) {
          .mobile-only-flex { display: none !important; }
        }
        @media (max-width: 1024px) {
          .sympo-links { display: none !important; }
          .mobile-only-flex { display: flex !important; }
        }
      `}</style>
    </>
  );
}

export default Navbar;
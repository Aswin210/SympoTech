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
        <Link to="/" className="sympo-logo" onClick={closeMenu}>
          <span className="desktop-only">SympoTech Event Management System</span>
          <span className="mobile-only">SympoTech</span>
        </Link>

        {/* Desktop Links */}
        <div className="sympo-links">
          <Link to="/" className="sympo-link">Home</Link>
          <Link to="/events" className="sympo-link">Events</Link>
          <Link to="/winners" className="sympo-link" style={{ color: "#FFD700" }}>Winners 🏆</Link>
          <Link to="/feedback" className="sympo-link">Feedback</Link>
          <Link to="/about" className="sympo-link">About</Link>
          <Link to="/admin-login" className="sympo-link" style={{ background: "var(--glass-bg)", marginLeft: "8px" }}>Admin</Link>
          
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            style={{ marginLeft: "8px" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="mobile-actions">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          <button
            className={"sympo-hamburger " + (menuOpen ? "open" : "")}
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={"sympo-mobile-menu " + (menuOpen ? "is-open" : "")}>
        <div className="mobile-menu-content">
          <Link to="/" onClick={closeMenu} className="secondary-button mobile-w-full">🏠 Home</Link>
          <Link to="/events" onClick={closeMenu} className="secondary-button mobile-w-full">🎉 Events</Link>
          <Link to="/winners" onClick={closeMenu} className="secondary-button mobile-w-full" style={{ color: "#FFD700", borderColor: "rgba(255, 215, 0, 0.3)" }}>🏆 Winners</Link>
          <Link to="/feedback" onClick={closeMenu} className="secondary-button mobile-w-full">💬 Feedback</Link>
          <Link to="/about" onClick={closeMenu} className="secondary-button mobile-w-full">ℹ️ About Us</Link>
          <Link to="/admin-login" onClick={closeMenu} className="primary-button mobile-w-full" style={{ marginTop: "20px" }}>🔐 Admin Portal</Link>
          
          <button onClick={closeMenu} className="secondary-button" style={{ marginTop: "40px", border: "none", opacity: 0.6 }}>
            Close Menu
          </button>
        </div>
      </div>

      <style>{`
        .desktop-only { display: inline; }
        .mobile-only { display: none; }
        .mobile-actions { display: none; gap: 8px; align-items: center; }
        .mobile-menu-content { 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
          width: 100%; 
          max-width: 320px; 
          padding: 20px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .desktop-only { display: none; }
          .mobile-only { display: inline; }
          .mobile-actions { display: flex; }
          
          .sympo-mobile-menu {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .sympo-logo { font-size: 18px !important; }
        }
      `}</style>
    </>
  );
}

export default Navbar;
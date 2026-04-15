import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .sympo-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #222;
          padding: 12px 20px;
          color: white;
          position: relative;
          z-index: 1000;
          width: 100%;
        }

        .sympo-logo {
          font-size: 18px;
          font-weight: bold;
          color: white;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 10px;
        }

        .sympo-hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          z-index: 1100;
          min-width: 36px;
          min-height: 36px;
        }

        .sympo-hamburger .bar {
          display: block;
          width: 24px;
          height: 3px;
          background: white;
          border-radius: 3px;
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform-origin: center;
        }

        .sympo-hamburger.open .bar:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }

        .sympo-hamburger.open .bar:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .sympo-hamburger.open .bar:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        .sympo-links {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .sympo-link {
          text-decoration: none;
          color: white;
          font-size: 15px;
          white-space: nowrap;
          transition: color 0.2s;
        }

        .sympo-link:hover {
          color: #ff7eb3;
        }

        .sympo-mobile-menu {
          display: none;
          flex-direction: column;
          background: #2a2a2a;
          width: 100%;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 998;
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
          overflow: hidden;
        }

        .sympo-mobile-menu.is-open {
          display: flex;
        }

        .sympo-mobile-menu a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 24px;
          color: white;
          text-decoration: none;
          font-size: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          transition: background 0.2s;
        }

        .sympo-mobile-menu a:last-child {
          border-bottom: none;
        }

        .sympo-mobile-menu a:hover,
        .sympo-mobile-menu a:active {
          background: rgba(255, 126, 179, 0.15);
          color: #ff7eb3;
        }

        @media (max-width: 768px) {
          .sympo-logo {
            font-size: 15px;
          }

          .sympo-hamburger {
            display: flex;
          }

          .sympo-links {
            display: none;
          }
        }

        @media (max-width: 380px) {
          .sympo-logo {
            font-size: 13px;
          }

          .sympo-navbar {
            padding: 10px 14px;
          }
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 1000 }}>
        <nav className="sympo-navbar">
          <div className="sympo-logo">Sympotech Event Management System</div>

          <div className="sympo-links">
            <Link to="/" className="sympo-link">Home</Link>
            <Link to="/events" className="sympo-link">Events</Link>
            <Link to="/admin-login" className="sympo-link">Admin Login</Link>
            <Link to="/feedback" className="sympo-link">FeedBack</Link>
            <Link to="/about" className="sympo-link">About</Link>
          </div>

          <button
            className={"sympo-hamburger " + (menuOpen ? "open" : "")}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </nav>

        <div className={"sympo-mobile-menu " + (menuOpen ? "is-open" : "")}>
          <Link to="/" onClick={closeMenu}>🏠 Home</Link>
          <Link to="/events" onClick={closeMenu}>🎉 Events</Link>
          <Link to="/admin-login" onClick={closeMenu}>🔐 Admin Login</Link>
          <Link to="/feedback" onClick={closeMenu}>💬 FeedBack</Link>
          <Link to="/about" onClick={closeMenu}>ℹ️ About</Link>
        </div>
      </div>
    </>
  );
}

export default Navbar;
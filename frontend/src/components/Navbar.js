import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <style>{`
        .sympo-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #222;
          padding: 12px 20px;
          color: white;
          position: relative;
          z-index: 1000;
        }

        .sympo-logo {
          font-size: 20px;
          font-weight: bold;
          color: white;
          flex: 1;
        }

        .sympo-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          z-index: 1100;
        }

        .sympo-hamburger span {
          display: block;
          width: 25px;
          height: 3px;
          background: white;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .sympo-hamburger.open span:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }

        .sympo-hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .sympo-hamburger.open span:nth-child(3) {
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

        /* Mobile overlay */
        .sympo-mobile-menu {
          display: none;
        }

        @media (max-width: 768px) {
          .sympo-logo {
            font-size: 16px;
          }

          .sympo-hamburger {
            display: flex;
          }

          .sympo-links {
            display: none;
          }

          .sympo-mobile-menu {
            display: ${menuOpen ? "flex" : "none"};
            flex-direction: column;
            background: #333;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 999;
            padding: 10px 0;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          }

          .sympo-mobile-menu a {
            padding: 14px 24px;
            color: white;
            text-decoration: none;
            font-size: 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            transition: background 0.2s;
          }

          .sympo-mobile-menu a:last-child {
            border-bottom: none;
          }

          .sympo-mobile-menu a:hover {
            background: rgba(255,255,255,0.1);
          }
        }
      `}</style>

      <nav className="sympo-navbar">
        <div className="sympo-logo">Sympotech Event Management System</div>

        {/* Desktop Links */}
        <div className="sympo-links">
          <Link to="/" className="sympo-link">Home</Link>
          <Link to="/events" className="sympo-link">Events</Link>
          <Link to="/admin-login" className="sympo-link">Admin Login</Link>
          <Link to="/feedback" className="sympo-link">FeedBack</Link>
          <Link to="/about" className="sympo-link">About</Link>
        </div>

        {/* Hamburger Button */}
        <button
          className={`sympo-hamburger ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div className="sympo-mobile-menu" style={{ display: menuOpen ? "flex" : "none" }}>
        <Link to="/" onClick={closeMenu}>🏠 Home</Link>
        <Link to="/events" onClick={closeMenu}>🎉 Events</Link>
        <Link to="/admin-login" onClick={closeMenu}>🔐 Admin Login</Link>
        <Link to="/feedback" onClick={closeMenu}>💬 FeedBack</Link>
        <Link to="/about" onClick={closeMenu}>ℹ️ About</Link>
      </div>
    </>
  );
}

export default Navbar;
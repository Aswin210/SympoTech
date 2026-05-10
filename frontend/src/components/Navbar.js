import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

/**
 * Navbar Component
 * Refactored for Proper Design & Mobile Responsiveness.
 */
function Navbar({ theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem("selected_events");
      if (saved) {
        setCartCount(JSON.parse(saved).length);
      } else {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("cartUpdated", updateCount);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("cartUpdated", updateCount);
    };
  }, []);

  return (
    <>
      <nav className="sympo-navbar nav-fade-in">
        <Link to="/" className="sympo-logo" onClick={closeMenu}>
          <span className="desktop-only">SympoTech Event Management System</span>
          <span className="mobile-only">SympoTech</span>
        </Link>

        {/* Desktop Links */}
        <div className="sympo-links">
          <div className="nav-group main-links">
            <NavLink to="/" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")}>Home</NavLink>
            <NavLink to="/events" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")}>Events</NavLink>
            <NavLink to="/cart" className={({ isActive }) => "sympo-link cart-nav-link" + (isActive ? " active" : "")}>
              Cart 🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>
            <NavLink to="/winners" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")} style={{ color: "var(--warning)" }}>Winners 🏆</NavLink>
            <NavLink to="/feedback" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")}>Feedback</NavLink>
            <NavLink to="/about" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")}>About</NavLink>
          </div>
          
          <div className="nav-group action-links">
            <NavLink to="/admin-login" className={({ isActive }) => "sympo-link admin-btn" + (isActive ? " active" : "")}>Admin</NavLink>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
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
          <Link to="/cart" onClick={closeMenu} className="secondary-button mobile-w-full">
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
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

        .cart-nav-link { position: relative; }
        .cart-badge {
          position: absolute;
          top: 4px;
          right: 2px;
          background: var(--danger);
          color: white;
          font-size: 8.5px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 100px;
          min-width: 15px;
          text-align: center;
          border: 2px solid var(--bg-navbar);
          line-height: 1;
        }

        .nav-group { display: flex; align-items: center; gap: 2px; }
        .action-links { margin-left: 8px; padding-left: 8px; border-left: 1px solid var(--border); }
        .admin-btn { background: rgba(255,255,255,0.03); border: 1px solid var(--border); }
        .admin-btn.active { background: rgba(99, 102, 241, 0.15); border-color: var(--primary); }
        .theme-toggle { border-radius: 100px; width: 40px; height: 40px; border: 1px solid transparent; }
        .theme-toggle:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); border-color: var(--border); }

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
import React, { useState, useEffect, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api";

/**
 * Navbar Component
 * Refactored for Proper Design & Mobile Responsiveness.
 */
function Navbar({ theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const [cartCount, setCartCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(() => {
    const saved = localStorage.getItem("last_seen_notif");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [hiddenNotifs, setHiddenNotifs] = useState(() => {
    const saved = localStorage.getItem("hidden_notifs");
    return saved ? JSON.parse(saved) : [];
  });

  const isAdmin = localStorage.getItem("admin") === "true";

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

  // ── Notification Polling ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) { console.warn("Notif fetch failed"); }
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => parseInt(n.id, 10) > lastSeenId && !hiddenNotifs.includes(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, lastSeenId, hiddenNotifs]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const openNotifs = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (notifications.length > 0) {
      const newestId = notifications[0].id;
      setLastSeenId(newestId);
      setUnreadCount(0);
      localStorage.setItem("last_seen_notif", newestId.toString());
    }
  };

  const deleteNotification = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return dismissNotif(id);
    
    if (!window.confirm("Permanently delete this broadcast for all users?")) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/notifications/delete/${id}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
      } else {
        alert("❌ " + (res.data.message || "Delete failed"));
      }
    } catch (err) {
      console.error("Delete failed", err);
      const errMsg = err.response?.data?.message || err.message || "Connection error";
      alert("❌ " + errMsg);
    }
  };

  const dismissNotif = (id) => {
    const updated = [...hiddenNotifs, id];
    setHiddenNotifs(updated);
    localStorage.setItem("hidden_notifs", JSON.stringify(updated));
  };

  const notificationUI = (
    <div className="notif-wrapper">
      <button 
        className={"notif-bell " + (unreadCount > 0 ? "has-unread" : "")} 
        onClick={openNotifs} 
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      
      {showNotifDropdown && (
        <div className="notif-dropdown glass-card">
          <div className="notif-header">
            <h4>Announcements</h4>
            <button onClick={() => setShowNotifDropdown(false)}>✕</button>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No new announcements</div>
            ) : (
              notifications
                .filter(n => !hiddenNotifs.includes(n.id))
                .map(n => (
                  <div key={n.id} className={"notif-item " + n.type}>
                    <span className="notif-icon">
                      {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'danger' ? '🚨' : 'ℹ️'}
                    </span>
                    <div className="notif-content">
                      <p>{n.message}</p>
                      <span className="notif-time">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button 
                      className="notif-delete-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        isAdmin ? deleteNotification(n.id) : dismissNotif(n.id);
                      }} 
                      title={isAdmin ? "Delete Permanently" : "Dismiss"}
                    >
                      {isAdmin ? "🗑️" : "✕"}
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );

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
            <NavLink to="/event-radar" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")} style={{ color: "var(--primary)" }}>Radar 📡</NavLink>
            <NavLink to="/about" className={({ isActive }) => "sympo-link" + (isActive ? " active" : "")}>About</NavLink>
          </div>
          
          <div className="nav-group action-links">
            {notificationUI}

            <NavLink to="/admin-login" className={({ isActive }) => "sympo-link admin-btn" + (isActive ? " active" : "")}>Admin</NavLink>
            <button className="theme-toggle desktop-only" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="mobile-actions">
          {notificationUI}
          
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
          <Link to="/event-radar" onClick={closeMenu} className="secondary-button mobile-w-full" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>📡 Live Radar</Link>
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

        @media (max-width: 480px) {
          .sympo-logo { font-size: 18px !important; }
        }

        /* --- NOTIFICATIONS --- */
        .notif-wrapper { position: relative; }
        .notif-bell {
          background: none; border: none; font-size: 20px; cursor: pointer;
          width: 40px; height: 40px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; position: relative;
          transition: var(--transition-fast);
        }
        .notif-bell:hover { background: rgba(255,255,255,0.05); }
        .notif-badge {
          position: absolute; top: 8px; right: 8px; background: var(--danger);
          color: white; font-size: 9px; font-weight: 800; padding: 2px 5px;
          border-radius: 10px; border: 2px solid var(--bg-navbar);
        }
        .notif-bell.has-unread { animation: ring 2s infinite; }
        
        .notif-dropdown {
          position: absolute; top: 50px; right: 0; width: 300px;
          max-height: 400px; padding: 0; overflow: hidden; z-index: 3000;
          box-shadow: var(--shadow-lg); animation: slideDown 0.3s ease;
          border-radius: var(--radius-md); background: var(--bg-surface);
        }
        .notif-header {
          padding: 16px; border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(255,255,255,0.02);
        }
        .notif-header h4 { margin: 0; font-size: 14px; }
        .notif-header button { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        
        .notif-list { overflow-y: auto; max-height: 340px; }
        .notif-item {
          padding: 12px 16px; border-bottom: 1px solid var(--border);
          display: flex; gap: 12px; transition: var(--transition-fast);
        }
        .notif-item:hover { background: rgba(255,255,255,0.03); }
        .notif-icon { font-size: 18px; margin-top: 2px; }
        .notif-content p { margin: 0; font-size: 13px; font-weight: 600; line-height: 1.4; color: var(--text-primary); }
        .notif-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; display: block; }
        .notif-empty { padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px; }

        .notif-item.warning { border-left: 3px solid var(--warning); }
        .notif-item.danger { border-left: 3px solid var(--danger); }
        .notif-item.success { border-left: 3px solid var(--success); }

        .notif-delete-btn {
          background: none;
          border: none;
          font-size: 14px;
          cursor: pointer;
          opacity: 0.3;
          transition: var(--transition-fast);
          padding: 8px;
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: var(--text-muted);
        }
        .notif-delete-btn:hover {
          opacity: 1;
          background: rgba(244, 63, 94, 0.1);
          color: var(--danger);
        }

        @keyframes ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .desktop-only { display: none; }
          .mobile-only { display: inline; }
          .mobile-actions { display: flex; align-items: center; gap: 4px; }
          
          .notif-dropdown {
            position: fixed !important;
            top: 75px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100vw - 40px) !important;
            max-width: 350px !important;
            right: auto !important;
            max-height: 80vh;
            z-index: 9999;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          }

          .sympo-mobile-menu {
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
}

export default Navbar;
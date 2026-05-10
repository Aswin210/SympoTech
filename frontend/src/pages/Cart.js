import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

/**
 * Cart Page
 * Displays selected events, pricing summary, and allows proceeding to registration.
 */
function Cart() {
  const navigate = useNavigate();
  const [selectedEvents, setSelectedEvents] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("selected_events");
    if (saved) {
      setSelectedEvents(JSON.parse(saved));
    }
  }, []);

  const removeEvent = (id) => {
    const updated = selectedEvents.filter(e => e.id !== id);
    setSelectedEvents(updated);
    localStorage.setItem("selected_events", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateTeamSize = (id, size) => {
    const updated = selectedEvents.map(e => e.id === id ? { ...e, teamSize: parseInt(size) } : e);
    setSelectedEvents(updated);
    localStorage.setItem("selected_events", JSON.stringify(updated));
  };

  const calculateTotal = () => {
    const count = selectedEvents.length;
    if (count === 1) return 100;
    if (count === 2) return 180;
    if (count === 3) return 250;
    return 0;
  };

  if (selectedEvents.length === 0) {
    return (
      <>
        <div className="cart-empty-wrapper fade-in">
          <div className="cart-empty-container">
          <div className="glass-card text-center cart-empty-card">
            <div className="empty-cart-icon">🛒</div>
            <h2 className="empty-cart-title">Your cart is empty</h2>
            <p className="empty-cart-text">
              Explore our technical and non-technical events and add them to your cart to participate.
            </p>
            <div className="empty-cart-actions">
              <Link to="/technical" className="primary-button">Technical</Link>
              <Link to="/non-technical" className="secondary-button">Non-Technical</Link>
            </div>
          </div>
        </div>
        </div>
        
        {/* We must include the styles here too, otherwise they aren't applied on empty cart */}
        <style>{`
          .cart-empty-wrapper { 
            height: calc(100vh - 130px);
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: var(--bg-app);
            padding: 10px;
            overflow: hidden;
          }
          .cart-empty-container {
            width: 100%;
            max-width: 360px;
            margin-top: -30px;
          }
          .cart-empty-card {
            padding: 30px !important;
            border-radius: var(--radius-lg) !important;
            box-shadow: var(--shadow-lg) !important;
          }
          .empty-cart-icon { font-size: 40px; margin-bottom: 8px; }
          .empty-cart-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; }
          .empty-cart-text { color: var(--text-secondary); margin-bottom: 24px; font-size: 12px; font-weight: 600; }
          .empty-cart-actions { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
          .empty-cart-actions a { width: 100%; padding: 14px !important; font-size: 14px !important; border-radius: 10px !important; text-decoration: none; }
          @media (max-width: 640px) {
            .cart-empty-wrapper { height: auto; min-height: calc(100vh - 130px); overflow: auto; padding: 40px 16px; align-items: flex-start; }
            .cart-empty-container { margin-top: 0; max-width: 100%; }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "20px", paddingBottom: "80px" }}>
      <div className="cart-header fade-in">
        <h1 className="gradient-text" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Review Your Selection</h1>
        <p style={{ color: "var(--text-secondary)" }}>You can select up to 3 events to get tiered discounts.</p>
      </div>

      <div className="grid-bento" style={{ marginTop: "40px" }}>
        {/* Cart Items */}
        <div className="col-8">
          <div className="glass-card" style={{ padding: "0" }}>
            <div className="cart-items-list">
              {selectedEvents.map((event) => (
                <div key={event.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-icon">⚡</div>
                    <div>
                      <h3 className="cart-item-name">{event.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                        <p className="cart-item-cat">{event.category || "Symposium Event"}</p>
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>•</span>
                        <div className="team-selector">
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginRight: "6px" }}>PARTICIPANTS:</label>
                          <select 
                            value={event.teamSize || 1} 
                            onChange={(e) => updateTeamSize(event.id, e.target.value)}
                            className="team-select"
                          >
                            <option value="1">1 (Solo)</option>
                            <option value="2">2 Members</option>
                            <option value="3">3 Members</option>
                            <option value="4">4 Members</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeEvent(event.id)} className="remove-btn" title="Remove Event">
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ padding: "20px 30px", background: "var(--glass-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link to="/events" style={{ color: "var(--primary)", fontWeight: "700", textDecoration: "none", fontSize: "14px" }}>
                ← Add more events
              </Link>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>
                {selectedEvents.length}/3 Events Selected
              </span>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="col-4">
          <div className="glass-card" style={{ position: "sticky", top: "130px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "24px" }}>Payment Summary</h2>
            
            <div className="summary-row">
              <span>Events Count</span>
              <span>{selectedEvents.length}</span>
            </div>
            
            <div className="summary-row" style={{ marginTop: "12px" }}>
              <span>Base Pricing</span>
              <span style={{ textDecoration: "line-through", opacity: 0.5 }}>₹{selectedEvents.length * 100}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>Total Amount</span>
              <span className="gradient-text">₹{calculateTotal()}</span>
            </div>

            <p style={{ fontSize: "12px", color: "var(--success)", fontWeight: "700", textAlign: "center", margin: "20px 0" }}>
              🎉 You saved ₹{(selectedEvents.length * 100) - calculateTotal()} with combo offer!
            </p>

            <button 
              onClick={() => navigate("/register")} 
              className="primary-button" 
              style={{ width: "100%", padding: "18px" }}
            >
              Confirm & Register →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cart-empty-wrapper { 
          height: calc(100vh - 130px);
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: var(--bg-app);
          padding: 10px;
          overflow: hidden;
        }
        .cart-empty-container {
          width: 100%;
          max-width: 360px;
          margin-top: -30px;
        }
        .cart-empty-card {
          padding: 30px !important;
          border-radius: var(--radius-lg) !important;
          box-shadow: var(--shadow-lg) !important;
        }
        .empty-cart-icon { font-size: 40px; margin-bottom: 8px; }
        .empty-cart-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; }
        .empty-cart-text { color: var(--text-secondary); margin-bottom: 24px; font-size: 12px; font-weight: 600; }
        .empty-cart-actions { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
        .empty-cart-actions a { width: 100%; padding: 14px !important; font-size: 14px !important; border-radius: 10px !important; text-decoration: none; }
        .cart-header { text-align: center; margin-bottom: 40px; }
        .cart-items-list { display: flex; flex-direction: column; }
        .cart-item { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 24px 30px; 
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }
        .cart-item:hover { background: var(--glass-bg); }
        .cart-item:last-child { border-bottom: none; }
        .cart-item-info { display: flex; align-items: center; gap: 20px; }
        .cart-item-icon { 
          width: 44px; height: 44px; 
          background: var(--primary-glow); 
          border-radius: 12px; 
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .cart-item-name { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
        .cart-item-cat { font-size: 13px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .remove-btn { 
          background: none; border: none; 
          color: var(--text-muted); cursor: pointer; 
          font-size: 18px; padding: 10px; 
          transition: 0.2s; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .remove-btn:hover { color: var(--danger); background: rgba(244, 63, 94, 0.1); }
        
        .summary-row { display: flex; justify-content: space-between; font-weight: 600; color: var(--text-secondary); }
        .summary-divider { height: 1px; background: var(--border); margin: 20px 0; }
        .summary-row.total { color: var(--text-primary); font-size: 22px; font-weight: 900; }
        
        .team-selector { display: flex; align-items: center; }
        .team-select { 
          background: var(--bg-surface); 
          border: 1px solid var(--border); 
          color: var(--text-primary); 
          font-size: 11px; 
          font-weight: 700; 
          padding: 2px 8px; 
          border-radius: 6px; 
          outline: none;
          cursor: pointer;
        }
        .team-select:focus { border-color: var(--primary); }

        @media (max-width: 1024px) {
          .col-8, .col-4 { grid-column: span 12 !important; }
          .col-4 { order: -1; } /* Summary first on mobile */
        }
        @media (max-width: 640px) {
          .cart-empty-wrapper { height: auto; min-height: calc(100vh - 130px); overflow: auto; padding: 40px 16px; align-items: flex-start; }
          .cart-empty-container { margin-top: 0; max-width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default Cart;

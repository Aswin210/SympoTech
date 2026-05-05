import React, { useState } from "react";
import QRCode from "react-qr-code";
import API_BASE_URL from "../api";

/**
 * My Ticket Page
 * Users enter their phone or email to retrieve their QR code and stage status.
 */
function MyTicket() {
  const [identifier, setIdentifier] = useState("");
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const lookup = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) { setError("Please enter your email or phone number."); return; }
    setLoading(true);
    setError("");
    setUser(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/my-ticket`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        setError(data.message || "Not found.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stages = user ? [
    { label: "Attendance",  done: user.is_attended,    icon: "🏁" },
    { label: "Refreshment", done: user.is_refreshment, icon: "🍵" },
    { label: "Food",        done: user.is_food,        icon: "🍽️" },
  ] : [];

  return (
    <div className="ticket-page">
      <div className="container ticket-container fade-in">

        <div className="ticket-hero">
          <div className="hero-icon">🎫</div>
          <h1 className="gradient-text hero-title">My Ticket</h1>
          <p className="hero-subtitle">
            Enter your registered email or phone to view your QR pass
          </p>
        </div>

        {/* Lookup Form */}
        <div className="glass-card lookup-card">
          <form onSubmit={lookup} className="lookup-form">
            <div className="form-group">
              <label>EMAIL OR PHONE NUMBER</label>
              <input
                className="premium-input"
                placeholder="john@example.com or 9876543210"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              />
            </div>

            {error && (
              <div className="camera-overlay error status-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className={loading ? "secondary-button" : "primary-button"}
              disabled={loading}
              style={{ width: "100%", padding: "16px", fontSize: "16px" }}
            >
              {loading ? "Searching..." : "🔍 Find My Ticket"}
            </button>
          </form>
        </div>

        {/* Result */}
        {user && (
          <div className="fade-in glass-card result-card">
            {/* Profile */}
            <div className="ticket-profile">
              <div className="profile-avatar">
                {user.name.charAt(0)}
              </div>
              <div className="profile-details">
                <div className="profile-name">{user.name}</div>
                <div className="profile-college">{user.college_name}</div>
                <div className="profile-id">
                  ID #{String(user.id).slice(-6).toUpperCase()}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="qr-section">
              <p className="qr-label">Your Entry QR Code</p>
              <div className="qr-wrapper">
                <QRCode value={user.qrData || user.id.toString()} size={180} />
              </div>
              <p className="qr-hint">
                Show this to the scanner at each stage
              </p>
            </div>

            {/* Stage Status */}
            <div className="stages-grid">
              {stages.map((s) => (
                <div key={s.label} className={"stage-card " + (s.done ? "is-done" : "")}>
                  <div className="stage-icon">{s.done ? "✅" : s.icon}</div>
                  <div className="stage-name">{s.label}</div>
                  <div className="stage-status">
                    {s.done ? "Done" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ticket-page { min-height: 100vh; background: var(--bg-app); padding-bottom: 80px; }
        .ticket-container { padding-top: 20px; max-width: 600px; }
        .ticket-hero { text-align: center; margin-bottom: 40px; }
        .hero-icon { font-size: 56px; margin-bottom: 16px; }
        .hero-title { font-size: clamp(2rem, 8vw, 3rem); }
        .hero-subtitle { color: var(--text-secondary); margin-top: 8px; font-weight: 600; }
        
        .lookup-card { padding: clamp(24px, 6vw, 40px); margin-bottom: 24px; }
        .lookup-form { display: flex; flex-direction: column; gap: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 11px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; }
        .status-error { width: 100%; justify-content: center; border-radius: 12px; padding: 14px; }
        
        .result-card { padding: clamp(24px, 6vw, 40px); }
        .ticket-profile { display: flex; gap: 16px; align-items: center; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .profile-avatar { width: 60px; height: 60px; border-radius: 16px; flex-shrink: 0; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; }
        .profile-name { font-weight: 900; font-size: 20px; }
        .profile-college { color: var(--text-secondary); font-size: 13px; font-weight: 600; }
        .profile-id { color: var(--text-muted); font-size: 11px; font-weight: 700; margin-top: 2px; }
        
        .qr-section { text-align: center; margin-bottom: 28px; }
        .qr-label { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .qr-wrapper { display: inline-block; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .qr-hint { color: var(--text-muted); font-size: 11px; margin-top: 12px; font-weight: 600; }
        
        .stages-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .stage-card { padding: 16px 8px; border-radius: 14px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid var(--border); transition: var(--transition-normal); }
        .stage-card.is-done { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3); }
        .stage-icon { font-size: 22px; margin-bottom: 6px; }
        .stage-name { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .is-done .stage-name { color: #10b981; }
        .stage-status { font-size: 9px; margin-top: 4px; font-weight: 700; color: var(--text-muted); }
        .is-done .stage-status { color: #10b981; }
 
        @media (max-width: 480px) {
          .stages-grid { grid-template-columns: 1fr; }
          .stage-card { display: flex; align-items: center; gap: 16px; padding: 12px 20px; text-align: left; }
          .stage-icon { margin-bottom: 0; }
          .stage-status { margin-left: auto; }
        }
      `}</style>
    </div>
  );
}

export default MyTicket;

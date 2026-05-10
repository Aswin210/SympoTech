import React, { useState, useRef } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import API_BASE_URL from "../api";

/**
 * My Ticket Page
 * Users enter their phone or email to retrieve their QR code and ID card.
 */
function MyTicket() {
  const [identifier, setIdentifier] = useState("");
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const idCardRef = useRef(null);

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

  const downloadCard = () => {
    if (!idCardRef.current) return;
    html2canvas(idCardRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = `SympoTech_Pass_${user.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
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
          <div className="fade-in result-section">
            <div className="glass-card result-card">
              {/* Profile */}
              <div className="ticket-profile">
                <div className="profile-avatar-box">
                  {user.photo ? (
                    <img src={user.photo} alt="User" className="profile-photo" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {user.name.charAt(0)}
                    </div>
                  )}
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

            {/* Hidden ID Card for download */}
            <div className="id-card-download-section" style={{ marginTop: "40px", textAlign: "center" }}>
              <h3 style={{ marginBottom: "20px" }}>Digital Pass</h3>
              <div ref={idCardRef} className="final-id-card">
                <div className="card-header">
                  <div className="card-system-name">SympoTech Event Management System</div>
                  <div className="card-event-name">OFFICIAL PASS</div>
                </div>
                <div className="card-body">
                  <div className="card-photo-box">
                    {user.photo ? (
                      <img src={user.photo} alt="User" className="card-photo" />
                    ) : (
                      <div className="profile-avatar-placeholder" style={{ borderRadius: "0", fontSize: "40px" }}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="card-user-info">
                    <h2 className="card-user-name">{user.name}</h2>
                    <p className="card-user-college">{user.college_name}</p>
                    <div className="card-user-id">
                      ID: #{String(user.id).slice(-6).toUpperCase()}
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "10px", color: "#64748b", fontWeight: "600" }}>
                      Registered Events: {user.event_names || "SympoTech 2026"}
                    </div>
                    {user.team_members && (
                      <div style={{ marginTop: "5px", fontSize: "9px", color: "#94a3b8" }}>
                        Team: {Object.values(JSON.parse(user.team_members)).flat().join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer">
                  <QRCode value={user.qrData || user.id.toString()} size={100} />
                </div>
              </div>
              <button onClick={downloadCard} className="primary-button" style={{ marginTop: "24px", width: "100%", maxWidth: "360px" }}>
                📥 Download Digital Pass
              </button>
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
        
        .result-card { padding: clamp(24px, 6vw, 40px); margin-bottom: 40px; }
        .ticket-profile { display: flex; gap: 16px; align-items: center; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        
        .profile-avatar-box { width: 80px; height: 80px; border-radius: 20px; overflow: hidden; border: 2px solid var(--border); background: var(--bg-surface); flex-shrink: 0; }
        .profile-photo { width: 100%; height: 100%; object-fit: cover; }
        .profile-avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; }

        .profile-name { font-weight: 900; font-size: 22px; }
        .profile-college { color: var(--text-secondary); font-size: 14px; font-weight: 600; }
        .profile-id { color: var(--text-muted); font-size: 12px; font-weight: 700; margin-top: 4px; }
        
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

        /* ID Card Styling (matches Register.js) */
        .final-id-card { background: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); width: 100%; max-width: 360px; margin: 0 auto; text-align: left; }
        .card-header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; color: #fff; text-align: center; }
        .card-system-name { font-size: 11px; font-weight: 800; opacity: 0.9; letter-spacing: 2.5px; margin-bottom: 10px; text-transform: uppercase; color: #fff; }
        .card-event-name { font-weight: 900; font-size: 20px; letter-spacing: 1px; color: #fff; line-height: 1.2; }
        .card-body { padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .card-photo-box { width: 140px; height: 140px; border-radius: 24px; overflow: hidden; border: 5px solid #f8fafc; box-shadow: 0 10px 25px rgba(0,0,0,0.1); background: #f1f5f9; }
        .card-photo { width: 100%; height: 100%; object-fit: cover; }
        .card-photo-box .profile-avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-size: 48px; font-weight: 900; }
        .card-user-info { text-align: center; width: 100%; }
        .card-user-name { font-size: 26px; font-weight: 900; color: #1e293b; margin-bottom: 4px; }
        .card-user-college { font-size: 14px; color: #64748b; font-weight: 700; text-transform: uppercase; }
        .card-user-id { margin-top: 20px; padding: 6px 16px; background: #f1f5f9; border-radius: 12px; font-size: 12px; font-weight: 800; color: #4f46e5; display: inline-block; border: 1px solid #e2e8f0; }
        .card-footer { background: #fafafa; padding: 32px 24px; text-align: center; border-top: 2px dashed #e2e8f0; }
 
        @media (max-width: 480px) {
          .stages-grid { grid-template-columns: 1fr; }
          .stage-card { display: flex; align-items: center; gap: 16px; padding: 12px 20px; text-align: left; }
          .stage-icon { margin-bottom: 0; }
          .stage-status { margin-left: auto; }
          .profile-avatar-box { width: 60px; height: 60px; }
          .profile-name { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}

export default MyTicket;

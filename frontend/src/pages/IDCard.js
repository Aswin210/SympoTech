import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import API_BASE_URL from "../api";

/**
 * IDCard Component
 * Refactored for Bento Design System with Mobile Optimization.
 */
function IDCard() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [user, setUser] = useState(null);
  const cardRef = useRef();

  useEffect(() => {
    if (userId) {
      axios
        .get(`${API_BASE_URL}/verify-user/${userId}`)
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.user);
          }
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
        });
    }
  }, [userId]);

  const downloadCard = () => {
    if (cardRef.current) {
      // Set temporary style to ensure high quality for export
      const originalStyle = cardRef.current.style.width;
      cardRef.current.style.width = "400px"; 

      html2canvas(cardRef.current, { 
        backgroundColor: null,
        scale: 3, 
        useCORS: true
      }).then((canvas) => {
        cardRef.current.style.width = originalStyle;
        const link = document.createElement("a");
        link.download = `SympoTech_Pass_${userId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  if (!userId) return (
    <div style={{ height: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="glass-card" style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "50px", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ color: "var(--danger)" }}>No Data Found</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "12px" }}>Please complete your registration first.</p>
      </div>
    </div>
  );

  if (!user) return (
    <div style={{ height: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "16px" }}>⚡</div>
        <h2 className="gradient-text">Syncing Pass...</h2>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ maxWidth: "440px", paddingTop: "20px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="gradient-text" style={{ fontSize: "32px" }}>Your Entry Pass</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontWeight: "600", fontSize: "14px" }}>Ready for SympoTech 2026</p>
        </div>

        <div ref={cardRef} className="glass-card" style={{ padding: 0, overflow: "hidden", borderRadius: "28px", border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          
          <div style={{ background: "#09090b", padding: "28px 24px", color: "#fff", textAlign: "center", borderBottom: "3px solid var(--primary)" }}>
            <div style={{ fontSize: "11px", fontWeight: "800", opacity: 0.7, letterSpacing: "2.5px", marginBottom: "10px", textTransform: "uppercase", color: "var(--primary)" }}>SympoTech Event Management System</div>
            <div style={{ fontWeight: "900", fontSize: "22px", letterSpacing: "1px", color: "#fff" }}>Official Gate Pass</div>
          </div>

          <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
            <div style={{ width: "160px", height: "160px", borderRadius: "28px", overflow: "hidden", border: "4px solid var(--bg-app)", boxShadow: "var(--shadow-md)" }}>
              {user.photo ? (
                <img src={user.photo} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--glass-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px" }}>👤</div>
              )}
            </div>

            <div style={{ textAlign: "center", width: "100%" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "900", marginBottom: "4px" }}>{user.name}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "700" }}>{user.college_name}</p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>EVENT</div>
                  <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--primary)" }}>#{user.event_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>USER</div>
                  <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--primary)" }}>ID-{user.id}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--glass-bg)", padding: "32px 20px", textAlign: "center", borderTop: "1px dashed var(--border)" }}>
            <div style={{ display: "inline-block", padding: "16px", background: "#fff", borderRadius: "20px", boxShadow: "var(--shadow-md)" }}>
              <QRCode value={`USER-${user.id}-${user.event_id}`} size={110} bgColor="#ffffff" fgColor="#09090b" />
            </div>
            <div style={{ marginTop: "16px", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "1px" }}>PRESENT AT MAIN GATE</div>
          </div>
          
        </div>

        <button onClick={downloadCard} className="primary-button" style={{ marginTop: "40px", width: "100%", padding: "16px" }}>
          Download Image Pass
        </button>
      </div>
    </div>
  );
}

export default IDCard;
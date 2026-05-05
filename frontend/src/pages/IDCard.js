import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import API_BASE_URL from "../api";

/**
 * IDCard Component
 * Redesigned with a premium "Clean-Tech" aesthetic featuring a white background.
 */
function IDCard() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [user, setUser] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
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
      setIsExporting(true);
      
      // Small timeout to ensure the DOM has updated to the light theme before capture
      setTimeout(() => {
        const originalWidth = cardRef.current.style.width;
        cardRef.current.style.width = "400px"; 

        html2canvas(cardRef.current, { 
          backgroundColor: "#ffffff",
          scale: 3, 
          useCORS: true,
          logging: false,
        }).then((canvas) => {
          cardRef.current.style.width = originalWidth;
          const link = document.createElement("a");
          link.download = `SympoTech_Pass_${user.name.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          setIsExporting(false);
        });
      }, 100);
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
        <div style={{ fontSize: "50px", marginBottom: "16px" }}>📄</div>
        <h2 className="gradient-text">Generating Your Pass...</h2>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ maxWidth: "440px", paddingTop: "20px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="gradient-text" style={{ fontSize: "32px", fontWeight: "900" }}>Your Entry Pass</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontWeight: "700", fontSize: "14px" }}>SYMPOTECH OFFICIAL PASS 2026</p>
        </div>

        {/* --- PREMIUM ID CARD (Clean White Theme) --- */}
        <div ref={cardRef} className="id-card-export" style={{ 
          padding: 0, 
          overflow: "hidden", 
          borderRadius: "28px", 
          border: "1px solid #e2e8f0", 
          background: "#ffffff", 
          width: "100%",
          boxShadow: isExporting ? "none" : "0 25px 50px -12px rgba(0,0,0,0.2)",
          position: "relative",
          transition: "all 0.3s ease"
        }}>
          
          {/* Subtle Corner Accents */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100px", height: "100px", background: "radial-gradient(circle at top left, rgba(79, 70, 229, 0.08), transparent 70%)" }}></div>

          {/* Premium Header Bar */}
          <div style={{ 
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", 
            padding: "28px 24px", 
            color: "#fff", 
            textAlign: "center", 
            position: "relative",
            zIndex: 1
          }}>
            <div style={{ position: "absolute", top: "10px", right: "20px", fontSize: "32px", opacity: 0.15 }}>💠</div>
            <div style={{ fontSize: "11px", fontWeight: "900", opacity: 0.9, letterSpacing: "2.5px", marginBottom: "6px", textTransform: "uppercase" }}>SYMPOTECH 2026</div>
            <div style={{ fontWeight: "900", fontSize: "24px", letterSpacing: "0.5px" }}>EVENT PASS</div>
          </div>

          <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", position: "relative", zIndex: 1 }}>
            
            {/* Elegant Photo Frame */}
            <div style={{ 
              width: "150px", 
              height: "150px", 
              borderRadius: "24px", 
              overflow: "hidden", 
              border: "5px solid #f8fafc", 
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              background: "#f1f5f9"
            }}>
              {user.photo ? (
                <img src={user.photo} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px", color: "#cbd5e1" }}>👤</div>
              )}
            </div>

            {/* Profile Details */}
            <div style={{ textAlign: "center", width: "100%" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1e293b", marginBottom: "4px" }}>{user.name}</h2>
              <p style={{ color: "#64748b", fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{user.college_name}</p>
              
              {/* Info Dashboard */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "1px", 
                marginTop: "32px", 
                background: "#f1f5f9", 
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ background: "#ffffff", padding: "18px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>EVENT REF</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#4f46e5" }}>#{user.event_id}</div>
                </div>
                <div style={{ background: "#ffffff", padding: "18px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>REG NO</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#7c3aed" }}>ID-{user.id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Validator Section */}
          <div style={{ 
            background: "#fafafa", 
            padding: "24px 20px 40px", 
            textAlign: "center", 
            borderTop: "2px dashed #e2e8f0",
            position: "relative",
            zIndex: 1
          }}>
            <div style={{ 
              display: "inline-block", 
              padding: "12px", 
              background: "#fff", 
              borderRadius: "20px", 
              border: isExporting ? "3px solid #000000" : "1px solid #e2e8f0", 
              boxShadow: isExporting ? "none" : "0 4px 10px rgba(0,0,0,0.05)" 
            }}>
              <QRCode 
                value={`USER-${user.id}-${user.event_id}`} 
                size={120} 
                bgColor="#ffffff" 
                fgColor="#000000" 
                level="H"
              />
            </div>
            <div style={{ marginTop: "20px", fontSize: "11px", fontWeight: "900", color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase" }}>Scan for Quick Verification</div>
          </div>

          {/* Bottom Branding Bar */}
          <div style={{ height: "6px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}></div>
          
        </div>

        <button onClick={downloadCard} className="primary-button" style={{ 
          marginTop: "40px", 
          width: "100%", 
          padding: "18px", 
          fontSize: "17px",
          borderRadius: "18px",
          boxShadow: "0 15px 30px -5px rgba(79, 70, 229, 0.3)"
        }}>
          📥 Download Image Pass
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>
          This pass is mandatory for entry and food counters.
        </p>
      </div>
    </div>
  );
}

export default IDCard;
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../api";

/**
 * QR Scanner Page
 * Refactored for Bento Design System with Mobile Optimization.
 */
function QRScanner() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const beepRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastScannedRef = useRef(null);
  const cooldownRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState(""); 
  const [history, setHistory] = useState([]);
  const [scanMode, setScanMode] = useState("attendance"); // attendance, refreshment, food

  useEffect(() => {
    beepRef.current = new Audio("https://www.soundjay.com/button/sounds/beep-01a.mp3");

    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
        isRunningRef.current = false;
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      if (isRunningRef.current) return;

      const config = { 
        fps: 30, 
        qrbox: (width, height) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size };
        }
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          if (decodedText === lastScannedRef.current) return;
          
          lastScannedRef.current = decodedText;
          beepRef.current?.play().catch(() => {});
          handleScan(decodedText);

          // Reset cooldown for this specific QR after 3 seconds
          if (cooldownRef.current) clearTimeout(cooldownRef.current);
          cooldownRef.current = setTimeout(() => {
            lastScannedRef.current = null;
          }, 3000);
        }
      );

      isRunningRef.current = true;
      setIsScanning(true);
      setStudent(null);
      setMessage("");
      setMsgType("");
    } catch (err) {
      console.error("Camera error:", err);
      isRunningRef.current = false;
      setMessage("Camera access denied.");
      setMsgType("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch { /* ignore */ }
      isRunningRef.current = false;
    }
    setIsScanning(false);
  };

  const handleScan = async (qrData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/mark-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData, mode: scanMode }),
      });

      const data = await res.json();
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (data.success) {
        setStudent(data.user);
        setMessage(data.message || "Success!");
        setMsgType("success");
        setHistory((prev) => [{ name: data.user?.name || "Unknown", time, mode: scanMode, status: "success" }, ...prev]);
      } else {
        if (data.user) setStudent(data.user);
        setMessage(data.message || "Invalid Scan");
        setMsgType(data.message?.includes("already") || data.message?.includes("Must") ? "warning" : "error");
        setHistory((prev) => [{ name: data.user?.name || "Unknown", time, mode: scanMode, status: data.message?.includes("already") ? "warning" : "error" }, ...prev]);
      }
      
      // Auto-clear message after 4 seconds to keep it snappy
      setTimeout(() => {
        setMessage("");
        setMsgType("");
      }, 4000);

    } catch (err) {
      console.error("Scan error:", err);
      setMessage("Connection Lost");
      setMsgType("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ paddingTop: "20px" }}>
        
        <div className="grid-bento">
          
          {/* Scanner Card */}
          <div className="glass-card" style={{ gridColumn: "span 7", padding: "clamp(20px, 5vw, 40px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)" }}>Stage Scanner</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600" }}>Currently: <span style={{ color: "var(--primary)", textTransform: "uppercase" }}>{scanMode}</span></p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => navigate("/admin-login")} className="secondary-button" style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "800" }}>LOGOUT</button>
              </div>
            </div>

            {/* Mode Selector */}
            <div style={{ display: "flex", background: "var(--glass-bg)", padding: "6px", borderRadius: "14px", marginBottom: "24px", gap: "6px" }}>
              {["attendance", "refreshment", "food"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setScanMode(mode); setStudent(null); setMessage(""); }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: scanMode === mode ? "var(--primary)" : "transparent",
                    color: scanMode === mode ? "#fff" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", marginBottom: "24px", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#000", aspectRatio: "4/3", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <div id="reader" style={{ width: "100%", height: "100%" }}></div>
              {!isScanning && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
                  <div style={{ fontSize: "48px" }}>📷</div>
                  <button className="primary-button" onClick={startScanner}>Start Scan</button>
                </div>
              )}
              {isScanning && (
                <button className="secondary-button" style={{ position: "absolute", bottom: "16px", background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(4px)", fontSize: "12px" }} onClick={stopScanner}>
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div className={`camera-overlay ${msgType}`} style={{ width: "100%", justifyContent: "center", borderRadius: "12px", marginBottom: "20px" }}>
                {message}
              </div>
            )}

            {student && (
              <div style={{ marginTop: "24px" }}>
                <div className="glass-card" style={{ background: "var(--bg-surface)", padding: "20px", display: "flex", gap: "16px", alignItems: "center", borderLeft: "4px solid var(--primary)", marginBottom: "16px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "900", flexShrink: 0 }}>
                    {student.name?.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: "800", fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>ID: {student.id} • {student.college_name}</div>
                  </div>
                </div>

                {/* Status Dashboard */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {[
                    { label: "Attendance", done: student.is_attended },
                    { label: "Refreshment", done: student.is_refreshment },
                    { label: "Food", done: student.is_food }
                  ].map((s, idx) => (
                    <div key={idx} style={{ 
                      padding: "12px", 
                      borderRadius: "12px", 
                      textAlign: "center", 
                      background: s.done ? "rgba(34, 197, 94, 0.1)" : "var(--glass-bg)",
                      border: `1px solid ${s.done ? "var(--success)" : "var(--border)"}`
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "4px" }}>{s.done ? "✅" : "⏳"}</div>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: s.done ? "var(--success)" : "var(--text-muted)", textTransform: "uppercase" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History Card */}
          <div className="glass-card" style={{ gridColumn: "span 5", padding: "clamp(20px, 5vw, 40px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800" }}>Activity Logs</h3>
              <span style={{ background: "var(--primary-glow)", color: "var(--primary)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "800" }}>{history.length}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "400px", paddingRight: "4px" }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", opacity: 0.5 }}>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>📊</p>
                  <p style={{ fontSize: "13px" }}>Awaiting scans...</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: `var(--${item.status})`, flexShrink: 0 }}></div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontWeight: "700", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>{item.mode}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", flexShrink: 0 }}>{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default QRScanner;
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../api";

/**
 * QR Scanner Page
 * Optimized for ultra-fast scanning and high-performance browser execution.
 */
function QRScanner() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const beepRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastScannedRef = useRef(null);
  const cooldownRef = useRef(null);
  const scanLockRef = useRef(false); // New lock to prevent double-processing

  const [isScanning, setIsScanning] = useState(false);
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState(""); 
  const [history, setHistory] = useState([]);
  const [scanMode, setScanMode] = useState("attendance"); // attendance, refreshment, food

  useEffect(() => {
    // Pre-load audio for zero-latency feedback
    beepRef.current = new Audio("https://www.soundjay.com/button/sounds/beep-01a.mp3");
    beepRef.current.load();

    return () => {
      stopScanner();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  /**
   * Initializes and starts the QR Scanner with high-performance settings.
   */
  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      if (isRunningRef.current) return;

      const config = { 
        fps: 20, // Increased for smoother detection
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.7);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        disableFlip: false, 
        formatsToSupport: [0], // QR_CODE only for maximum speed
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // 1. Check for double scans of the same code
          if (decodedText === lastScannedRef.current || scanLockRef.current) return;
          
          scanLockRef.current = true;
          lastScannedRef.current = decodedText;
          
          // 2. Immediate feedback
          beepRef.current?.play().catch(() => {});
          
          // 3. Process scan
          await handleScan(decodedText);

          // 4. Unlock after processing
          scanLockRef.current = false;

          // 5. Reset duplicate check after 3 seconds
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
      console.error("Scanner startup error:", err);
      isRunningRef.current = false;
      setMessage("Camera access denied or device error.");
      setMsgType("error");
    }
  };

  /**
   * Stops the camera and cleans up scanner instance.
   */
  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Scanner stop warning:", err);
      }
      isRunningRef.current = false;
    }
    setIsScanning(false);
  };

  /**
   * Handles the server communication for the scanned QR code.
   */
  const handleScan = async (qrData) => {
    try {
      const startTime = Date.now();
      const res = await fetch(`${API_BASE_URL}/mark-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData, mode: scanMode }),
      });

      const data = await res.json();
      const endTime = Date.now();
      console.log(`Scan processed in ${endTime - startTime}ms`);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (data.success) {
        setStudent(data.user);
        setMessage(data.message || "Successfully Verified");
        setMsgType("success");
        setHistory((prev) => [{ 
          name: data.user?.name || "Unknown", 
          time: timeStr, 
          mode: scanMode, 
          status: "success" 
        }, ...prev.slice(0, 49)]); // Keep history lean
      } else {
        if (data.user) setStudent(data.user);
        setMessage(data.message || "Invalid Scan");
        const isWarning = data.message?.includes("already") || data.message?.includes("Must");
        setMsgType(isWarning ? "warning" : "error");
        setHistory((prev) => [{ 
          name: data.user?.name || "Unknown", 
          time: timeStr, 
          mode: scanMode, 
          status: isWarning ? "warning" : "error" 
        }, ...prev.slice(0, 49)]);
      }
      
      // Auto-clear message after 4 seconds
      const msgTimeout = setTimeout(() => {
        setMessage("");
        setMsgType("");
      }, 4000);

      return () => clearTimeout(msgTimeout);

    } catch (err) {
      console.error("API Error during scan:", err);
      setMessage("Network connection unstable");
      setMsgType("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ paddingTop: "20px" }}>
        
        <div className="grid-bento">
          
          {/* Main Scanner Section */}
          <div className="glass-card" style={{ gridColumn: "span 7", padding: "clamp(20px, 5vw, 40px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: "900" }}>Smart Scanner</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>Active Stage: <span style={{ color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px" }}>{scanMode}</span></p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => navigate("/admin/publish-winners")} className="primary-button" style={{ padding: "10px 16px", fontSize: "12px", background: "rgba(255, 215, 0, 0.15)", color: "#FFD700", border: "1px solid rgba(255, 215, 0, 0.3)" }}>🏆 WINNERS</button>
                <button onClick={() => { stopScanner(); navigate("/admin-login"); }} className="secondary-button" style={{ padding: "10px 16px", fontSize: "12px" }}>EXIT</button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "6px", borderRadius: "16px", marginBottom: "28px", gap: "6px", border: "1px solid var(--border)" }}>
              {["attendance", "refreshment", "food"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { 
                    setScanMode(mode); 
                    setStudent(null); 
                    setMessage(""); 
                    lastScannedRef.current = null;
                  }}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    background: scanMode === mode ? "var(--primary)" : "transparent",
                    color: scanMode === mode ? "#fff" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Viewfinder Container */}
            <div style={{ position: "relative", marginBottom: "28px", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#000", aspectRatio: "4/3", border: "2px solid var(--border)", boxShadow: "0 0 40px rgba(0,0,0,0.4)" }}>
              <div id="reader" style={{ width: "100%", height: "100%" }}></div>
              {!isScanning && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
                  <div style={{ fontSize: "64px", filter: "drop-shadow(0 0 20px var(--primary))" }}>📸</div>
                  <button className="primary-button" onClick={startScanner} style={{ padding: "18px 40px", fontSize: "18px" }}>Initialize Camera</button>
                </div>
              )}
              {isScanning && (
                <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.5)", padding: "8px 12px", borderRadius: "8px", backdropFilter: "blur(4px)" }}>
                  <div className="pulse" style={{ width: "10px", height: "10px", background: "#22c55e", borderRadius: "50%" }}></div>
                  <span style={{ fontSize: "11px", fontWeight: "900", color: "#fff" }}>LIVE SCANNING</span>
                </div>
              )}
              {isScanning && (
                <button className="secondary-button" style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }} onClick={stopScanner}>
                  Stop Scanner
                </button>
              )}
            </div>

            {/* Status Messages */}
            {message && (
              <div className={`camera-overlay ${msgType}`} style={{ width: "100%", justifyContent: "center", borderRadius: "14px", marginBottom: "24px", padding: "16px", animation: "slideUpFade 0.4s ease" }}>
                {msgType === "success" ? "✅" : msgType === "warning" ? "⚠️" : "❌"} {message}
              </div>
            )}

            {/* Scanned Student Profile */}
            {student && (
              <div className="fade-in" style={{ marginTop: "24px" }}>
                <div className="glass-card" style={{ background: "rgba(255,255,255,0.03)", padding: "24px", display: "flex", gap: "20px", alignItems: "center", borderLeft: "6px solid var(--primary)", marginBottom: "20px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, var(--primary), var(--secondary))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "900", flexShrink: 0 }}>
                    {student.name?.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: "900", fontSize: "20px", color: "var(--text-primary)" }}>{student.name}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>ID: {student.id} • {student.college_name}</div>
                  </div>
                </div>

                {/* Verification Progress */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {[
                    { label: "Check-in", done: student.is_attended },
                    { label: "Refreshment", done: student.is_refreshment },
                    { label: "Lunch/Food", done: student.is_food }
                  ].map((s, idx) => (
                    <div key={idx} style={{ 
                      padding: "16px 8px", 
                      borderRadius: "16px", 
                      textAlign: "center", 
                      background: s.done ? "rgba(34, 197, 94, 0.1)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${s.done ? "rgba(34, 197, 94, 0.4)" : "var(--border)"}`,
                      transition: "all 0.3s ease"
                    }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.done ? "✅" : "🔘"}</div>
                      <div style={{ fontSize: "11px", fontWeight: "900", color: s.done ? "#22c55e" : "var(--text-muted)", textTransform: "uppercase" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Log Section */}
          <div className="glass-card" style={{ gridColumn: "span 5", padding: "clamp(20px, 5vw, 40px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: "900" }}>Recent Activity</h3>
              <span style={{ background: "var(--primary-glow)", color: "var(--primary)", padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "900" }}>{history.length}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "600px", paddingRight: "8px" }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", opacity: 0.6 }}>
                  <p style={{ fontSize: "40px", marginBottom: "12px" }}>📋</p>
                  <p style={{ fontSize: "14px", fontWeight: "600" }}>Scanning history will appear here.</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", transition: "transform 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.status === "success" ? "#22c55e" : item.status === "warning" ? "#eab308" : "#ef4444", boxShadow: `0 0 10px ${item.status === "success" ? "rgba(34,197,148,0.4)" : "transparent"}`, flexShrink: 0 }}></div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontWeight: "800", fontSize: "15px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.mode}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", flexShrink: 0 }}>{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Dynamic Scan Line Effect (Only when scanning) */}
      {isScanning && (
        <style>{`
          #reader video { object-fit: cover !important; }
          .pulse { animation: pulse 1.5s infinite; }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      )}
    </div>
  );
}

export default QRScanner;
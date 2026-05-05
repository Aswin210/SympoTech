import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import API_BASE_URL from "../api";

/**
 * Ultra-Fast QR Scanner
 * 
 * Strategy (fastest → slowest):
 *  1. Native BarcodeDetector API  — hardware-accelerated, ~2ms per frame (Chrome/Android)
 *  2. jsQR (pure JS fallback)     — ~15ms per frame, works in all browsers
 * 
 * Uses getUserMedia + requestAnimationFrame directly — no library wrapper overhead.
 * The scanModeRef pattern ensures the active stage is always current (no stale closure).
 */
function QRScanner() {
  const navigate = useNavigate();

  // ── Auth guard — redirect to login if no admin token ──────────────────
  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin-login");
  }, [navigate]);

  // ── Camera / scanning refs (never cause re-renders) ────────────────────
  const videoRef       = useRef(null);   // <video> element
  const canvasRef      = useRef(null);   // offscreen <canvas> for jsQR
  const streamRef      = useRef(null);   // MediaStream
  const animFrameRef   = useRef(null);   // requestAnimationFrame id
  const detectorRef    = useRef(null);   // BarcodeDetector instance (if supported)
  const useFallbackRef = useRef(false);  // true when BarcodeDetector unavailable
  const beepRef        = useRef(null);

  // ── Scan-control refs ─────────────────────────────────────────────────────
  const isRunningRef   = useRef(false);
  const scanLockRef    = useRef(false);  // prevents simultaneous double-process
  const lastScannedRef = useRef(null);   // last decoded text (cooldown guard)
  const cooldownRef    = useRef(null);
  const scanModeRef    = useRef("attendance"); // ALWAYS current mode — fixes stale closure

  // ── React state (drives UI) ───────────────────────────────────────────────
  const [isScanning, setIsScanning] = useState(false);
  const [student,    setStudent]    = useState(null);
  const [message,    setMessage]    = useState("");
  const [msgType,    setMsgType]    = useState("");
  const [history,    setHistory]    = useState([]);
  const [scanMode,   setScanMode]   = useState("attendance");

  // Keep scanModeRef always in sync with React state
  useEffect(() => { scanModeRef.current = scanMode; }, [scanMode]);

  // Pre-load beep audio
  useEffect(() => {
    beepRef.current = new Audio("https://www.soundjay.com/button/sounds/beep-01a.mp3");
    beepRef.current.load();
    return () => {
      stopScanner();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle a decoded QR string ────────────────────────────────────────────
  const handleScan = useCallback(async (qrData, mode) => {
    try {
      console.log(`🔍 Scanning in mode: ${mode}`);
      const res = await fetch(`${API_BASE_URL}/mark-attendance`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ qrData, mode }),
      });

      const data    = await res.json();
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      if (data.success) {
        setStudent(data.user);
        setMessage(data.message || "Successfully Verified");
        setMsgType("success");
        setHistory(prev => [
          { name: data.user?.name || "Unknown", time: timeStr, mode, status: "success" },
          ...prev.slice(0, 49),
        ]);
      } else {
        if (data.user) setStudent(data.user);
        setMessage(data.message || "Invalid Scan");
        const isWarning = data.message?.includes("already") || data.message?.includes("Must");
        setMsgType(isWarning ? "warning" : "error");
        setHistory(prev => [
          { name: data.user?.name || "Unknown", time: timeStr, mode, status: isWarning ? "warning" : "error" },
          ...prev.slice(0, 49),
        ]);
      }

      // Auto-clear message after 4 s
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => {
        setMessage("");
        setMsgType("");
      }, 4000);

    } catch {
      setMessage("Network connection unstable");
      setMsgType("error");
    }
  }, []);

  // ── Core frame-scan loop (requestAnimationFrame) ──────────────────────────
  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    try {
      let decodedText = null;

      if (!useFallbackRef.current && detectorRef.current) {
        // ── Path 1: Native BarcodeDetector (fastest) ──
        const barcodes = await detectorRef.current.detect(video);
        if (barcodes.length > 0) decodedText = barcodes[0].rawValue;
      } else {
        // ── Path 2: jsQR fallback ──
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code    = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "dontInvert", // fastest: skip inverted-color attempt
        });
        if (code) decodedText = code.data;
      }

      if (decodedText && decodedText !== lastScannedRef.current && !scanLockRef.current) {
        scanLockRef.current   = true;
        lastScannedRef.current = decodedText;
        beepRef.current?.play().catch(() => {});

        const currentMode = scanModeRef.current;
        await handleScan(decodedText, currentMode);

        scanLockRef.current = false;

        // 3-second cooldown before accepting the same QR again
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        cooldownRef.current = setTimeout(() => {
          lastScannedRef.current = null;
        }, 3000);
      }
    } catch {
      // Silently continue scanning on frame errors
    }

    if (isRunningRef.current) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
    }
  }, [handleScan]);

  // ── Start scanner ─────────────────────────────────────────────────────────
  const startScanner = async () => {
    if (isRunningRef.current) return;
    try {
      // Request camera — prefer rear camera, high resolution for better detection
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode:  { ideal: "environment" },
          width:       { ideal: 1280 },
          height:      { ideal: 720 },
          frameRate:   { ideal: 30, max: 60 },
        },
      });

      streamRef.current         = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Initialise BarcodeDetector if supported (Chrome 83+, Edge, Android Chrome)
      if ("BarcodeDetector" in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          if (supported.includes("qr_code")) {
            detectorRef.current    = new window.BarcodeDetector({ formats: ["qr_code"] });
            useFallbackRef.current = false;
            console.log("✅ Using native BarcodeDetector (fastest)");
          } else {
            useFallbackRef.current = true;
          }
        } catch {
          useFallbackRef.current = true;
        }
      } else {
        useFallbackRef.current = true;
        console.log("ℹ️ BarcodeDetector not available — using jsQR fallback");
      }

      isRunningRef.current = true;
      setIsScanning(true);
      setStudent(null);
      setMessage("");
      setMsgType("");
      lastScannedRef.current = null;

      // Kick off the frame loop
      animFrameRef.current = requestAnimationFrame(scanFrame);

    } catch (err) {
      console.error("Camera error:", err);
      setMessage("Camera access denied or unavailable.");
      setMsgType("error");
    }
  };

  // ── Stop scanner ──────────────────────────────────────────────────────────
  const stopScanner = () => {
    isRunningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "100px" }}>
      {/* Hidden offscreen canvas used by jsQR fallback */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="container fade-in" style={{ paddingTop: "20px" }}>
        <div className="grid-bento">

          {/* ── Main Scanner Card ── */}
          <div className="glass-card" style={{ gridColumn: "span 7", padding: "clamp(16px, 4vw, 40px)" }}>

            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: "900", marginBottom: "4px" }}>
                    Smart Scanner
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600" }}>
                    Stage:{" "}
                    <span style={{ color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: "800" }}>
                      {scanMode}
                    </span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => navigate("/admin/publish-winners")}
                    className="primary-button"
                    style={{
                      padding: "10px 14px", fontSize: "11px",
                      background: "rgba(255,215,0,0.1)", color: "#FFD700",
                      border: "1px solid rgba(255,215,0,0.2)", borderRadius: "12px", boxShadow: "none",
                    }}
                  >
                    🏆 WINNERS
                  </button>
                  <button
                    onClick={() => { stopScanner(); navigate("/admin/dashboard"); }}
                    className="secondary-button"
                    style={{ padding: "10px 14px", fontSize: "11px", borderRadius: "12px", background: "rgba(255,255,255,0.05)" }}
                  >
                    EXIT
                  </button>
                </div>
              </div>

              {/* Mode Switcher */}
              <div style={{
                display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px",
                borderRadius: "14px", gap: "4px", border: "1px solid var(--border)",
                overflowX: "auto", scrollbarWidth: "none",
              }}>
                {["attendance", "refreshment", "food"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setScanMode(mode);
                      setStudent(null);
                      setMessage("");
                      lastScannedRef.current = null;
                    }}
                    style={{
                      flex: 1, minWidth: "90px", padding: "12px 8px", borderRadius: "11px",
                      border: "none",
                      background: scanMode === mode ? "var(--primary)" : "transparent",
                      color:      scanMode === mode ? "#fff" : "var(--text-secondary)",
                      fontSize: "11px", fontWeight: "800", textTransform: "uppercase",
                      cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Viewfinder */}
            <div style={{
              position: "relative", marginBottom: "28px", borderRadius: "20px",
              overflow: "hidden", background: "#000", aspectRatio: "1/1",
              border: "1px solid var(--border)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}>
              {/* Live video feed — always rendered, hidden when not scanning */}
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: isScanning ? "block" : "none",
                }}
              />

              {/* Corner guides + scan line */}
              {isScanning && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "65%", height: "65%", position: "relative" }}>
                    {[
                      { top: 0,    left: 0,    borderTop: "4px solid #fff", borderLeft:  "4px solid #fff", borderRadius: "4px 0 0 0"  },
                      { top: 0,    right: 0,   borderTop: "4px solid #fff", borderRight: "4px solid #fff", borderRadius: "0 4px 0 0"  },
                      { bottom: 0, left: 0,    borderBottom: "4px solid #fff", borderLeft:  "4px solid #fff", borderRadius: "0 0 0 4px" },
                      { bottom: 0, right: 0,   borderBottom: "4px solid #fff", borderRight: "4px solid #fff", borderRadius: "0 0 4px 0" },
                    ].map((s, i) => (
                      <div key={i} style={{ position: "absolute", width: "28px", height: "28px", ...s }} />
                    ))}
                    <div style={{
                      position: "absolute", left: 0, width: "100%", height: "2px",
                      background: "linear-gradient(to right, transparent, var(--primary), transparent)",
                      boxShadow: "0 0 12px var(--primary)",
                      animation: "scanMove 2s infinite linear",
                    }} />
                  </div>
                </div>
              )}

              {/* Idle overlay */}
              {!isScanning && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "24px",
                  background: "radial-gradient(circle at center, rgba(15,15,20,0.8), rgba(9,9,11,0.95))",
                  backdropFilter: "blur(10px)",
                }}>
                  <div style={{
                    fontSize: "48px", width: "100px", height: "100px",
                    background: "rgba(255,255,255,0.03)", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 0 30px var(--primary-glow)",
                  }}>📸</div>
                  <button className="primary-button" onClick={startScanner}
                    style={{ padding: "16px 32px", fontSize: "16px", borderRadius: "16px" }}>
                    Start Scanner
                  </button>
                </div>
              )}

              {/* Live badge */}
              {isScanning && (
                <div style={{
                  position: "absolute", top: "20px", left: "20px",
                  display: "flex", alignItems: "center", gap: "10px",
                  background: "rgba(0,0,0,0.6)", padding: "8px 16px",
                  borderRadius: "100px", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <div className="pulse" style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "#fff", letterSpacing: "1px" }}>LIVE SCANNING</span>
                </div>
              )}

              {/* Stop button */}
              {isScanning && (
                <button onClick={stopScanner} className="secondary-button" style={{
                  position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)",
                  background: "rgba(255,255,255,0.1)", color: "#fff",
                  backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)",
                  padding: "12px 24px", borderRadius: "14px", fontSize: "13px", fontWeight: "700",
                }}>
                  Stop Scanner
                </button>
              )}
            </div>

            {/* Status message */}
            {message && (
              <div className={`camera-overlay ${msgType}`} style={{
                width: "100%", justifyContent: "center", borderRadius: "16px",
                marginBottom: "24px", padding: "18px",
                animation: "slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <span style={{ fontSize: "18px" }}>
                  {msgType === "success" ? "✅" : msgType === "warning" ? "⚠️" : "❌"}
                </span>
                <span style={{ marginLeft: "10px", fontWeight: "700" }}>{message}</span>
              </div>
            )}

            {/* Student profile */}
            {student && (
              <div className="fade-in" style={{ marginTop: "24px" }}>
                <div className="glass-card" style={{
                  background: "rgba(255,255,255,0.03)", padding: "20px",
                  display: "flex", gap: "16px", alignItems: "center",
                  borderLeft: "4px solid var(--primary)", marginBottom: "16px",
                }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "14px", flexShrink: 0,
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", fontWeight: "900",
                  }}>
                    {student.name?.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: "800", fontSize: "18px", color: "var(--text-primary)", marginBottom: "2px" }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
                      ID: {student.id} • {student.college_name}
                    </div>
                  </div>
                </div>

                {/* Stage status */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {[
                    { label: "Attendance",   done: student.is_attended },
                    { label: "Refresh",      done: student.is_refreshment },
                    { label: "Food",         done: student.is_food },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: "14px 4px", borderRadius: "14px", textAlign: "center",
                      background: s.done ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${s.done ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                      transition: "all 0.3s ease",
                    }}>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.done ? "✅" : "🔘"}</div>
                      <div style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: s.done ? "#22c55e" : "var(--text-muted)" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Activity Log ── */}
          <div className="glass-card" style={{ gridColumn: "span 5", padding: "clamp(20px,5vw,40px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "900" }}>Recent Activity</h3>
              <span style={{ background: "var(--primary-glow)", color: "var(--primary)", padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: "900" }}>
                {history.length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "500px", paddingRight: "4px" }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)", opacity: 0.5 }}>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>📋</p>
                  <p style={{ fontSize: "13px", fontWeight: "600" }}>No scans yet.</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="fade-in" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderRadius: "14px",
                    background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                        background: item.status === "success" ? "#22c55e" : item.status === "warning" ? "#eab308" : "#ef4444",
                      }} />
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          {item.mode}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", flexShrink: 0 }}>
                      {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse {
          0%   { transform: scale(1);   opacity: 1; }
          50%  { transform: scale(1.3); opacity: 0.4; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes scanMove {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
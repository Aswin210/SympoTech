import React, { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner() {
  const scannerRef    = useRef(null);
  const beepRef       = useRef(null);
  const isRunningRef  = useRef(false); // ✅ FIX: tracks real scanner state

  const [isScanning, setIsScanning] = useState(false);
  const [student,    setStudent]    = useState(null);
  const [message,    setMessage]    = useState("");
  const [msgType,    setMsgType]    = useState(""); // "success" | "error" | "warning"
  const [history,    setHistory]    = useState([]);

  useEffect(() => {
    beepRef.current = new Audio(
      "https://www.soundjay.com/button/sounds/beep-01a.mp3"
    );

    // ✅ FIX: only stop if scanner is actually running
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
        isRunningRef.current = false;
      }
    };
  }, []);

  /* =============================
     START SCANNER
  ============================= */
  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      // ✅ FIX: if already running, don't start again
      if (isRunningRef.current) return;

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: 250 },
        async (decodedText) => {
          await stopScanner();
          beepRef.current?.play().catch(() => {});
          handleScan(decodedText);
        }
      );

      isRunningRef.current = true; // ✅ FIX: mark as running
      setIsScanning(true);
      setStudent(null);
      setMessage("");
      setMsgType("");
    } catch (err) {
      console.error("Camera error:", err);
      isRunningRef.current = false;
      setMessage("❌ Camera access denied or not available.");
      setMsgType("error");
    }
  };

  /* =============================
     STOP SCANNER
  ============================= */
  const stopScanner = async () => {
    // ✅ FIX: guard with isRunningRef so stop() is never called on an idle scanner
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // swallow — already stopped
      }
      isRunningRef.current = false;
    }
    setIsScanning(false);
  };

  /* =============================
     HANDLE QR SCAN RESULT
  ============================= */
  const handleScan = async (qrData) => {
    try {
      const res = await fetch("http://localhost:5000/mark-attendance", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ qrData }),
      });

      const data = await res.json();
      const time = new Date().toLocaleTimeString();

      if (data.success) {
        setStudent(data.user);
        setMessage("✅ Attendance Marked Successfully!");
        setMsgType("success");

        setHistory((prev) => [
          { name: data.user?.name || "Unknown", time, status: "✅" },
          ...prev,
        ]);
      } else {
        if (data.user) {
          setStudent(data.user);
        }
        setMessage(data.message || "❌ Error marking attendance");
        setMsgType(data.message?.includes("already") ? "warning" : "error");

        setHistory((prev) => [
          { name: data.user?.name || "Unknown", time, status: "⚠️" },
          ...prev,
        ]);
      }
    } catch {
      setMessage("❌ Server Error. Make sure backend is running.");
      setMsgType("error");
    }
  };

  /* =============================
     MESSAGE COLOR
  ============================= */
  const msgColor = {
    success: "#16a34a",
    warning: "#d97706",
    error:   "#dc2626",
  }[msgType] || "#fff";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ marginBottom: 6 }}>📷 QR Scanner</h1>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>
          Scan student ID card to mark attendance
        </p>

        {/* Scan Buttons */}
        {!isScanning ? (
          <button style={styles.startBtn} onClick={startScanner}>
            ▶ Start Scan
          </button>
        ) : (
          <button style={styles.stopBtn} onClick={stopScanner}>
            ■ Stop
          </button>
        )}

        {/* Camera Feed */}
        <div
          id="reader"
          style={{
            width:        "100%",
            marginTop:    16,
            borderRadius: 8,
            overflow:     "hidden",
            border:       isScanning ? "2px solid #00c6ff" : "none",
          }}
        />

        {/* Message */}
        {message && (
          <div
            style={{
              marginTop:    14,
              padding:      "10px 14px",
              borderRadius: 8,
              backgroundColor: msgType === "success"
                ? "#dcfce7"
                : msgType === "warning"
                ? "#fef9c3"
                : "#fee2e2",
              border: `1px solid ${msgColor}`,
              color:  msgColor,
              fontWeight: "600",
              fontSize:   14,
            }}
          >
            {message}
          </div>
        )}

        {/* Student Details Card */}
        {student && (
          <div style={styles.studentCard}>
            <div style={styles.avatar}>
              {student.name?.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ margin: "8px 0 4px", fontSize: 18 }}>
              {student.name}
            </h2>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "2px 0" }}>
              {student.college_name}
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "2px 0" }}>
              📱 {student.phone}
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "2px 0" }}>
              🎯 Event ID: {student.event_id}
            </p>
          </div>
        )}

        {/* Scan History */}
        <div style={styles.history}>
          <h3 style={{ marginBottom: 8, fontSize: 14, color: "#d1d5db" }}>
            Scan History
          </h3>
          {history.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>No scans yet</p>
          ) : (
            history.map((h, i) => (
              <div key={i} style={styles.historyRow}>
                <span>{h.status} {h.name}</span>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>{h.time}</span>
              </div>
            ))
          )}
        </div>

        {/* Rescan Button */}
        {!isScanning && student && (
          <button
            style={{ ...styles.startBtn, marginTop: 12, backgroundColor: "#7c3aed" }}
            onClick={startScanner}
          >
            🔄 Scan Next Student
          </button>
        )}
      </div>
    </div>
  );
}

export default QRScanner;

const styles = {
  page: {
    minHeight:       "100vh",
    display:         "flex",
    justifyContent:  "center",
    alignItems:      "flex-start",
    background:      "#111827",
    padding:         "24px 16px",
  },
  card: {
    padding:         24,
    borderRadius:    14,
    background:      "#1f2937",
    width:           "100%",
    maxWidth:        400,
    textAlign:       "center",
    color:           "#f9fafb",
    boxShadow:       "0 4px 24px rgba(0,0,0,0.4)",
  },
  startBtn: {
    padding:         "11px 28px",
    background:      "#0891b2",
    border:          "none",
    borderRadius:    8,
    color:           "#fff",
    fontSize:        15,
    fontWeight:      "bold",
    cursor:          "pointer",
    width:           "100%",
  },
  stopBtn: {
    padding:         "11px 28px",
    background:      "#dc2626",
    border:          "none",
    borderRadius:    8,
    color:           "#fff",
    fontSize:        15,
    fontWeight:      "bold",
    cursor:          "pointer",
    width:           "100%",
  },
  studentCard: {
    marginTop:       16,
    padding:         16,
    borderRadius:    10,
    background:      "#111827",
    border:          "1px solid #374151",
    textAlign:       "center",
  },
  avatar: {
    width:           48,
    height:          48,
    borderRadius:    "50%",
    background:      "#4f46e5",
    color:           "#fff",
    fontSize:        22,
    fontWeight:      "bold",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    margin:          "0 auto",
  },
  history: {
    marginTop:       20,
    textAlign:       "left",
    borderTop:       "1px solid #374151",
    paddingTop:      14,
  },
  historyRow: {
    display:         "flex",
    justifyContent:  "space-between",
    alignItems:      "center",
    padding:         "6px 0",
    borderBottom:    "1px solid #1f2937",
    fontSize:        13,
    color:           "#e5e7eb",
  },
};
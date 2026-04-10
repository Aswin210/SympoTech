import { useState, useRef, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import html2canvas from "html2canvas";

const API = "http://localhost:5000";

function Register() {
  const location = useLocation();
  const eventId = location.state?.eventId || "";
  const eventName = location.state?.eventName || "No Event Selected";

  const [formData, setFormData] = useState({
    name: "",
    college_name: "",
    phone: "",
    email: "",
    event_id: eventId,
  });

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [qrData, setQrData] = useState("");
  const [photo, setPhoto] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [utrScore, setUtrScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollStatus, setPollStatus] = useState("");
  const [autoApproved, setAutoApproved] = useState(false);

  // ── NEW: payment screenshot state ──
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const screenshotInputRef = useRef(null);
  // ── END NEW ──

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const idCardRef = useRef(null);
  const streamRef = useRef(null);
  const pollRef = useRef(null);

  const YOUR_UPI_ID = "arunsekar664@okaxis";
  const AMOUNT = "1";
  const PAYEE_NAME = "CollegeEvent";
  const upiQRValue = `upi://pay?pa=${YOUR_UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${AMOUNT}&cu=INR`;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ══════════════════════════════════════════
     NEW: HANDLE PAYMENT SCREENSHOT UPLOAD
  ══════════════════════════════════════════ */
  const handleScreenshotChange = (e) => {
    setScreenshotError("");
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setScreenshotError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("File size must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result);
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview("");
    setScreenshotError("");
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
  };
  /* ══════════════════════════════════════════
     END NEW
  ══════════════════════════════════════════ */

  /* ══════════════════════════════════════════
     CLIENT-SIDE UTR FORMAT VALIDATION
     (Server does deeper analysis — this is UX-level)
  ══════════════════════════════════════════ */
  const validateUTRClient = (utr) => {
    const t = utr.trim();
    if (!t)
      return { valid: false, msg: "Please enter your UTR / Transaction ID." };
    if (t.length < 10)
      return { valid: false, msg: "UTR must be at least 10 characters." };
    if (t.length > 22)
      return { valid: false, msg: "UTR must not exceed 22 characters." };
    if (!/^[a-zA-Z0-9]+$/.test(t))
      return {
        valid: false,
        msg: "Only letters and numbers allowed. No spaces or special characters.",
      };
    if (/^(.)\1+$/.test(t))
      return {
        valid: false,
        msg: "❌ This looks fake — all characters are the same.",
      };
    const seq = "0123456789012345678901234567890";
    if (seq.includes(t))
      return {
        valid: false,
        msg: "❌ Sequential numbers are not a valid UTR.",
      };
    const fakeKw = [
      /^test/i,
      /^fake/i,
      /^dummy/i,
      /^sample/i,
      /^1234/,
      /^0000/,
      /^9999/,
    ];
    for (const p of fakeKw)
      if (p.test(t))
        return {
          valid: false,
          msg: "❌ Invalid UTR — please enter the real one from your payment app.",
        };
    return { valid: true };
  };

  /* Live UTR strength indicator */
  const getUTRStrength = (utr) => {
    if (!utr || utr.length < 5) return null;
    const t = utr.trim().toUpperCase();
    const uniqueRatio = new Set(t.split("")).size / t.length;
    const bankPrefixes = [
      "HDFC",
      "ICIC",
      "SBIN",
      "AXIS",
      "PYTM",
      "YESB",
      "KOTAK",
      "GPAY",
      "NEFT",
      "RTGS",
      "IMPS",
    ];
    const hasPrefix = bankPrefixes.some((p) => t.startsWith(p));
    const hasMixed = /[A-Z]/.test(t) && /\d/.test(t);
    if (uniqueRatio > 0.6 && hasMixed && t.length >= 12)
      return { label: "Strong", color: "#16a34a", width: "85%" };
    if (hasPrefix || (hasMixed && t.length >= 10))
      return { label: "Good", color: "#2563eb", width: "60%" };
    if (uniqueRatio < 0.25)
      return { label: "Weak", color: "#dc2626", width: "20%" };
    return { label: "Fair", color: "#d97706", width: "40%" };
  };

  const strength = getUTRStrength(utrNumber);

  /* ══════════════════════════════════════════
     STEP 1 → STEP 2
  ══════════════════════════════════════════ */
  const handleShowPayment = (e) => {
    e.preventDefault();
    setStep(2);
    setUtrError("");
  };

  /* ══════════════════════════════════════════
     SUBMIT UTR
  ══════════════════════════════════════════ */
  const submitUTR = async () => {
    setUtrError("");
    const check = validateUTRClient(utrNumber);
    if (!check.valid) {
      setUtrError(check.msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/submit-utr`, {
        utrNumber: utrNumber.trim(),
        amount: AMOUNT,
        ...formData,
        photo,
        paymentScreenshot, // ── NEW: send screenshot to backend ──
      });

      if (res.data.success) {
        setUserId(res.data.userId);
        setQrData(res.data.qrData);
        setUtrScore(res.data.utrScore);

        if (res.data.autoApproved) {
          /* High-score UTR — skip waiting, go straight to camera */
          setAutoApproved(true);
          setStep(4);
        } else {
          setStep(3);
          startPolling(res.data.userId);
        }
      } else {
        setUtrError(res.data.message || "Submission failed. Please try again.");
      }
    } catch {
      setUtrError("Server error. Please make sure backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ══════════════════════════════════════════
     POLL STATUS
  ══════════════════════════════════════════ */
  const startPolling = (uid) => {
    setPolling(true);
    setPollStatus("⏳ Waiting for admin to verify your payment...");

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/user-status/${uid}`);
        if (res.data.success) {
          if (res.data.payment_status === "approved") {
            clearInterval(pollRef.current);
            setPolling(false);
            setPollStatus("✅ Payment Verified!");
            setTimeout(() => setStep(4), 800);
          } else if (res.data.payment_status === "rejected") {
            clearInterval(pollRef.current);
            setPolling(false);
            setPollStatus("❌ Payment rejected. Please contact support.");
          } else {
            setPollStatus("⏳ Admin is reviewing your payment... please wait.");
          }
        }
      } catch {
        setPollStatus("⚠️ Checking status... please wait.");
      }
    }, 5000);
  };

  /* ══════════════════════════════════════════
     CAMERA
  ══════════════════════════════════════════ */
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      alert("Camera access denied");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/png"));
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    setStep(5);
  };

  /* ══════════════════════════════════════════
     DOWNLOAD ID CARD
  ══════════════════════════════════════════ */
  const downloadCard = () => {
    html2canvas(idCardRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "Event_ID_Card.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  /* ══════════════════════════════════════════
     STYLES
  ══════════════════════════════════════════ */
  const s = {
    page: { minHeight: "100vh", backgroundColor: "#f3f4f6" },
    container: {
      maxWidth: "480px",
      margin: "0 auto",
      padding: "24px 16px",
      textAlign: "center",
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#111827",
      marginBottom: "6px",
    },
    subtitle: { fontSize: "14px", color: "#6b7280", marginBottom: "24px" },
    card: {
      background: "#fff",
      borderRadius: "14px",
      padding: "24px",
      marginBottom: "16px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      textAlign: "left",
    },
    label: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "6px",
      display: "block",
    },
    hint: { fontSize: "12px", color: "#9ca3af", marginBottom: "10px" },
    input: {
      width: "100%",
      padding: "12px 14px",
      fontSize: "14px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      marginBottom: "12px",
      boxSizing: "border-box",
      outline: "none",
      backgroundColor: "#fafafa",
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#4f46e5",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "8px",
    },
    greenBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#16a34a",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "8px",
    },
    cyanBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#0891b2",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "12px",
    },
    disabledBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#9ca3af",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "not-allowed",
      marginTop: "4px",
    },
    errorBox: {
      backgroundColor: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: "8px",
      padding: "10px 14px",
      marginBottom: "12px",
      fontSize: "13px",
      color: "#b91c1c",
      textAlign: "left",
    },
    infoBox: {
      backgroundColor: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "8px",
      padding: "10px 14px",
      marginBottom: "16px",
      fontSize: "13px",
      color: "#1e40af",
      textAlign: "left",
    },
    warningBox: {
      backgroundColor: "#fefce8",
      border: "1px solid #fde047",
      borderRadius: "8px",
      padding: "10px 14px",
      marginBottom: "16px",
      fontSize: "13px",
      color: "#854d0e",
      textAlign: "left",
    },
    successBox: {
      backgroundColor: "#f0fdf4",
      border: "1px solid #86efac",
      borderRadius: "8px",
      padding: "12px 14px",
      marginBottom: "16px",
      fontSize: "13px",
      color: "#166534",
      textAlign: "left",
    },
    qrWrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "#6b7280",
      cursor: "pointer",
      textDecoration: "underline",
      fontSize: "13px",
      marginTop: "12px",
      display: "block",
      width: "100%",
      textAlign: "center",
    },
    idCard: {
      border: "2px solid #4f46e5",
      width: "300px",
      margin: "auto",
      padding: "20px",
      borderRadius: "14px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 12px rgba(79,70,229,0.15)",
    },
    stepBadge: (active) => ({
      display: "inline-block",
      width: 28,
      height: 28,
      borderRadius: "50%",
      backgroundColor: active ? "#4f46e5" : "#e5e7eb",
      color: active ? "#fff" : "#6b7280",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: "28px",
      textAlign: "center",
      margin: "0 4px",
    }),
    // ── NEW: screenshot upload styles ──
    uploadZone: {
      border: "2px dashed #d1d5db",
      borderRadius: "10px",
      padding: "18px 14px",
      textAlign: "center",
      cursor: "pointer",
      backgroundColor: "#f9fafb",
      marginBottom: "14px",
      transition: "border-color 0.2s",
    },
    uploadZoneActive: {
      border: "2px dashed #4f46e5",
      borderRadius: "10px",
      padding: "18px 14px",
      textAlign: "center",
      cursor: "pointer",
      backgroundColor: "#eef2ff",
      marginBottom: "14px",
    },
    screenshotPreviewBox: {
      position: "relative",
      marginBottom: "14px",
      borderRadius: "10px",
      overflow: "hidden",
      border: "1px solid #e5e7eb",
    },
    screenshotImg: {
      width: "100%",
      maxHeight: "200px",
      objectFit: "cover",
      display: "block",
      borderRadius: "8px",
    },
    removeBtn: {
      position: "absolute",
      top: "8px",
      right: "8px",
      background: "#ef4444",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: "26px",
      height: "26px",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    },
    // ── END NEW ──
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>
        <h2 style={s.title}>Event Registration</h2>
        <p style={s.subtitle}>Fill the form and pay ₹{AMOUNT} to register</p>

        {/* Step Indicator */}
        <div style={{ marginBottom: 20 }}>
          {["Form", "Pay", "Verify", "Photo", "ID Card"].map((label, i) => (
            <span key={i}>
              <span style={s.stepBadge(step === i + 1)}>{i + 1}</span>
              <span
                style={{
                  fontSize: 11,
                  color: step === i + 1 ? "#4f46e5" : "#9ca3af",
                }}
              >
                {label}
              </span>
              {i < 4 && (
                <span style={{ color: "#d1d5db", margin: "0 4px" }}>›</span>
              )}
            </span>
          ))}
        </div>

        {/* ══ STEP 1 — FORM ══ */}
        {step === 1 && (
          <form onSubmit={handleShowPayment}>
            <div style={s.card}>
              <label style={s.label}>Full Name</label>
              <input
                style={s.input}
                name="name"
                placeholder="Enter your name"
                onChange={handleChange}
                required
              />
              <label style={s.label}>College Name</label>
              <input
                style={s.input}
                name="college_name"
                placeholder="Enter college name"
                onChange={handleChange}
                required
              />
              <label style={s.label}>Phone Number</label>
              <input
                style={s.input}
                name="phone"
                placeholder="Enter phone number"
                type="tel"
                onChange={handleChange}
                required
              />
              <label style={s.label}>Email Address</label>
              <input
                style={s.input}
                name="email"
                placeholder="Enter email address"
                type="email"
                onChange={handleChange}
                required
              />
              <div style={s.successBox}>
                Selected Event: <strong>{eventName}</strong>
              </div>
              <button type="submit" style={s.primaryBtn}>
                Proceed to Pay ₹{AMOUNT}
              </button>
            </div>
          </form>
        )}

        {/* ══ STEP 2 — PAYMENT + UTR ══ */}
        {step === 2 && (
          <div>
            <div style={s.card}>
              <label style={{ ...s.label, fontSize: 15 }}>
                Scan QR &amp; Pay ₹{AMOUNT}
              </label>
              <p style={s.hint}>Open GPay / PhonePe / Paytm → Scan QR → Pay</p>
              <div style={s.qrWrapper}>
                <div
                  style={{
                    padding: 12,
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <QRCode value={upiQRValue} size={180} />
                </div>
                <p style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                  UPI ID:{" "}
                  <strong style={{ color: "#111827" }}>{YOUR_UPI_ID}</strong>
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Amount:{" "}
                  <strong style={{ color: "#111827" }}>₹{AMOUNT}</strong>
                </p>
              </div>
              <div style={s.infoBox}>
                <strong>How to pay:</strong>
                <br />
                1. Open GPay / PhonePe / Paytm
                <br />
                2. Tap <strong>Scan QR</strong> and scan above
                <br />
                3. Confirm payment of ₹{AMOUNT}
                <br />
                4. Copy the <strong>UTR / Transaction ID</strong> from the app
              </div>
            </div>

            {/* ══════════════════════════════════════════
                NEW: PAYMENT SCREENSHOT UPLOAD CARD
            ══════════════════════════════════════════ */}
            <div style={s.card}>
              <label style={{ ...s.label, fontSize: 14 }}>
                Upload Payment Screenshot{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional but speeds up verification)
                </span>
              </label>
              <p style={s.hint}>
                Take a screenshot of your payment success screen from GPay /
                PhonePe / Paytm and upload it here.
              </p>

              {screenshotError && (
                <div style={s.errorBox}>⚠️ {screenshotError}</div>
              )}

              {screenshotPreview ? (
                <div style={s.screenshotPreviewBox}>
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot preview"
                    style={s.screenshotImg}
                  />
                  <button
                    onClick={removeScreenshot}
                    style={s.removeBtn}
                    title="Remove screenshot"
                  >
                    ✕
                  </button>
                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderTop: "1px solid #86efac",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ✅ Screenshot uploaded successfully
                  </div>
                </div>
              ) : (
                <div
                  style={s.uploadZone}
                  onClick={() => screenshotInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      const fakeEvent = { target: { files: [file] } };
                      handleScreenshotChange(fakeEvent);
                    }
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      marginBottom: "8px",
                      color: "#9ca3af",
                    }}
                  >
                    📷
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    <strong style={{ color: "#4f46e5" }}>
                      Click to upload
                    </strong>{" "}
                    or drag &amp; drop
                  </p>
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                    JPG, PNG, WEBP — max 5 MB
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleScreenshotChange}
                style={{ display: "none" }}
              />
            </div>
            {/* ══ END NEW: PAYMENT SCREENSHOT UPLOAD CARD ══ */}

            <div style={s.card}>
              <label style={s.label}>Enter UTR / Transaction ID</label>
              <p style={s.hint}>
                GPay → UPI Ref. No. &nbsp;|&nbsp; PhonePe → Transaction ID
                &nbsp;|&nbsp; Paytm → UTR Number
              </p>

              <div style={s.warningBox}>
                ⚠️ <strong>Important:</strong> Enter only the real UTR from your
                payment app. Our system uses smart analysis to detect fake UTRs
                automatically. Fake submissions will be{" "}
                <strong>permanently rejected</strong>.
              </div>

              {utrError && <div style={s.errorBox}>⚠️ {utrError}</div>}

              <input
                type="text"
                placeholder="e.g. HDFC2024XXXXXXXX or AXISFBK2891"
                value={utrNumber}
                onChange={(e) => {
                  setUtrError("");
                  setUtrNumber(e.target.value.replace(/\s/g, "").slice(0, 22));
                }}
                style={{
                  ...s.input,
                  border: utrError ? "1px solid #f87171" : "1px solid #d1d5db",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                  fontFamily: "monospace",
                  fontSize: "15px",
                }}
              />

              {/* Live strength bar */}
              {strength && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      UTR strength
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: strength.color,
                      }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        height: 4,
                        width: strength.width,
                        backgroundColor: strength.color,
                        borderRadius: 4,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                </div>
              )}

              {submitting || utrNumber.trim().length < 10 ? (
                <button disabled style={s.disabledBtn}>
                  {submitting
                    ? "🔬 Analyzing UTR..."
                    : "Submit UTR for Verification"}
                </button>
              ) : (
                <button onClick={submitUTR} style={s.greenBtn}>
                  Submit UTR for Verification
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setStep(1);
                setUtrNumber("");
                setUtrError("");
              }}
              style={s.backBtn}
            >
              ← Back to Form
            </button>
          </div>
        )}

        {/* ══ STEP 3 — WAITING FOR ADMIN ══ */}
        {step === 3 && (
          <div style={s.card}>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              {polling && (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: "4px solid #e5e7eb",
                    borderTop: "4px solid #4f46e5",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }}
                />
              )}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              <h3 style={{ color: "#4f46e5", marginBottom: 8 }}>
                UTR Submitted Successfully!
              </h3>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
                Your UTR{" "}
                <strong style={{ color: "#111827", fontFamily: "monospace" }}>
                  {utrNumber}
                </strong>{" "}
                has been submitted.
              </p>

              {/* UTR Score badge */}
              {utrScore !== null && (
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    backgroundColor:
                      utrScore >= 75
                        ? "#f0fdf4"
                        : utrScore >= 45
                          ? "#fefce8"
                          : "#fef2f2",
                    border: `1px solid ${utrScore >= 75 ? "#86efac" : utrScore >= 45 ? "#fde047" : "#fca5a5"}`,
                    color:
                      utrScore >= 75
                        ? "#166534"
                        : utrScore >= 45
                          ? "#854d0e"
                          : "#b91c1c",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  {utrScore >= 75
                    ? `✅ UTR Score: ${utrScore}/100 — Looks genuine`
                    : utrScore >= 45
                      ? `⚠️ UTR Score: ${utrScore}/100 — Under review`
                      : `❌ UTR Score: ${utrScore}/100 — Flagged`}
                </div>
              )}

              <div style={{ ...s.infoBox, textAlign: "center", fontSize: 13 }}>
                {pollStatus}
              </div>

              <div style={{ ...s.warningBox, textAlign: "left" }}>
                <strong>What happens next?</strong>
                <br />
                1. Admin checks your UTR in their bank app
                <br />
                2. If payment is genuine → <strong>Approved ✅</strong>
                <br />
                3. If UTR is fake → <strong>Rejected ❌</strong>
                <br />
                4. This page auto-updates every 5 seconds
              </div>

              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                Do not close this page. Your ID card will appear here once
                approved.
              </p>
            </div>
          </div>
        )}

        {/* ══ STEP 4 — CAMERA ══ */}
        {step === 4 && (
          <div style={s.card}>
            {autoApproved ? (
              <div style={s.successBox}>
                ✅ UTR auto-verified (high confidence score)! Take your photo to
                generate your ID card.
              </div>
            ) : (
              <div style={s.successBox}>
                ✅ Payment verified by admin! Take your photo to generate your
                ID card.
              </div>
            )}

            <p style={{ ...s.label, fontSize: 15 }}>
              Your Registration QR Code
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <QRCode value={qrData.toString()} size={180} />
            </div>

            <button onClick={openCamera} style={s.primaryBtn}>
              Open Camera for Photo
            </button>

            <video
              ref={videoRef}
              width="100%"
              style={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                display: "block",
                marginTop: 12,
              }}
            />

            <button onClick={capturePhoto} style={s.cyanBtn}>
              Capture Photo
            </button>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {/* ══ STEP 5 — ID CARD ══ */}
        {step === 5 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ ...s.label, fontSize: 15, textAlign: "center" }}>
              Your Event ID Card
            </p>
            <div ref={idCardRef} style={s.idCard}>
              <h3 style={{ color: "#4f46e5", marginBottom: 12, fontSize: 16 }}>
                College Event ID Card
              </h3>
              <p style={{ fontSize: 14, marginBottom: 6 }}>
                <strong>Name:</strong> {formData.name}
              </p>
              <p style={{ fontSize: 14, marginBottom: 6 }}>
                <strong>User ID:</strong> {userId}
              </p>
              <p style={{ fontSize: 14, marginBottom: 14 }}>
                <strong>Event:</strong> {eventName}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <QRCode value={qrData.toString()} size={120} />
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <img
                  src={photo}
                  alt="User"
                  width="110"
                  style={{ borderRadius: 8, border: "2px solid #e5e7eb" }}
                />
              </div>
            </div>
            <button
              onClick={downloadCard}
              style={{ ...s.greenBtn, marginTop: 16 }}
            >
              Download ID Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
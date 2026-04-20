import { useState, useRef, useCallback } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import html2canvas from "html2canvas";

const API = "http://localhost:5000";

/* ─────────────────────────────────────────────────────
   PAYMENT PROCESSING OVERLAY
───────────────────────────────────────────────────── */
const PaymentOverlay = ({ status }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
  }}>
    <div style={{
      background: "#fff", borderRadius: 20, padding: "36px 40px",
      textAlign: "center", maxWidth: 340, width: "90%",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>
        {status === "verifying" ? "🔐" : status === "success" ? "✅" : "⏳"}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 8 }}>
        {status === "verifying" ? "Verifying Payment..." : status === "success" ? "Payment Verified!" : "Processing..."}
      </h3>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        {status === "verifying"
          ? "Checking your payment with Razorpay..."
          : "Payment confirmed! Setting up your registration..."}
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────── */
const StepIndicator = ({ current }) => {
  const steps = ["Form", "Pay", "Photo", "ID Card"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
      {steps.map((label, i) => {
        const num    = i + 1;
        const done   = current > num;
        const active = current === num;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: (done || active) ? "#6366f1" : "#e5e7eb",
                color: (done || active) ? "#fff" : "#9ca3af",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, margin: "0 auto 4px",
                transition: "all 0.3s",
                boxShadow: active ? "0 0 0 3px rgba(99,102,241,0.25)" : "none",
              }}>
                {done ? "✓" : num}
              </div>
              <span style={{
                fontSize: 10,
                color: (active || done) ? "#6366f1" : "#9ca3af",
                fontWeight: active ? 700 : 500,
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 28, height: 2,
                background: done ? "#6366f1" : "#e5e7eb",
                margin: "0 4px 14px",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   FORM FIELD
───────────────────────────────────────────────────── */
const FormField = ({ label, name, type, placeholder, value, onChange, onBlur, error, aiResult, loading }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <input
        name={name}
        type={type || "text"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete="off"
        style={{
          width: "100%", padding: "11px 13px", fontSize: 14,
          borderRadius: 9, border: `1.5px solid ${error ? "#f87171" : "#d1d5db"}`,
          marginBottom: 4, boxSizing: "border-box", background: "#fafafa",
          outline: "none", transition: "border-color 0.2s",
          paddingRight: loading ? 36 : 13,
        }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
          🔄
        </span>
      )}
    </div>
    {error && <p style={{ fontSize: 11, color: "#dc2626", marginBottom: 8 }}>⚠️ {error}</p>}
    {aiResult?.valid && !error && (
      <p style={{ fontSize: 11, color: "#16a34a", marginBottom: 6 }}>✅ {aiResult.reason}</p>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   LOAD RAZORPAY SCRIPT DYNAMICALLY
═══════════════════════════════════════════════════ */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script    = document.createElement("script");
    script.id       = "razorpay-script";
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function Register() {
  const location  = useLocation();
  const eventId   = location.state?.eventId   || "";
  const eventName = location.state?.eventName || "No Event Selected";

  const [formData,     setFormData]     = useState({ name: "", college_name: "", phone: "", email: "", event_id: eventId });
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [fieldAI,      setFieldAI]      = useState({});
  const [fieldLoading, setFieldLoading] = useState({});

  const [step,          setStep]          = useState(1);
  const [userId,        setUserId]        = useState("");
  const [qrData,        setQrData]        = useState("");
  const [photo,         setPhoto]         = useState("");
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [paymentError,  setPaymentError]  = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const idCardRef = useRef(null);
  const streamRef = useRef(null);

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateFieldAI = useCallback(async (field, value) => {
    if (!value || value.trim().length < 2) return;
    setFieldLoading((prev) => ({ ...prev, [field]: true }));
    try {
      const resp = await axios.post(`${API}/api/validate-field`, { field, value });
      if (resp.data?.success) {
        setFieldAI((prev) => ({ ...prev, [field]: resp.data }));
        if (!resp.data.valid) {
          setFieldErrors((prev) => ({ ...prev, [field]: resp.data.reason }));
        }
      }
    } catch { /* AI unavailable */ }
    finally {
      setFieldLoading((prev) => ({ ...prev, [field]: false }));
    }
  }, []);

  const handleBlur = useCallback((e) => {
    validateFieldAI(e.target.name, e.target.value);
  }, [validateFieldAI]);

  /* ── Step 1 → 2 ── */
  const handleShowPayment = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim())                errs.name         = "Name is required.";
    if (!formData.college_name.trim())        errs.college_name = "College name is required.";
    if (!/^\d{10}$/.test(formData.phone))     errs.phone        = "Enter a valid 10-digit phone number.";
    if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email        = "Enter a valid email address.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setStep(2);
    setPaymentError("");
  };

  /* ── Razorpay ── */
  const startRazorpayPayment = async () => {
    setPaymentError("");
    setCreatingOrder(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError("Failed to load Razorpay. Check your internet connection.");
        setCreatingOrder(false);
        return;
      }

      const orderRes = await axios.post(`${API}/api/create-order`, { ...formData, event_id: eventId });
      if (!orderRes.data.success) {
        setPaymentError(orderRes.data.message || "Failed to create order.");
        setCreatingOrder(false);
        return;
      }

      const { orderId, userId: newUserId, keyId, amount, currency } = orderRes.data;
      setUserId(newUserId);
      setCreatingOrder(false);
      setPaymentStatus("processing");

      const options = {
        key: keyId, amount, currency, order_id: orderId,
        name: "Sympo-Tech",
        description: `Event Registration — ${eventName}`,
        image: "",
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
            setPaymentError("Payment cancelled. Please try again.");
          },
        },
        handler: async (response) => {
          setPaymentStatus("verifying");
          try {
            const verifyRes = await axios.post(`${API}/api/verify-payment`, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              userId:              newUserId,
            });
            if (verifyRes.data.success) {
              setQrData(verifyRes.data.qrData);
              setUserId(verifyRes.data.userId);
              setPaymentStatus("success");
              setTimeout(() => { setPaymentStatus("idle"); setStep(3); }, 1200);
            } else {
              setPaymentStatus("idle");
              setPaymentError(verifyRes.data.message || "Payment verification failed. Contact support.");
            }
          } catch {
            setPaymentStatus("idle");
            setPaymentError("Verification error. Contact support with payment ID: " + response.razorpay_payment_id);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setPaymentStatus("idle");
        setPaymentError(`Payment failed: ${response.error.description}. Please try again.`);
      });
      rzp.open();

    } catch (err) {
      setCreatingOrder(false);
      setPaymentStatus("idle");
      setPaymentError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  /* ── Camera ── */
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current          = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  const capturePhoto = async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const photoData = canvas.toDataURL("image/png");
    setPhoto(photoData);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    try {
      await axios.post(`${API}/api/update-photo`, { userId, photo: photoData });
    } catch { /* non-critical */ }
    setStep(4);
  };

  const skipPhoto    = () => { setPhoto(""); setStep(4); };
  const downloadCard = () => {
    html2canvas(idCardRef.current).then((canvas) => {
      const link    = document.createElement("a");
      link.download = "Event_ID_Card.png";
      link.href     = canvas.toDataURL();
      link.click();
    });
  };

  /* ── Shared styles ── */
  const S = {
    page:    { minHeight: "100vh", background: "#f1f5f9" },
    wrap:    { maxWidth: 500, margin: "0 auto", padding: "24px 16px" },
    card:    { background: "#fff", borderRadius: 16, padding: "22px 20px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
    title:   { fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 4 },
    sub:     { fontSize: 13, color: "#6b7280", marginBottom: 20 },
    label:   { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
    btn:     (color) => ({ width: "100%", padding: "13px", background: color, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }),
    disBtn:  { width: "100%", padding: "13px", background: "#9ca3af", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "not-allowed", marginTop: 8 },
    infoBox: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e40af", marginBottom: 14 },
    errBox:  { background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#b91c1c", marginBottom: 12 },
    okBox:   { background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#166534", marginBottom: 14 },
    backBtn: { background: "none", border: "none", color: "#6b7280", cursor: "pointer", textDecoration: "underline", fontSize: 13, margin: "10px auto 0", display: "block", textAlign: "center" },
    idCard:  { border: "2px solid #6366f1", width: 300, margin: "0 auto", padding: 20, borderRadius: 16, background: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.15)" },
  };

  return (
    <div style={S.page}>
      <Navbar />

      {(paymentStatus === "verifying" || paymentStatus === "success") && (
        <PaymentOverlay status={paymentStatus} />
      )}

      <div style={S.wrap}>
        <h2 style={S.title}>Event Registration</h2>
        <p style={S.sub}>
          Fill the form and pay ₹100 to register for{" "}
          <strong style={{ color: "#6366f1" }}>{eventName}</strong>
        </p>

        <StepIndicator current={step} />

        {/* ══ STEP 1: FORM ══ */}
        {step === 1 && (
          <form onSubmit={handleShowPayment}>
            <div style={S.card}>
              <FormField label="Full Name" name="name" placeholder="e.g. Arun Sekar"
                value={formData.name} onChange={handleChange} onBlur={handleBlur}
                error={fieldErrors.name} aiResult={fieldAI.name} loading={fieldLoading.name} />
              <FormField label="College Name" name="college_name" placeholder="e.g. Anna University"
                value={formData.college_name} onChange={handleChange} onBlur={handleBlur}
                error={fieldErrors.college_name} aiResult={fieldAI.college_name} loading={fieldLoading.college_name} />
              <FormField label="Phone Number" name="phone" type="tel" placeholder="10-digit mobile number"
                value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                error={fieldErrors.phone} aiResult={fieldAI.phone} loading={fieldLoading.phone} />
              <FormField label="Email Address" name="email" type="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange} onBlur={handleBlur}
                error={fieldErrors.email} aiResult={fieldAI.email} loading={fieldLoading.email} />
              <div style={S.okBox}>🎫 Selected Event: <strong>{eventName}</strong></div>
              <button type="submit" style={S.btn("#6366f1")}>Proceed to Pay ₹1 →</button>
            </div>
          </form>
        )}

        {/* ══ STEP 2: PAYMENT ══ */}
        {step === 2 && (
          <div style={S.card}>
            <div style={S.infoBox}>
              <strong>How it works:</strong><br />
              Click the button below → Razorpay secure popup opens →
              Pay ₹100 via UPI / Card / NetBanking → Done! No UTR entry needed.
            </div>

            {paymentError && <div style={S.errBox}>⚠️ {paymentError}</div>}

            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
              {[["Name", formData.name], ["College", formData.college_name], ["Event", eventName]].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{lbl}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: lbl === "Event" ? "#6366f1" : "inherit" }}>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Amount</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>₹1.00</span>
              </div>
            </div>

            {creatingOrder ? (
              <button disabled style={S.disBtn}>⏳ Creating secure order...</button>
            ) : paymentStatus === "processing" ? (
              <button disabled style={S.disBtn}>💳 Payment in progress...</button>
            ) : (
              <button onClick={startRazorpayPayment}
                style={{ ...S.btn("#6366f1"), display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span>💳</span><span>Pay ₹1 Securely via Razorpay</span>
              </button>
            )}

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Secured by Razorpay · 256-bit SSL Encryption</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                {["UPI", "GPay", "PhonePe", "Paytm", "Cards", "NetBanking"].map((m) => (
                  <span key={m} style={{ fontSize: 11, padding: "3px 10px", background: "#f3f4f6", borderRadius: 6, color: "#374151", border: "1px solid #e5e7eb" }}>{m}</span>
                ))}
              </div>
            </div>
            <button onClick={() => { setStep(1); setPaymentError(""); }} style={S.backBtn}>← Edit Registration Details</button>
          </div>
        )}

        {/* ══ STEP 3: CAMERA ══ */}
        {step === 3 && (
          <div style={S.card}>
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "16px 18px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 28 }}>✅</span>
              <div>
                <p style={{ fontWeight: 800, color: "#166534", fontSize: 14, marginBottom: 4 }}>Payment Verified by Razorpay!</p>
                <p style={{ color: "#15803d", fontSize: 12 }}>Your ₹1 registration fee is confirmed. No manual review needed.</p>
              </div>
            </div>
            <p style={{ ...S.label, fontSize: 15, marginBottom: 8 }}>Your Registration QR</p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ padding: 12, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <QRCode value={qrData.toString()} size={180} />
              </div>
            </div>
            <p style={{ ...S.label, fontSize: 14, marginBottom: 8 }}>📷 Take a photo for your ID card</p>
            <button onClick={openCamera} style={S.btn("#6366f1")}>Open Camera</button>
            <video ref={videoRef} width="100%" style={{ borderRadius: 8, border: "1px solid #e5e7eb", marginTop: 12, display: "block" }} />
            <button onClick={capturePhoto} style={S.btn("#0891b2")}>Capture Photo</button>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <button onClick={skipPhoto} style={S.backBtn}>Skip photo → Go to ID Card</button>
          </div>
        )}

        {/* ══ STEP 4: ID CARD ══ */}
        {step === 4 && (
          <div>
            <p style={{ ...S.label, fontSize: 15, textAlign: "center", marginBottom: 14 }}>🪪 Your Event ID Card</p>
            <div ref={idCardRef} style={S.idCard}>
              <div style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", margin: "-20px -20px 16px", padding: "14px 20px", borderRadius: "14px 14px 0 0" }}>
                <h3 style={{ color: "#fff", margin: 0, fontSize: 15 }}>🎫 {eventName}</h3>
                <p style={{ color: "rgba(255,255,255,0.8)", margin: "2px 0 0", fontSize: 11 }}>Official ID Card · Powered by Sympo-Tech</p>
              </div>
              <p style={{ fontSize: 14, marginBottom: 6 }}><strong>Name:</strong> {formData.name}</p>
              <p style={{ fontSize: 14, marginBottom: 6 }}><strong>College:</strong> {formData.college_name}</p>
              <p style={{ fontSize: 14, marginBottom: 6 }}><strong>Phone:</strong> {formData.phone}</p>
              <p style={{ fontSize: 14, marginBottom: 6 }}><strong>User ID:</strong> #{userId}</p>
              <p style={{ fontSize: 14, marginBottom: 14 }}><strong>Event:</strong> {eventName}</p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <QRCode value={qrData.toString()} size={110} />
              </div>
              {photo ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img src={photo} alt="User" width="100" style={{ borderRadius: 8, border: "2px solid #e5e7eb" }} />
                </div>
              ) : (
                <div style={{ width: 100, height: 100, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 32, border: "2px solid #e5e7eb" }}>
                  👤
                </div>
              )}
              <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>✅ Payment verified by Razorpay</p>
            </div>
            <button onClick={downloadCard} style={{ ...S.btn("#16a34a"), marginTop: 16 }}>⬇️ Download ID Card</button>
            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>Registration complete! User ID: #{userId}</p>
          </div>
        )}

      </div>
    </div>
  );
}
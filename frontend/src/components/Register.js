import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import QRCode from "react-qr-code";
import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";

import API_BASE_URL from "../api";

const API = API_BASE_URL;

/**
 * Register Component
 * Refactored for Bento Design System.
 */
export default function Register() {
  const location = useLocation();
  const eventId = location.state?.eventId || "";
  const eventName = location.state?.eventName || "No Event Selected";

  const [formData, setFormData] = useState({ name: "", college_name: "", phone: "", email: "", event_id: eventId });
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [qrData, setQrData] = useState("");
  const [photo, setPhoto] = useState("");

  const [paymentError, setPaymentError] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const idCardRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const [faceCount, setFaceCount] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading face detection models:", err);
      }
    };
    loadModels();
    
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateFieldAI = useCallback(async (field, value) => {
    if (!value || value.trim().length < 2) return;
    try {
      const resp = await axios.post(`${API}/api/validate-field`, { field, value });
      if (resp.data?.success) {
        if (!resp.data.valid) {
          setFieldErrors((prev) => ({ ...prev, [field]: resp.data.reason }));
        }
      }
    } catch { /* AI unavailable */ }
  }, []);

  const handleBlur = useCallback((e) => {
    validateFieldAI(e.target.name, e.target.value);
  }, [validateFieldAI]);

  const handleShowPayment = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required.";
    if (!formData.college_name.trim()) errs.college_name = "College name is required.";
    if (!/^\d{10}$/.test(formData.phone)) errs.phone = "Enter a valid 10-digit phone number.";
    if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Enter a valid email address.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setStep(2);
  };

  const startRazorpayPayment = async () => {
    setPaymentError("");
    setCreatingOrder(true);
    try {
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
        name: "SympoTech",
        description: `Event Registration — ${eventName}`,
        theme: { color: "#6366f1" },
        handler: async (response) => {
          setPaymentStatus("verifying");
          try {
            const verifyRes = await axios.post(`${API}/api/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: newUserId,
            });
            if (verifyRes.data.success) {
              setQrData(verifyRes.data.qrData);
              setPaymentStatus("success");
              setTimeout(() => { setPaymentStatus("idle"); setStep(3); }, 1200);
            } else {
              setPaymentStatus("idle");
              setPaymentError(verifyRes.data.message || "Payment verification failed.");
            }
          } catch {
            setPaymentStatus("idle");
            setPaymentError("Verification error.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setCreatingOrder(false);
      setPaymentStatus("idle");
      setPaymentError(err.response?.data?.message || "Something went wrong.");
    }
  };

  const openCamera = async () => {
    try {
      setCameraActive(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            startFaceDetection();
          };
        }
      }, 100);
    } catch {
      alert("Camera access denied.");
      setCameraActive(false);
    }
  };

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
        setFaceCount(detections.length);
      }
    }, 500);
  };

  const capturePhoto = async () => {
    if (faceCount !== 1) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const photoData = canvas.toDataURL("image/png");
    setPhoto(photoData);
    
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    setCameraActive(false);

    try {
      await axios.post(`${API}/api/update-photo`, { userId, photo: photoData });
    } catch { /* ignored */ }
    setStep(4);
  };

  const downloadCard = () => {
    html2canvas(idCardRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "Event_Pass.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ maxWidth: "600px", paddingTop: "40px" }}>
        <div className="glass-card" style={{ padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h2 className="gradient-text" style={{ fontSize: "28px" }}>Registration</h2>
            <div style={{ background: "var(--primary)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>STEP {step}/4</div>
          </div>

          <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
            Event: <strong style={{ color: "var(--text-primary)" }}>{eventName}</strong>
          </p>

          {/* Step 1: Form */}
          {step === 1 && (
            <form onSubmit={handleShowPayment} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginLeft: "4px" }}>FULL NAME</label>
                <input className="premium-input" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} onBlur={handleBlur} />
                {fieldErrors.name && <small style={{ color: "var(--danger)" }}>{fieldErrors.name}</small>}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginLeft: "4px" }}>COLLEGE NAME</label>
                <input className="premium-input" name="college_name" placeholder="Anna University" value={formData.college_name} onChange={handleChange} onBlur={handleBlur} />
                {fieldErrors.college_name && <small style={{ color: "var(--danger)" }}>{fieldErrors.college_name}</small>}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>PHONE</label>
                  <input className="premium-input" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} onBlur={handleBlur} />
                  {fieldErrors.phone && <small style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldErrors.phone}</small>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px" }}>EMAIL</label>
                  <input className="premium-input" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} />
                  {fieldErrors.email && <small style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldErrors.email}</small>}
                </div>
              </div>

              <button type="submit" className="primary-button" style={{ marginTop: "12px" }}>
                Continue to Payment
              </button>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "40px 24px", borderRadius: "var(--radius-lg)", marginBottom: "32px" }}>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>TOTAL PAYABLE</div>
                <h1 style={{ fontSize: "56px", marginBottom: "4px" }}>₹1</h1>
                <div style={{ color: "var(--success)", fontSize: "13px", fontWeight: "700" }}>SECURE TRANSACTION</div>
              </div>
              {paymentError && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>{paymentError}</div>}
              <button onClick={startRazorpayPayment} disabled={creatingOrder || paymentStatus !== "idle"} className="primary-button" style={{ width: "100%" }}>
                {creatingOrder ? "Initializing..." : "Pay with Razorpay"}
              </button>
              <button onClick={() => setStep(1)} className="secondary-button" style={{ marginTop: "16px", width: "100%" }}>
                Edit Details
              </button>
            </div>
          )}

          {/* Step 3: Camera */}
          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
                  <div style={{ padding: "16px", background: "#fff", borderRadius: "20px", boxShadow: "var(--shadow-md)" }}>
                    <QRCode value={qrData.toString()} size={140} />
                  </div>
                </div>
                
                <h3 style={{ marginBottom: "8px" }}>Identity Verification</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>Please capture a clear photo of yourself for the digital pass.</p>
                
                {!cameraActive ? (
                  <button onClick={openCamera} className="primary-button" style={{ width: "100%" }}>
                    {modelsLoaded ? "Launch Camera" : "Loading AI Models..."}
                  </button>
                ) : (
                  <>
                    <div style={{ position: "relative", marginBottom: "24px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "2px solid var(--border)" }}>
                      <video ref={videoRef} playsInline style={{ width: "100%", display: "block", background: "#000" }} />
                      <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)" }}>
                        {faceCount === 0 && <span className="camera-overlay warning">NO FACE DETECTED</span>}
                        {faceCount > 1 && <span className="camera-overlay warning">MULTIPLE FACES</span>}
                        {faceCount === 1 && <span className="camera-overlay success">READY TO CAPTURE</span>}
                      </div>
                    </div>
                    <button onClick={capturePhoto} disabled={faceCount !== 1} className={faceCount === 1 ? "primary-button" : "secondary-button"} style={{ width: "100%", opacity: faceCount === 1 ? 1 : 0.5 }}>
                      Capture Photo
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: ID Card */}
          {step === 4 && (
            <div style={{ textAlign: "center" }}>
              <div ref={idCardRef} style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: "340px", margin: "0 auto 32px", textAlign: "left" }}>
                <div style={{ background: "#09090b", padding: "28px 24px", color: "#fff", textAlign: "center", borderBottom: "3px solid var(--primary)" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", opacity: 0.7, letterSpacing: "2.5px", marginBottom: "10px", textTransform: "uppercase", color: "var(--primary)" }}>SympoTech Event Management System</div>
                  <div style={{ fontWeight: "900", fontSize: "22px", letterSpacing: "1px", color: "#fff" }}>{eventName}</div>
                </div>
                <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
                  <div style={{ width: "140px", height: "140px", borderRadius: "24px", overflow: "hidden", border: "4px solid var(--bg-app)" }}>
                    <img src={photo} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: "24px", marginBottom: "4px" }}>{formData.name}</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>{formData.college_name}</p>
                    <div style={{ marginTop: "16px", padding: "4px 12px", background: "var(--glass-bg)", borderRadius: "10px", fontSize: "11px", fontWeight: "800", color: "var(--primary)", display: "inline-block" }}>
                      ID: #{userId.toString().slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div style={{ background: "var(--glass-bg)", padding: "32px 24px", textAlign: "center", borderTop: "1px dashed var(--border)" }}>
                  <QRCode value={qrData.toString()} size={100} />
                </div>
              </div>
              <button onClick={downloadCard} className="primary-button" style={{ width: "100%" }}>
                Download Digital Pass
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
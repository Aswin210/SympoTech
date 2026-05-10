import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import QRCode from "react-qr-code";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

import API_BASE_URL from "../api";

const API = API_BASE_URL;

/**
 * Register Component
 * Updated for Multi-Event Selection and Dynamic Pricing.
 */
export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle multiple events from state or localStorage fallback
  const selectedEvents = useMemo(() => {
    if (location.state?.events) return location.state.events;
    const saved = localStorage.getItem("selected_events");
    return saved ? JSON.parse(saved) : [];
  }, [location.state]);

  const eventNames = useMemo(() => selectedEvents.map(e => e.name).join(", "), [selectedEvents]);

  // Pricing Logic
  const totalPrice = useMemo(() => {
    const count = selectedEvents.length;
    if (count === 3) return 250;
    if (count === 2) return 180;
    if (count === 1) return 100;
    return 0;
  }, [selectedEvents]);

  const [formData, setFormData] = useState({ 
    name: "", 
    college_name: "", 
    phone: "", 
    email: "", 
    event_names: eventNames,
    team_members: {} // { eventId: [member1, member2, ...] }
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, event_names: eventNames }));
  }, [eventNames]);

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
    if (selectedEvents.length === 0) {
      alert("No events in your cart. Redirecting to selection...");
      navigate("/events");
    }
  }, [selectedEvents, navigate]);

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

  const handleTeamMemberChange = (eventId, index, value) => {
    setFormData(prev => {
      const currentTeam = prev.team_members[eventId] || [];
      const nextTeam = [...currentTeam];
      nextTeam[index] = value;
      return {
        ...prev,
        team_members: {
          ...prev.team_members,
          [eventId]: nextTeam
        }
      };
    });
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
    
    // Validate team members
    selectedEvents.forEach(event => {
      const size = event.teamSize || 1;
      if (size > 1) {
        const members = formData.team_members[event.id] || [];
        for (let i = 0; i < size - 1; i++) {
          if (!members[i] || !members[i].trim()) {
            errs[`team_${event.id}_${i}`] = `Member ${i + 2} name is required for ${event.name}.`;
          }
        }
      }
    });

    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setStep(2);
  };

  const startRazorpayPayment = async () => {
    setPaymentError("");
    setCreatingOrder(true);
    try {
      console.log("📤 Sending registration data:", { ...formData, event_names: eventNames, amount: totalPrice });
      const orderRes = await axios.post(`${API}/api/create-order`, { 
        ...formData, 
        event_names: eventNames,
        amount: totalPrice 
      });
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
        description: `Multi-Event Registration (${selectedEvents.length} events)`,
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
              // Clear cart on success
              localStorage.removeItem("selected_events");
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
      link.download = `SympoTech_Pass_${formData.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <>
      <div className="register-page">
        <div className="container register-container fade-in">
          <div className="glass-card register-card">
            <div className="register-header">
              <h2 className="gradient-text">Registration</h2>
              <div className="step-badge">STEP {step}/4</div>
            </div>

            <div className="event-info-box">
              <div className="event-info-label">SELECTED EVENTS ({selectedEvents.length})</div>
              <div className="event-list-pills">
                {selectedEvents.map(e => (
                  <span key={e.id} className="event-pill">{e.name}</span>
                ))}
              </div>
            </div>

            {/* Step 1: Form */}
            {step === 1 && (
              <div className="fade-in">
                <button onClick={() => navigate("/cart")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "700", cursor: "pointer", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", padding: "0" }}>
                  ← Edit Selection in Cart
                </button>
                <form onSubmit={handleShowPayment} className="register-form">
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input className="premium-input" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} onBlur={handleBlur} />
                  {fieldErrors.name && <small className="error-text">{fieldErrors.name}</small>}
                </div>
                
                <div className="form-group">
                  <label>COLLEGE NAME</label>
                  <input className="premium-input" name="college_name" placeholder="Anna University" value={formData.college_name} onChange={handleChange} onBlur={handleBlur} />
                  {fieldErrors.college_name && <small className="error-text">{fieldErrors.college_name}</small>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>PHONE</label>
                    <input className="premium-input" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} onBlur={handleBlur} />
                    {fieldErrors.phone && <small className="error-text">{fieldErrors.phone}</small>}
                  </div>
                  <div className="form-group">
                    <label>EMAIL</label>
                    <input className="premium-input" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} />
                    {fieldErrors.email && <small className="error-text">{fieldErrors.email}</small>}
                  </div>
                </div>

                {/* Team Member Inputs */}
                {selectedEvents.map(event => {
                  const size = event.teamSize || 1;
                  if (size <= 1) return null;
                  
                  return (
                    <div key={`team-section-${event.id}`} className="team-reg-section">
                      <div className="team-section-title">
                        Team Members for <b>{event.name}</b>
                      </div>
                      <div className="team-members-grid">
                        {Array.from({ length: size - 1 }).map((_, i) => (
                          <div key={`${event.id}-member-${i}`} className="form-group">
                            <label>MEMBER {i + 2} NAME</label>
                            <input 
                              className="premium-input" 
                              placeholder={`Enter name of member ${i + 2}`}
                              value={formData.team_members[event.id]?.[i] || ""}
                              onChange={(e) => handleTeamMemberChange(event.id, i, e.target.value)}
                            />
                            {fieldErrors[`team_${event.id}_${i}`] && <small className="error-text">{fieldErrors[`team_${event.id}_${i}`]}</small>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button type="submit" className="primary-button continue-btn">
                  Continue to Payment (₹{totalPrice})
                </button>
              </form>
            </div>
          )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="payment-step">
                <div className="payment-display">
                  <div className="payment-label">TOTAL PAYABLE</div>
                  <h1 className="payment-amount">₹{totalPrice}</h1>
                  <div className="payment-badge">SECURE TRANSACTION</div>
                </div>
                {paymentError && <div className="payment-error">{paymentError}</div>}
                <button onClick={startRazorpayPayment} disabled={creatingOrder || paymentStatus !== "idle"} className="primary-button mobile-w-full">
                  {creatingOrder ? "Initializing..." : "Pay with Razorpay"}
                </button>
                <button onClick={() => setStep(1)} className="secondary-button mobile-w-full" style={{ marginTop: "16px" }}>
                  Edit Details
                </button>
              </div>
            )}

            {/* Step 3: Camera */}
            {step === 3 && (
              <div className="camera-step">
                <div className="qr-preview">
                  <div className="qr-box">
                    <QRCode value={qrData.toString()} size={140} />
                  </div>
                </div>
                
                <h3 className="camera-title">Identity Verification</h3>
                <p className="camera-desc">Please capture a clear photo of yourself for the digital pass.</p>
                
                {!cameraActive ? (
                  <button onClick={openCamera} className="primary-button mobile-w-full">
                    {modelsLoaded ? "Launch Camera" : "Loading AI Models..."}
                  </button>
                ) : (
                  <>
                    <div className="video-container">
                      <video ref={videoRef} playsInline className="live-video" />
                      <div className="camera-status">
                        {faceCount === 0 && <span className="camera-overlay warning">NO FACE DETECTED</span>}
                        {faceCount > 1 && <span className="camera-overlay warning">MULTIPLE FACES</span>}
                        {faceCount === 1 && <span className="camera-overlay success">READY TO CAPTURE</span>}
                      </div>
                    </div>
                    <button onClick={capturePhoto} disabled={faceCount !== 1} className={"primary-button mobile-w-full " + (faceCount === 1 ? "" : "disabled-btn")}>
                      Capture Photo
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 4: ID Card */}
            {step === 4 && (
              <div className="id-card-step">
                <div ref={idCardRef} className="final-id-card">
                  <div className="card-header">
                    <div className="card-system-name">SympoTech Event Management System</div>
                    <div className="card-event-name">{eventNames.length > 30 ? selectedEvents.length + " Events" : eventNames}</div>
                  </div>
                  <div className="card-body">
                    <div className="card-photo-box">
                      <img src={photo} alt="User" className="card-photo" />
                    </div>
                    <div className="card-user-info">
                      <h2 className="card-user-name">{formData.name}</h2>
                      <p className="card-user-college">{formData.college_name}</p>
                      <div className="card-user-id">
                        ID: #{userId.toString().slice(-6).toUpperCase()}
                      </div>
                      <div style={{ marginTop: "10px", fontSize: "10px", color: "#64748b", fontWeight: "600" }}>
                        {eventNames}
                      </div>
                      {Object.keys(formData.team_members).length > 0 && (
                        <div style={{ marginTop: "5px", fontSize: "9px", color: "#94a3b8" }}>
                          Team: {Object.values(formData.team_members).flat().join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-footer">
                    <QRCode value={qrData.toString()} size={100} />
                  </div>
                </div>
                <button onClick={downloadCard} className="primary-button mobile-w-full">
                  Download Digital Pass
                </button>
              </div>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <style>{`
          .register-page { min-height: 100vh; background: var(--bg-app); padding-bottom: 80px; }
          .register-container { max-width: 600px; padding-top: 40px; }
          .register-card { padding: 40px; }
          .register-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
          .step-badge { background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
          
          .event-info-box { margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px solid var(--border); }
          .event-info-label { font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 1px; }
          .event-list-pills { display: flex; flex-wrap: wrap; gap: 8px; }
          .event-pill { background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
          
          .register-form { display: flex; flex-direction: column; gap: 24px; }
          .form-group { display: flex; flex-direction: column; gap: 8px; }
          .form-group label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-left: 4px; }
          .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
          .error-text { color: var(--danger); font-size: 11px; }
          .continue-btn { margin-top: 12px; }
          
          .payment-step { text-align: center; }
          .payment-display { background: var(--bg-surface); border: 1px solid var(--border); padding: 40px 24px; border-radius: var(--radius-lg); margin-bottom: 32px; }
          .payment-label { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; }
          .payment-amount { font-size: 56px; margin-bottom: 4px; }
          .payment-badge { color: var(--success); font-size: 13px; font-weight: 700; }
          .payment-error { color: var(--danger); margin-bottom: 16px; }
          
          .camera-step { text-align: center; }
          .qr-preview { display: flex; justify-content: center; margin-bottom: 32px; }
          .qr-box { padding: 16px; background: #fff; border-radius: 20px; box-shadow: var(--shadow-md); }
          .camera-title { margin-bottom: 8px; }
          .camera-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 32px; }
          .video-container { position: relative; margin-bottom: 24px; border-radius: var(--radius-lg); overflow: hidden; border: 2px solid var(--border); }
          .live-video { width: 100%; display: block; background: #000; }
          .camera-status { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); }
          .disabled-btn { opacity: 0.5; cursor: not-allowed; }
          
          .id-card-step { text-align: center; }
          .final-id-card { background: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); width: 100%; max-width: 360px; margin: 0 auto 32px; text-align: left; }
          .card-header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; color: #fff; text-align: center; border-bottom: none; }
          .card-system-name { font-size: 11px; font-weight: 800; opacity: 0.9; letter-spacing: 2.5px; margin-bottom: 10px; text-transform: uppercase; color: #fff; }
          .card-event-name { font-weight: 900; font-size: 20px; letter-spacing: 1px; color: #fff; line-height: 1.2; }
          .card-body { padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .card-photo-box { width: 140px; height: 140px; border-radius: 24px; overflow: hidden; border: 5px solid #f8fafc; box-shadow: 0 10px 25px rgba(0,0,0,0.1); background: #f1f5f9; }
          .card-photo { width: 100%; height: 100%; object-fit: cover; }
          .card-user-info { text-align: center; width: 100%; }
          .card-user-name { font-size: 26px; font-weight: 900; color: #1e293b; margin-bottom: 4px; }
          .card-user-college { font-size: 14px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .card-user-id { margin-top: 20px; padding: 6px 16px; background: #f1f5f9; border-radius: 12px; font-size: 12px; font-weight: 800; color: #4f46e5; display: inline-block; border: 1px solid #e2e8f0; }
          .card-footer { background: #fafafa; padding: 32px 24px; text-align: center; border-top: 2px dashed #e2e8f0; }

          @media (max-width: 640px) {
            .register-card { padding: 24px; }
            .register-header h2 { font-size: 22px; }
            .form-row { grid-template-columns: 1fr; gap: 16px; }
            .payment-amount { font-size: 44px; }
            .final-id-card { max-width: 100%; }
        }

        .team-reg-section {
          background: rgba(255,255,255,0.03);
          border: 1px dashed var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-top: 8px;
        }
        .team-section-title {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }
        .team-members-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
      `}</style>
    </div>
  </>
  );
}
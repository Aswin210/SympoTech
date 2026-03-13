import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import html2canvas from "html2canvas";
import * as faceapi from "face-api.js";

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

  const [userId, setUserId] = useState("");
  const [qrData, setQrData] = useState("");
  const [photo, setPhoto] = useState(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [registering, setRegistering] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const idCardRef = useRef(null);
  const streamRef = useRef(null);
  const detectInterval = useRef(null);

  /* ===============================
     LOAD FACE MODEL
  =============================== */

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {
        console.log("Face model load error:", err);
      }
    };

    loadModels();
  }, []);

  /* ===============================
     HANDLE INPUT
  =============================== */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* ===============================
     REGISTER USER
  =============================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (registering) return;

    setRegistering(true);

    try {
      const res = await axios.post("http://localhost:5000/register", formData);

      if (res.data.success) {
        setUserId(res.data.userId);
        setQrData(res.data.userId);

        alert("Registration Successful");
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Registration failed");
    }

    setRegistering(false);
  };

  /* ===============================
     OPEN CAMERA
  =============================== */

  const openCamera = async () => {
    if (!modelsLoaded) {
      alert("Face model still loading...");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startFaceDetection();
        };
      }
    } catch (err) {
      console.log(err);
      alert("Camera permission denied");
    }
  };

  /* ===============================
     START FACE DETECTION LOOP
  =============================== */

  const startFaceDetection = () => {
    detectInterval.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions(),
      );

      if (detections.length === 1) {
        setFaceDetected(true);
      } else {
        setFaceDetected(false);
      }
    }, 500);
  };

  /* ===============================
     CAPTURE PHOTO
  =============================== */

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.videoWidth === 0) {
      alert("Camera not ready");
      return;
    }

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");

    setPhoto(image);

    /* STOP CAMERA */

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    /* STOP FACE DETECTION */

    if (detectInterval.current) {
      clearInterval(detectInterval.current);
    }
  };

  /* ===============================
     DOWNLOAD ID CARD
  =============================== */

  const downloadCard = () => {
    html2canvas(idCardRef.current).then((canvas) => {
      const link = document.createElement("a");

      link.download = "Event_ID_Card.png";
      link.href = canvas.toDataURL();

      link.click();
    });
  };

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Event Registration</h2>

        {!qrData && (
          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Enter Name"
              onChange={handleChange}
              required
            />

            <br />
            <br />

            <input
              name="college_name"
              placeholder="College Name"
              onChange={handleChange}
              required
            />

            <br />
            <br />

            <input
              name="phone"
              placeholder="Phone Number"
              onChange={handleChange}
              required
            />

            <br />
            <br />

            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />

            <br />
            <br />

            <h3>Selected Event : {eventName}</h3>

            <button type="submit" disabled={registering}>
              Register
            </button>
          </form>
        )}

        {/* QR SECTION */}

        {qrData && (
          <div>
            <h3>Your QR Code</h3>

            <QRCode value={qrData} size={220} />

            <h3 style={{ marginTop: "20px" }}>Take Photo</h3>

            <button onClick={openCamera}>Open Camera</button>

            <br />
            <br />

            <video
              ref={videoRef}
              autoPlay
              playsInline
              width="320"
              height="240"
              style={{ border: "2px solid black" }}
            />

            <br />

            {faceDetected ? (
              <p style={{ color: "green" }}>Face Detected</p>
            ) : (
              <p style={{ color: "red" }}>No Face / Multiple Faces</p>
            )}

            <button onClick={capturePhoto} disabled={!faceDetected}>
              Capture Photo
            </button>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {/* ID CARD */}

        {photo && (
          <div style={{ marginTop: "30px" }}>
            <div
              ref={idCardRef}
              style={{
                border: "2px solid black",
                width: "300px",
                padding: "15px",
                margin: "auto",
                borderRadius: "10px",
              }}
            >
              <h3>College Event ID Card</h3>

              <p>Name : {formData.name}</p>
              <p>User ID : {userId}</p>
              <p>Event : {eventName}</p>

              <QRCode value={qrData} size={150} />

              <br />
              <br />

              <img src={photo} alt="user" width="120" />
            </div>

            <br />

            <button onClick={downloadCard}>Download ID Card</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
import React, { useState, useRef } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import html2canvas from "html2canvas";

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
  const [photo, setPhoto] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const idCardRef = useRef(null);
  const streamRef = useRef(null);

  /* =============================
   INPUT CHANGE
============================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* =============================
   PAYMENT
============================= */

  const handlePayment = async (e) => {
    e.preventDefault();

    try {
      const orderRes = await axios.post("http://localhost:5000/create-order", {
        amount: 200,
      });

      const order = orderRes.data.order;

      const options = {
        key: "YOUR_RAZORPAY_KEY_ID",

        amount: order.amount,

        currency: "INR",

        name: "College Event",

        description: eventName,

        order_id: order.id,

        handler: async function () {
          alert("Payment Successful");

          registerUser();
        },

        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.open();
    } catch (err) {
      alert("Payment Failed");
    }
  };

  /* =============================
   REGISTER USER
============================= */

  const registerUser = async () => {
    try {
      const res = await axios.post("http://localhost:5000/register", {
        ...formData,
        photo,
      });

      if (res.data.success) {
        setUserId(res.data.userId);
        setQrData(res.data.qrData);

        alert("Registration Successful");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Registration Failed");
    }
  };

  /* =============================
   OPEN CAMERA
============================= */

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      videoRef.current.srcObject = stream;

      videoRef.current.play();
    } catch (err) {
      alert("Camera access denied");
    }
  };

  /* =============================
   CAPTURE PHOTO
============================= */

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/png");

    setPhoto(image);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  /* =============================
   DOWNLOAD ID CARD
============================= */

  const downloadCard = () => {
    html2canvas(idCardRef.current).then((canvas) => {
      const link = document.createElement("a");

      link.download = "Event_ID_Card.png";

      link.href = canvas.toDataURL();

      link.click();
    });
  };

  /* =============================
   UI
============================= */

  return (
    <div>
      <Navbar />

      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Event Registration</h2>

        {!qrData && (
          <form onSubmit={handlePayment}>
            <input
              name="name"
              placeholder="Name"
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
              placeholder="Phone"
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

            <button type="submit">Pay & Register</button>
          </form>
        )}

        {/* QR */}

        {qrData && (
          <div>
            <h3>Your QR Code</h3>

            <QRCode value={qrData.toString()} size={200} />

            <br />
            <br />

            <button onClick={openCamera}>Open Camera</button>

            <br />
            <br />

            <video
              ref={videoRef}
              width="320"
              height="240"
              style={{ border: "2px solid black" }}
            />

            <br />
            <br />

            <button onClick={capturePhoto}>Capture Photo</button>

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
                margin: "auto",
                padding: "15px",
                borderRadius: "10px",
              }}
            >
              <h3>College Event ID Card</h3>

              <p>Name : {formData.name}</p>
              <p>User ID : {userId}</p>
              <p>Event : {eventName}</p>

              <QRCode value={qrData.toString()} size={120} />

              <br />
              <br />

              <img src={photo} alt="User" width="120" />
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

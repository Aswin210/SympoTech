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
event_id: eventId
});

const [userId, setUserId] = useState("");
const [qrData, setQrData] = useState("");
const [photo, setPhoto] = useState("");

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
================================ */

useEffect(() => {

const loadModels = async () => {

try {

await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
setModelsLoaded(true);

} catch (err) {

console.log("Face model error:", err);

}

};

loadModels();

}, []);

/* ===============================
   INPUT HANDLER
================================ */

const handleChange = (e) => {

setFormData({
...formData,
[e.target.name]: e.target.value
});

};

/* ===============================
   REGISTER USER
================================ */

const handleSubmit = async (e) => {

e.preventDefault();

if (registering) return;

setRegistering(true);

try {

const res = await axios.post("http://localhost:5000/register", {

name: formData.name,
college_name: formData.college_name,
phone: formData.phone,
email: formData.email,
event_id: formData.event_id,
photo: photo

});

console.log("Server Response:", res.data);

if (res.data.success) {

setUserId(res.data.userId);
setQrData(res.data.qrData);

alert("Registration Successful");

} else {

alert(res.data.message || "Registration failed");

}

} catch (error) {

console.log("Register error:", error);

alert("Registration failed. Backend not responding.");

}

setRegistering(false);

};

/* ===============================
   OPEN CAMERA
================================ */

const openCamera = async () => {

if (!modelsLoaded) {

alert("Face model loading...");
return;

}

try {

const stream = await navigator.mediaDevices.getUserMedia({
video: true,
audio: false
});

streamRef.current = stream;

videoRef.current.srcObject = stream;

videoRef.current.onloadedmetadata = () => {

videoRef.current.play();
startFaceDetection();

};

} catch (err) {

alert("Camera permission denied");

}

};

/* ===============================
   FACE DETECTION
================================ */

const startFaceDetection = () => {

detectInterval.current = setInterval(async () => {

if (!videoRef.current) return;

const detections = await faceapi.detectAllFaces(
videoRef.current,
new faceapi.TinyFaceDetectorOptions()
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
================================ */

const capturePhoto = () => {

const video = videoRef.current;
const canvas = canvasRef.current;

if (!video) return;

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

const ctx = canvas.getContext("2d");

ctx.drawImage(video, 0, 0);

const image = canvas.toDataURL("image/png");

setPhoto(image);

/* STOP CAMERA */

if (streamRef.current) {

streamRef.current.getTracks().forEach(track => track.stop());

}

/* STOP DETECTION */

if (detectInterval.current) {

clearInterval(detectInterval.current);

}

};

/* ===============================
   DOWNLOAD ID CARD
================================ */

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

<div style={{ textAlign:"center", padding:"20px" }}>

<h2>Event Registration</h2>

{!qrData && (

<form onSubmit={handleSubmit}>

<input
name="name"
placeholder="Name"
onChange={handleChange}
required
/>

<br/><br/>

<input
name="college_name"
placeholder="College Name"
onChange={handleChange}
required
/>

<br/><br/>

<input
name="phone"
placeholder="Phone"
onChange={handleChange}
required
/>

<br/><br/>

<input
name="email"
placeholder="Email"
onChange={handleChange}
required
/>

<br/><br/>

<h3>Selected Event : {eventName}</h3>

<button type="submit" disabled={registering}>
{registering ? "Registering..." : "Register"}
</button>

</form>

)}

{/* QR CODE */}

{qrData && (

<div>

<h3>Your QR Code</h3>

<QRCode value={qrData.toString()} size={220} />

<br/><br/>

<button onClick={openCamera}>Open Camera</button>

<br/><br/>

<video
ref={videoRef}
width="320"
height="240"
style={{border:"2px solid black"}}
/>

<br/>

{faceDetected ? (
<p style={{color:"green"}}>Face Detected</p>
) : (
<p style={{color:"red"}}>No Face / Multiple Faces</p>
)}

<button onClick={capturePhoto} disabled={!faceDetected}>
Capture Photo
</button>

<canvas ref={canvasRef} style={{display:"none"}}/>

</div>

)}

{/* ID CARD */}

{photo && (

<div style={{marginTop:"30px"}}>

<div
ref={idCardRef}
style={{
border:"2px solid black",
width:"300px",
margin:"auto",
padding:"15px",
borderRadius:"10px"
}}
>

<h3>College Event ID Card</h3>

<p>Name : {formData.name}</p>
<p>User ID : {userId}</p>
<p>Event : {eventName}</p>

<QRCode value={qrData.toString()} size={150} />

<br/><br/>

<img src={photo} alt="user" width="120"/>

</div>

<br/>

<button onClick={downloadCard}>
Download ID Card
</button>

</div>

)}

</div>

</div>

);

}

export default Register;
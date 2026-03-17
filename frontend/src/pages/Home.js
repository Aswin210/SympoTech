import React from "react";
import Navbar from "../components/Navbar";
import bgVideo from "../assets/background.mp4"; // your video file

function Home() {
  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      <Navbar />

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
        }}
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Content */}
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          color: "white",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1>Welcome to SympoTech</h1>

        <p style={{ maxWidth: "6000px", margin: "2px auto", fontSize: "30px"}}>
          Register for exciting college events, generate your unique QR code ID,
          complete secure payment, and use your QR code for quick event check-in
          and admin verification.
        </p>

        <h3>Features</h3>

        <ul style={{ listStyle: "none" }}>
          <li>🎫 Event Registration</li>
          <li>📱 QR Code for Entry</li>
          <li>💳 Online Payment</li>
          <li>📊 Admin QR Scanner</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;

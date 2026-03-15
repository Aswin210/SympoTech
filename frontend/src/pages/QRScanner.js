import React, { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner() {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  const startScanner = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 25, qrbox: 250 },
        async (decodedText) => {
          // Pause scanning to prevent multiple triggers
          await stopScanner();
          handleAttendance(decodedText);
        }
      );
      setIsScanning(true);
      setStatus("");
      setStudent(null);
    } catch (err) {
      console.error("Failed to start scanner", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleAttendance = async (decodedText) => {
    try {
      // 1. Verify User
      const verify = await fetch(`http://localhost:5000/verify-user/${decodedText}`);
      const verifyData = await verify.json();

      if (!verifyData.success) {
        setStatus("notfound");
        setMessage("User not found in database.");
        return;
      }

      setStudent(verifyData.user);

      // 2. Mark Attendance
      const attendance = await fetch(`http://localhost:5000/mark-attendance/${decodedText}`, {
        method: "PUT",
      });
      const attendanceData = await attendance.json();

      if (attendanceData.success) {
        setStatus("success");
        setMessage(`Attendance marked at ${new Date().toLocaleTimeString()}`);
      } else {
        setStatus("already");
        setMessage("Attendance already recorded for this user.");
      }
    } catch (err) {
      setStatus("servererror");
      setMessage("Server connection error.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>QR Attendance Scanner</h2>

      <div style={{ margin: "20px" }}>
        {!isScanning ? (
          <button onClick={startScanner}>Start Scanner</button>
        ) : (
          <button onClick={stopScanner}>Stop Scanner</button>
        )}
      </div>

      <div id="reader" style={{ width: "350px", margin: "auto" }}></div>

      {student && (
        <div style={{ marginTop: "20px" }}>
          <h3>{student.name}</h3>
          <p>{student.college_name}</p>
          <h3 style={{ color: status === "success" ? "green" : "red" }}>{message}</h3>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
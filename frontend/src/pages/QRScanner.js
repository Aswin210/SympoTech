import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner() {

  const scannerRef = useRef(null);
  const scannerRunning = useRef(false);

  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {

    const startScanner = async () => {

      try {

        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: 250
          },

          async (decodedText) => {

            console.log("Scanned:", decodedText);

            try {

              const verify = await fetch(
                `http://localhost:5000/verify-user/${decodedText}`
              );

              const verifyData = await verify.json();

              if (!verifyData.success) {

                setStatus("notfound");
                return;

              }

              setStudent(verifyData.user);

              const attendance = await fetch(
                `http://localhost:5000/mark-attendance/${decodedText}`,
                { method: "PUT" }
              );

              const attendanceData = await attendance.json();

              if (attendanceData.success) {

                setStatus("success");

              } else {

                setStatus("already");

              }

            } catch (err) {

              console.log(err);
              setStatus("servererror");

            }

          }

        );

        scannerRunning.current = true;

      } catch (error) {

        console.log("Scanner start error:", error);

      }

    };

    startScanner();

    return () => {

      if (scannerRef.current && scannerRunning.current) {

        scannerRef.current.stop()
          .then(() => {
            scannerRunning.current = false;
          })
          .catch(() => {});

      }

    };

  }, []);

  return (

    <div style={{ textAlign: "center", marginTop: "40px" }}>

      <h2>QR Attendance Scanner</h2>

      <div
        id="reader"
        style={{
          width: "350px",
          margin: "auto",
          border: "3px solid black"
        }}
      ></div>

      {student && (

        <div style={{ marginTop: "20px" }}>

          <h3>{student.name}</h3>
          <p>{student.college_name}</p>

          {status === "success" && (
            <h2 style={{ color: "green" }}>✔ Attendance Marked</h2>
          )}

          {status === "already" && (
            <h2 style={{ color: "red" }}>Already Scanned</h2>
          )}

          {status === "notfound" && (
            <h2 style={{ color: "orange" }}>User Not Found</h2>
          )}

        </div>

      )}

    </div>

  );
}

export default QRScanner;
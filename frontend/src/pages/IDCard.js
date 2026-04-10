import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";

function IDCard() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [user, setUser] = useState(null);
  const cardRef = useRef();

  useEffect(() => {
    axios
      .get(`http://localhost:5000/verify-user/${userId}`)
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
        }
      });
  }, [userId]);

  const downloadCard = () => {
    html2canvas(cardRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "id-card.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  if (!user) return <h2>Loading...</h2>;

  return (
    <div style={styles.container}>
      <div ref={cardRef} style={styles.card}>
        <h2 style={styles.title}>🎓 EVENT PASS</h2>

        <p><b>Name:</b> {user.name}</p>
        <p><b>College:</b> {user.college_name}</p>
        <p><b>Event ID:</b> {user.event_id}</p>

        <div style={{ marginTop: 10 }}>
          <QRCode value={`USER-${user.id}`} size={100} />
        </div>

        <p style={{ marginTop: 10, color: "green" }}>
          ✅ Approved Entry
        </p>
      </div>

      <button onClick={downloadCard} style={styles.btn}>
        📥 Download ID Card
      </button>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
  },
  card: {
    width: "300px",
    margin: "auto",
    padding: "20px",
    borderRadius: "15px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  title: {
    marginBottom: "10px",
  },
  btn: {
    marginTop: "20px",
    padding: "10px 20px",
    border: "none",
    background: "#28a745",
    color: "white",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default IDCard;
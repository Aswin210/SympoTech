import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import API_BASE_URL from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [darkMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
      if (res.data.success) {
        localStorage.setItem("admin", "true");
        localStorage.setItem("adminToken", res.data.token);
        navigate("/scanner");
      } else {
        setError(res.data.message || "❌ Invalid credentials");
      }
    } catch (err) {
      setError(err.response?.data?.message || "❌ Server error. Please try again.");
    }
  };

  return (
    <div style={darkMode ? styles.darkPage : styles.page}>
      <Navbar />

      <div style={styles.container}>
        <form
          onSubmit={handleLogin}
          style={darkMode ? styles.darkCard : styles.card}
        >
          <h2 style={styles.heading}>🔐 Admin Login</h2>

          {error && <div style={styles.error}>{error}</div>}

          <input
            type="text"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eye}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },

  darkPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #141e30, #243b55)",
  },

  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "90vh",
    padding: "16px",
    boxSizing: "border-box",
  },

  card: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: "clamp(24px, 6vw, 40px)",
    borderRadius: "15px",
    width: "min(320px, 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
  },

  darkCard: {
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: "clamp(24px, 6vw, 40px)",
    borderRadius: "15px",
    width: "min(320px, 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    color: "#fff",
    boxSizing: "border-box",
  },

  heading: {
    textAlign: "center",
    color: "#fff",
    fontSize: "clamp(18px, 5vw, 22px)",
    margin: 0,
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    fontSize: "16px", // 16px prevents iOS auto-zoom on focus
    width: "100%",
    boxSizing: "border-box",
    WebkitAppearance: "none",
  },

  button: {
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #ff7eb3, #ff758c)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },

  eye: {
    position: "absolute",
    right: "10px",
    top: "12px",
    cursor: "pointer",
    fontSize: "16px",
    userSelect: "none",
    WebkitUserSelect: "none",
  },

  error: {
    background: "#ff4d4d",
    color: "#fff",
    padding: "8px",
    borderRadius: "6px",
    textAlign: "center",
    fontSize: "14px",
  },

  toggleBtn: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};

export default AdminLogin;
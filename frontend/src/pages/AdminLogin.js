import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api";

/**
 * Admin Login Page
 * Refactored for Bento Design System with Mobile Optimization.
 */
function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
      if (res.data.success) {
        localStorage.setItem("admin", "true");
        localStorage.setItem("adminToken", res.data.token);
        navigate("/admin/dashboard");
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 100px)", background: "var(--bg-app)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="glass-card" style={{ padding: "clamp(24px, 8vw, 48px)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "50px", marginBottom: "16px" }}>🔐</div>
            <h1 className="gradient-text" style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>Admin Access</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px", fontWeight: "600" }}>SympoTech Control Center</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
              <div className="camera-overlay error" style={{ width: "100%", justifyContent: "center", borderRadius: "12px", padding: "12px", fontSize: "12px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px", letterSpacing: "1px" }}>IDENTITY</label>
              <input
                className="premium-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginLeft: "4px", letterSpacing: "1px" }}>SECURITY KEY</label>
              <div style={{ position: "relative" }}>
                <input
                  className="premium-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "50px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "var(--glass-bg)", border: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: "16px", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={loading ? "secondary-button" : "primary-button"} 
              disabled={loading}
              style={{ width: "100%", marginTop: "10px", padding: "18px", fontSize: "16px" }}
            >
              {loading ? "Verifying..." : "Authorize Portal"}
            </button>
          </form>
          
          <div style={{ textAlign: "center", marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
              Encrypted Access Point
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
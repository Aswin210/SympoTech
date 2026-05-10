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
    <div className="login-wrapper">
      <div className="fade-in login-container">
        <div className="glass-card login-card">
          <div className="login-header">
            <div className="login-icon">🔐</div>
            <h1 className="gradient-text login-title">Admin Access</h1>
            <p className="login-subtitle">SympoTech Control Center</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="camera-overlay error login-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label>IDENTITY</label>
              <input
                className="premium-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>SECURITY KEY</label>
              <div className="password-input-wrapper">
                <input
                  className="premium-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={loading ? "secondary-button auth-btn" : "primary-button auth-btn"} 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Authorize Portal"}
            </button>
          </form>
          
          <div className="login-footer">
            <p className="encrypted-text">Encrypted Access Point</p>
          </div>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          height: calc(100vh - 130px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app);
          padding: 10px;
          overflow: hidden;
        }
        .login-container {
          width: 100%;
          max-width: 360px;
          margin-top: -30px;
        }
        .login-card {
          padding: 30px !important;
          border-radius: var(--radius-lg) !important;
          box-shadow: var(--shadow-lg) !important;
        }
        .login-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .login-icon {
          font-size: 40px;
          margin-bottom: 8px;
        }
        .login-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }
        .login-subtitle {
          color: var(--text-secondary);
          font-size: 12px;
          margin-top: 2px;
          font-weight: 600;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-muted);
          margin-left: 2px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .login-error {
          width: 100%;
          justify-content: center;
          border-radius: 10px;
          padding: 8px;
          font-size: 11px;
        }
        .password-input-wrapper {
          position: relative;
        }
        .password-input-wrapper .premium-input {
          padding-right: 44px;
          height: 44px;
          font-size: 14px;
        }
        .form-group .premium-input {
          height: 44px;
          font-size: 14px;
          padding: 0 16px;
        }
        .password-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--glass-bg);
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 14px;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-btn {
          width: 100%;
          margin-top: 4px;
          padding: 14px !important;
          font-size: 14px !important;
          border-radius: 10px !important;
        }
        .login-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .encrypted-text {
          font-size: 8px;
          color: var(--text-muted);
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .login-wrapper { height: auto; min-height: calc(100vh - 130px); overflow: auto; padding: 40px 16px; align-items: flex-start; }
          .login-container { margin-top: 0; max-width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default AdminLogin;
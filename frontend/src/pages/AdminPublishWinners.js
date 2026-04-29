import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

/**
 * Admin Publish Winners Page
 * Allows administrators to broadcast event winners with a premium UI.
 */
function AdminPublishWinners() {
  const navigate = useNavigate();
  
  // State management
  const [eventId, setEventId] = useState("");
  const [firstPlace, setFirstPlace] = useState("");
  const [secondPlace, setSecondPlace] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin-login");
  }, [navigate]);

  /**
   * Handle form submission for publishing winners
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/event-winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: parseInt(eventId),
          first_place: firstPlace,
          second_place: secondPlace,
          third_place: thirdPlace
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showStatus("Winners published successfully!", "success");
        resetForm();
      } else {
        showStatus(result.message || "Failed to publish winners.", "error");
      }
    } catch (err) {
      console.error("Submission Error:", err);
      showStatus("Connection to server lost.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears all winners from the database
   */
  const handleDeleteAll = async () => {
    const confirmed = window.confirm("⚠️ DANGER: Are you sure you want to delete ALL event winners? This action is irreversible.");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/all-event-winners`, {
        method: "DELETE",
      });

      const result = await response.json();
      
      if (result.success) {
        showStatus("All winners list has been cleared.", "success");
      } else {
        showStatus(result.message || "Failed to clear winners.", "error");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      showStatus("Server unreachable.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Display status message for a duration
  const showStatus = (text, type) => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => {
      setMessage("");
      setMsgType("");
    }, 5000);
  };

  // Helper: Reset form fields
  const resetForm = () => {
    setEventId("");
    setFirstPlace("");
    setSecondPlace("");
    setThirdPlace("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "100px" }}>
      <div className="container fade-in" style={{ paddingTop: "40px" }}>
        
        <div className="grid-bento">
          <div className="glass-card" style={{ gridColumn: "span 12", maxWidth: "650px", margin: "0 auto", width: "100%", padding: "clamp(24px, 6vw, 48px)", border: "1px solid rgba(255,255,255,0.05)" }}>
            
            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", gap: "20px" }}>
              <div>
                <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "900", marginBottom: "8px" }}>Publish Winners</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>Manage and broadcast results for college events.</p>
              </div>
              <button onClick={() => navigate("/scanner")} className="secondary-button" style={{ padding: "10px 18px", fontSize: "12px", fontWeight: "800" }}>
                ← BACK
              </button>
            </div>

            {/* Notification Banner */}
            {message && (
              <div className={`camera-overlay ${msgType}`} style={{ width: "100%", justifyContent: "center", borderRadius: "16px", marginBottom: "32px", padding: "16px", fontSize: "14px", fontWeight: "700" }}>
                {msgType === "success" ? "✨" : "🚫"} {message}
              </div>
            )}

            {/* Winners Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "12px", fontWeight: "900", color: "var(--text-muted)", marginLeft: "4px", textTransform: "uppercase", letterSpacing: "1.5px" }}>Event Identification</label>
                <input
                  className="premium-input"
                  type="number"
                  placeholder="Enter Event ID (e.g. 101)"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "900", color: "#FFD700", marginLeft: "4px", textTransform: "uppercase", letterSpacing: "1.5px" }}>🥇 Gold Medalist (1st)</label>
                  <input
                    className="premium-input"
                    type="text"
                    placeholder="Name | Department | College"
                    value={firstPlace}
                    onChange={(e) => setFirstPlace(e.target.value)}
                    style={{ borderColor: firstPlace ? "rgba(255, 215, 0, 0.3)" : "" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "900", color: "#C0C0C0", marginLeft: "4px", textTransform: "uppercase", letterSpacing: "1.5px" }}>🥈 Silver Medalist (2nd)</label>
                  <input
                    className="premium-input"
                    type="text"
                    placeholder="Name | Department | College"
                    value={secondPlace}
                    onChange={(e) => setSecondPlace(e.target.value)}
                    style={{ borderColor: secondPlace ? "rgba(192, 192, 192, 0.3)" : "" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "900", color: "#CD7F32", marginLeft: "4px", textTransform: "uppercase", letterSpacing: "1.5px" }}>🥉 Bronze Medalist (3rd)</label>
                  <input
                    className="premium-input"
                    type="text"
                    placeholder="Name | Department | College"
                    value={thirdPlace}
                    onChange={(e) => setThirdPlace(e.target.value)}
                    style={{ borderColor: thirdPlace ? "rgba(205, 127, 50, 0.3)" : "" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <button 
                  type="submit" 
                  className={loading ? "secondary-button" : "primary-button"} 
                  disabled={loading}
                  style={{ width: "100%", padding: "20px", fontSize: "16px", background: loading ? "var(--glass-bg)" : "var(--primary)", boxShadow: "0 10px 20px -5px var(--primary-glow)" }}
                >
                  {loading ? "Processing Broadcast..." : "Broadcast Results 🏆"}
                </button>

                <button 
                  type="button" 
                  onClick={handleDeleteAll}
                  className="secondary-button" 
                  disabled={loading}
                  style={{ width: "100%", padding: "16px", fontSize: "14px", color: "var(--danger)", border: "1px solid rgba(244, 63, 94, 0.2)", background: "rgba(244, 63, 94, 0.02)" }}
                >
                  {loading ? "Wiping Data..." : "🗑️ Reset All Event Records"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPublishWinners;

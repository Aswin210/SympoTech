import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api";

function EventWinners({ eventId }) {
  const [winners, setWinners] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/event-winners/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setWinners(data.data);
        }
      })
      .catch((err) => console.error("Error fetching winners:", err))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return null;
  if (!winners || (!winners.first_place && !winners.second_place && !winners.third_place)) {
    return null;
  }

  return (
    <div style={{
      marginTop: "16px",
      padding: "12px",
      borderRadius: "12px",
      background: "var(--glass-bg)",
      border: "1px solid rgba(255, 215, 0, 0.3)",
    }}>
      <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#FFD700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span>🏆</span> Event Winners
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
        {winners.first_place && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🥇</span> {winners.first_place}
          </div>
        )}
        {winners.second_place && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🥈</span> {winners.second_place}
          </div>
        )}
        {winners.third_place && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🥉</span> {winners.third_place}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventWinners;

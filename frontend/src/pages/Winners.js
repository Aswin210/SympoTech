import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api";

function Winners() {
  const [winnersList, setWinnersList] = useState([]);
  const [eventsMap, setEventsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch both the events and the winners
    Promise.all([
      fetch(`${API_BASE_URL}/events`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/all-event-winners`).then(res => res.json())
    ])
    .then(([eventsData, winnersData]) => {
      // Map events for easy lookup
      const eMap = {};
      
      // We also add hardcoded tech and non-tech events to ensure we catch everything
      const techEvents = [
        { id: 1,  name: "Project Presentation / Adzap" },
        { id: 2,  name: "Reverse Engineering / Just a Minute" },
        { id: 3,  name: "Hackathon / Best Manager" },
        { id: 4,  name: "Paper Presentation / Connections" },
        { id: 5,  name: "Web Designing / Treasure Hunt" },
        { id: 6,  name: "App Development / Debate" },
        { id: 7,  name: "AI Quiz / Group Discussion" },
        { id: 8,  name: "Cyber Security / Mime" },
        { id: 9,  name: "Coding Contest / Photography" },
        { id: 10, name: "UI/UX Design / Short Film" },
        { id: 11, name: "Cloud Computing / Quiz" },
        { id: 12, name: "Robotics Demo / Stress Interview" },
        { id: 13, name: "Data Science / Dance Battle" },
        { id: 14, name: "Singing Contest" },
        { id: 15, name: "Stand-up Comedy" },
        { id: 16, name: "Fashion Show" },
        { id: 17, name: "Code Debugging / Cooking" },
        { id: 18, name: "Face Painting" },
        { id: 19, name: "Rangoli" },
        { id: 20, name: "Mehendi" },
        { id: 21, name: "Dumb Charades" },
        { id: 22, name: "Open Mic" },
      ];

      techEvents.forEach(e => {
        eMap[e.id] = e.name;
      });

      // Override with DB events if available
      if (eventsData.success && Array.isArray(eventsData.data)) {
        eventsData.data.forEach(e => {
          eMap[e.id] = e.name;
        });
      }

      setEventsMap(eMap);

      if (winnersData.success && Array.isArray(winnersData.data)) {
        setWinnersList(winnersData.data);
      }
    })
    .catch(err => console.error("Error fetching winners:", err))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container" style={{ paddingTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 className="gradient-text fade-in" style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>Event Winners</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "18px", fontWeight: "600" }}>Celebrating excellence and creativity</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h3 style={{ fontSize: "24px", color: "var(--text-secondary)" }}>Loading Winners...</h3>
          </div>
        ) : winnersList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.2 }}>🏆</div>
            <h3 style={{ fontSize: "24px", color: "var(--text-secondary)" }}>No winners have been announced yet.</h3>
          </div>
        ) : (
          <div className="grid-bento fade-in">
            {winnersList.map((winner) => (
              <div key={winner.id} className="glass-card" style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <h3 style={{ fontSize: "22px", fontWeight: "800" }}>{eventsMap[winner.event_id] || `Event #${winner.event_id}`}</h3>
                  <span style={{ fontSize: "11px", background: "rgba(255, 215, 0, 0.2)", color: "#FFD700", padding: "4px 10px", borderRadius: "8px", fontWeight: "800", border: "1px solid rgba(255, 215, 0, 0.4)" }}>#{winner.event_id}</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--bg-surface)", padding: "16px", borderRadius: "12px" }}>
                  {winner.first_place && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                      <span style={{ fontSize: "28px" }}>🥇</span> 
                      <div>
                        <div style={{ fontSize: "11px", color: "#FFD700", fontWeight: "800", textTransform: "uppercase" }}>1st Place</div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>{winner.first_place}</div>
                      </div>
                    </div>
                  )}
                  {winner.second_place && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                      <span style={{ fontSize: "28px" }}>🥈</span> 
                      <div>
                        <div style={{ fontSize: "11px", color: "#C0C0C0", fontWeight: "800", textTransform: "uppercase" }}>2nd Place</div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>{winner.second_place}</div>
                      </div>
                    </div>
                  )}
                  {winner.third_place && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "28px" }}>🥉</span> 
                      <div>
                        <div style={{ fontSize: "11px", color: "#CD7F32", fontWeight: "800", textTransform: "uppercase" }}>3rd Place</div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>{winner.third_place}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Winners;

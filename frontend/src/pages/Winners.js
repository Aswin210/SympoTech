import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api";

/**
 * Winners Page
 * Displays the winners for each event with a premium podium design.
 */
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
      const eMap = {};
      
      // Hardcoded fallback list for common events
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

      techEvents.forEach(e => { eMap[e.id] = e.name; });

      if (eventsData.success && Array.isArray(eventsData.data)) {
        eventsData.data.forEach(e => { eMap[e.id] = e.name; });
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
    <div className="winners-page">
      <div className="container winners-container">
        <div className="winners-hero fade-in">
          <h1 className="gradient-text hero-title">Event Winners</h1>
          <p className="hero-subtitle">Celebrating excellence and creativity</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="pulse-loader" />
            <p>Loading Results...</p>
          </div>
        ) : winnersList.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">🏆</div>
            <h3>Results Pending</h3>
            <p>Winners will be announced soon.</p>
          </div>
        ) : (
          <div className="grid-bento fade-in">
            {winnersList.map((winner) => (
              <div key={winner.id} className="glass-card winner-card col-4">
                <div className="winner-card-header">
                  <h3 className="event-name">{eventsMap[winner.event_id] || `Event #${winner.event_id}`}</h3>
                  <span className="event-id-badge">#{winner.event_id}</span>
                </div>
                
                <div className="podium-container">
                  {winner.first_place && (
                    <PodiumItem rank="1st" icon="🥇" name={winner.first_place} color="#FFD700" />
                  )}
                  {winner.second_place && (
                    <PodiumItem rank="2nd" icon="🥈" name={winner.second_place} color="#C0C0C0" />
                  )}
                  {winner.third_place && (
                    <PodiumItem rank="3rd" icon="🥉" name={winner.third_place} color="#CD7F32" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .winners-page { min-height: 100vh; background: var(--bg-app); padding-bottom: 80px; }
        .winners-container { padding-top: 40px; }
        .winners-hero { text-align: center; margin-bottom: 60px; }
        .hero-title { font-size: clamp(2.5rem, 8vw, 4rem); }
        .hero-subtitle { color: var(--text-secondary); margin-top: 12px; font-size: 18px; font-weight: 600; }
        
        .loading-state { textAlign: center; padding: 100px 0; }
        .pulse-loader { width: 40px; height: 40px; background: var(--primary); borderRadius: 50%; margin: 0 auto 16px; animation: pulse 1.5s infinite; }
        
        .empty-state { textAlign: center; padding: 100px 20px; opacity: 0.6; }
        .empty-icon { fontSize: 80px; marginBottom: 20px; opacity: 0.2; }
        
        .winner-card { display: flex; flex-direction: column; gap: 20px; min-height: 320px; }
        .winner-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .event-name { font-size: 20px; font-weight: 800; line-height: 1.2; }
        .event-id-badge { font-size: 11px; background: rgba(255, 215, 0, 0.1); color: #FFD700; padding: 4px 10px; border-radius: 8px; font-weight: 800; border: 1px solid rgba(255, 215, 0, 0.2); }
        
        .podium-container { display: flex; flex-direction: column; gap: 12px; background: var(--bg-surface); padding: 16px; border-radius: 16px; border: 1px solid var(--border); margin-top: auto; }
        .podium-item { display: flex; alignItems: center; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
        .podium-item:last-child { padding-bottom: 0; border-bottom: none; }
        .podium-icon { font-size: 28px; flex-shrink: 0; }
        .podium-rank { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .podium-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }

        @media (max-width: 640px) {
          .winner-card { padding: 24px; min-height: auto; }
          .event-name { font-size: 18px; }
        }

        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function PodiumItem({ rank, icon, name, color }) {
  return (
    <div className="podium-item">
      <span className="podium-icon">{icon}</span> 
      <div>
        <div className="podium-rank" style={{ color }}>{rank} Place</div>
        <div className="podium-name">{name}</div>
      </div>
    </div>
  );
}

export default Winners;


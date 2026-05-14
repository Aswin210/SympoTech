import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api";

/**
 * EventRadar Page
 * A dynamic "Live Status" board for all events.
 */
function EventRadar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = () => {
    fetch(`${API_BASE_URL}/events`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.data);
        }
      })
      .catch((err) => console.error("Error fetching events:", err))
      .finally(() => setLoading(false));
  };

  const filteredEvents = events.filter((e) => 
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ongoingEvents = filteredEvents.filter((e) => e.status?.toLowerCase() === "ongoing");
  const upcomingEvents = filteredEvents.filter((e) => e.status?.toLowerCase() === "upcoming" || !e.status);
  const completedEvents = filteredEvents.filter((e) => e.status?.toLowerCase() === "completed");

  return (
    <div className="radar-page">
      <div className="container">
        <div className="radar-header fade-in">
          <h1 className="gradient-text">Live Event Radar</h1>
          <p className="subtitle">Real-time status of all SympoTech events</p>
          <div className="live-indicator">
            <span className="pulse-dot"></span>
            LIVE UPDATES
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search event, room, or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="radar-search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loader-container">
            <div className="radar-scanner"></div>
            <p>Scanning for events...</p>
          </div>
        ) : (
          <div className="radar-grid">
            {/* ONGOING SECTION */}
            <section className="radar-section ongoing fade-in">
              <h2 className="section-title"><span className="icon">🔥</span> Happening Now</h2>
              {ongoingEvents.length === 0 ? (
                <div className="empty-card">
                  {searchQuery ? `No ongoing events match "${searchQuery}"` : "No events are currently live."}
                </div>
              ) : (
                <div className="event-list">
                  {ongoingEvents.map((event) => (
                    <EventCard key={event.id} event={event} type="ongoing" />
                  ))}
                </div>
              )}
            </section>

            {/* UPCOMING SECTION */}
            <section className="radar-section upcoming fade-in">
              <h2 className="section-title"><span className="icon">🕒</span> Starting Soon</h2>
              {upcomingEvents.length === 0 ? (
                <div className="empty-card">
                  {searchQuery ? `No upcoming events match "${searchQuery}"` : "Stay tuned for upcoming events."}
                </div>
              ) : (
                <div className="event-list">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} type="upcoming" />
                  ))}
                </div>
              )}
            </section>

            {/* COMPLETED SECTION */}
            <section className="radar-section completed fade-in">
              <h2 className="section-title"><span className="icon">✅</span> Recently Completed</h2>
              {completedEvents.length === 0 ? (
                <div className="empty-card">
                  {searchQuery ? `No completed events match "${searchQuery}"` : "Results will appear here."}
                </div>
              ) : (
                <div className="event-list">
                  {completedEvents.map((event) => (
                    <EventCard key={event.id} event={event} type="completed" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <style>{`
        .radar-page { min-height: 100vh; background: var(--bg-app); padding: 40px 0 100px; color: var(--text-primary); }
        .radar-header { text-align: center; margin-bottom: 50px; }
        .radar-header h1 { font-size: clamp(2.5rem, 8vw, 4rem); font-weight: 900; margin-bottom: 10px; }
        .subtitle { color: var(--text-secondary); font-size: 18px; font-weight: 600; }
        
        .live-indicator { 
          display: inline-flex; align-items: center; gap: 10px; 
          background: rgba(34, 197, 94, 0.1); color: #22c55e;
          padding: 8px 16px; border-radius: 100px; font-size: 12px;
          font-weight: 900; letter-spacing: 1px; margin-top: 20px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        
        .pulse-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite; }

        .search-container { margin-top: 30px; display: flex; justify-content: center; }
        .search-wrapper { 
          position: relative; width: 100%; max-width: 500px; 
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 100px; padding: 2px 6px; display: flex; align-items: center;
          transition: all 0.3s ease; box-shadow: var(--shadow-sm);
        }
        .search-wrapper:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); transform: translateY(-2px); }
        .search-icon { margin-left: 15px; font-size: 16px; opacity: 0.6; }
        .radar-search-input { 
          width: 100%; background: none; border: none; padding: 12px 15px;
          color: var(--text-primary); font-size: 15px; font-weight: 600; outline: none;
        }
        .clear-search { 
          background: rgba(255,255,255,0.1); border: none; color: var(--text-secondary);
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          margin-right: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 10px; transition: all 0.2s;
        }
        .clear-search:hover { background: var(--danger); color: white; }
        
        .radar-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
        @media (min-width: 1024px) { .radar-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .radar-section { display: flex; flex-direction: column; gap: 20px; }
        .section-title { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .section-title .icon { font-size: 24px; }
        
        .event-list { display: flex; flex-direction: column; gap: 16px; }
        
        .radar-card { 
          background: var(--glass-bg); backdrop-filter: blur(12px);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 24px; transition: all 0.3s ease; position: relative;
          overflow: hidden;
        }
        .radar-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        
        .card-tag { 
          position: absolute; top: 0; right: 0; padding: 6px 12px; 
          font-size: 10px; font-weight: 900; text-transform: uppercase;
          border-bottom-left-radius: 12px;
        }
        
        .ongoing .radar-card { border-left: 4px solid #ef4444; }
        .ongoing .card-tag { background: #ef4444; color: white; }
        
        .upcoming .radar-card { border-left: 4px solid var(--primary); }
        .upcoming .card-tag { background: var(--primary); color: white; }
        
        .completed .radar-card { border-left: 4px solid #22c55e; opacity: 0.8; }
        .completed .card-tag { background: #22c55e; color: white; }
        
        .event-name { font-size: 18px; font-weight: 800; margin-bottom: 12px; color: var(--text-primary); }
        .event-info { display: flex; flex-direction: column; gap: 8px; }
        .info-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); font-weight: 600; }
        
        .empty-card { 
          padding: 40px; text-align: center; background: rgba(255,255,255,0.02);
          border: 1px dashed var(--border); border-radius: 20px; color: var(--text-muted);
          font-weight: 600; font-size: 14px;
        }
        
        .loader-container { text-align: center; padding: 100px 0; }
        .radar-scanner { 
          width: 60px; height: 60px; border: 4px solid var(--primary);
          border-top-color: transparent; border-radius: 50%;
          margin: 0 auto 20px; animation: spin 1s linear infinite;
        }
        
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function EventCard({ event, type }) {
  return (
    <div className="radar-card">
      <div className="card-tag">{type}</div>
      <h3 className="event-name">{event.name}</h3>
      <div className="event-info">
        <div className="info-item">
          <span>📍</span> {event.venue || "TBA"}
        </div>
        <div className="info-item">
          <span>⏰</span> {event.start_time || "Scheduled"}
        </div>
        <div className="info-item">
          <span>🏷️</span> {event.category}
        </div>
      </div>
    </div>
  );
}

export default EventRadar;

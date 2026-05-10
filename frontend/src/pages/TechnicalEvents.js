import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventWinners from "../components/EventWinners";
import API_BASE_URL from "../api";

/**
 * Technical Events Listing Page
 */
function TechnicalEvents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedEvents, setSelectedEvents] = useState([]);

  // Load selection from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("selected_events") || "[]");
    setSelectedEvents(saved);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events dynamically from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/events`)
      .then(res => res.json())
      .then(data => {
        // Fallback or data parsing
        const eventData = data.data || (Array.isArray(data) ? data : []);
        const techEvents = eventData
          .filter(e => e.category === "Technical")
          .map(e => ({
            id: e.id,
            name: e.name,
            time: "10:00 AM - 1:00 PM", // Placeholder since DB doesn't have a time column
            venue: e.venue || "TBA",
            teamSize: e.max_team_size || 1
          }));
        setEvents(techEvents);
      })
      .catch(err => console.error("Failed to load events:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase());
    const isMorning = event.time.includes("AM");
    const isAfternoon = event.time.includes("PM");
    if (filter === "Morning") return matchesSearch && isMorning;
    if (filter === "Afternoon") return matchesSearch && isAfternoon;
    return matchesSearch;
  }), [search, filter, events]);

  const toggleEvent = (event) => {
    setSelectedEvents((prev) => {
      let next;
      if (prev.find(e => e.id === event.id)) {
        next = prev.filter(e => e.id !== event.id);
      } else {
        if (prev.length >= 3) {
          alert("Maximum 3 events can be selected.");
          return prev;
        }
        next = [...prev, { id: event.id, name: event.name, category: 'Technical', teamSize: event.teamSize || 1 }];
      }
      localStorage.setItem("selected_events", JSON.stringify(next));
      window.dispatchEvent(new Event("cartUpdated"));
      return next;
    });
  };

  const handleRegister = () => {
    if (selectedEvents.length === 0) {
      alert("Please select at least one event.");
      return;
    }
    navigate("/cart");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "120px" }}>
      <div className="container" style={{ paddingTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 className="gradient-text fade-in" style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>Technical Events</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "18px", fontWeight: "600" }}>Empowering the innovators of tomorrow</p>
        </div>

        <div className="fade-in search-filter-bar">
          <input
            className="premium-input search-input"
            placeholder="Search for an event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="premium-input filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Events</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
          </select>
        </div>

        <div className="grid-bento fade-in">
          {loading ? (
            <div style={{ textAlign: "center", width: "100%", padding: "40px", gridColumn: "span 12", color: "var(--text-muted)", fontWeight: "600" }}>Loading technical events...</div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const isSelected = selectedEvents.some(e => e.id === event.id);
              return (
              <div key={event.id} className={`glass-card event-card col-4 ${isSelected ? 'selected' : ''}`}>
                <div className="event-card-header">
                  <h3 className="event-title">{event.name}</h3>
                  <span className="event-badge">#{event.id}</span>
                </div>
                <div className="event-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span> {event.time}
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🏢</span> {event.venue}
                  </div>
                </div>
                <EventWinners eventId={event.id} />
                <button 
                  className={`primary-button event-btn ${isSelected ? 'selected-btn' : ''}`} 
                  onClick={() => toggleEvent(event)}
                >
                  {isSelected ? "✓ Selected" : "Select Event"}
                </button>
              </div>
            );
          })
          ) : (
            <div style={{ textAlign: "center", width: "100%", padding: "40px", gridColumn: "span 12", color: "var(--text-muted)", fontWeight: "600" }}>
              No technical events found.
            </div>
          )}
        </div>

        {/* Floating Selection Bar */}
        {selectedEvents.length > 0 && (
          <div className="selection-bar fade-in-up">
            <div className="selection-info">
              <div className="selection-count">{selectedEvents.length} Event{selectedEvents.length > 1 ? 's' : ''} Selected</div>
              <div className="selection-names">{selectedEvents.map(e => e.name).join(", ")}</div>
            </div>
            <button className="primary-button register-floating-btn" onClick={handleRegister}>
              View Cart 🛒
            </button>
          </div>
        )}

        <style>{`
          .search-filter-bar { display: flex; gap: 20px; margin-bottom: 48px; flex-wrap: wrap; }
          .search-input { flex: 1; min-width: 260px; }
          .filter-select { width: 200px; cursor: pointer; }
          
          .event-card { display: flex; flex-direction: column; gap: 24px; min-height: 380px; transition: all 0.3s ease; border: 1px solid transparent; }
          .event-card.selected { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }
          .event-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
          .event-title { fontSize: 20px; fontWeight: 800; line-height: 1.2; }
          .event-badge { fontSize: 11px; background: var(--primary); color: #fff; padding: 4px 10px; border-radius: 8px; font-weight: 800; }
          
          .event-details { display: flex; flex-direction: column; gap: 12px; color: var(--text-secondary); font-size: 14px; font-weight: 500; }
          .detail-item { display: flex; align-items: center; gap: 10px; }
          .detail-icon { font-size: 18px; }
          
          .event-btn { width: 100%; margin-top: auto; border-radius: 12px; }
          .selected-btn { background: var(--success) !important; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }

          .selection-bar {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            width: 90%; max-width: 800px; background: rgba(15, 15, 20, 0.85);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            padding: 16px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
            display: flex; justify-content: space-between; align-items: center; gap: 20px;
            z-index: 1000; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          }
          .selection-info { flex: 1; min-width: 0; }
          .selection-count { font-weight: 800; font-size: 16px; color: #fff; }
          .selection-names { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
          .register-floating-btn { padding: 12px 28px; white-space: nowrap; }

          @media (max-width: 1024px) {
            .event-card { min-height: auto; }
          }

          @media (max-width: 640px) {
            .search-filter-bar { gap: 12px; margin-bottom: 32px; }
            .search-input { min-width: 100%; }
            .filter-select { width: 100%; }
            .event-card { padding: 24px; }
            .selection-bar { bottom: 20px; flex-direction: column; text-align: center; padding: 20px; }
            .register-floating-btn { width: 100%; }
          }
        `}</style>

        {filteredEvents.length === 0 && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.2 }}>🔭</div>
            <h3 style={{ fontSize: "24px", color: "var(--text-secondary)" }}>No events matched your search</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicalEvents;
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EventWinners from "../components/EventWinners";

/**
 * Non-Technical Events Listing Page
 */
function NonTechnicalEvents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const events = useMemo(() => [
    { id: 1,  name: "Adzap",                  time: "9:30 AM - 12:30 PM",  venue: "Room 121" },
    { id: 2,  name: "Just a Minute",           time: "1:00 PM - 4:30 PM",   venue: "Room 115" },
    { id: 3,  name: "Best Manager",            time: "1:00 PM - 4:30 PM",   venue: "Room 113" },
    { id: 4,  name: "Connections",             time: "10:00 AM - 12:00 PM", venue: "Room 110" },
    { id: 5,  name: "Treasure Hunt",           time: "10:30 AM - 1:30 PM",  venue: "Campus Area" },
    { id: 6,  name: "Debate",                  time: "2:00 PM - 4:00 PM",   venue: "Seminar Hall" },
    { id: 7,  name: "Group Discussion",        time: "11:00 AM - 1:00 PM",  venue: "Room 108" },
    { id: 8,  name: "Mime",                    time: "9:00 AM - 11:00 AM",  venue: "Auditorium" },
    { id: 9,  name: "Photography",             time: "All Day",             venue: "Entire Campus" },
    { id: 10, name: "Short Film",              time: "2:00 PM - 5:00 PM",   venue: "Room 105" },
    { id: 11, name: "Quiz",                    time: "12:00 PM - 2:00 PM",  venue: "Room 102" },
    { id: 12, name: "Stress Interview",        time: "3:00 PM - 5:00 PM",   venue: "Room 101" },
    { id: 13, name: "Dance Battle",            time: "11:00 AM - 2:00 PM",  venue: "Auditorium" },
    { id: 14, name: "Singing Contest",         time: "2:00 PM - 5:00 PM",   venue: "Auditorium" },
    { id: 15, name: "Stand-up Comedy",         time: "1:00 PM - 3:00 PM",   venue: "Seminar Hall" },
    { id: 16, name: "Fashion Show",            time: "3:00 PM - 6:00 PM",   venue: "Main Stage" },
    { id: 17, name: "Cooking Without Fire",    time: "10:00 AM - 12:00 PM", venue: "Room 109" },
    { id: 18, name: "Face Painting",           time: "11:30 AM - 2:30 PM",  venue: "Room 106" },
    { id: 19, name: "Rangoli",                 time: "9:00 AM - 11:30 AM",  venue: "Entrance Area" },
    { id: 20, name: "Mehendi",                 time: "12:00 PM - 3:00 PM",  venue: "Room 104" },
    { id: 21, name: "Dumb Charades",           time: "2:00 PM - 4:00 PM",   venue: "Room 111" },
    { id: 22, name: "Open Mic",                time: "4:00 PM - 6:00 PM",   venue: "Auditorium" },
  ], []);

  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase());
    const isMorning = event.time.includes("AM");
    const isAfternoon = event.time.includes("PM");
    if (filter === "Morning") return matchesSearch && isMorning;
    if (filter === "Afternoon") return matchesSearch && isAfternoon;
    return matchesSearch;
  }), [search, filter, events]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container" style={{ paddingTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 className="gradient-text fade-in" style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>Creative Arena</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "18px", fontWeight: "600" }}>Express your talent and passion</p>
        </div>

        <div className="fade-in search-filter-bar">
          <input
            className="premium-input search-input"
            placeholder="Search for a non-tech event..."
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
          {filteredEvents.map((event) => (
            <div key={event.id} className="glass-card event-card col-4">
              <div className="event-card-header">
                <h3 className="event-title">{event.name}</h3>
                <span className="event-badge non-tech">#{event.id}</span>
              </div>
              <div className="event-details">
                <div className="detail-item">
                  <span className="detail-icon">📅</span> {event.time}
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📍</span> {event.venue}
                </div>
              </div>
              <EventWinners eventId={event.id} />
              <button 
                className="primary-button event-btn non-tech" 
                onClick={() => navigate("/register", { state: { eventId: event.id, eventName: event.name } })}
              >
                Register Now
              </button>
            </div>
          ))}
        </div>

        <style>{`
          .search-filter-bar { display: flex; gap: 20px; margin-bottom: 48px; flex-wrap: wrap; }
          .search-input { flex: 1; min-width: 260px; }
          .filter-select { width: 200px; cursor: pointer; }
          
          .event-card { display: flex; flex-direction: column; gap: 24px; min-height: 380px; }
          .event-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
          .event-title { font-size: 20px; font-weight: 800; line-height: 1.2; }
          .event-badge { font-size: 11px; background: var(--secondary); color: #fff; padding: 4px 10px; border-radius: 8px; font-weight: 800; }
          
          .event-details { display: flex; flex-direction: column; gap: 12px; color: var(--text-secondary); font-size: 14px; font-weight: 500; }
          .detail-item { display: flex; align-items: center; gap: 10px; }
          .detail-icon { font-size: 18px; }
          
          .event-btn { width: 100%; margin-top: auto; border-radius: 12px; background: var(--secondary); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); }

          @media (max-width: 1024px) {
            .event-card { min-height: auto; }
          }

          @media (max-width: 640px) {
            .search-filter-bar { gap: 12px; margin-bottom: 32px; }
            .search-input { min-width: 100%; }
            .filter-select { width: 100%; }
            .event-card { padding: 24px; }
          }
        `}</style>

        {filteredEvents.length === 0 && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.2 }}>🎭</div>
            <h3 style={{ fontSize: "24px", color: "var(--text-secondary)" }}>No events matched your search</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default NonTechnicalEvents;
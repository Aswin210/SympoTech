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

        <div className="fade-in" style={{ display: "flex", gap: "20px", marginBottom: "48px", flexWrap: "wrap" }}>
          <input
            className="premium-input"
            style={{ flex: "1", minWidth: "260px" }}
            placeholder="Search for a non-tech event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="premium-input"
            style={{ width: "200px", cursor: "pointer" }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option style={{ background: "var(--bg-surface)" }}>All</option>
            <option style={{ background: "var(--bg-surface)" }}>Morning</option>
            <option style={{ background: "var(--bg-surface)" }}>Afternoon</option>
          </select>
        </div>

        <div className="grid-bento fade-in">
          {filteredEvents.map((event) => (
            <div key={event.id} className="glass-card" style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800" }}>{event.name}</h3>
                <span style={{ fontSize: "11px", background: "var(--secondary)", color: "#fff", padding: "4px 10px", borderRadius: "8px", fontWeight: "800" }}>#{event.id}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>📅</span> {event.time}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>📍</span> {event.venue}
                </div>
              </div>
              <EventWinners eventId={event.id} />
              <button 
                className="primary-button" 
                style={{ width: "100%", marginTop: "auto", borderRadius: "12px", background: "var(--secondary)", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)" }}
                onClick={() => navigate("/register", { state: { eventId: event.id, eventName: event.name } })}
              >
                Register Now
              </button>
            </div>
          ))}
        </div>

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
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function TechnicalEvents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const events = [
    { id: 1,  name: "Project Presentation",      time: "9:30 AM - 12:30 PM",  venue: "Room 107" },
    { id: 2,  name: "Reverse Engineering",        time: "9:30 AM - 12:30 PM",  venue: "Room 114" },
    { id: 17, name: "Code Debugging",             time: "1:00 PM - 4:30 PM",   venue: "Room 224" },
    { id: 3,  name: "Hackathon",                  time: "9:00 AM - 6:00 PM",   venue: "Lab 1" },
    { id: 4,  name: "Paper Presentation",         time: "10:00 AM - 1:00 PM",  venue: "Seminar Hall" },
    { id: 5,  name: "Web Designing",              time: "1:30 PM - 4:30 PM",   venue: "Lab 2" },
    { id: 6,  name: "App Development",            time: "9:30 AM - 12:30 PM",  venue: "Lab 3" },
    { id: 7,  name: "AI Quiz",                    time: "11:00 AM - 12:30 PM", venue: "Room 210" },
    { id: 8,  name: "Cyber Security Challenge",   time: "2:00 PM - 5:00 PM",   venue: "Lab 4" },
    { id: 9,  name: "Coding Contest",             time: "10:00 AM - 1:00 PM",  venue: "Lab 5" },
    { id: 10, name: "UI/UX Design",               time: "1:00 PM - 3:30 PM",   venue: "Room 118" },
    { id: 11, name: "Cloud Computing Workshop",   time: "9:30 AM - 12:30 PM",  venue: "Room 305" },
    { id: 12, name: "Robotics Demo",              time: "2:00 PM - 4:00 PM",   venue: "Lab 6" },
    { id: 13, name: "Data Science Challenge",     time: "10:30 AM - 1:30 PM",  venue: "Room 220" },
  ];

  const handleRegister = (event) => {
    navigate("/register", {
      state: { eventId: event.id, eventName: event.name },
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase());
    const isMorning = event.time.includes("AM");
    const isAfternoon = event.time.includes("PM");
    if (filter === "Morning") return matchesSearch && isMorning;
    if (filter === "Afternoon") return matchesSearch && isAfternoon;
    return matchesSearch;
  });

  return (
    <div style={styles.page}>
      <Navbar />

      <h2 style={styles.heading}>🚀 Technical Events</h2>
      <p style={styles.subheading}>{filteredEvents.length} events available</p>

      {/* Search + Filter */}
      <div style={styles.filterRow}>
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.select}
        >
          <option>All</option>
          <option>Morning</option>
          <option>Afternoon</option>
        </select>
      </div>

      {/* Event Cards Grid */}
      <div style={styles.grid}>
        {filteredEvents.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</p>
            <p style={{ color: "#6b7280", fontSize: "16px" }}>No events match your search.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{event.name}</h3>
              <p style={styles.cardDetail}><b>⏰</b> {event.time}</p>
              <p style={styles.cardDetail}><b>📍</b> {event.venue}</p>
              <button
                onClick={() => handleRegister(event)}
                style={styles.registerBtn}
              >
                Register Now
              </button>
            </div>
          ))
        )}
      </div>

      {/* Responsive grid CSS */}
      <style>{`
        @media (max-width: 480px) {
          .tech-grid { grid-template-columns: 1fr !important; }
          .tech-filter-row { flex-direction: column !important; }
          .tech-search { width: 100% !important; }
          .tech-select { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    background: "#f5f7fa",
    minHeight: "100vh",
    paddingBottom: "32px",
  },
  heading: {
    textAlign: "center",
    marginTop: "24px",
    marginBottom: "4px",
    fontSize: "clamp(20px, 5vw, 28px)",
    color: "#111827",
    fontWeight: "800",
  },
  subheading: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "20px",
  },
  filterRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    margin: "0 16px 24px 16px",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "12px 14px",
    flex: "1",
    minWidth: "200px",
    maxWidth: "300px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff",
    minWidth: "130px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
    padding: "0 16px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid #f3f4f6",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardTitle: {
    color: "#111827",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  cardDetail: {
    color: "#4b5563",
    fontSize: "14px",
    margin: "0",
  },
  registerBtn: {
    marginTop: "12px",
    padding: "12px",
    width: "100%",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px 20px",
  },
};

export default TechnicalEvents;
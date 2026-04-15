import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function NonTechnicalEvents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const events = [
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

      <h2 style={styles.heading}>🎉 Non-Technical Events</h2>
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

      {/* Event Cards */}
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
    background: "linear-gradient(135deg, #ff7eb3, #ff758c)",
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

export default NonTechnicalEvents;
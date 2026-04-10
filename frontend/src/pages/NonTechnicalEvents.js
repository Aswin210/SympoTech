import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function NonTechnicalEvents() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const events = [
    { id: 1, name: "Adzap", time: "9:30 AM - 12:30 PM", venue: "Room 121" },
    { id: 2, name: "Just a Minute", time: "1:00 PM - 4:30 PM", venue: "Room 115" },
    { id: 3, name: "Best Manager", time: "1:00 PM - 4:30 PM", venue: "Room 113" },
    { id: 4, name: "Connections", time: "10:00 AM - 12:00 PM", venue: "Room 110" },
    { id: 5, name: "Treasure Hunt", time: "10:30 AM - 1:30 PM", venue: "Campus Area" },
    { id: 6, name: "Debate", time: "2:00 PM - 4:00 PM", venue: "Seminar Hall" },
    { id: 7, name: "Group Discussion", time: "11:00 AM - 1:00 PM", venue: "Room 108" },
    { id: 8, name: "Mime", time: "9:00 AM - 11:00 AM", venue: "Auditorium" },
    { id: 9, name: "Photography", time: "All Day", venue: "Entire Campus" },
    { id: 10, name: "Short Film", time: "2:00 PM - 5:00 PM", venue: "Room 105" },
    { id: 11, name: "Quiz", time: "12:00 PM - 2:00 PM", venue: "Room 102" },
    { id: 12, name: "Stress Interview", time: "3:00 PM - 5:00 PM", venue: "Room 101" },

    // ✅ 10 New Events Added
    { id: 13, name: "Dance Battle", time: "11:00 AM - 2:00 PM", venue: "Auditorium" },
    { id: 14, name: "Singing Contest", time: "2:00 PM - 5:00 PM", venue: "Auditorium" },
    { id: 15, name: "Stand-up Comedy", time: "1:00 PM - 3:00 PM", venue: "Seminar Hall" },
    { id: 16, name: "Fashion Show", time: "3:00 PM - 6:00 PM", venue: "Main Stage" },
    { id: 17, name: "Cooking Without Fire", time: "10:00 AM - 12:00 PM", venue: "Room 109" },
    { id: 18, name: "Face Painting", time: "11:30 AM - 2:30 PM", venue: "Room 106" },
    { id: 19, name: "Rangoli", time: "9:00 AM - 11:30 AM", venue: "Entrance Area" },
    { id: 20, name: "Mehendi", time: "12:00 PM - 3:00 PM", venue: "Room 104" },
    { id: 21, name: "Dumb Charades", time: "2:00 PM - 4:00 PM", venue: "Room 111" },
    { id: 22, name: "Open Mic", time: "4:00 PM - 6:00 PM", venue: "Auditorium" },
  ];

  const handleRegister = (event) => {
    navigate("/register", {
      state: {
        eventId: event.id,
        eventName: event.name,
      },
    });
  };

  // 🔍 Filter Logic
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase());

    const isMorning = event.time.includes("AM");
    const isAfternoon = event.time.includes("PM");

    if (filter === "Morning") return matchesSearch && isMorning;
    if (filter === "Afternoon") return matchesSearch && isAfternoon;

    return matchesSearch;
  });

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Navbar />

      <h2 style={{ textAlign: "center", marginTop: "20px" }}>
        🎉 Non-Technical Events
      </h2>

      {/* 🔍 Search + Filter */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "20px" }}>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px",
            width: "250px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px" }}
        >
          <option>All</option>
          <option>Morning</option>
          <option>Afternoon</option>
        </select>
      </div>

      {/* 📦 Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          padding: "20px",
        }}
      >
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
            }}
          >
            <h3>{event.name}</h3>
            <p><b>⏰ Time:</b> {event.time}</p>
            <p><b>📍 Venue:</b> {event.venue}</p>

            <button
              onClick={() => handleRegister(event)}
              style={{
                marginTop: "10px",
                padding: "10px",
                width: "100%",
                border: "none",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ff7eb3, #ff758c)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Register
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NonTechnicalEvents;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function TechnicalEvents() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const events = [
    {
      id: 1,
      name: "Project Presentation",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 107",
    },
    {
      id: 2,
      name: "Reverse Engineering",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 114",
    },
    {
      id: 17,
      name: "Code Debugging",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 224",
    },
    { id: 3, name: "Hackathon", time: "9:00 AM - 6:00 PM", venue: "Lab 1" },
    {
      id: 4,
      name: "Paper Presentation",
      time: "10:00 AM - 1:00 PM",
      venue: "Seminar Hall",
    },
    { id: 5, name: "Web Designing", time: "1:30 PM - 4:30 PM", venue: "Lab 2" },
    {
      id: 6,
      name: "App Development",
      time: "9:30 AM - 12:30 PM",
      venue: "Lab 3",
    },
    { id: 7, name: "AI Quiz", time: "11:00 AM - 12:30 PM", venue: "Room 210" },
    {
      id: 8,
      name: "Cyber Security Challenge",
      time: "2:00 PM - 5:00 PM",
      venue: "Lab 4",
    },
    {
      id: 9,
      name: "Coding Contest",
      time: "10:00 AM - 1:00 PM",
      venue: "Lab 5",
    },
    {
      id: 10,
      name: "UI/UX Design",
      time: "1:00 PM - 3:30 PM",
      venue: "Room 118",
    },
    {
      id: 11,
      name: "Cloud Computing Workshop",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 305",
    },
    {
      id: 12,
      name: "Robotics Demo",
      time: "2:00 PM - 4:00 PM",
      venue: "Lab 6",
    },
    {
      id: 13,
      name: "Data Science Challenge",
      time: "10:30 AM - 1:30 PM",
      venue: "Room 220",
    },
  ];

  const handleRegister = (event) => {
    navigate("/register", {
      state: {
        eventId: event.id,
        eventName: event.name,
      },
    });
  };

  // 🔍 Filter logic
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(search.toLowerCase());

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
        🚀 Technical Events
      </h2>

      {/* 🔍 Search + Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          margin: "20px",
        }}
      >
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

      {/* 📦 Event Cards */}
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
              cursor: "pointer",
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
            <h3 style={{ color: "#333" }}>{event.name}</h3>
            <p>
              <b>⏰ Time:</b> {event.time}
            </p>
            <p>
              <b>📍 Venue:</b> {event.venue}
            </p>

            <button
              onClick={() => handleRegister(event)}
              style={{
                marginTop: "10px",
                padding: "10px",
                width: "100%",
                border: "none",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
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

export default TechnicalEvents;

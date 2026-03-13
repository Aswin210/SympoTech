import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Events() {
  const navigate = useNavigate();

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
      id: 3,
      name: "Fun with Sensors",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 105",
    },
    {
      id: 4,
      name: "Robotics Task Challenge",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 116",
    },
    { id: 5, name: "Adzap", time: "9:30 AM - 12:30 PM", venue: "Room 121" },
    {
      id: 6,
      name: "Paper Presentation",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 225",
    },
    {
      id: 7,
      name: "Circuit Cluster",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 203",
    },
    {
      id: 8,
      name: "Circuit Debugging",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 204",
    },
    {
      id: 9,
      name: "Line Follower",
      time: "9:30 AM - 12:30 PM",
      venue: "Room 208",
    },
    {
      id: 10,
      name: "Startup Spark (Business Plan)",
      time: "9:30 AM - 12:30 PM",
      venue: "Abhinantham Hall",
    },
    { id: 11, name: "24 Hour Hackathon", time: "24 Hours", venue: "Civil Lab" },
    {
      id: 12,
      name: "Hands on Concrete Mix Design",
      time: "9:30 AM - 12:30 PM",
      venue: "Civil Lab",
    },

    {
      id: 13,
      name: "Matlab Programming",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 106",
    },
    {
      id: 14,
      name: "Best Manager",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 113",
    },
    { id: 15, name: "AI Script", time: "1:00 PM - 4:30 PM", venue: "Room 227" },
    {
      id: 16,
      name: "Prompt Engineering Contest",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 232",
    },
    {
      id: 17,
      name: "Code Debugging",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 224",
    },
    {
      id: 18,
      name: "Algo Master",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 210",
    },
    { id: 19, name: "Think AI", time: "1:00 PM - 4:30 PM", venue: "Room 206" },
    {
      id: 20,
      name: "CAD Modelling",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 219",
    },
    {
      id: 21,
      name: "Estimation and Costing",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 223",
    },
    {
      id: 22,
      name: "Technical Quiz",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 217",
    },
    {
      id: 23,
      name: "Just a Minute",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 115",
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

  return (
    <div>
      <Navbar />

      <div style={{ padding: "30px" }}>
        <h2>SRISHTA 2K26 - Technical Events</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "15px",
                boxShadow: "0 0 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{event.name}</h3>

              <p>
                <b>Time:</b> {event.time}
              </p>

              <p>
                <b>Venue:</b> {event.venue}
              </p>

              <button
                onClick={() => handleRegister(event)}
                style={{
                  padding: "8px 15px",
                  background: "#0984e3",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Register
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Events;

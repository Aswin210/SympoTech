import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function TechnicalEvents() {
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
      id: 17,
      name: "Code Debugging",
      time: "1:00 PM - 4:30 PM",
      venue: "Room 224",
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
      <h2 style={{ textAlign: "center" }}>Technical Events</h2>

      <div style={{ display: "grid", gap: "20px", padding: "20px" }}>
        {events.map((event) => (
          <div key={event.id} style={{ border: "1px solid #ccc", padding: "15px" }}>
            <h3>{event.name}</h3>
            <p><b>Time:</b> {event.time}</p>
            <p><b>Venue:</b> {event.venue}</p>

            <button onClick={() => handleRegister(event)}>
              Register
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechnicalEvents;
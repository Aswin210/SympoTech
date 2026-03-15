import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";

function Feedback() {

  const location = useLocation();

  const eventId = location?.state?.eventId || 1;
  const eventName = location?.state?.eventName || "College Event";

  const userId = 1;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  /* LOAD FEEDBACK */

  const loadFeedbacks = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/feedback/${eventId}`
      );

      if (Array.isArray(res.data)) {
        setFeedbacks(res.data);
      } else {
        setFeedbacks([]);
      }

    } catch (error) {

      console.error("Error loading feedback:", error);

    } finally {

      setLoading(false);

    }

  };

  /* RUN WHEN PAGE LOADS */

  useEffect(() => {
  loadFeedbacks();
}, [eventId, loadFeedbacks]);

  /* SUBMIT FEEDBACK */

  const submitFeedback = async () => {

    if (!comment.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {

      const res = await axios.post("http://localhost:5000/feedback", {
        user_id: userId,
        event_id: eventId,
        rating: rating,
        comment: comment
      });

      if (res.data.success) {

        alert("Feedback submitted");

        setComment("");
        setRating(5);

        loadFeedbacks();

      }

    } catch (error) {

      console.error("Submit feedback error:", error);
      alert("Server error");

    }

  };

  return (

    <div>

      <Navbar />

      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>

        <h2>Feedback for {eventName}</h2>

        <div style={{ marginBottom: "10px" }}>

          <label>Rating:</label>

          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value="1">1 Star</option>
            <option value="2">2 Star</option>
            <option value="3">3 Star</option>
            <option value="4">4 Star</option>
            <option value="5">5 Star</option>
          </select>

        </div>

        <div style={{ marginBottom: "10px" }}>

          <label>Comment</label>

          <textarea
            style={{ width: "100%", height: "80px" }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

        </div>

        <button onClick={submitFeedback}>
          Submit Feedback
        </button>

        <hr />

        <h3>All Feedback</h3>

        {loading && <p>Loading...</p>}

        {!loading && feedbacks.length === 0 && (
          <p>No feedback yet.</p>
        )}

        {feedbacks.map((f) => (

          <div
            key={f.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px"
            }}
          >

            <p>
              <b>{f.user_name || "User"}</b> rated {f.rating}/5
            </p>

            <p>{f.comment}</p>

            <p style={{ fontSize: "12px" }}>
              {f.created_at
                ? new Date(f.created_at).toLocaleString()
                : ""}
            </p>

          </div>

        ))}

      </div>

    </div>

  );

}

export default Feedback;
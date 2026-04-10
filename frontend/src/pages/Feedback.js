import React, { useState, useEffect } from "react";
import axios from "axios";

function Feedback() {

  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [eventName, setEventName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);

  // ✅ Load feedback
  const loadFeedback = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/feedback");
      setFeedbackList(res.data);
    } catch (err) {
      console.log("❌ Error loading feedback");
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  // ✅ Submit feedback
  const submitFeedback = async () => {

    if (!userName || !userId || !eventName || !comment) {
      alert("⚠️ Fill all fields");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/feedback", {
        user_name: userName,
        user_id: Number(userId),
        event_name: eventName,
        rating: Number(rating),
        comment: comment
      });

      if (res.data.success) {
        alert("✅ Feedback submitted successfully");

        setUserName("");
        setUserId("");
        setEventName("");
        setRating(5);
        setComment("");

        loadFeedback();
      } else {
        alert("❌ Failed to submit feedback");
      }

    } catch (error) {
      console.error("❌ Error:", error);
      alert("🚫 Server error");
    }
  };

  return (
    <div style={styles.container}>

      <h2 style={styles.heading}>Event Feedback</h2>

      <input
        type="text"
        placeholder="Enter Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        style={styles.input}
      />

      <input
        type="number"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={styles.input}
      />

      <input
        type="text"
        placeholder="Event Name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        style={styles.input}
      />

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        style={styles.input}
      >
        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
        <option value="4">⭐⭐⭐⭐ Good</option>
        <option value="3">⭐⭐⭐ Average</option>
        <option value="2">⭐⭐ Poor</option>
        <option value="1">⭐ Bad</option>
      </select>

      <textarea
        placeholder="Enter Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={styles.textarea}
      />

      <button onClick={submitFeedback} style={styles.button}>
        Submit Feedback
      </button>

      <h3 style={{ marginTop: "30px" }}>All Feedback</h3>

      {feedbackList.map((fb, index) => (
        <div key={index} style={styles.card}>
          <p><b>Name:</b> {fb.user_name}</p>
          <p><b>Event:</b> {fb.event_name}</p>
          <p><b>Rating:</b> ⭐ {fb.rating}</p>
          <p><b>Comment:</b> {fb.comment}</p>
        </div>
      ))}

    </div>
  );
}

const styles = {
  container: {
    width: "400px",
    margin: "auto",
    padding: "20px",
    textAlign: "center"
  },
  heading: {
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0"
  },
  textarea: {
    width: "100%",
    padding: "10px",
    height: "80px",
    margin: "10px 0"
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "black",
    color: "white",
    border: "none",
    cursor: "pointer"
  },
  card: {
    border: "1px solid #ccc",
    padding: "10px",
    marginTop: "10px",
    textAlign: "left"
  }
};

export default Feedback;
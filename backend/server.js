const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.post("/register", (req, res) => {
  const { name, college_name, phone, event_id } = req.body;

  const sql = "INSERT INTO users (name, college_name, phone, event_id) VALUES (?, ?, ?, ?)";

  db.query(sql, [
    name,
    college_name,
    phone,
    parseInt(event_id)
  ], (err, result) => {
    if (err) {
      console.log("Database error:", err);
      return res.status(500).send("Error saving data");
    }

    console.log("Inserted Successfully");
    res.send("Data Stored Successfully");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
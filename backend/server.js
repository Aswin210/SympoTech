const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/register", (req, res) => {
  const { name, college_name, phone, event_id } = req.body;

  const sql = "INSERT INTO users (name, college_name, phone, event_id) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, college_name, phone, event_id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error saving data");
    } else {
      res.send("Data Stored Successfully");
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

db.query("SELECT 1", (err, result) => {
  console.log(result);
});
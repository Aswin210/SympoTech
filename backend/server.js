const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===============================
   TEST ROUTE
=================================*/
app.get("/", (req, res) => {
  res.json({ message: "Backend is working" });
});

/* ===============================
   USER REGISTER
=================================*/
app.post("/register", (req, res) => {
  const { name, college_name, phone, event_id } = req.body;

  if (!name || !college_name || !phone || !event_id) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const sql =
    "INSERT INTO users (name, college_name, phone, event_id, attendance) VALUES (?, ?, ?, ?, 0)";

  db.query(sql, [name, college_name, phone, event_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    const userId = result.insertId;

    // QR data contains only userId
    const qrData = `${userId}`;

    res.json({
      success: true,
      message: "Registered Successfully",
      userId: userId,
      qrData: qrData
    });
  });
});

/* ===============================
   ADMIN LOGIN
=================================*/
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({
      success: false,
      message: "Username and Password required"
    });
  }

  const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error("Login Error:", err);
      return res.status(500).json({
        success: false,
        message: "Server Error"
      });
    }

    if (result.length > 0) {
      res.json({
        success: true,
        message: "Login Successful"
      });
    } else {
      res.json({
        success: false,
        message: "Invalid Credentials"
      });
    }
  });
});

/* ===============================
   ADMIN SCAN QR → GET USER DATA
=================================*/
app.get("/admin/user/:id", (req, res) => {
  const userId = req.params.id;

  const sql = "SELECT * FROM users WHERE id=?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).json([]);
    }

    if (result.length === 0) {
      return res.json([]);
    }

    res.json(result[0]);
  });
});

/* ===============================
   MARK ATTENDANCE AFTER SCAN
=================================*/
app.put("/admin/attendance/:id", (req, res) => {
  const userId = req.params.id;

  const sql = "UPDATE users SET attendance=1 WHERE id=?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false });
    }

    res.json({ success: true, message: "Attendance Marked" });
  });
});

/* =============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
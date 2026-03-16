const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();
const PORT = 5000;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend working successfully 🚀"
  });
});

/* =================================================
   SUBMIT FEEDBACK
================================================= */

app.post("/feedback", (req, res) => {

  const { user_id, event_id, rating, comment } = req.body;

  console.log("Incoming Feedback:", req.body);

  if (!user_id || !event_id || !rating) {
    return res.status(400).json({
      success: false,
      message: "user_id, event_id and rating are required"
    });
  }

  const sql = `
    INSERT INTO feedback (user_id, event_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_id, event_id, rating, comment || ""], (err, result) => {

    if (err) {
      console.log("Feedback Insert Error:", err);

      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      feedbackId: result.insertId
    });

  });

});

/* =================================================
   GET EVENT FEEDBACK
================================================= */

app.get("/feedback/:eventId", (req, res) => {

  const eventId = req.params.eventId;

  const sql = `
    SELECT 
      f.id,
      f.rating,
      f.comment,
      f.created_at,
      u.name AS user_name
    FROM feedback f
    LEFT JOIN users u ON u.id = f.user_id
    WHERE f.event_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [eventId], (err, result) => {

    if (err) {
      console.log("Fetch Feedback Error:", err);
      return res.status(500).json([]);
    }

    res.json(result);

  });

});

/* =================================================
   USER REGISTRATION
================================================= */

app.post("/register", (req, res) => {

  const { name, college_name, phone, email, event_id, photo } = req.body;

  console.log("REGISTER DATA:", req.body);

  if (!name || !college_name || !phone || !email || !event_id) {

    return res.json({
      success: false,
      message: "All fields are required"
    });

  }

  const checkUser = `
    SELECT * FROM users 
    WHERE phone = ? OR email = ?
  `;

  db.query(checkUser, [phone, email], (err, result) => {

    if (err) {
      console.log("User Check Error:", err);
      return res.json({
        success: false,
        message: "Database error"
      });
    }

    if (result.length > 0) {

      return res.json({
        success: false,
        message: "User already registered"
      });

    }

    const insertUser = `
      INSERT INTO users
      (name, college_name, phone, email, event_id, photo)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertUser,
      [name, college_name, phone, email, event_id, photo || ""],
      (err, result) => {

        if (err) {
          console.log("Insert User Error:", err);
          return res.json({
            success: false,
            message: "Registration failed"
          });
        }

        res.json({
          success: true,
          message: "Registration successful",
          userId: result.insertId,
          qrData: result.insertId
        });

      }
    );

  });

});

/* =================================================
   VERIFY USER (QR SCAN)
================================================= */

app.get("/verify-user/:id", (req, res) => {

  const id = req.params.id;

  db.query(
    "SELECT * FROM users WHERE id=?",
    [id],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.json({ success: false });
      }

      if (result.length === 0) {

        return res.json({
          success: false,
          message: "User not found"
        });

      }

      res.json({
        success: true,
        user: result[0]
      });

    }
  );

});

/* =================================================
   MARK ATTENDANCE
================================================= */

app.put("/mark-attendance/:id", (req, res) => {

  const userId = req.params.id;

  db.query(
    "SELECT * FROM users WHERE id=?",
    [userId],
    (err, userResult) => {

      if (err) return res.json({ success: false });

      if (userResult.length === 0) {

        return res.json({
          success: false,
          message: "User not found"
        });

      }

      const user = userResult[0];

      db.query(
        "SELECT * FROM attendance WHERE user_id=?",
        [userId],
        (err, scanResult) => {

          if (err) return res.json({ success: false });

          if (scanResult.length > 0) {

            return res.json({
              success: false,
              message: "Attendance already marked"
            });

          }

          db.query(
            `
            INSERT INTO attendance
            (user_id,name,event_id,phone,scan_time)
            VALUES (?,?,?,?,NOW())
            `,
            [user.id, user.name, user.event_id, user.phone],
            (err) => {

              if (err) {
                console.log(err);
                return res.json({ success: false });
              }

              res.json({
                success: true,
                message: "Attendance marked successfully"
              });

            }
          );

        }
      );

    }
  );

});

/* =================================================
   ATTENDANCE LIST
================================================= */

app.get("/attendance-list", (req, res) => {

  const sql = `
    SELECT 
      users.name,
      users.college_name,
      users.photo,
      attendance.scan_time
    FROM attendance
    JOIN users ON users.id = attendance.user_id
    ORDER BY attendance.scan_time DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);

  });

});

/* =================================================
   EVENT WISE ATTENDANCE
================================================= */

app.get("/attendance/event/:eventId", (req, res) => {

  const eventId = req.params.eventId;

  const sql = `
    SELECT 
      users.name,
      users.college_name,
      users.phone,
      attendance.scan_time
    FROM attendance
    JOIN users ON users.id = attendance.user_id
    WHERE users.event_id = ?
    ORDER BY attendance.scan_time DESC
  `;

  db.query(sql, [eventId], (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);

  });

});

/* =================================================
   TOTAL ATTENDANCE COUNT
================================================= */

app.get("/attendance-count", (req, res) => {

  db.query(
    "SELECT COUNT(*) AS total FROM attendance",
    (err, result) => {

      if (err) {
        console.log(err);
        return res.json({ total: 0 });
      }

      res.json(result[0]);

    }
  );

});

/* =================================================
   START SERVER
================================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
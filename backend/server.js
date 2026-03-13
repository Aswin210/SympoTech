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
  res.json({ message: "Backend working successfully 🚀" });
});

/* =========================
   USER REGISTRATION
========================= */

app.post("/register", (req, res) => {
  const { name, college_name, phone, email, event_id, photo } = req.body;

  if (!name || !college_name || !phone || !email || !event_id) {
    return res.json({
      success: false,
      message: "All fields required",
    });
  }

  /* CHECK DUPLICATE USER */

  const checkUser =
    "SELECT * FROM users WHERE phone=? OR email=?";

  db.query(checkUser, [phone, email], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({
        success: false,
        message: "Database error",
      });
    }

    if (result.length > 0) {
      return res.json({
        success: false,
        message: "User already registered",
      });
    }

    /* INSERT USER */

    const insertUser =
      "INSERT INTO users(name,college_name,phone,email,event_id,photo) VALUES(?,?,?,?,?,?)";

    db.query(
      insertUser,
      [name, college_name, phone, email, event_id, photo || ""],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.json({
            success: false,
            message: "Registration failed",
          });
        }

        res.json({
          success: true,
          userId: result.insertId,
          qrData: result.insertId,
        });
      }
    );
  });
});

/* =========================
   VERIFY USER (QR SCAN)
========================= */

app.get("/verify-user/:id", (req, res) => {
  const id = req.params.id;

  const sql = "SELECT * FROM users WHERE id=?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    if (result.length === 0) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      user: result[0],
    });
  });
});

/* =========================
   MARK ATTENDANCE
========================= */

app.put("/mark-attendance/:id", (req, res) => {
  const userId = req.params.id;

  console.log("Scanning User:", userId);

  /* GET USER */

  const getUser = "SELECT * FROM users WHERE id=?";

  db.query(getUser, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = result[0];

    /* PREVENT DUPLICATE SCAN */

    const checkScan =
      "SELECT * FROM attendance WHERE user_id=?";

    db.query(checkScan, [userId], (err, result) => {
      if (result.length > 0) {
        return res.json({
          success: false,
          message: "Already scanned",
        });
      }

      /* INSERT ATTENDANCE */

      const insertAttendance =
        "INSERT INTO attendance (user_id,name,event_id,phone,scan_time) VALUES (?,?,?,?,NOW())";

      db.query(
        insertAttendance,
        [user.id, user.name, user.event_id, user.phone],
        (err) => {
          if (err) {
            console.log(err);
            return res.json({ success: false });
          }

          res.json({
            success: true,
            message: "Attendance marked successfully",
          });
        }
      );
    });
  });
});

/* =========================
   LIVE ATTENDANCE LIST
========================= */

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

/* =========================
   EVENT-WISE ATTENDANCE
========================= */

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

/* =========================
   TOTAL ATTENDANCE COUNT
========================= */

app.get("/attendance-count", (req, res) => {
  const sql = "SELECT COUNT(*) AS total FROM attendance";

  db.query(sql, (err, result) => {
    if (err) {
      return res.json({ total: 0 });
    }

    res.json(result[0]);
  });
});

/* =========================
   EVENT-WISE COUNT
========================= */

app.get("/attendance-count-event", (req, res) => {
  const sql = `
  SELECT event_id, COUNT(*) AS total
  FROM attendance
  GROUP BY event_id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.json([]);
    }

    res.json(result);
  });
});

/* =========================
   ALL ATTENDANCE (ADMIN)
========================= */

app.get("/attendance", (req, res) => {
  db.query("SELECT * FROM attendance", (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

/* =========================
   AUTO PORT HANDLER
========================= */

const startServer = (port) => {
  app
    .listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} busy, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error(err);
      }
    });
};

startServer(PORT);
const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => res.json({ success: true, message: "Backend running 🚀" }));

/* =================================================
   DATABASE BOOTSTRAP
   Creates / alters all tables on startup
================================================= */
function bootstrapDB() {
  /* Users table */
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      name            VARCHAR(255)  NOT NULL,
      college_name    VARCHAR(255)  NOT NULL,
      phone           VARCHAR(20)   NOT NULL,
      email           VARCHAR(255)  NOT NULL,
      event_id        VARCHAR(100)  NOT NULL,
      utr_number      VARCHAR(100)  UNIQUE,
      photo           LONGTEXT,
      payment_status  VARCHAR(50)   DEFAULT 'pending',
      payment_screenshot VARCHAR(255),
      utr_score       INT           DEFAULT 0,
      utr_flags       TEXT,
      auto_checked    TINYINT(1)    DEFAULT 0,
      created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("❌ users table:", err.message); else console.log("✅ users table ready"); });

  /* transaction_history table */
  db.query(`
    CREATE TABLE IF NOT EXISTS transaction_history (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT           NOT NULL,
      name       VARCHAR(255)  NOT NULL,
      email      VARCHAR(255)  NOT NULL,
      phone      VARCHAR(20)   NOT NULL,
      event_id   VARCHAR(100)  NOT NULL,
      utr_number VARCHAR(100)  NOT NULL UNIQUE,
      amount     VARCHAR(20)   DEFAULT '1',
      status     VARCHAR(50)   DEFAULT 'pending',
      utr_score  INT           DEFAULT 0,
      utr_flags  TEXT,
      paid_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("❌ transaction_history:", err.message); else console.log("✅ transaction_history ready"); });

  /* utr_blacklist table */
  db.query(`
    CREATE TABLE IF NOT EXISTS utr_blacklist (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      utr_number VARCHAR(100) NOT NULL UNIQUE,
      reason     VARCHAR(255),
      added_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("❌ utr_blacklist:", err.message); else console.log("✅ utr_blacklist ready"); });

  /* attendance table */
  db.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      user_id   INT          NOT NULL,
      name      VARCHAR(255) NOT NULL,
      event_id  VARCHAR(100) NOT NULL,
      phone     VARCHAR(20)  NOT NULL,
      scan_time DATETIME     DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("❌ attendance:", err.message); else console.log("✅ attendance ready"); });

  /* feedback table */
  db.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_name  VARCHAR(255) NOT NULL,
      user_id    INT          NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      rating     INT          NOT NULL,
      comment    TEXT,
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("❌ feedback:", err.message); else console.log("✅ feedback ready"); });

  /* events table */
  db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      date        DATE,
      venue       VARCHAR(255),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("❌ events:", err.message); else console.log("✅ events ready"); });
}

bootstrapDB();

/* =================================================
   SMART UTR ANALYZER ENGINE
   Returns { score: 0-100, flags: [], block: bool, verdict: string }
================================================= */
function analyzeUTR(utr) {
  const t = utr.trim().toUpperCase();
  let score = 100;
  const flags = [];

  if (t.length < 10 || t.length > 22)
    return { score: 0, flags: ["Invalid length. UTR must be 10–22 characters."], block: true, verdict: "blocked" };

  if (!/^[A-Z0-9]+$/.test(t))
    return { score: 0, flags: ["Invalid characters. Only letters and numbers allowed."], block: true, verdict: "blocked" };

  /* Entropy */
  const uniqueRatio = new Set(t).size / t.length;
  if (uniqueRatio < 0.2) { score -= 60; flags.push("Very low character variety — likely fake"); }
  else if (uniqueRatio < 0.35) { score -= 30; flags.push("Low character variety — suspicious"); }

  /* All-same */
  if (/^(.)\1+$/.test(t)) { score -= 80; flags.push("All characters identical — fake pattern"); }

  /* Sequential */
  const seq  = "0123456789012345678901234567890";
  const rseq = "9876543210987654321098765432109";
  if (seq.includes(t) || rseq.includes(t)) { score -= 70; flags.push("Sequential number pattern — fake"); }

  /* Fake keywords */
  if ([/^TEST/,/^FAKE/,/^DUMMY/,/^SAMPLE/,/^ABCD/,/^XXXX/,/^QWER/].some(p => p.test(t))) {
    score -= 70; flags.push("Known fake keyword prefix detected");
  }

  /* All digits */
  if (/^\d+$/.test(t)) { score -= 10; flags.push("All digits — slightly suspicious"); }

  /* Known bank prefixes */
  const bankPfx = ["HDFC","ICIC","SBIN","AXIS","PYTM","YESB","KOTAK","IDFB","BARB","CNRB","UBIN",
    "PUNB","ALLA","BKID","SIBL","CBIN","FDRL","INDB","JAKA","KARB","KVBL","LAVB","MAHB",
    "NKGS","ORBC","RATN","SVCB","TMBL","TNSC","UTIB","VIJB","DCBL","GPAY","PAYTM",
    "PHONEPE","BHIM","NEFT","RTGS","IMPS"];
  if (bankPfx.some(p => t.startsWith(p))) { score = Math.min(100, score + 15); flags.push("✅ Recognized bank/UPI prefix"); }

  /* Common format: prefix + digits */
  if (/^[A-Z]{2,6}\d{6,16}$/.test(t)) { score = Math.min(100, score + 10); flags.push("✅ Matches common UTR format"); }

  /* Year hint */
  if (t.includes("2024") || t.includes("2025") || t.includes("2026")) { score = Math.min(100, score + 5); flags.push("✅ Contains year-like pattern"); }

  /* High entropy */
  if (uniqueRatio > 0.7 && t.length >= 12) { score = Math.min(100, score + 10); flags.push("✅ High entropy — consistent with real UTR"); }

  score = Math.max(0, Math.min(100, score));
  const verdict = score >= 75 ? "likely_real" : score >= 45 ? "suspicious" : "likely_fake";
  return { score, flags, block: score < 30, verdict };
}

/* =================================================
   ADMIN LOGIN
================================================= */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  /* In production: hash passwords in DB. This is a simple check. */
  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "Admin@1234";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    /* Generate simple session token */
    const token = crypto.randomBytes(32).toString("hex");
    res.json({ success: true, token, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "❌ Invalid username or password." });
  }
});

/* =================================================
   SUBMIT UTR
================================================= */
app.post("/submit-utr", (req, res) => {
  const { utrNumber, name, college_name, phone, email, event_id, photo } = req.body;

  if (!name || !college_name || !phone || !email || !event_id)
    return res.json({ success: false, message: "All registration fields are required." });

  if (!utrNumber || utrNumber.trim().length < 10)
    return res.json({ success: false, message: "❌ Invalid UTR. Must be at least 10 characters." });

  const cleanUTR = utrNumber.trim();
  const analysis = analyzeUTR(cleanUTR);

  console.log(`📥 submit-utr | User: ${name} | UTR: ${cleanUTR} | Score: ${analysis.score} | Verdict: ${analysis.verdict}`);

  if (analysis.block)
    return res.json({ success: false, message: `❌ UTR failed verification. ${analysis.flags[0]}` });

  /* Check blacklist */
  db.query("SELECT id FROM utr_blacklist WHERE utr_number = ?", [cleanUTR.toUpperCase()], (err, black) => {
    if (err) return res.json({ success: false, message: "Database error." });
    if (black.length > 0) return res.json({ success: false, message: "❌ This UTR is blacklisted." });

    /* Check duplicate UTR */
    db.query("SELECT id FROM users WHERE utr_number = ?", [cleanUTR], (err, utrRow) => {
      if (err) return res.json({ success: false, message: "Database error." });
      if (utrRow.length > 0) return res.json({ success: false, message: "❌ This UTR has already been used." });

      /* Check duplicate phone/email */
      db.query("SELECT id FROM users WHERE phone = ? OR email = ?", [phone, email], (err, userRow) => {
        if (err) return res.json({ success: false, message: "Database error." });
        if (userRow.length > 0) return res.json({ success: false, message: "❌ This phone or email is already registered." });

        const autoApprove = analysis.score >= 85 && analysis.verdict === "likely_real";
        const initStatus = autoApprove ? "approved" : "pending";
        const flagsJSON = JSON.stringify(analysis.flags);

        db.query(
          `INSERT INTO users (name, college_name, phone, email, event_id, utr_number, photo, payment_status, utr_score, utr_flags, auto_checked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, college_name, phone, email, event_id, cleanUTR, photo || "", initStatus, analysis.score, flagsJSON, 1],
          (err, result) => {
            if (err) {
              console.error("❌ Insert User Error:", err.message);
              if (err.code === "ER_DUP_ENTRY") return res.json({ success: false, message: "❌ This UTR is already registered." });
              return res.json({ success: false, message: "Registration failed. Try again." });
            }

            const userId = result.insertId;
            const qrData = `${userId}-${event_id}`;

            /* Save to transaction_history (non-blocking) */
            db.query(
              `INSERT INTO transaction_history (user_id, name, email, phone, event_id, utr_number, status, utr_score, utr_flags)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [userId, name, email, phone, event_id, cleanUTR, initStatus, analysis.score, flagsJSON],
              err => { if (err) console.warn("⚠️ History insert:", err.message); }
            );

            if (analysis.verdict === "suspicious")
              console.warn(`⚠️ Suspicious UTR | User: ${name} | UTR: ${cleanUTR} | Score: ${analysis.score}`);

            console.log(`✅ Registered | User ID: ${userId} | Status: ${initStatus} | Score: ${analysis.score}`);

            res.json({
              success: true,
              userId,
              qrData,
              autoApproved: autoApprove,
              utrScore: analysis.score,
              verdict: analysis.verdict,
              message: autoApprove ? "✅ UTR auto-verified! Proceeding…" : "✅ UTR submitted. Awaiting admin approval.",
            });
          }
        );
      });
    });
  });
});

/* =================================================
   GET USER PAYMENT STATUS (polled by frontend)
================================================= */
app.get("/user-status/:id", (req, res) => {
  db.query(
    "SELECT payment_status, utr_score FROM users WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err || !rows.length) return res.json({ success: false });
      res.json({ success: true, payment_status: rows[0].payment_status, utr_score: rows[0].utr_score });
    }
  );
});

/* =================================================
   ADMIN: GET ALL USERS (includes photo for thumbnail)
================================================= */
app.get("/admin/users", (req, res) => {
  db.query(
    `SELECT u.id, u.name, u.college_name, u.phone, u.email,
            u.event_id, e.name AS event_name,
            u.utr_number, u.payment_status, u.utr_score, u.utr_flags,
            u.auto_checked, u.created_at, u.photo
     FROM users u
     LEFT JOIN events e ON e.id = u.event_id
     ORDER BY u.id DESC`,
    (err, rows) => {
      if (err) {
        /* Fallback without JOIN if events table has different id type */
        db.query(
          `SELECT id, name, college_name, phone, email, event_id,
                  utr_number, payment_status, utr_score, utr_flags,
                  auto_checked, created_at, photo
           FROM users ORDER BY id DESC`,
          (err2, rows2) => {
            if (err2) return res.json([]);
            res.json(rows2.map(r => ({ ...r, utr_flags: safeParseJSON(r.utr_flags) })));
          }
        );
        return;
      }
      res.json(rows.map(r => ({ ...r, utr_flags: safeParseJSON(r.utr_flags) })));
    }
  );
});

function safeParseJSON(str) {
  try { return JSON.parse(str || "[]"); } catch { return []; }
}

/* =================================================
   ADMIN: APPROVE OR REJECT
================================================= */
app.post("/admin/update-status", (req, res) => {
  const { id, status } = req.body;
  if (!["approved", "rejected"].includes(status))
    return res.json({ success: false, message: "Invalid status value." });

  db.query("UPDATE users SET payment_status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.json({ success: false });

    /* Update history (non-blocking) */
    db.query("UPDATE transaction_history SET status = ? WHERE user_id = ?", [status, id], () => {});

    /* Blacklist UTR on rejection */
    if (status === "rejected") {
      db.query("SELECT utr_number FROM users WHERE id = ?", [id], (err, rows) => {
        if (!err && rows.length)
          db.query("INSERT IGNORE INTO utr_blacklist (utr_number, reason) VALUES (?, 'Rejected by admin')", [rows[0].utr_number], () => {});
      });
    }

    console.log(`✅ User ${id} → ${status}`);
    res.json({ success: true, message: `Status updated to ${status}` });
  });
});

/* =================================================
   ADMIN: BULK AUTO-APPROVE
================================================= */
app.post("/admin/bulk-approve", (req, res) => {
  const threshold = Number(req.body.threshold) || 80;
  db.query(
    "SELECT id, name, utr_number FROM users WHERE payment_status = 'pending' AND utr_score >= ?",
    [threshold],
    (err, rows) => {
      if (err) return res.json({ success: false });
      if (!rows.length) return res.json({ success: true, approved: 0, message: "No eligible users." });

      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => "?").join(",");

      db.query(`UPDATE users SET payment_status = 'approved' WHERE id IN (${placeholders})`, ids, (err) => {
        if (err) return res.json({ success: false });
        db.query(`UPDATE transaction_history SET status = 'approved' WHERE user_id IN (${placeholders})`, ids, () => {});
        console.log(`✅ Bulk approved ${ids.length} users (score >= ${threshold})`);
        res.json({ success: true, approved: ids.length, users: rows.map(r => r.name) });
      });
    }
  );
});

/* =================================================
   ADMIN: RE-ANALYZE UTR
================================================= */
app.post("/admin/reanalyze/:id", (req, res) => {
  db.query("SELECT utr_number FROM users WHERE id = ?", [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.json({ success: false });
    const analysis = analyzeUTR(rows[0].utr_number);
    db.query(
      "UPDATE users SET utr_score = ?, utr_flags = ?, auto_checked = 1 WHERE id = ?",
      [analysis.score, JSON.stringify(analysis.flags), req.params.id],
      (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, score: analysis.score, verdict: analysis.verdict, flags: analysis.flags });
      }
    );
  });
});

/* =================================================
   MARK ATTENDANCE VIA QR SCAN
================================================= */
app.post("/mark-attendance", (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.json({ success: false, message: "QR data missing." });

  const [userId, eventId] = qrData.split("-");
  if (!userId || !eventId) return res.json({ success: false, message: "Invalid QR format." });

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, userRows) => {
    if (err) return res.json({ success: false, message: "Database error." });
    if (!userRows.length) return res.json({ success: false, message: "❌ User not found." });

    const user = userRows[0];
    if (user.payment_status !== "approved")
      return res.json({ success: false, message: "❌ Payment not approved for this user." });

    db.query("SELECT id FROM attendance WHERE user_id = ?", [userId], (err, attRows) => {
      if (err) return res.json({ success: false, message: "Database error." });
      if (attRows.length)
        return res.json({
          success: false,
          message: "⚠️ Attendance already marked.",
          user: { name: user.name, college_name: user.college_name, phone: user.phone, event_id: user.event_id },
        });

      db.query(
        "INSERT INTO attendance (user_id, name, event_id, phone) VALUES (?, ?, ?, ?)",
        [user.id, user.name, eventId, user.phone],
        (err) => {
          if (err) return res.json({ success: false, message: "Failed to mark attendance." });
          res.json({
            success: true,
            message: "✅ Attendance marked!",
            user: { name: user.name, college_name: user.college_name, phone: user.phone, event_id: user.event_id },
          });
        }
      );
    });
  });
});

/* =================================================
   EVENTS
================================================= */
app.get("/events", (req, res) => {
  db.query("SELECT * FROM events ORDER BY date ASC", (err, rows) => {
    if (err) return res.json({ success: false, data: [] });
    res.json({ success: true, data: rows });
  });
});

app.post("/events", (req, res) => {
  const { name, description, date, venue } = req.body;
  if (!name) return res.json({ success: false, message: "Event name required." });
  db.query(
    "INSERT INTO events (name, description, date, venue) VALUES (?, ?, ?, ?)",
    [name, description || "", date || null, venue || ""],
    (err, result) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

/* =================================================
   TRANSACTION HISTORY
================================================= */
app.get("/transaction-history", (req, res) => {
  db.query("SELECT * FROM transaction_history ORDER BY paid_at DESC", (err, rows) => {
    if (err) return res.json({ success: false, data: [] });
    res.json({ success: true, data: rows });
  });
});

/* =================================================
   VERIFY USER
================================================= */
app.get("/verify-user/:id", (req, res) => {
  db.query("SELECT * FROM users WHERE id = ?", [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.json({ success: false, message: "User not found." });
    const user = rows[0];
    if (user.payment_status !== "approved")
      return res.json({ success: false, message: "Payment not approved yet." });
    res.json({ success: true, user });
  });
});

/* =================================================
   FEEDBACK
================================================= */
app.post("/api/feedback", (req, res) => {
  const { user_name, user_id, event_name, rating, comment } = req.body;
  if (!user_name || !user_id || !event_name || !rating || !comment)
    return res.status(400).json({ success: false, message: "All fields required." });
  db.query(
    "INSERT INTO feedback (user_name, user_id, event_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
    [user_name, user_id, event_name, rating, comment],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, message: "Feedback submitted." });
    }
  );
});

app.get("/api/feedback", (req, res) => {
  db.query("SELECT * FROM feedback ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json(rows);
  });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
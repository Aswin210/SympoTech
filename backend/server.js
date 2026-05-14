require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const supabase = require("./db");
const path     = require("path");
const crypto   = require("crypto");
const axios    = require("axios");
const Razorpay   = require("razorpay");
const rateLimit  = require("express-rate-limit");
const nodemailer = require("nodemailer");
const jwt      = require("jsonwebtoken");

const app        = express();
const PORT       = process.env.PORT           || 5000;
const AI_SERVICE = process.env.AI_SERVICE_URL || "http://localhost:5001";
const JWT_SECRET = process.env.JWT_SECRET     || "fallback_secret_for_development_change_in_prod";

// Admin Auth Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized: Missing Token" });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Forbidden: Invalid Token" });
    if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: "Forbidden: Not Admin" });
    req.admin = decoded;
    next();
  });
};

/* ── RAZORPAY ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── EMAIL (NODEMAILER) ── */
const emailTransporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } })
  : null;

async function sendConfirmationEmail(to, name, qrData) {
  if (!emailTransporter) return;
  try {
    await emailTransporter.sendMail({
      from: `"SympoTech Events" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🎉 Your SympoTech Registration is Confirmed!",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#09090b;color:#fafafa;padding:32px;border-radius:16px;border:1px solid rgba(99,102,241,0.3)"><h2 style="color:#6366f1">SympoTech 🎓</h2><h3>Hi ${name}! You're In! 🎉</h3><p>Your registration is confirmed. Here is your QR entry code:</p><div style="background:#18181b;padding:20px;border-radius:12px;text-align:center;font-size:22px;font-weight:900;letter-spacing:4px;color:#6366f1;margin:20px 0">${qrData}</div><p style="color:#a1a1aa;font-size:13px">Show this at the entrance. You can also visit <b>My Ticket</b> on the website to view your QR code anytime.</p><p style="color:#52525b;font-size:11px;margin-top:24px">SympoTech • The Future of Events</p></div>`,
    });
    console.log(`📧 Email sent → ${to}`);
  } catch (err) {
    console.warn("⚠️ Email failed:", err.message);
  }
}

/* ── RATE LIMITERS ── */
const scanLimiter  = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

/* ── MIDDLEWARE ── */
app.use(cors());
app.use("/webhook/razorpay", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── HEALTH CHECK ── */
app.get("/", (_req, res) =>
  res.json({ success: true, message: "Backend running 🚀" })
);

/* ── UPDATE PHOTO ── */
app.post("/api/update-photo", async (req, res) => {
  const { userId, photo } = req.body;
  if (!userId || !photo)
    return res.json({ success: false, message: "userId and photo required." });

  console.log(`📸 Updating photo for user ${userId}`);
  const { error } = await supabase
    .from("users")
    .update({ photo })
    .eq("id", userId);

  if (error) {
    console.error("❌ Photo update error:", error);
    return res.json({ success: false, message: error.message });
  }
  res.json({ success: true });
});

/* ── RAZORPAY: CREATE ORDER ── */
app.post("/api/create-order", async (req, res) => {
  console.log("📝 Incoming registration request:", req.body);
  const { name, college_name, phone, email, event_names, amount: customAmount, team_members } = req.body;

  const missing = [];
  if (!name) missing.push("name");
  if (!college_name) missing.push("college_name");
  if (!phone) missing.push("phone");
  if (!email) missing.push("email");
  if (!event_names) missing.push("event_names");

  if (missing.length > 0) {
    console.warn("⚠️ Missing fields:", missing.join(", "));
    return res.json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
  }
  if (!/^\d{10}$/.test(phone))
    return res.json({ success: false, message: "Enter a valid 10-digit phone number." });
  if (!/\S+@\S+\.\S+/.test(email))
    return res.json({ success: false, message: "Enter a valid email address." });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    return res.json({ success: false, message: "Payment configuration error. Contact support." });

  try {
    // Check duplicate
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .or(`phone.eq.${phone},email.eq.${email}`);

    if (existing && existing.length > 0)
      return res.json({ success: false, message: "❌ This phone or email is already registered." });

    // Dynamic amount handling (customAmount is in INR, Razorpay expects paise)
    const finalAmount = (customAmount || 1) * 100; 

    const orderOptions = {
      amount:   finalAmount,
      currency: "INR",
      receipt:  `reg_${Date.now()}`,
      notes:    { name, college_name, phone, email, event_names: String(event_names) },
    };

    console.log("📦 Creating Razorpay order:", orderOptions);
    const order = await razorpay.orders.create(orderOptions);
    console.log("✅ Razorpay order created:", order);

    // Pre-insert user with pending status
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert({
        name,
        college_name,
        phone,
        email,
        event_names: String(event_names), 
        team_members: team_members ? JSON.stringify(team_members) : null,
        razorpay_order_id: order.id,
        payment_status:    "pending",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    console.log(`📋 Order created | Order: ${order.id} | User: ${inserted.id}`);

    return res.json({
      success:  true,
      orderId:  order.id,
      userId:   inserted.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error("❌ Create order error:", JSON.stringify(err, null, 2));
    if (err.code === "23505" || err.message?.includes("unique_phone") || err.message?.includes("unique_email"))
      return res.json({ success: false, message: "❌ Already registered with this phone or email." });
    
    const errMsg = err?.error?.description || err?.message || "Unknown error";
    return res.json({ success: false, message: `Failed to create order: ${errMsg}` });
  }
});

/* ── RAZORPAY: VERIFY PAYMENT ── */
app.post("/api/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return res.json({ success: false, message: "Missing payment details." });

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn("⚠️  Signature mismatch");
    return res.json({ success: false, message: "❌ Payment verification failed. Signature mismatch." });
  }

  try {
    // Update payment status
    const { error: updateErr } = await supabase
      .from("users")
      .update({ payment_status: "approved", razorpay_payment_id })
      .eq("razorpay_order_id", razorpay_order_id);

    if (updateErr) throw updateErr;

    // Fetch updated user
    const { data: rows, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id);

    if (fetchErr) throw fetchErr;
    if (!rows || !rows.length)
      return res.json({ success: false, message: "User not found." });

    const user   = rows[0];
    const qrData = `${user.id}-${user.event_names}`;

    // Split event names and store in categorized tables
    const names = (user.event_names || "").split(",").map(n => n.trim()).filter(n => n);
    if (names.length > 0) {
      for (const ename of names) {
        try {
          // Fetch event category by name (using limit(1) to avoid .single() error if duplicates exist)
          const { data: eventRows } = await supabase
            .from("events")
            .select("name, category")
            .ilike("name", ename)
            .limit(1);

          const eventData = eventRows && eventRows.length > 0 ? eventRows[0] : null;

          if (eventData) {
            // Get team members for this specific event
            let eventTeamMembers = "";
            try {
              const allTeamMembers = typeof user.team_members === 'string' 
                ? JSON.parse(user.team_members) 
                : (user.team_members || {});
              
              // We need the event ID to get the team members.
              const { data: eventDetails } = await supabase.from("events").select("id").ilike("name", ename).limit(1);
              if (eventDetails && eventDetails.length > 0) {
                const eid = eventDetails[0].id;
                // Check both string and number keys
                const members = allTeamMembers[eid] || allTeamMembers[String(eid)];
                if (members && Array.isArray(members)) {
                  eventTeamMembers = members.filter(m => m && m.trim()).join(", ");
                }
              }
            } catch (e) {
              console.error("Error parsing team members:", e);
            }

            const regData = {
              user_id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              event_name: eventData.name,
              team_members: eventTeamMembers
            };

            if (eventData.category === "Technical") {
              const { error: regErr } = await supabase.from("technical_registrations").insert(regData);
              if (regErr) console.error(`❌ Technical Reg Error for ${user.name}:`, regErr.message);
              else console.log(`✅ Stored Technical Registration: ${user.name} -> ${eventData.name}`);
            } else if (eventData.category === "Non-Technical") {
              const { error: regErr } = await supabase.from("non_technical_registrations").insert(regData);
              if (regErr) console.error(`❌ Non-Technical Reg Error for ${user.name}:`, regErr.message);
              else console.log(`✅ Stored Non-Technical Registration: ${user.name} -> ${eventData.name}`);
            }
          } else {
            console.warn(`⚠️ Event "${ename}" not found in events table. Cannot categorize.`);
          }
        } catch (catErr) {
          console.error(`⚠️ Categorization error for Event ${ename}:`, catErr.message);
        }
      }
    }

    // Insert transaction history (ignore duplicate)
    await supabase.from("transaction_history").upsert({
      user_id:             user.id,
      name:                user.name,
      email:               user.email,
      phone:               user.phone,
      event_id:            user.event_names, // Using names in the event_id field for history
      razorpay_order_id,
      razorpay_payment_id,
      amount:              "PAID",
      status:              "success",
    }, { onConflict: "razorpay_order_id" });

    console.log(`✅ Payment verified | User: ${user.id} | Payment: ${razorpay_payment_id}`);
    sendConfirmationEmail(user.email, user.name, qrData);

    return res.json({
      success: true,
      userId:  user.id,
      qrData,
      message: "✅ Payment verified! Proceeding to photo.",
    });

  } catch (err) {
    console.error("❌ Verify payment error:", err.message);
    return res.json({ success: false, message: "Database error. Please contact support." });
  }
});

/* ── RAZORPAY: WEBHOOK ── */
app.post("/webhook/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("⚠️  RAZORPAY_WEBHOOK_SECRET not set");
    return res.status(400).json({ error: "Webhook secret not configured" });
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSig) {
    console.warn("⚠️  Invalid webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const payId   = payment.id;
    const amount  = payment.amount;

    console.log(`🔔 Webhook: payment.captured | Order: ${orderId} | Amount: ₹${amount}`);

    if (amount === 100) {
      const { error } = await supabase
        .from("users")
        .update({ payment_status: "approved", razorpay_payment_id: payId })
        .eq("razorpay_order_id", orderId)
        .eq("payment_status", "pending");

      if (error) console.warn("⚠️ Webhook DB update:", error.message);
      else       console.log(`✅ Webhook approved user for order: ${orderId}`);
    }
  }

  res.json({ status: "ok" });
});

/* ── USER STATUS POLL ── */
app.get("/user-status/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("payment_status")
    .eq("id", req.params.id)
    .single();

  if (error || !data) return res.json({ success: false });
  res.json({ success: true, payment_status: data.payment_status });
});

/* ── UPDATE PHOTO ── */
app.post("/api/update-photo", async (req, res) => {
  const { userId, photo } = req.body;
  if (!userId || !photo)
    return res.json({ success: false, message: "userId and photo required." });

  const { error } = await supabase
    .from("users")
    .update({ photo })
    .eq("id", userId);

  if (error) return res.json({ success: false, message: error.message });
  res.json({ success: true });
});

/* ── ADMIN LOGIN ── */
app.post("/admin/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "8h" });
    return res.json({ success: true, token, message: "Login successful" });
  }
  return res.status(401).json({ success: false, message: "❌ Invalid credentials." });
});

/* ── ADMIN: GET ALL USERS ── */
app.get("/admin/users", authenticateAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id, name, college_name, phone, email, event_names, team_members,
      razorpay_order_id, razorpay_payment_id,
      payment_status, created_at, photo,
      events ( name )
    `)
    .order("id", { ascending: false });

  if (error) return res.json([]);

  // Flatten event name to match old shape
  const rows = (data || []).map((u) => ({
    ...u,
    event_name: u.events?.name || null,
    events:     undefined,
  }));

  res.json(rows);
});

/* ── ADMIN: DASHBOARD STATS ── */
app.get("/admin/dashboard-stats", authenticateAdmin, async (_req, res) => {
  try {
    const [totalRes, attRes, refRes, foodRes, usersRes] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("payment_status", "approved"),
      supabase.from("attendance").select("*", { count: "exact", head: true }),
      supabase.from("refreshment").select("*", { count: "exact", head: true }),
      supabase.from("food").select("*", { count: "exact", head: true }),
      supabase.from("users").select("id,name,college_name,phone,email,event_names,team_members,payment_status,created_at").eq("payment_status", "approved").order("id", { ascending: false }),
    ]);
    res.json({
      success: true,
      stats: {
        total:       totalRes.count || 0,
        attended:    attRes.count   || 0,
        refreshment: refRes.count   || 0,
        food:        foodRes.count  || 0,
      },
      users: usersRes.data || [],
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.json({ success: false, message: "Failed to fetch stats." });
  }
});

/* ── ADMIN: APPROVE / REJECT ── */
app.post("/admin/update-status", authenticateAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!["approved", "rejected"].includes(status))
    return res.json({ success: false, message: "Invalid status." });

  const { error } = await supabase
    .from("users")
    .update({ payment_status: status })
    .eq("id", id);

  if (error) return res.json({ success: false });

  await supabase
    .from("transaction_history")
    .update({ status })
    .eq("user_id", id);

  res.json({ success: true, message: `Status updated → ${status}` });
});

/* ── MARK ATTENDANCE (3-STAGE) ── */
app.post("/mark-attendance", scanLimiter, async (req, res) => {
  const { qrData, mode } = req.body; 
  
  // Validation
  if (!qrData) return res.json({ success: false, message: "QR data missing." });
  if (!["attendance", "refreshment", "food"].includes(mode)) {
    return res.json({ success: false, message: "❌ Invalid scan mode." });
  }

  // Parse QR Data robustly
  const parts = qrData.split("-");
  let userId;
  if (parts[0] === "USER") {
    userId = parts[1];
  } else {
    userId = parts[0]; // Fallback for older QR codes
  }

  if (!userId)
    return res.json({ success: false, message: "Invalid QR format." });

  try {
    // 1. Fetch User and all stage records in parallel for maximum speed
    const [userRes, attRes, refRes, foodRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("attendance").select("*").eq("user_id", userId).single(),
      supabase.from("refreshment").select("*").eq("user_id", userId).single(),
      supabase.from("food").select("*").eq("user_id", userId).single()
    ]);

    const user = userRes.data;
    if (userRes.error || !user)
      return res.json({ success: false, message: "❌ User not found." });
    
    if (user.payment_status !== "approved")
      return res.json({ success: false, message: "❌ Payment not approved." });

    const finalStatus = {
      id: user.id,
      name: user.name,
      college_name: user.college_name,
      is_attended: !!attRes.data,
      is_refreshment: !!refRes.data,
      is_food: !!foodRes.data
    };

    // 2. Determine if already marked
    let alreadyMarked = false;
    let targetTable = "";

    if (mode === "attendance") { targetTable = "attendance"; alreadyMarked = finalStatus.is_attended; }
    else if (mode === "refreshment") { targetTable = "refreshment"; alreadyMarked = finalStatus.is_refreshment; }
    else if (mode === "food") { targetTable = "food"; alreadyMarked = finalStatus.is_food; }

    if (alreadyMarked) {
      return res.json({ 
        success: false, 
        message: `⚠️ ${mode.charAt(0).toUpperCase() + mode.slice(1)} already completed.`, 
        user: finalStatus 
      });
    }

    // 3. Mark the specific requested mode
    const { error: insErr } = await supabase
      .from(targetTable)
      .insert({ 
        user_id: user.id, 
        name: user.name, 
        event_names: user.event_names, // Pull directly from DB, avoiding QR string parsing errors
        phone: user.phone 
      });

    if (insErr) throw insErr;

    // Update local status for the response (correctly map each mode to its field)
    if (mode === 'attendance') finalStatus.is_attended = true;
    else if (mode === 'refreshment') finalStatus.is_refreshment = true;
    else if (mode === 'food') finalStatus.is_food = true;

    return res.json({
      success: true,
      message: `✅ ${mode.charAt(0).toUpperCase() + mode.slice(1)} marked!`,
      user: finalStatus,
    });

  } catch (err) {
    console.error("Attendance System Error:", err);
    return res.json({ success: false, message: "❌ Database operation failed." });
  }
});

/* ── EVENTS ── */
app.get("/events", async (_req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (error) return res.json({ success: false, data: [] });
  res.json({ success: true, data });
});

app.post("/events", async (req, res) => {
  const { name, description, date, venue } = req.body;
  if (!name) return res.json({ success: false, message: "Event name required." });

  const { data, error } = await supabase
    .from("events")
    .insert({ name, description: description || "", date: date || null, venue: venue || "" })
    .select()
    .single();

  if (error) return res.json({ success: false, message: error.message });
  res.json({ success: true, id: data.id });
});

/* ── ADMIN: UPDATE EVENT ── */
app.post("/admin/update-event", authenticateAdmin, async (req, res) => {
  const { id, name, venue, status, date, description, start_time } = req.body;
  if (!id) return res.json({ success: false, message: "Event ID required." });

  const { error } = await supabase
    .from("events")
    .update({ name, venue, status, date, description, start_time })
    .eq("id", id);

  if (error) return res.json({ success: false, message: error.message });
  res.json({ success: true, message: "Event updated successfully." });
});

/* ── TRANSACTION HISTORY ── */
app.get("/transaction-history", async (_req, res) => {
  const { data, error } = await supabase
    .from("transaction_history")
    .select("*")
    .order("paid_at", { ascending: false });

  if (error) return res.json({ success: false, data: [] });
  res.json({ success: true, data });
});

/* ── MY TICKET LOOKUP ── */
app.post("/my-ticket", async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.json({ success: false, message: "Email or phone required." });
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .eq("payment_status", "approved");
    if (error || !users || users.length === 0)
      return res.json({ success: false, message: "No confirmed registration found. Check your email/phone." });
    const user = users[0];
    const qrData = `${user.id}-${user.event_names}`;
    const [attRes, refRes, foodRes] = await Promise.all([
      supabase.from("attendance").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("refreshment").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("food").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    res.json({
      success: true,
      user: {
        id: user.id, name: user.name, college_name: user.college_name,
        email: user.email, phone: user.phone, event_names: user.event_names, qrData,
        photo: user.photo,
        team_members: user.team_members,
        is_attended: !!attRes.data, is_refreshment: !!refRes.data, is_food: !!foodRes.data,
      },
    });
  } catch (err) {
    console.error("My ticket error:", err);
    res.json({ success: false, message: "Server error." });
  }
});

/* ── CERTIFICATES LOOKUP ── */
app.post("/api/certificates", async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.json({ success: false, message: "Email or phone required." });
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .eq("payment_status", "approved");

    if (error || !users || users.length === 0) {
      return res.json({ success: false, message: "No registration found. Check your email/phone." });
    }
    const user = users[0];

    // Check attendance for participant certificates
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let participantEvents = [];
    if (attendanceData && attendanceData.event_names) {
      participantEvents = attendanceData.event_names.split(",").map(e => e.trim());
    }

    // Check winners for winner certificates
    const { data: winnersData } = await supabase
      .from("event_winners")
      .select("*, events(name)");
      
    let winnerEvents = [];
    if (winnersData) {
      winnersData.forEach(w => {
        // Name format in DB is often "Name | Dept | College", so we check if the user's name is in it
        const userNameRegex = new RegExp(user.name, 'i');
        let position = null;
        if (w.first_place && userNameRegex.test(w.first_place)) position = "1st Place";
        else if (w.second_place && userNameRegex.test(w.second_place)) position = "2nd Place";
        else if (w.third_place && userNameRegex.test(w.third_place)) position = "3rd Place";

        if (position && w.events && w.events.name) {
          winnerEvents.push({ event_name: w.events.name, position });
        }
      });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        college_name: user.college_name,
        participantEvents,
        winnerEvents
      }
    });

  } catch (err) {
    console.error("Certificate lookup error:", err);
    res.json({ success: false, message: "Server error." });
  }
});

/* ── VERIFY USER (QR scan) ── */
app.get("/verify-user/:id", async (req, res) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !user)
    return res.json({ success: false, message: "Not found." });
  if (user.payment_status !== "approved")
    return res.json({ success: false, message: "Not approved yet." });

  res.json({ success: true, user });
});

/* ── FEEDBACK ── */
app.post("/api/feedback", async (req, res) => {
  const { user_name, college_name, user_id, event_name, rating, comment } = req.body;
  if (!user_name || !college_name || !user_id || !event_name || !rating || !comment)
    return res.status(400).json({ success: false, message: "All fields required." });

  const { error } = await supabase
    .from("feedback")
    .insert({ user_name, college_name, user_id, event_name, rating, comment });

  if (error) {
    console.error("Feedback DB error:", error);
    return res.status(500).json({ success: false });
  }
  res.json({ success: true, message: "Feedback submitted." });
});

app.get("/api/feedback", async (_req, res) => {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ success: false });
  res.json(data);
});

const fs = require("fs");
const WINNERS_FILE = path.join(__dirname, "winners.json");

/* ── EVENT WINNERS ── */
app.post("/api/event-winners", authenticateAdmin, async (req, res) => {
  const { event_id, first_place, second_place, third_place } = req.body;
  if (!event_id) return res.json({ success: false, message: "event_id is required." });

  const { error } = await supabase
    .from("event_winners")
    .upsert(
      { event_id, first_place, second_place, third_place },
      { onConflict: "event_id" }
    );

  if (error) {
    console.error("Winner DB error:", error);
    return res.json({ success: false, message: error.message });
  }
  res.json({ success: true, message: "Winners updated successfully!" });
});

app.get("/api/event-winners/:event_id", async (req, res) => {
  const { data, error } = await supabase
    .from("event_winners")
    .select("*")
    .eq("event_id", req.params.event_id)
    .single();

  if (error && error.code !== 'PGRST116') {
     return res.json({ success: false, message: error.message });
  }
  
  res.json({ success: true, data: data || null });
});

app.get("/api/all-event-winners", async (_req, res) => {
  const { data, error } = await supabase
    .from("event_winners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
     return res.json({ success: false, message: error.message });
  }
  
  res.json({ success: true, data: data || [] });
});

app.delete("/api/all-event-winners", authenticateAdmin, async (_req, res) => {
  // Pass an empty eq/neq condition to ensure all rows are deleted, or delete by id > 0
  const { error } = await supabase
    .from("event_winners")
    .delete()
    .neq("event_id", -1); // deletes everything since event_id is never -1

  if (error) {
     return res.json({ success: false, message: error.message });
  }
  res.json({ success: true, message: "All winners deleted successfully." });
});

/* ── AI FIELD VALIDATION PROXY ── */
app.post("/api/validate-field", async (req, res) => {
  const { field, value } = req.body;
  if (!field || !value) return res.json({ success: true, valid: true, reason: "OK" });

  const rules = {
    name:         { test: (v) => v.trim().length >= 2,           reason: "Enter a valid full name." },
    college_name: { test: (v) => v.trim().length >= 3,           reason: "Enter your college name." },
    phone:        { test: (v) => /^\d{10}$/.test(v.trim()),      reason: "Enter a valid 10-digit mobile number." },
    email:        { test: (v) => /\S+@\S+\.\S+/.test(v.trim()), reason: "Enter a valid email address." },
  };

  const rule = rules[field];
  if (!rule) return res.json({ success: true, valid: true, reason: "OK" });

  try {
    const aiResp = await axios.post(`${AI_SERVICE}/ai/validate-field`, { field, value }, { timeout: 5000 });
    if (aiResp.data?.success !== undefined) return res.json(aiResp.data);
  } catch { /* fall through to local validation */ }

  const isValid = rule.test(value);
  return res.json({ success: true, valid: isValid, reason: isValid ? "Looks good!" : rule.reason });
});

/* ── START SERVER ── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💳 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? "✅ Loaded" : "❌ Missing!"}`);
  console.log(`🔑 Razorpay Secret: ${process.env.RAZORPAY_KEY_SECRET ? "✅ Loaded" : "❌ Missing!"}`);
  console.log(`🔔 Webhook Secret:  ${process.env.RAZORPAY_WEBHOOK_SECRET ? "✅ Loaded" : "❌ Missing!"}`);
  console.log(`🗄️  Supabase URL:    ${process.env.SUPABASE_URL ? "✅ Loaded" : "❌ Missing!"}`);
});
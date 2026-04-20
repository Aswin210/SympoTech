require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const supabase = require("./db");
const path     = require("path");
const crypto   = require("crypto");
const axios    = require("axios");
const Razorpay = require("razorpay");

const app        = express();
const PORT       = process.env.PORT           || 5000;
const AI_SERVICE = process.env.AI_SERVICE_URL || "http://localhost:5001";

/* ── RAZORPAY ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

/* ── RAZORPAY: CREATE ORDER ── */
app.post("/api/create-order", async (req, res) => {
  const { name, college_name, phone, email, event_id } = req.body;

  if (!name || !college_name || !phone || !email || !event_id)
    return res.json({ success: false, message: "All registration fields are required." });
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

    const orderOptions = {
      amount:   100,
      currency: "INR",
      receipt:  `reg_${Date.now()}`,
      notes:    { name, college_name, phone, email, event_id },
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
        event_id,
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
    if (err.code === "23505")
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
    const qrData = `${user.id}-${user.event_id}`;

    // Insert transaction history (ignore duplicate)
    await supabase.from("transaction_history").upsert({
      user_id:             user.id,
      name:                user.name,
      email:               user.email,
      phone:               user.phone,
      event_id:            user.event_id,
      razorpay_order_id,
      razorpay_payment_id,
      amount:              "100",
      status:              "approved",
    }, { onConflict: "razorpay_order_id" });

    console.log(`✅ Payment verified | User: ${user.id} | Payment: ${razorpay_payment_id}`);

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
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString("hex");
    return res.json({ success: true, token, message: "Login successful" });
  }
  return res.status(401).json({ success: false, message: "❌ Invalid credentials." });
});

/* ── ADMIN: GET ALL USERS ── */
app.get("/admin/users", async (_req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id, name, college_name, phone, email, event_id,
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

/* ── ADMIN: APPROVE / REJECT ── */
app.post("/admin/update-status", async (req, res) => {
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

/* ── MARK ATTENDANCE ── */
app.post("/mark-attendance", async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.json({ success: false, message: "QR data missing." });

  const [userId, eventId] = qrData.split("-");
  if (!userId || !eventId)
    return res.json({ success: false, message: "Invalid QR format." });

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userErr || !user)
    return res.json({ success: false, message: "❌ User not found." });
  if (user.payment_status !== "approved")
    return res.json({ success: false, message: "❌ Payment not approved." });

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing)
    return res.json({
      success: false,
      message: "⚠️ Attendance already marked.",
      user: { name: user.name, college_name: user.college_name, phone: user.phone },
    });

  const { error: attErr } = await supabase
    .from("attendance")
    .insert({ user_id: user.id, name: user.name, event_id: eventId, phone: user.phone });

  if (attErr)
    return res.json({ success: false, message: "Failed to mark attendance." });

  res.json({
    success: true,
    message: "✅ Attendance marked!",
    user: { name: user.name, college_name: user.college_name, phone: user.phone },
  });
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

/* ── TRANSACTION HISTORY ── */
app.get("/transaction-history", async (_req, res) => {
  const { data, error } = await supabase
    .from("transaction_history")
    .select("*")
    .order("paid_at", { ascending: false });

  if (error) return res.json({ success: false, data: [] });
  res.json({ success: true, data });
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
  const { user_name, user_id, event_name, rating, comment } = req.body;
  if (!user_name || !user_id || !event_name || !rating || !comment)
    return res.status(400).json({ success: false, message: "All fields required." });

  const { error } = await supabase
    .from("feedback")
    .insert({ user_name, user_id, event_name, rating, comment });

  if (error) return res.status(500).json({ success: false });
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
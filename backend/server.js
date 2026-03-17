const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const Razorpay = require("razorpay");

const app = express();
const PORT = 5000;

/* =========================
   RAZORPAY CONFIG
========================= */

const razorpay = new Razorpay({
  key_id: "YOUR_RAZORPAY_KEY_ID",
  key_secret: "YOUR_RAZORPAY_KEY_SECRET"
});

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

/* =========================
   CREATE PAYMENT ORDER
========================= */

app.post("/create-order", async (req, res) => {

  try {

    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: order
    });

  } catch (error) {

    console.log("Payment order error:", error);

    res.json({
      success: false,
      message: "Payment order failed"
    });

  }

});

/* =================================================
   USER REGISTRATION
================================================= */

app.post("/register", (req, res) => {

  const { name, college_name, phone, email, event_id, photo } = req.body;

  if (!name || !college_name || !phone || !email || !event_id) {

    return res.json({
      success: false,
      message: "All fields required"
    });

  }

  const checkUser = `
    SELECT * FROM users 
    WHERE phone=? OR email=?
  `;

  db.query(checkUser, [phone, email], (err, result) => {

    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    if (result.length > 0) {

      return res.json({
        success: false,
        message: "User already registered"
      });

    }

    const insertUser = `
      INSERT INTO users
      (name,college_name,phone,email,event_id,photo)
      VALUES (?,?,?,?,?,?)
    `;

    db.query(
      insertUser,
      [name, college_name, phone, email, event_id, photo || ""],
      (err, result) => {

        if (err) {
          console.log(err);
          return res.json({ success: false });
        }

        res.json({
          success: true,
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

      if (err) return res.json({ success:false });

      if (result.length === 0) {

        return res.json({
          success:false,
          message:"User not found"
        });

      }

      res.json({
        success:true,
        user:result[0]
      });

    }
  );

});

/* =================================================
   MARK ATTENDANCE
================================================= */

app.put("/mark-attendance/:id",(req,res)=>{

const userId = req.params.id;

db.query(
"SELECT * FROM users WHERE id=?",
[userId],
(err,userResult)=>{

if(err) return res.json({success:false});

if(userResult.length===0){

return res.json({
success:false,
message:"User not found"
});

}

const user=userResult[0];

db.query(
"SELECT * FROM attendance WHERE user_id=?",
[userId],
(err,scanResult)=>{

if(err) return res.json({success:false});

if(scanResult.length>0){

return res.json({
success:false,
message:"Attendance already marked"
});

}

db.query(
`INSERT INTO attendance
(user_id,name,event_id,phone,scan_time)
VALUES (?,?,?,?,NOW())`,
[user.id,user.name,user.event_id,user.phone],
(err)=>{

if(err) return res.json({success:false});

res.json({
success:true,
message:"Attendance marked"
});

});

});

});

});

/* =================================================
   START SERVER
================================================= */

app.listen(PORT,()=>{

console.log(`🚀 Server running on http://localhost:${PORT}`);

});
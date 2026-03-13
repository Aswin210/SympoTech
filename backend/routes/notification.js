const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/sendNotification",(req,res)=>{

const {event_id,message}=req.body;

const sql="INSERT INTO notifications(event_id,message) VALUES(?,?)";

db.query(sql,[event_id,message],(err,result)=>{

if(err) return res.send(err);

res.send("Notification Sent");

});

});

module.exports = router;
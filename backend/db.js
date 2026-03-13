const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",      // put your MySQL password if you have one
  database: "college_events"
});

db.connect((err) => {
  if (err) {
    console.log("❌ MySQL Connection Failed");
    console.log(err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

module.exports = db;
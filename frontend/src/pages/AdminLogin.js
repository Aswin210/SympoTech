import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    /* SIMPLE ADMIN LOGIN */

    if (username === "admin" && password === "1234") {
      localStorage.setItem("admin", "true");

      alert("Admin Login Successful");

      navigate("/scanner");
    } else {
      alert("Invalid Admin Username or Password");
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h2>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <br />
          <br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <br />
          <br />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;

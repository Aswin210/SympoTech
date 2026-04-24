import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Events from "./pages/Events";
import QRScanner from "./pages/QRScanner";
import Register from "./components/Register";
import AdminLogin from "./pages/AdminLogin";
import Feedback from "./pages/Feedback";
import Home from "./pages/Home";
import IDCard from "./pages/IDCard";
import TechnicalEvents from "./pages/TechnicalEvents";
import NonTechnicalEvents from "./pages/NonTechnicalEvents";
import About from "./pages/About";

function App() {
  const getInitialTheme = () => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };

  const [theme, setTheme] = useState(getInitialTheme());

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    
    // Auto-update theme color meta tag if exists
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <Router>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main style={{ minHeight: "100vh", paddingTop: "100px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scanner" element={<QRScanner />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/technical" element={<TechnicalEvents />} />
          <Route path="/non-technical" element={<NonTechnicalEvents />} />
          <Route path="/id-card" element={<IDCard />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
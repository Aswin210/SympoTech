import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Lazy loading components for better browser performance and faster initial load
const Home = lazy(() => import("./pages/Home"));
const Events = lazy(() => import("./pages/Events"));
const QRScanner = lazy(() => import("./pages/QRScanner"));
const Register = lazy(() => import("./components/Register"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Feedback = lazy(() => import("./pages/Feedback"));
const IDCard = lazy(() => import("./pages/IDCard"));
const TechnicalEvents = lazy(() => import("./pages/TechnicalEvents"));
const NonTechnicalEvents = lazy(() => import("./pages/NonTechnicalEvents"));
const About = lazy(() => import("./pages/About"));
const Winners = lazy(() => import("./pages/Winners"));
const AdminPublishWinners = lazy(() => import("./pages/AdminPublishWinners"));

/**
 * Loading Fallback Component
 */
const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
    <div className="pulse" style={{ width: "40px", height: "40px", background: "var(--primary)", borderRadius: "50%" }}></div>
    <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>LOADING SYSTEM...</p>
  </div>
);

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
    
    // Auto-update theme color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#09090b' : '#f4f4f5');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <Router>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main style={{ minHeight: "100vh", paddingTop: "100px" }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/register" element={<Register />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/publish-winners" element={<AdminPublishWinners />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/technical" element={<TechnicalEvents />} />
            <Route path="/non-technical" element={<NonTechnicalEvents />} />
            <Route path="/id-card" element={<IDCard />} />
            <Route path="/about" element={<About />} />
            <Route path="/winners" element={<Winners />} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

export default App;
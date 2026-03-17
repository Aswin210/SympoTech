import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Events from "./pages/Events";
import QRScanner from "./pages/QRScanner";
import Register from "./components/Register";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Feedback from "./pages/Feedback";
import Home from "./pages/Home";
import TechnicalEvents from "./pages/TechnicalEvents";
import NonTechnicalEvents from "./pages/NonTechnicalEvents";

function App() {

  return (

    <Router>

      <Routes>

        {/* HOME */}
        
        <Route path="/" element={<Home />} />

        {/* EVENTS PAGE */}
        <Route path="/events" element={<Events />} />

        {/* REGISTER */}
        <Route path="/register" element={<Register />} />

        {/* QR SCANNER */}
        <Route path="/scanner" element={<QRScanner />} />

        {/* ADMIN LOGIN */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ADMIN DASHBOARD */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* FEEDBACK */}
        <Route path="/feedback" element={<Feedback />} />

        <Route path="/technical" element={<TechnicalEvents />} />
        
        <Route path="/non-technical" element={<NonTechnicalEvents />} />

      </Routes>

    </Router>

  );

}

export default App;
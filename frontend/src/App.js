import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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

        {/* FEEDBACK */}
        <Route path="/feedback" element={<Feedback />} />

        <Route path="/technical" element={<TechnicalEvents />} />
        
        <Route path="/non-technical" element={<NonTechnicalEvents />} />

        <Route path="/id-card" element={<IDCard />} />

        <Route path="/about" element={<About />} />


      </Routes>

    </Router>

  );

}

export default App;
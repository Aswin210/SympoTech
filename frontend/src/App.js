import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import QRScanner from "./pages/QRScanner";
import Events from "./pages/Events";
import Register from "./components/Register";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";


function App() {

  return (

    <Router>

      <Routes>

         <Route path="/" element={<Events />} />

        <Route path="/events" element={<Events />} />

        <Route path="/register" element={<Register />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/scanner" element={<QRScanner />} />
      </Routes>

    </Router>

  );

}

export default App;

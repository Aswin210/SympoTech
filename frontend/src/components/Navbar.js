
import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        Sympotech Event Management System 
      </div>

      <div style={styles.links}>
        
        <Link to="/" style={styles.link}>Home</Link>

        <Link to="/events" style={styles.link}>Events</Link>

        <Link to="/admin-login" style={styles.link}>Admin Login</Link>

        <Link to="/feedback" style={styles.link}>FeedBack</Link>

        <Link to="/about" style={styles.link}>About</Link>
          
        
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#222",
    padding: "12px 20px",
    color: "white"
  },

  logo: {
    fontSize: "35px",
    fontWeight: "bold"
  },

  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },

  link: {
    textDecoration: "none",
    color: "white"
  },

  adminBtn: {
    padding: "6px 12px",
    border: "none",
    background: "#222",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer"
  }
};

export default Navbar;


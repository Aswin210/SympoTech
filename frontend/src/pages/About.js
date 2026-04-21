import React from "react";
import Navbar from "../components/Navbar";

function About() {
  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
    },
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "80px 20px",
      textAlign: "center",
    },
    card: {
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      marginTop: "20px",
    },
    heading: {
      fontSize: "36px",
      fontWeight: "800",
      marginBottom: "20px",
      textTransform: "uppercase",
      letterSpacing: "2px",
    },
    subheading: {
      fontSize: "20px",
      color: "#e0e7ff",
      marginBottom: "30px",
      lineHeight: "1.6",
    },
    section: {
      marginBottom: "30px",
      textAlign: "left",
    },
    sectionTitle: {
      fontSize: "24px",
      fontWeight: "700",
      marginBottom: "15px",
      borderBottom: "2px solid rgba(255,255,255,0.2)",
      paddingBottom: "10px",
    },
    contactInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    contactItem: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      fontSize: "18px",
    },
    icon: {
      fontSize: "24px",
    },
    footer: {
      marginTop: "40px",
      fontSize: "14px",
      color: "rgba(255,255,255,0.6)",
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.heading}>About SympoTech</h1>
        <p style={styles.subheading}>
          SympoTech is a state-of-the-art Event Management System designed to streamline 
          college symposiums and technical fests. From registration to real-time 
          attendance tracking, we provide a seamless experience for both organizers and participants.
        </p>

        <div style={styles.card}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📞 Contact Us</h2>
            <div style={styles.contactInfo}>
              <div style={styles.contactItem}>
                <span style={styles.icon}>📱</span>
                <span><b>General Inquiries:</b> +91 98765 43210</span>
              </div>
              <div style={styles.contactItem}>
                <span style={styles.icon}>☎️</span>
                <span><b>Event Support:</b> +91 80123 45678</span>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>✉️ Email Support</h2>
            <div style={styles.contactInfo}>
              <div style={styles.contactItem}>
                <span style={styles.icon}>📧</span>
                <span><b>Support:</b> support@sympotech.edu</span>
              </div>
              <div style={styles.contactItem}>
                <span style={styles.icon}>🏢</span>
                <span><b>Collaborations:</b> events@college.ac.in</span>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📍 Location</h2>
            <p style={{fontSize: "18px"}}>
              SympoTech Innovation Hub, <br />
              Department of Information Technology, <br />
              Anna University Campus, Chennai - 600025
            </p>
          </div>
        </div>

        <p style={styles.footer}>© 2026 SympoTech Event Management System. All rights reserved.</p>
      </div>
    </div>
  );
}

export default About;

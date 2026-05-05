import React from "react";

/**
 * About Page
 * Refactored for Bento Design System with Mobile Optimization.
 */
function About() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingBottom: "80px" }}>
      <div className="container fade-in" style={{ paddingTop: "20px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 className="gradient-text" style={{ fontSize: "clamp(2.2rem, 8vw, 5rem)" }}>About SympoTech</h1>
          <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", color: "var(--text-secondary)", marginTop: "12px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Pioneering the future of events
          </p>
        </div>

        <div className="grid-bento">
          
          <div className="glass-card col-12" style={{ padding: "clamp(24px, 5vw, 60px)" }}>
            <h2 className="gradient-text" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginBottom: "20px" }}>Our Mission</h2>
            <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", lineHeight: "1.8", color: "var(--text-primary)", opacity: 0.9 }}>
              SympoTech is a state-of-the-art Event Management System designed to streamline 
              college symposiums and technical fests. From registration to real-time 
              attendance tracking, we provide a seamless experience for both organizers and participants.
              We believe in the power of technology to connect minds and foster innovation.
            </p>
          </div>

          <div className="glass-card col-6" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800" }}>📞 Get in Touch</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ fontSize: "20px", background: "var(--glass-bg)", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px", flexShrink: 0 }}>📱</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase" }}>GENERAL</div>
                  <div style={{ fontSize: "clamp(14px, 2vw, 17px)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>+91 98765 43210</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ fontSize: "20px", background: "var(--glass-bg)", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px", flexShrink: 0 }}>☎️</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase" }}>SUPPORT</div>
                  <div style={{ fontSize: "clamp(14px, 2vw, 17px)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>+91 80123 45678</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card col-6" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800" }}>✉️ Email Support</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ fontSize: "20px", background: "var(--glass-bg)", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px", flexShrink: 0 }}>📧</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase" }}>TECHNICAL</div>
                  <div style={{ fontSize: "clamp(14px, 2vw, 17px)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>support@sympotech.edu</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ fontSize: "20px", background: "var(--glass-bg)", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px", flexShrink: 0 }}>🏢</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase" }}>EVENTS</div>
                  <div style={{ fontSize: "clamp(14px, 2vw, 17px)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>events@college.ac.in</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card col-12" style={{ background: "var(--bg-surface)", borderStyle: "dashed" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px" }}>📍 Our Headquarters</h3>
            <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", lineHeight: "1.7", color: "var(--text-secondary)" }}>
              SympoTech Innovation Hub, Department of Information Technology,<br />
              Anna University Campus, Chennai, Tamil Nadu - 600025
            </p>
          </div>

        </div>

        <footer style={{ textAlign: "center", marginTop: "80px", fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "1.5px" }}>
          © 2026 SYMPOTECH • INNOVATING FOR TOMORROW
        </footer>
      </div>
    </div>
  );
}

export default About;

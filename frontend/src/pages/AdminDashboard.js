import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import * as XLSX from "xlsx";
import axios from "axios";
import API_BASE_URL from "../api";

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState({ total: 0, attended: 0, refreshment: 0, food: 0 });
  const [users, setUsers]       = useState([]);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin-login");
  }, [navigate]);

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUsers(data.users || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch { /* network error — keep old data */ }
    finally { setLoading(false); }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events`);
      const data = await res.json();
      if (data.success) {
        // Only update if not currently editing to prevent jumpy inputs
        setEvents(data.data);
      }
    } catch (err) { console.error("Error fetching events:", err); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) { console.error("Error fetching notifications:", err); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchEvents();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchStats();
      fetchEvents();
      fetchNotifications();
    }, 15000); 
    return () => clearInterval(interval);
  }, [fetchStats, fetchEvents, fetchNotifications]);

  const handleLocalEventChange = (eventId, field, value) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, [field]: value } : e));
  };

  const updateEventStatus = async (eventId, field, value) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // 1. Calculate the updated event object
    const updatedEvent = { ...event, [field]: value };

    // 2. Update local state immediately for a snappier feel
    setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

    try {
      // 3. Send update to server
      const res = await fetch(`${API_BASE_URL}/admin/update-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(updatedEvent)
      });
      const data = await res.json();
      if (!data.success) {
        alert("Failed to update: " + data.message);
        fetchEvents(); // Revert on failure
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error updating event.");
      fetchEvents(); // Revert on failure
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;
    setSendingNotif(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify({ message: notifMessage, type: notifType })
      });
      const data = await res.json();
      if (data.success) {
        alert("📢 Notification sent successfully!");
        setNotifMessage("");
        fetchNotifications(); // Refresh list
      } else {
        alert("Failed to send: " + data.message);
      }
    } catch (err) { console.error("Notif error:", err); }
    finally { setSendingNotif(false); }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Permanently delete this notification for all users?")) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/notifications/delete/${id}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.data.success) {
        setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
      } else {
        alert("❌ " + (res.data.message || "Failed to delete"));
      }
    } catch (err) {
      console.error("❌ Delete failed:", err);
      const errMsg = err.response?.data?.message || err.message || "Connection error";
      alert("❌ " + errMsg);
    }
  };

  // ── Excel Export ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const rows = users.map((u, i) => {
      let teamMembersStr = "Solo";
      try {
        if (u.team_members) {
          const parsed = typeof u.team_members === 'string' ? JSON.parse(u.team_members) : u.team_members;
          const allMembers = Object.values(parsed).flat().filter(m => m && m.trim());
          if (allMembers.length > 0) teamMembersStr = allMembers.join(", ");
        }
      } catch (e) { console.error("Export parse error:", e); }

      return {
        "#":           i + 1,
        "Name":        u.name,
        "College":     u.college_name,
        "Phone":       u.phone,
        "Email":       u.email,
        "Events":      u.event_names,
        "Team Members": teamMembersStr,
        "Registered":  new Date(u.created_at).toLocaleString(),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `SympoTech_Participants_${Date.now()}.xlsx`);
  };

  const exportToCSV = () => {
    const rows = users.map((u, i) => {
      let teamMembersStr = "Solo";
      try {
        if (u.team_members) {
          const parsed = typeof u.team_members === 'string' ? JSON.parse(u.team_members) : u.team_members;
          const allMembers = Object.values(parsed).flat().filter(m => m && m.trim());
          if (allMembers.length > 0) teamMembersStr = allMembers.join(", ");
        }
      } catch (e) { console.error("Export parse error:", e); }

      return {
        "S.No":        i + 1,
        "Name":        u.name,
        "College":     u.college_name,
        "Phone":       u.phone,
        "Email":       u.email,
        "Events":      u.event_names,
        "Team Members": teamMembersStr,
        "Registration Date": new Date(u.created_at).toLocaleString(),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SympoTech_Participants_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = {
    labels: ["Attended", "Refreshment", "Food", "Not Yet"],
    datasets: [{
      data: [
        stats.attended,
        stats.refreshment,
        stats.food,
        Math.max(0, stats.total - stats.attended),
      ],
      backgroundColor: ["#10b981", "#6366f1", "#f59e0b", "#27272a"],
      borderColor:     ["#10b981", "#6366f1", "#f59e0b", "#3f3f46"],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#a1a1aa", font: { size: 10, weight: "700" }, padding: 12 } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
    },
    cutout: "75%",
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const pct   = (n) => stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;
  const cards = [
    { label: "Registered",   value: stats.total,       color: "#6366f1", icon: "👥" },
    { label: "Attended",     value: stats.attended,    color: "#10b981", icon: "✅" },
    { label: "Refreshment",  value: stats.refreshment, color: "#6366f1", icon: "🍵" },
    { label: "Food",         value: stats.food,        color: "#f59e0b", icon: "🍽️" },
  ];

  return (
    <div className="admin-page">
      <div className="container dashboard-container fade-in">

        {/* Header */}
        <div className="dashboard-header">
          <div className="header-text">
            <h1 className="gradient-text">Admin Dashboard</h1>
            {lastUpdated && (
              <p className="update-status">
                🔄 Last updated: {lastUpdated} · Auto-refreshes every 10s
              </p>
            )}
          </div>
          <div className="header-actions">
            <button onClick={exportToCSV} className="primary-button action-btn" style={{ background: "var(--secondary)" }}>
              📄 <span className="btn-text">CSV</span>
            </button>
            <button onClick={exportToExcel} className="primary-button action-btn">
              📥 <span className="btn-text">Excel</span>
            </button>
            <button onClick={() => navigate("/scanner")} className="secondary-button action-btn">
              📷 <span className="btn-text">Scanner</span>
            </button>
            <button onClick={() => { localStorage.removeItem("adminToken"); localStorage.removeItem("admin"); navigate("/admin-login"); }}
              className="secondary-button action-btn logout-btn">
              🚪 <span className="btn-text">Logout</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="pulse-loader" />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="stat-grid">
              {cards.map((c) => (
                <div key={c.label} className="glass-card stat-card">
                  <div className="stat-icon">{c.icon}</div>
                  <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                  <div className="stat-label">{c.label}</div>
                  {c.label !== "Registered" && (
                    <div className="stat-progress">
                      <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${pct(c.value)}%`, background: c.color }} />
                      </div>
                      <div className="progress-text">{pct(c.value)}% of total</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chart + Progress Summary */}
            <div className="grid-bento charts-section">
              <div className="glass-card chart-card">
                <h3 className="section-title">Participation Overview</h3>
                <div className="chart-wrapper">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
                <p className="chart-info">
                  {stats.total} total participants registered
                </p>
              </div>

              <div className="glass-card progress-card">
                <h3 className="section-title">Stage Progress</h3>
                {[
                  { label: "Check-in Attendance", value: stats.attended,    total: stats.total, color: "#10b981", icon: "✅" },
                  { label: "Refreshment",          value: stats.refreshment, total: stats.total, color: "#6366f1", icon: "🍵" },
                  { label: "Food / Lunch",         value: stats.food,        total: stats.total, color: "#f59e0b", icon: "🍽️" },
                ].map((s) => (
                  <div key={s.label} className="stage-item">
                    <div className="stage-info">
                      <span className="stage-name">{s.icon} {s.label}</span>
                      <span className="stage-stats" style={{ color: s.color }}>{s.value} / {s.total}</span>
                    </div>
                    <div className="stage-progress-bar">
                      <div className="stage-progress-fill" style={{ width: `${pct(s.value)}%`, background: `linear-gradient(to right, ${s.color}aa, ${s.color})` }} />
                    </div>
                    <div className="stage-pct">{pct(s.value)}% completed</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Participants Table */}
            <div className="glass-card table-card">
              <div className="table-header">
                <h3 className="section-title">👥 All Participants ({users.length})</h3>
                <button onClick={exportToExcel} className="primary-button mobile-hide">📥 Download Excel</button>
              </div>
              <div className="table-container">
                <table className="participants-table">
                  <thead>
                    <tr>
                      {["#", "Name", "College", "Events", "Team Members", "Registered"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id}>
                        <td className="col-hash">{i + 1}</td>
                        <td className="col-name">
                          {u.name}
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{u.email}</div>
                        </td>
                        <td className="col-college">{u.college_name}</td>
                        <td className="col-events" style={{ maxWidth: "150px", fontSize: "11px" }}>{u.event_names}</td>
                        <td className="col-team" style={{ maxWidth: "150px", fontSize: "11px", color: "var(--primary)" }}>
                          {(() => {
                            try {
                              if (!u.team_members) return "Solo";
                              const parsed = typeof u.team_members === 'string' ? JSON.parse(u.team_members) : u.team_members;
                              const allMembers = Object.values(parsed).flat().filter(m => m && m.trim());
                              return allMembers.length > 0 ? allMembers.join(", ") : "Solo";
                            } catch { return "Solo"; }
                          })()}
                        </td>
                        <td className="col-date">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="empty-table">No participants yet.</div>
                )}
              </div>
            </div>

            {/* Event Radar Management */}
            <div className="glass-card table-card" style={{ marginTop: "32px" }}>
              <div className="table-header">
                <h3 className="section-title">📡 Event Radar Management ({events.length})</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Manage live status and venues</p>
              </div>
              <div className="table-container">
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Category</th>
                      <th>Venue</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td className="col-name" style={{ fontWeight: "800", color: "var(--primary)" }}>{e.name}</td>
                        <td style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>{e.category}</td>
                        <td>
                          <input 
                            type="text" 
                            value={e.venue || ""} 
                            placeholder="TBA"
                            onChange={(evt) => handleLocalEventChange(e.id, "venue", evt.target.value)}
                            onBlur={(evt) => updateEventStatus(e.id, "venue", evt.target.value)}
                            className="admin-input"
                            style={{ width: "140px" }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={e.start_time || ""} 
                            placeholder="e.g. 10:30 AM"
                            onChange={(evt) => handleLocalEventChange(e.id, "start_time", evt.target.value)}
                            onBlur={(evt) => updateEventStatus(e.id, "start_time", evt.target.value)}
                            className="admin-input"
                            style={{ width: "120px" }}
                          />
                        </td>
                        <td>
                          <select 
                            value={e.status || "upcoming"} 
                            onChange={(evt) => updateEventStatus(e.id, "status", evt.target.value)}
                            className="admin-select"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notification Broadcast */}
            <div className="glass-card table-card" style={{ marginTop: "32px" }}>
              <div className="table-header">
                <h3 className="section-title">📢 Broadcast Live Notification</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Send real-time updates to all users</p>
              </div>
              <form onSubmit={sendBroadcast} className="notif-form" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                <input 
                  type="text" 
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type your announcement here..."
                  className="premium-input"
                  style={{ flex: 1, minWidth: "250px" }}
                />
                <select 
                  value={notifType} 
                  onChange={(e) => setNotifType(e.target.value)}
                  className="admin-select"
                  style={{ height: "54px" }}
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="success">✅ Success</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="danger">🚨 Alert</option>
                </select>
                <button type="submit" disabled={sendingNotif} className="primary-button" style={{ padding: "0 32px", height: "54px" }}>
                  {sendingNotif ? "Sending..." : "🚀 Broadcast"}
                </button>
              </form>

              {/* Notification History */}
              {notifications.length > 0 && (
                <div className="notif-history" style={{ marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "12px", color: "var(--text-secondary)" }}>Sent Notifications</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ fontSize: "16px" }}>
                            {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'danger' ? '🚨' : 'ℹ️'}
                          </span>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: "600", margin: 0 }}>{n.message}</p>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteNotification(n.id)}
                          style={{ background: "rgba(244, 63, 94, 0.1)", border: "none", color: "var(--danger)", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .admin-page { min-height: 100vh; background: var(--bg-app); padding-bottom: 80px; }
        .dashboard-container { padding-top: 20px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .header-text h1 { font-size: clamp(24px,6vw,36px); font-weight: 900; }
        .update-status { color: var(--text-muted); font-size: 12px; font-weight: 600; margin-top: 4px; }
        .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .action-btn { padding: 12px 16px; font-size: 13px; }
        
        .loading-state { text-align: center; padding: 80px 0; }
        .pulse-loader { width: 48px; height: 48px; background: var(--primary); border-radius: 50%; margin: 0 auto 16px; animation: pulse 1.5s infinite; }
        
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { padding: 24px; text-align: center; }
        .stat-icon { font-size: 36px; margin-bottom: 12px; }
        .stat-value { font-size: 42px; font-weight: 900; line-height: 1; }
        .stat-label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
        .stat-progress { margin-top: 12px; }
        .progress-bg { height: 4px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .progress-text { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-weight: 700; }
        
        .charts-section { margin-bottom: 32px; }
        .chart-card { grid-column: span 5; padding: 32px; display: flex; flex-direction: column; align-items: center; }
        .section-title { font-weight: 900; font-size: 18px; margin-bottom: 24px; align-self: flex-start; }
        .chart-wrapper { position: relative; height: 240px; width: 100%; }
        .chart-info { color: var(--text-muted); font-size: 13px; font-weight: 700; margin-top: 20px; text-align: center; }
        
        .progress-card { grid-column: span 7; padding: 32px; }
        .stage-item { margin-bottom: 28px; }
        .stage-info { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .stage-name { font-weight: 800; font-size: 14px; }
        .stage-stats { font-weight: 900; font-size: 14px; }
        .stage-progress-bar { height: 10px; background: var(--border); border-radius: 100px; overflow: hidden; }
        .stage-progress-fill { height: 100%; border-radius: 100px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .stage-pct { font-size: 11px; color: var(--text-muted); margin-top: 4px; font-weight: 700; }
        
        .table-card { padding: 32px; }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .participants-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .participants-table th { text-align: left; padding: 12px 16px; font-size: 10px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
        .participants-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .col-hash { color: var(--text-muted); font-weight: 700; }
        .col-name { font-weight: 800; }
        .col-college, .col-phone, .col-email { color: var(--text-secondary); }
        .col-phone { font-family: monospace; }
        .col-date { color: var(--text-muted); font-size: 11px; }
        .empty-table { text-align: center; padding: 48px; color: var(--text-muted); }

        @media (max-width: 1024px) {
          .chart-card, .progress-card { grid-column: span 2 !important; }
        }

        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .chart-card, .progress-card { grid-column: span 1 !important; padding: 24px; }
          .table-card { padding: 20px; }
          .mobile-hide { display: none; }
          .btn-text { display: none; }
          .action-btn { padding: 10px; }
          .logout-btn { margin-left: auto; }
        }
        
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }

        .admin-input {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          outline: none;
          transition: all 0.2s ease;
        }
        .admin-input:focus {
          border-color: var(--primary);
          background: var(--bg-card-hover);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }
        .admin-select {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
        }
        .admin-select:hover {
          background: var(--bg-card-hover);
          border-color: var(--text-secondary);
        }
        .admin-select option {
          background: var(--bg-card);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;


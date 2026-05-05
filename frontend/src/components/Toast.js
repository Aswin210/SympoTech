import React, { useEffect } from "react";

/**
 * Reusable Toast notification component.
 * Replaces browser alert() with a premium sliding notification.
 */
function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: { bg: "#10b981", icon: "✅" },
    error:   { bg: "#f43f5e", icon: "❌" },
    warning: { bg: "#f59e0b", icon: "⚠️" },
    info:    { bg: "#6366f1", icon: "ℹ️" },
  };
  const s = styles[type] || styles.info;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: "fixed", top: "90px", right: "20px", zIndex: 99999,
        background: s.bg, color: "#fff",
        padding: "16px 20px", borderRadius: "16px",
        display: "flex", alignItems: "center", gap: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        animation: "toastIn 0.4s cubic-bezier(0.16,1,0.3,1)",
        maxWidth: "360px", minWidth: "260px",
        fontWeight: "700", fontSize: "14px",
        fontFamily: "inherit",
      }}>
        <span style={{ fontSize: "20px", flexShrink: 0 }}>{s.icon}</span>
        <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.25)", border: "none",
            color: "#fff", borderRadius: "8px",
            width: "28px", height: "28px", cursor: "pointer",
            fontSize: "16px", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}
        >×</button>
      </div>
    </>
  );
}

export default Toast;

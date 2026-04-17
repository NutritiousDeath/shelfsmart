import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, color = "blue", alert = false, loading, linkTo }) {
  const iconColors = {
    blue:   "#4da6ff",
    amber:  "var(--primary)",
    red:    "#ff4444",
    orange: "#ff8c00",
    green:  "#00ff88",
  };

  const iconColor = iconColors[color] || "var(--primary)";
  const isAlert = alert && value > 0;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${isAlert ? "rgba(255,68,68,0.3)" : "var(--primary-border)"}`,
      borderRadius: 4,
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 4, marginBottom: "0.75rem",
        background: "var(--primary-dim)",
        border: "1px solid var(--primary-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: iconColor,
      }}>
        <Icon size={18} />
      </div>

      {/* Value */}
      {loading ? (
        <div style={{ height: 28, background: "rgba(74,80,104,0.2)", borderRadius: 3, width: 48, marginBottom: 4, animation: "ss-pulse 1.5s infinite" }} />
      ) : (
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: isAlert ? "#ff4444" : "var(--white)",
          lineHeight: 1.2,
        }}>{value}</p>
      )}

      {/* Label */}
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        letterSpacing: "1px",
        color: "var(--grey)",
        marginTop: 4,
        flex: 1,
      }}>{label}</p>

      {/* Link */}
      {linkTo && (
        <Link
          to={linkTo}
          style={{
            marginTop: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "1px",
            color: "var(--primary)",
            padding: "6px 0",
            borderTop: "1px solid var(--primary-border)",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          VIEW <ArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}
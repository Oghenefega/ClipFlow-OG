import React from "react";
import T from "../styles/theme";

export default function PlaceholderView({ title, subtitle }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.6px" }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: T.textSecondary, fontSize: 14, margin: "6px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div
        style={{
          background: T.surface,
          borderRadius: T.radius.lg,
          border: `1px solid ${T.border}`,
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🚧</div>
        <div style={{ color: T.textTertiary, fontSize: 16, fontWeight: 600 }}>
          This view will be built next
        </div>
        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 8 }}>
          The Rename tab is fully functional — start there
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function StarRating({ rating = 0, max = 5, size = "1rem", interactive = false, onRate }) {
  const stars = [];

  for (let i = 1; i <= max; i++) {
    const isFilled = i <= Math.round(rating);
    stars.push(
      <span
        key={i}
        onClick={() => interactive && onRate && onRate(i)}
        style={{
          cursor: interactive ? "pointer" : "default",
          fontSize: size,
          color: isFilled ? "#f59e0b" : "#4b5563",
          transition: "transform 0.15s ease",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (interactive) e.currentTarget.style.transform = "scale(1.2)";
        }}
        onMouseLeave={(e) => {
          if (interactive) e.currentTarget.style.transform = "scale(1)";
        }}
      >
        ★
      </span>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {stars}
      {rating > 0 && !interactive && (
        <span style={{ marginLeft: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}

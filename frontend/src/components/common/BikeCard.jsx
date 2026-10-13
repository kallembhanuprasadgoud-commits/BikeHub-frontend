import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { wishlistApi } from "../../services/wishlistApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function BikeCard({ bike, isWishlisted = false, onWishlistChange, onCompareToggle, isSelectedForCompare = false }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [inWishlist, setInWishlist] = useState(isWishlisted);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Primary or Fallback image
  const primaryImage =
    bike.primaryImageUrl ||
    (bike.images && bike.images.length > 0
      ? bike.images.find((img) => img.isPrimary)?.imageUrl || bike.images[0].imageUrl
      : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80");

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please log in to save bikes to your wishlist");
      navigate("/login");
      return;
    }

    try {
      setLoadingWishlist(true);
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(bike.id);
        setInWishlist(false);
        toast.success("Removed from wishlist");
        if (onWishlistChange) onWishlistChange(bike.id, false);
      } else {
        await wishlistApi.addToWishlist(bike.id);
        setInWishlist(true);
        toast.success("Added to wishlist!");
        if (onWishlistChange) onWishlistChange(bike.id, true);
      }
    } catch (err) {
      toast.error("Could not update wishlist");
    } finally {
      setLoadingWishlist(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <div
      className="card card-hover"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: 0,
        position: "relative",
      }}
    >
      {/* Thumbnail area */}
      <div style={{ position: "relative", width: "100%", height: "200px", background: "#0b0f19", overflow: "hidden" }}>
        <img
          src={primaryImage}
          alt={`${bike.brand} ${bike.model}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80";
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />

        {/* Condition Badge */}
        <span
          className={`badge ${bike.condition === "NEW" ? "badge-success" : "badge-primary"}`}
          style={{ position: "absolute", top: "12px", left: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {bike.condition?.replace("_", " ")}
        </span>

        {/* Sold / Status Badge */}
        {bike.status && bike.status !== "AVAILABLE" && (
          <span
            className="badge badge-danger"
            style={{ position: "absolute", top: "12px", left: "80px", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {bike.status}
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          disabled={loadingWishlist}
          title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(17, 24, 39, 0.75)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: inWishlist ? "#ef4444" : "#9ca3af",
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "transform 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {inWishlist ? "♥" : "♡"}
        </button>
      </div>

      {/* Card Details */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1, gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600, textTransform: "uppercase" }}>
              {bike.brand}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{bike.year}</span>
          </div>

          <Link to={`/bikes/${bike.id}`} style={{ textDecoration: "none" }}>
            <h3
              style={{
                fontSize: "1.15rem",
                color: "var(--text-primary)",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={`${bike.brand} ${bike.model}`}
            >
              {bike.model}
            </h3>
          </Link>
        </div>

        {/* Spec Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
            📍 {bike.city || "Pan India"}
          </span>
          <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
            🛣 {(bike.kmDriven ?? bike.kilometersDriven ?? 0).toLocaleString()} km
          </span>
          {bike.engineCc && (
            <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
              ⚡ {bike.engineCc} cc
            </span>
          )}
        </div>

        {/* Price and Action Buttons */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Price</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              {formatPrice(bike.price)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {onCompareToggle && (
              <button
                onClick={() => onCompareToggle(bike)}
                className={`btn btn-sm ${isSelectedForCompare ? "btn-primary" : "btn-secondary"}`}
                title="Compare specs with other bikes"
              >
                {isSelectedForCompare ? "✓ Compare" : "+ Compare"}
              </button>
            )}
            <Link to={`/bikes/${bike.id}`} className="btn btn-sm btn-primary">
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

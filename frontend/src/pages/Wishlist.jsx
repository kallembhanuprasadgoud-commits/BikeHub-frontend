import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { wishlistApi } from "../services/wishlistApi";
import BikeCard from "../components/common/BikeCard";
import Loader from "../components/common/Loader";

export default function Wishlist() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      try {
        setLoading(true);
        const data = await wishlistApi.getWishlist();
        setBikes(data || []);
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, []);

  const handleWishlistChange = (bikeId, isSaved) => {
    if (!isSaved) {
      setBikes((prev) => prev.filter((b) => b.id !== bikeId));
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Saved Motorcycles</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Your bookmarked motorcycles for quick price tracking and inquiries
        </p>
      </div>

      {loading ? (
        <Loader message="Loading saved bikes..." />
      ) : bikes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>♥</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Your wishlist is currently empty</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Click the heart icon on any motorcycle to bookmark it for later.
          </p>
          <Link to="/listings" className="btn btn-primary">
            Explore Bikes for Sale &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid-listing">
          {bikes.map((bike) => (
            <BikeCard
              key={bike.id}
              bike={bike}
              isWishlisted={true}
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

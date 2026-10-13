import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { bikeApi } from "../services/bikeApi";
import { aiApi } from "../services/aiApi";
import BikeCard from "../components/common/BikeCard";
import Loader from "../components/common/Loader";

const POPULAR_BRANDS = [
  { name: "Royal Enfield", icon: "👑" },
  { name: "KTM", icon: "⚡" },
  { name: "Yamaha", icon: "🏁" },
  { name: "Kawasaki", icon: "🐉" },
  { name: "Honda", icon: "🔴" },
  { name: "TVS", icon: "🐎" },
  { name: "Bajaj", icon: "⚙️" },
  { name: "BMW", icon: "🔵" },
];

export default function Home() {
  const navigate = useNavigate();
  const [featuredBikes, setFeaturedBikes] = useState([]);
  const [recommendedBikes, setRecommendedBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load latest listings
        const bikePage = await bikeApi.getBikes({ page: 0, size: 6, sortBy: "createdAt", sortDir: "desc" });
        setFeaturedBikes(bikePage.content || []);

        // Load AI recommendations
        try {
          const recs = await aiApi.getRecommendations(4);
          setRecommendedBikes(recs || []);
        } catch (e) {
          console.warn("AI recommendation fallback:", e);
        }
      } catch (err) {
        console.error("Error loading home page listings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    if (selectedCity) params.append("city", selectedCity);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4.5rem", paddingBottom: "4rem" }}>
      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          minHeight: "560px",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 15, 25, 1) 100%)",
          borderBottom: "1px solid var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        {/* Subtle background ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1, padding: "3rem 1.25rem" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
            <span
              className="badge badge-primary animate-fade"
              style={{ marginBottom: "1.25rem", padding: "0.4rem 1rem", fontSize: "0.85rem" }}
            >
              🚀 Verified Motorcycle Platform
            </span>

            <h1
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                marginBottom: "1.25rem",
              }}
            >
              Buy & Sell Bikes With <span style={{ color: "var(--accent-primary)" }}>Verified Trust</span>
            </h1>

            <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", marginBottom: "2.5rem", lineHeight: 1.6 }}>
              Browse certified pre-owned & new superbikes. Get instant AI valuations, chat directly with sellers, and complete purchases with secure Razorpay escrow.
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="glass-panel"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div style={{ flex: "2 1 240px" }}>
                <input
                  type="text"
                  placeholder="Search by model, brand (e.g. Duke 390, Classic 350)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                  style={{ background: "transparent", border: "none", padding: "0.85rem 1rem" }}
                />
              </div>

              <div style={{ flex: "1 1 160px" }}>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="form-control"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", padding: "0.85rem" }}
                >
                  <option value="">All Cities</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 1.75rem", flex: "0 0 auto" }}>
                🔍 Search Bikes
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Brands Carousel */}
      <section className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem" }}>Explore by Make</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Find top models from leading global manufacturers</p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "1rem",
          }}
        >
          {POPULAR_BRANDS.map((b) => (
            <Link
              key={b.name}
              to={`/listings?brand=${encodeURIComponent(b.name)}`}
              className="card card-hover"
              style={{
                textAlign: "center",
                padding: "1.25rem 0.75rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "2rem" }}>{b.icon}</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Bikes Section */}
      <section className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem" }}>Latest Bike Listings</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Freshly listed motorcycles available right now</p>
          </div>
          <Link to="/listings" className="btn btn-sm btn-outline">
            View All ({featuredBikes.length}+) &rarr;
          </Link>
        </div>

        {loading ? (
          <Loader message="Loading latest motorcycles..." />
        ) : featuredBikes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "var(--text-muted)" }}>No bikes listed yet. Be the first to sell!</p>
            <Link to="/seller/add-bike" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              List a Bike
            </Link>
          </div>
        ) : (
          <div className="grid-listing">
            {featuredBikes.map((bike) => (
              <BikeCard key={bike.id} bike={bike} />
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations Section */}
      {recommendedBikes.length > 0 && (
        <section className="container">
          <div
            className="glass-panel"
            style={{
              padding: "2rem",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.8rem" }}>🤖</span>
              <div>
                <h2 style={{ fontSize: "1.5rem" }}>AI-Recommended For You</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Trained on user interactions, popular categories, and market trends
                </p>
              </div>
            </div>

            <div className="grid-listing">
              {recommendedBikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value Proposition / Features Grid */}
      <section className="container">
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 2.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Why Choose BikeHub?</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Engineered to solve the trust deficit in pre-owned vehicle purchases.
          </p>
        </div>

        <div className="grid-3">
          <div className="card">
            <div style={{ fontSize: "2.2rem", marginBottom: "1rem", color: "var(--accent-primary)" }}>🛡</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>100% Verified Sellers</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Every dealership and private seller submits proof of identity and registration papers verified by administrators.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: "2.2rem", marginBottom: "1rem", color: "var(--accent-blue)" }}>🧠</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>AI Price Intelligence</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Machine learning models analyze depreciation, condition, and odometer readings to prevent overpaying or underpricing.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: "2.2rem", marginBottom: "1rem", color: "var(--accent-success)" }}>💳</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Razorpay Escrow Safety</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Secure test-mode tokenized checkout guarantees vehicle lock upon booking with transparent delivery milestones.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="container">
        <div
          className="glass-panel"
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(30, 41, 59, 0.8) 100%)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
          }}
        >
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Ready to Sell Your Motorcycle?</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
            Reach thousands of verified riders in your city. Get real-time chat inquiries and sell within 48 hours.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/seller/add-bike" className="btn btn-lg btn-primary">
              List Your Bike Free
            </Link>
            <Link to="/ai-valuation" className="btn btn-lg btn-secondary">
              Check Bike Market Value
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

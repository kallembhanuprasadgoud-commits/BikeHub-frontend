import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { bikeApi } from "../services/bikeApi";
import Loader from "../components/common/Loader";

export default function CompareBikes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get("ids") || "";

  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableBikes, setAvailableBikes] = useState([]);

  useEffect(() => {
    async function loadComparison() {
      if (!idsParam) {
        setBikes([]);
        return;
      }
      try {
        setLoading(true);
        const data = await bikeApi.compareBikes(idsParam.split(",").map((s) => s.trim()));
        setBikes(data || []);
      } catch (err) {
        console.error("Failed to compare bikes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [idsParam]);

  // Load a quick list of bikes to pick for comparison if slots are open
  useEffect(() => {
    async function loadPickerList() {
      try {
        const res = await bikeApi.getBikes({ size: 10, status: "AVAILABLE" });
        setAvailableBikes(res.content || []);
      } catch (e) {
        // ignore
      }
    }
    loadPickerList();
  }, []);

  const handleAddBike = (bikeId) => {
    const currentIds = idsParam ? idsParam.split(",").filter(Boolean) : [];
    if (!currentIds.includes(String(bikeId))) {
      currentIds.push(String(bikeId));
      setSearchParams({ ids: currentIds.join(",") });
    }
  };

  const handleRemoveBike = (bikeId) => {
    const updatedIds = idsParam
      .split(",")
      .filter((id) => id !== String(bikeId))
      .join(",");
    setSearchParams(updatedIds ? { ids: updatedIds } : {});
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  // Helper to determine lowest price among compared
  const lowestPrice = bikes.length > 1 ? Math.min(...bikes.map((b) => b.price)) : null;
  const lowestKm = bikes.length > 1 ? Math.min(...bikes.map((b) => b.kilometersDriven || 0)) : null;

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Compare Motorcycles Side-by-Side</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Evaluate technical specifications, pricing, odometer readings, and condition across models
        </p>
      </div>

      {loading ? (
        <Loader message="Loading comparison matrix..." />
      ) : bikes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚖️</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>No Motorcycles Selected for Comparison</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
            Select 2 or 3 bikes from the marketplace or pick from our suggested popular models below.
          </p>

          <div style={{ maxWidth: "400px", margin: "0 auto 2rem", textAlign: "left" }}>
            <label className="form-label">Quickly Pick a Motorcycle to Compare:</label>
            <select
              className="form-control"
              onChange={(e) => e.target.value && handleAddBike(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                -- Select a bike --
              </option>
              {availableBikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand} {b.model} ({b.year}) - {formatPrice(b.price)}
                </option>
              ))}
            </select>
          </div>

          <Link to="/listings" className="btn btn-primary">
            Browse All Motorcycles &rarr;
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          {/* Quick slot addition selector if less than 3 bikes */}
          {bikes.length < 3 && (
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Add another bike to compare ({bikes.length}/3 slots):
              </span>
              <select
                className="form-control"
                style={{ width: "auto" }}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddBike(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  + Add bike...
                </option>
                {availableBikes
                  .filter((ab) => !bikes.some((b) => b.id === ab.id))
                  .map((ab) => (
                    <option key={ab.id} value={ab.id}>
                      {ab.brand} {ab.model} ({ab.year})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Comparison Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <thead>
              <tr style={{ background: "var(--bg-surface-elevated)" }}>
                <th style={{ padding: "1.25rem", textAlign: "left", width: "220px", color: "var(--text-muted)" }}>
                  Specification / Feature
                </th>
                {bikes.map((bike) => (
                  <th key={bike.id} style={{ padding: "1.25rem", textAlign: "center", minWidth: "260px" }}>
                    <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                      <button
                        onClick={() => handleRemoveBike(bike.id)}
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          background: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                        }}
                        title="Remove from comparison"
                      >
                        ✕
                      </button>
                      <img
                        src={
                          bike.images && bike.images[0]
                            ? bike.images[0].imageUrl
                            : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={bike.model}
                        style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px" }}
                      />
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 700 }}>{bike.brand}</div>
                    <h3 style={{ fontSize: "1.15rem", margin: "0.2rem 0" }}>{bike.model}</h3>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                      {formatPrice(bike.price)}
                      {lowestPrice && bike.price === lowestPrice && (
                        <span className="badge badge-success" style={{ marginLeft: "6px", verticalAlign: "middle" }}>
                          Best Price
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.75rem" }}>
                      <Link to={`/bikes/${bike.id}`} className="btn btn-sm btn-outline">
                        View Details
                      </Link>
                      <Link to={`/checkout/${bike.id}`} className="btn btn-sm btn-primary">
                        Buy Now
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Year */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Manufacturing Year</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "#fff", fontWeight: 700 }}>
                    {b.year}
                  </td>
                ))}
              </tr>

              {/* Engine Displacement */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Engine Displacement</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "#fff" }}>
                    {b.engineCc ? `${b.engineCc} cc` : "N/A"}
                  </td>
                ))}
              </tr>

              {/* Kilometers Driven */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Kilometers Driven</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "#fff" }}>
                    {b.kilometersDriven?.toLocaleString() || 0} km
                    {lowestKm && b.kilometersDriven === lowestKm && (
                      <span className="badge badge-info" style={{ marginLeft: "6px" }}>
                        Lowest KM
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Condition */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Condition</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center" }}>
                    <span className={`badge ${b.condition === "NEW" ? "badge-success" : "badge-primary"}`}>
                      {b.condition?.replace("_", " ")}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Fuel Type */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Fuel Type</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    {b.fuelType || "Petrol"}
                  </td>
                ))}
              </tr>

              {/* Transmission */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Transmission</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    {b.transmission || "Manual"}
                  </td>
                ))}
              </tr>

              {/* City / Location */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Location</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    📍 {b.city || "Pan India"}
                  </td>
                ))}
              </tr>

              {/* Seller */}
              <tr style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontWeight: 600 }}>Seller</td>
                {bikes.map((b) => (
                  <td key={b.id} style={{ padding: "1rem", textAlign: "center", color: "#fff" }}>
                    {b.sellerName || "Verified Dealer"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

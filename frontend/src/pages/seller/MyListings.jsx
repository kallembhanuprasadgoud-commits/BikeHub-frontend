import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bikeApi } from "../../services/bikeApi";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

export default function MyListings() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        const res = await bikeApi.getMyListings({ size: 50 });
        setBikes(res.content || res || []);
      } catch (err) {
        console.error("Failed to load seller listings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      await bikeApi.deleteBike(id);
      setBikes(bikes.filter((b) => b.id !== id));
      toast.success("Listing deleted successfully");
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>My Vehicle Listings</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Manage active motorcycle inventory, pricing, status updates, and deletions
          </p>
        </div>
        <Link to="/seller/add-bike" className="btn btn-primary">
          + Add New Listing
        </Link>
      </div>

      {loading ? (
        <Loader message="Loading your inventory..." />
      ) : bikes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏍</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>No listings found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            List your first motorcycle to reach verified buyers across your city.
          </p>
          <Link to="/seller/add-bike" className="btn btn-primary">
            Create First Listing &rarr;
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bikes.map((bike) => {
            const primaryImage =
              bike.images && bike.images.length > 0
                ? bike.images[0].imageUrl
                : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80";

            return (
              <div
                key={bike.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  flexWrap: "wrap",
                  gap: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <img
                    src={primaryImage}
                    alt={bike.model}
                    style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "8px" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                        {bike.brand}
                      </span>
                      <span className={`badge ${bike.status === "AVAILABLE" ? "badge-success" : "badge-danger"}`}>
                        {bike.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1.15rem", margin: "2px 0" }}>{bike.model}</h3>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {bike.year} • {bike.kilometersDriven?.toLocaleString() || 0} km • 📍 {bike.city || "Pan India"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Asking Price</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>
                      {formatPrice(bike.price)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link to={`/bikes/${bike.id}`} className="btn btn-sm btn-outline">
                      View
                    </Link>
                    <Link to={`/seller/edit-bike/${bike.id}`} className="btn btn-sm btn-secondary">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(bike.id)} className="btn btn-sm btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

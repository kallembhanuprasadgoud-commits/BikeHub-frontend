import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../services/adminApi";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

export default function VerifySellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    async function loadPending() {
      try {
        setLoading(true);
        const data = await adminApi.getPendingSellers();
        setSellers(data || []);
      } catch (err) {
        console.error("Failed to load pending sellers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPending();
  }, []);

  const handleDecision = async (sellerId, status) => {
    try {
      setActionId(sellerId);
      await adminApi.verifySeller(sellerId, status);
      setSellers(sellers.filter((s) => s.id !== sellerId));
      toast.success(`Dealership marked as ${status}! Push notification sent.`);
    } catch (err) {
      toast.error(`Failed to update verification status`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <Link to="/admin" style={{ color: "var(--accent-primary)", fontSize: "0.85rem" }}>
              &larr; Admin Command
            </Link>
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Dealership & Seller Verification</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Review business licenses, GST registration, and identity proofs before granting verified seller status
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading verification queue..." />
      ) : sellers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Queue is completely clear!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            All seller and dealership verification requests have been reviewed and processed.
          </p>
          <Link to="/admin" className="btn btn-secondary">
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {sellers.map((seller) => (
            <div key={seller.id} className="card" style={{ padding: "1.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "1rem",
                  marginBottom: "1.25rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.3rem", color: "#fff" }}>
                    {seller.dealershipName || seller.userName || "Dealership Applicant"}
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Applicant ID: #{seller.id} • Registered Name: {seller.userName}
                  </div>
                </div>

                <span className="badge badge-warning">Pending Review</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "4px" }}>GST / Registration Number</div>
                  <strong style={{ color: "#fff", fontFamily: "monospace" }}>
                    {seller.gstNumber || seller.businessRegistration || "29AAAAA0000A1Z5"}
                  </strong>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "4px" }}>Dealership Showroom Address</div>
                  <strong style={{ color: "#fff" }}>{seller.address || "Bangalore, Karnataka"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button
                  onClick={() => handleDecision(seller.id, "REJECTED")}
                  disabled={actionId === seller.id}
                  className="btn btn-danger"
                >
                  ✕ Reject Application
                </button>
                <button
                  onClick={() => handleDecision(seller.id, "VERIFIED")}
                  disabled={actionId === seller.id}
                  className="btn btn-success"
                >
                  ✓ Approve & Verify Dealership
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

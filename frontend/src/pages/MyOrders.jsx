import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../services/orderApi";
import Loader from "../components/common/Loader";
import toast from "react-hot-toast";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getMyOrders();
      setOrders(res.content || res || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? This will release the bike for other buyers.")) {
      return;
    }
    try {
      setCancellingId(orderId);
      await orderApi.cancelOrder(orderId);
      toast.success("Order cancelled successfully");
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return <span className="badge badge-success">Paid / Escrow Locked</span>;
      case "SHIPPED":
        return <span className="badge badge-info">Out for Inspection</span>;
      case "DELIVERED":
        return <span className="badge badge-success">Delivered & Verified</span>;
      case "CANCELLED":
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-warning">{status || "Pending Payment"}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>My Motorcycle Orders & Bookings</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Track escrow status, scheduled delivery dates, and payment history
        </p>
      </div>

      {loading ? (
        <Loader message="Loading your orders..." />
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛍</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>No orders placed yet</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Explore our curated inventory and book your dream motorcycle with verified escrow safety.
          </p>
          <Link to="/listings" className="btn btn-primary">
            Browse Motorcycles &rarr;
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {orders.map((order) => {
            const bikeId = order.bike?.id || order.bikeId;
            const bikeBrand = order.bike?.brand || order.bikeBrand;
            const bikeModel = order.bike?.model || order.bikeModel;
            const bikePrice = order.amount || order.totalAmount;

            return (
              <div key={order.id} className="card" style={{ padding: "1.5rem" }}>
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
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Order ID: <strong style={{ color: "#fff" }}>#{order.id}</strong> •{" "}
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}
                    </div>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                      {bikeBrand}
                    </span>
                    <h3 style={{ fontSize: "1.25rem", margin: "2px 0 0.5rem" }}>{bikeModel}</h3>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>
                      {formatPrice(bikePrice)}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ marginBottom: "0.3rem" }}>
                      📍 <strong>Escrow Protection:</strong> Held safely until physical inspection
                    </div>
                    {order.payment && (
                      <div style={{ marginBottom: "0.3rem" }}>
                        💳 <strong>Payment Status:</strong> {order.payment.status || "Pending"}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                  {order.status === "PLACED" && bikeId && (
                    <>
                      <Link to={`/checkout/${bikeId}`} className="btn btn-sm btn-primary">
                        Complete Payment Now
                      </Link>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="btn btn-sm"
                        style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                      >
                        {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    </>
                  )}
                  {bikeId && (
                    <Link to={`/bikes/${bikeId}`} className="btn btn-sm btn-outline">
                      View Motorcycle Specs
                    </Link>
                  )}
                  <Link to={`/chat`} className="btn btn-sm btn-secondary">
                    Chat with Seller
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

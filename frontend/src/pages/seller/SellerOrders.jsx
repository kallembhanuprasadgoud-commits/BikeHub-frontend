import React, { useState, useEffect } from "react";
import { orderApi } from "../../services/orderApi";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await orderApi.getSellerOrders({ size: 50 });
        setOrders(res.content || res || []);
      } catch (err) {
        console.error("Failed to load seller orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const updated = await orderApi.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));
      toast.success(`Order #${orderId} marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
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
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Orders & Booking Inquiries Received</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Fulfill customer reservations, dispatch delivery inspections, and manage escrow status
        </p>
      </div>

      {loading ? (
        <Loader message="Loading received orders..." />
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>No orders received yet</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            When a buyer reserves or purchases one of your motorcycles, the booking will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "1rem",
                  marginBottom: "1.25rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Order ID: <strong style={{ color: "#fff" }}>#{order.id}</strong> •{" "}
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Update Fulfillment:</label>
                  <select
                    className="form-control"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{ width: "auto", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  >
                    <option value="PLACED">PLACED</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED (Out for Inspection)</option>
                    <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                    {order.bikeBrand}
                  </span>
                  <h3 style={{ fontSize: "1.25rem", margin: "2px 0 0.5rem" }}>{order.bikeModel}</h3>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>
                    {formatPrice(order.totalAmount)}
                  </div>
                </div>

                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ marginBottom: "0.3rem" }}>
                    👤 <strong>Buyer Name:</strong> {order.buyerName || "Customer"}
                  </div>
                  <div style={{ marginBottom: "0.3rem" }}>
                    📞 <strong>Buyer Contact:</strong> {order.contactNumber}
                  </div>
                  <div style={{ marginBottom: "0.3rem" }}>
                    📍 <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </div>
                  {order.notes && (
                    <div>
                      📝 <strong>Buyer Remarks:</strong> {order.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

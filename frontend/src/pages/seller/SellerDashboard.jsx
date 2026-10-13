import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bikeApi } from "../../services/bikeApi";
import { orderApi } from "../../services/orderApi";
import Loader from "../../components/common/Loader";

export default function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [listingsRes, ordersRes] = await Promise.all([
          bikeApi.getMyListings({ size: 5 }),
          orderApi.getSellerOrders({ size: 5 }),
        ]);
        setListings(listingsRes.content || listingsRes || []);
        setOrders(ordersRes.content || ordersRes || []);
      } catch (err) {
        console.error("Failed to load seller dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  if (loading) return <Loader fullScreen message="Loading seller dashboard..." />;

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Dealership & Seller Dashboard</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Overview of your motorcycle inventory, sales, inquiries, and fulfillment
          </p>
        </div>
        <Link to="/seller/add-bike" className="btn btn-primary">
          + List New Motorcycle
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: "2.5rem" }}>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Active Inventory</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>{listings.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)" }}>Bikes Listed</span>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Orders Received</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>{orders.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>Booking Requests</span>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Escrow Revenue</div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>
            {formatPrice(totalRevenue)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-success)" }}>Verified Escrow</span>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Verification Status</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-success)", margin: "0.4rem 0" }}>
            VERIFIED
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Identity Confirmed</span>
        </div>
      </div>

      {/* Recent Inventory Table */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1.2rem" }}>Recent Listings</h3>
          <Link to="/seller/my-listings" style={{ fontSize: "0.85rem", color: "var(--accent-primary)" }}>
            View All ({listings.length}) &rarr;
          </Link>
        </div>

        {listings.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
            No bikes listed yet. Click "+ List New Motorcycle" to add your first bike.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.75rem" }}>Bike</th>
                  <th style={{ padding: "0.75rem" }}>Year</th>
                  <th style={{ padding: "0.75rem" }}>Price</th>
                  <th style={{ padding: "0.75rem" }}>Condition</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.slice(0, 5).map((bike) => (
                  <tr key={bike.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "#fff" }}>
                      {bike.brand} {bike.model}
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{bike.year}</td>
                    <td style={{ padding: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                      {formatPrice(bike.price)}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className="badge badge-neutral">{bike.condition}</span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className={`badge ${bike.status === "AVAILABLE" ? "badge-success" : "badge-danger"}`}>
                        {bike.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <Link to={`/seller/edit-bike/${bike.id}`} className="btn btn-sm btn-secondary" style={{ marginRight: "0.5rem" }}>
                        Edit
                      </Link>
                      <Link to={`/bikes/${bike.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders Received */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1.2rem" }}>Recent Customer Orders</h3>
          <Link to="/seller/orders" style={{ fontSize: "0.85rem", color: "var(--accent-primary)" }}>
            Manage All Orders &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
            No customer orders received yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.75rem" }}>Order ID</th>
                  <th style={{ padding: "0.75rem" }}>Bike</th>
                  <th style={{ padding: "0.75rem" }}>Amount</th>
                  <th style={{ padding: "0.75rem" }}>Buyer Contact</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem", color: "#fff" }}>#{order.id}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>
                      {order.bikeBrand} {order.bikeModel}
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{order.contactNumber}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className="badge badge-success">{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

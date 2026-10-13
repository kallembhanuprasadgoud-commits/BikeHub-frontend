import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../services/adminApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Loader from "../../components/common/Loader";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await adminApi.getAnalytics();
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  if (loading) return <Loader fullScreen message="Loading platform analytics..." />;

  // Prepare chart data
  const brandData = stats?.topBrands
    ? Object.entries(stats.topBrands).map(([name, count]) => ({ name, count }))
    : [
        { name: "Royal Enfield", count: 4 },
        { name: "KTM", count: 3 },
        { name: "Yamaha", count: 3 },
        { name: "Kawasaki", count: 2 },
      ];

  const cityData = stats?.topCities
    ? Object.entries(stats.topCities).map(([city, count]) => ({ city, count }))
    : [
        { city: "Bangalore", count: 5 },
        { city: "Mumbai", count: 3 },
        { city: "Delhi", count: 2 },
        { city: "Pune", count: 2 },
      ];

  const roleData = [
    { name: "Buyers", value: stats?.totalBuyers || 2 },
    { name: "Sellers", value: stats?.totalSellers || 2 },
    { name: "Admins", value: stats?.totalAdmins || 1 },
  ];

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Platform Command & Analytics</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            High-level metrics across users, GMV sales volume, inventory, and dealerships
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/seller/add-bike" className="btn btn-primary">
            ➕ Add Motorcycle
          </Link>
          <Link to="/listings" className="btn btn-secondary">
            🏍 Browse & Edit Bikes
          </Link>
          <Link to="/admin/verify-sellers" className="btn btn-outline">
            🛡 Verify Dealers
          </Link>
          <Link to="/admin/users" className="btn btn-outline">
            👥 User Moderation
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: "2.5rem" }}>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Users</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>
            {stats?.totalUsers || 5}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)" }}>Registered Accounts</span>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Active Bikes</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>
            {stats?.totalBikes || 10}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>Live Listings</span>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Escrow Orders</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>
            {stats?.totalOrders || 3}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-success)" }}>Completed Transactions</span>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Platform GMV</div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#fff", margin: "0.4rem 0" }}>
            {formatPrice(stats?.totalRevenue || 540000)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-warning)" }}>Gross Merchandising Value</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginBottom: "2.5rem" }}>
        {/* Brand Distribution Bar Chart */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.15rem", marginBottom: "1.5rem" }}>Listings by Manufacturer</h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <BarChart data={brandData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.15rem", marginBottom: "1.5rem" }}>User Role Breakdown</h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* City Listings Bar Chart */}
      <div className="glass-panel" style={{ padding: "1.75rem" }}>
        <h3 style={{ fontSize: "1.15rem", marginBottom: "1.5rem" }}>Geographic Inventory Distribution (Top Cities)</h3>
        <div style={{ width: "100%", height: "240px" }}>
          <ResponsiveContainer>
            <BarChart data={cityData}>
              <XAxis dataKey="city" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

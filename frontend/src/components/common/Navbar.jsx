import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

export default function Navbar() {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(11, 15, 25, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(249, 115, 22, 0.4)",
              fontWeight: 900,
              color: "#fff",
              fontSize: "1.2rem",
            }}
          >
            🏍
          </div>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.4rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Bike<span style={{ color: "var(--accent-primary)" }}>Hub</span>
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            to="/listings"
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: isActive("/listings") ? "var(--accent-primary)" : "var(--text-secondary)",
              transition: "color 0.2s",
            }}
          >
            Browse Bikes
          </Link>
          <Link
            to="/compare"
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: isActive("/compare") ? "var(--accent-primary)" : "var(--text-secondary)",
              transition: "color 0.2s",
            }}
          >
            Compare
          </Link>
          <Link
            to="/ai-valuation"
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: isActive("/ai-valuation") ? "var(--accent-primary)" : "var(--text-secondary)",
              transition: "color 0.2s",
            }}
          >
            AI Price Estimator
          </Link>
          {isAuthenticated && (
            <Link
              to="/wishlist"
              style={{
                fontSize: "0.95rem",
                fontWeight: 500,
                color: isActive("/wishlist") ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s",
              }}
            >
              Wishlist
            </Link>
          )}
        </nav>

        {/* Right Section: Sell Button + Notifications + User Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Sell Button CTA - Only shown AFTER login */}
          {isAuthenticated && (
            <Link
              to="/seller/add-bike"
              className="btn btn-sm btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span>+</span> Sell Bike
            </Link>
          )}

          {/* Notifications Trigger */}
          {isAuthenticated && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen && unreadCount > 0) markAllAsRead();
                  setDropdownOpen(false);
                }}
                style={{
                  position: "relative",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                }}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: "320px",
                    padding: "1rem",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 200,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontSize: "0.95rem" }}>Notifications</h4>
                    {notifications.length > 0 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{notifications.length} recent</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
                      No new notifications
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                      {notifications.slice(0, 5).map((n, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "0.6rem 0.8rem",
                            background: "var(--bg-surface)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.85rem",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ color: "var(--text-primary)" }}>{n.message}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Auth Controls */}
          {isAuthenticated ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotifOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.4rem 0.8rem",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-full)",
                  color: "var(--text-primary)",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#fff",
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name?.split(" ")[0]}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>▼</span>
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: "220px",
                    padding: "0.75rem",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 200,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <div style={{ padding: "0.5rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "0.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{user?.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user?.email}</div>
                    <span className={`badge ${isAdmin ? "badge-danger" : isSeller ? "badge-warning" : "badge-info"}`} style={{ marginTop: "4px" }}>
                      {user?.role}
                    </span>
                  </div>

                  {/* Role Specific Routes */}
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem", color: "var(--accent-primary)", fontWeight: 600 }}
                      >
                        🛡 Admin Analytics
                      </Link>
                      <Link
                        to="/seller/add-bike"
                        onClick={() => setDropdownOpen(false)}
                        style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                      >
                        ➕ Add New Listing
                      </Link>
                      <Link
                        to="/admin/verify-sellers"
                        onClick={() => setDropdownOpen(false)}
                        style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                      >
                        🏪 Verify Dealerships
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setDropdownOpen(false)}
                        style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                      >
                        👥 User Moderation
                      </Link>
                    </>
                  )}

                  {/* Direct Selling Links (Available to any logged in user with one email) */}
                  <Link
                    to="/seller/add-bike"
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem", color: "var(--accent-primary)", fontWeight: 600 }}
                  >
                    ➕ Sell a Motorcycle
                  </Link>
                  <Link
                    to="/seller/my-listings"
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                  >
                    🏍 My Listed Bikes
                  </Link>

                  {(isSeller || isAdmin) && (
                    <>
                      <Link
                        to="/seller/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                      >
                        📊 Sales Analytics
                      </Link>
                      <Link
                        to="/seller/orders"
                        onClick={() => setDropdownOpen(false)}
                        style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                      >
                        📦 Orders Received
                      </Link>
                    </>
                  )}

                  <Link
                    to="/my-orders"
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                  >
                    🛍 My Orders
                  </Link>

                  <Link
                    to="/chat"
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                  >
                    💬 Live Chats
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: "0.5rem", borderRadius: "6px", fontSize: "0.88rem", display: "flex", gap: "0.5rem" }}
                  >
                    ⚙ Settings & Profile
                  </Link>

                  <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0.25rem 0" }} />

                  <button
                    onClick={handleLogout}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "6px",
                      fontSize: "0.88rem",
                      color: "var(--accent-danger)",
                      textAlign: "left",
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Link to="/login" className="btn btn-sm btn-secondary">
                Log In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#080c14",
        borderTop: "1px solid var(--border-subtle)",
        marginTop: "auto",
        padding: "3.5rem 0 1.5rem",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand & Mission */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              >
                🏍
              </div>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
                Bike<span style={{ color: "var(--accent-primary)" }}>Hub</span>
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1rem" }}>
              India's premier verified two-wheeler ecosystem. Enabling secure transactions, AI-powered price intelligence, and verified dealership guarantees.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge-success">✓ Escrow Protected</span>
              <span className="badge badge-info">⚡ AI Valuation</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#fff" }}>Marketplace</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
              <li>
                <Link to="/listings" style={{ color: "var(--text-secondary)" }}>
                  All Bikes for Sale
                </Link>
              </li>
              <li>
                <Link to="/listings?condition=NEW" style={{ color: "var(--text-secondary)" }}>
                  Brand New Motorcycles
                </Link>
              </li>
              <li>
                <Link to="/listings?condition=USED" style={{ color: "var(--text-secondary)" }}>
                  Certified Pre-Owned
                </Link>
              </li>
              <li>
                <Link to="/compare" style={{ color: "var(--text-secondary)" }}>
                  Side-by-Side Comparison
                </Link>
              </li>
              <li>
                <Link to="/ai-valuation" style={{ color: "var(--text-secondary)" }}>
                  Free AI Price Estimation
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Brands */}
          <div>
            <h4 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#fff" }}>Top Makes</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
              <li>
                <Link to="/listings?brand=Royal+Enfield" style={{ color: "var(--text-secondary)" }}>
                  Royal Enfield Classic & Hunter
                </Link>
              </li>
              <li>
                <Link to="/listings?brand=KTM" style={{ color: "var(--text-secondary)" }}>
                  KTM Duke & RC Series
                </Link>
              </li>
              <li>
                <Link to="/listings?brand=Yamaha" style={{ color: "var(--text-secondary)" }}>
                  Yamaha R15 & MT-15
                </Link>
              </li>
              <li>
                <Link to="/listings?brand=Kawasaki" style={{ color: "var(--text-secondary)" }}>
                  Kawasaki Ninja Series
                </Link>
              </li>
              <li>
                <Link to="/listings?brand=TVS" style={{ color: "var(--text-secondary)" }}>
                  TVS Apache Series
                </Link>
              </li>
            </ul>
          </div>

          {/* Final Year Academic Badge */}
          <div>
            <h4 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#fff" }}>Project Architecture</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              Final-Year Engineering Project built with Spring Boot 3, MySQL 8, React.js (Vite), Razorpay, STOMP WebSockets, and Flask ML service.
            </p>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              REST API: <code style={{ color: "var(--accent-primary)" }}>http://localhost:8080/api</code>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              WebSocket Broker: <code style={{ color: "var(--accent-primary)" }}>/ws &rarr; /topic</code>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
          }}
        >
          <div>© {new Date().getFullYear()} BikeHub Platform. All rights reserved.</div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span>Security & Escrow</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

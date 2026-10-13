import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);

      // Smart redirect based on role
      if (from !== "/") {
        navigate(from, { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (user.role === "SELLER") {
        navigate("/seller/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (!err.response ? "Cannot connect to backend server. Make sure Spring Boot is running on port 8080." : "Invalid email or password");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      setLoading(true);
      const user = await login(demoEmail, demoPassword);
      toast.success(`Welcome back, ${user.name}!`);

      // Smart redirect
      if (from !== "/") {
        navigate(from, { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (!err.response ? "Cannot connect to backend server. Make sure Spring Boot is running on port 8080." : "Login failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "2.5rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            🏍
          </div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>Sign In to BikeHub</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Access orders, selling listings, live chats, and moderation
          </p>
        </div>

        {/* Single Email Policy Banner */}
        <div
          style={{
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "0.6rem 0.9rem",
            marginBottom: "1.25rem",
            fontSize: "0.8rem",
            color: "#93c5fd",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✨</span>
          <span>
            <strong>Single Account Access:</strong> With one email ID you can buy bikes, list and sell bikes, and chat without needing separate accounts!
          </span>
        </div>

        {/* Host / Super-Admin Direct 1-Click Instant Login (Only Admin) */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(30, 41, 59, 0.6) 100%)",
            border: "1px solid rgba(249, 115, 22, 0.4)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 15px rgba(249, 115, 22, 0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              👑 HOST / ADMIN INSTANT ACCESS:
            </span>
            <span className="badge badge-primary" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
              Admin Only
            </span>
          </div>

          <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>
            1-Click instant authentication is reserved exclusively for the platform administrator. All other members (sellers, buyers, riders) sign in with email & password below.
          </p>

          <button
            type="button"
            disabled={loading}
            className="btn btn-primary"
            onClick={() => handleDirectLogin("host@bikehub.com", "password123")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.6rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            <span>👑</span>
            <span>{loading ? "Authenticating Host..." : "1-Click Instant Login as Host Super-Admin"}</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0 1.25rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span>MEMBER SIGN IN (SELLER / BUYER / USER)</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: "0.5rem" }}>
            {loading ? "Authenticating..." : "Sign In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && (roleParam === "SELLER" || roleParam === "BUYER")) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        name,
        email,
        phone,
        password,
        role,
      });

      toast.success(`Account created successfully! Welcome, ${user.name}`);
      if (user.role === "SELLER") {
        navigate("/seller/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Try a different email.");
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
        padding: "2.5rem 1.25rem",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "2.5rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>Join BikeHub</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Create an account to browse verified listings or list your bikes
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            background: "var(--bg-surface-elevated)",
            padding: "0.35rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.75rem",
          }}
        >
          <button
            type="button"
            onClick={() => setRole("BUYER")}
            className="btn btn-sm"
            style={{
              background: role === "BUYER" ? "var(--accent-primary)" : "transparent",
              color: role === "BUYER" ? "#fff" : "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            🛒 I'm a Buyer
          </button>
          <button
            type="button"
            onClick={() => setRole("SELLER")}
            className="btn btn-sm"
            style={{
              background: role === "SELLER" ? "var(--accent-primary)" : "transparent",
              color: role === "SELLER" ? "#fff" : "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            🏪 I'm a Seller / Dealer
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{role === "SELLER" ? "Dealership / Full Name" : "Full Name"}</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder={role === "SELLER" ? "Apex Superbikes Bangalore" : "Rahul Sharma"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              className="form-control"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Create Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-control"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: "0.5rem" }}>
            {loading ? "Creating Account..." : `Register as ${role}`}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const res = await adminApi.getUsers({ size: 50 });
        setUsers(res.content || res || []);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error("Security violation: You cannot block your own administrative account");
      return;
    }

    const nextStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      setActionId(user.id);
      await adminApi.updateUserStatus(user.id, nextStatus);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      toast.success(`User ${user.name} is now ${nextStatus}`);
    } catch (err) {
      toast.error("Failed to change user status");
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
          <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>User Management & Moderation</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Inspect registered accounts, role privileges, and enforce account suspensions
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading registered users..." />
      ) : (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.75rem" }}>User</th>
                  <th style={{ padding: "0.75rem" }}>Email</th>
                  <th style={{ padding: "0.75rem" }}>Phone</th>
                  <th style={{ padding: "0.75rem" }}>Role</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Moderation</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "#fff" }}>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span style={{ fontSize: "0.7rem", color: "var(--accent-primary)", marginLeft: "6px" }}>
                          (You)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{u.email}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{u.phone || "N/A"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-danger" : u.role === "SELLER" ? "badge-warning" : "badge-info"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className={`badge ${u.status === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                        {u.status || "ACTIVE"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionId === u.id}
                          className={`btn btn-sm ${u.status === "ACTIVE" ? "btn-danger" : "btn-success"}`}
                        >
                          {u.status === "ACTIVE" ? "Block Account" : "Unblock Account"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

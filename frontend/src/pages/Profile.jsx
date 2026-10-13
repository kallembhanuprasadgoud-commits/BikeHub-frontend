import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/authApi";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, isSeller, isAdmin } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await authApi.updateProfile({ name, phone });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully! You can use your new password next time.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password. Verify your current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="container" style={{ padding: "3rem 1.25rem 5rem", maxWidth: "680px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          {isAdmin ? "👑 Host Profile & Credentials" : "Account Profile & Settings"}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {isAdmin
            ? "Manage Host Super-Admin login credentials, contact info, and security"
            : "Manage your personal details and account preferences"}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: isAdmin
                  ? "linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
                  : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {isAdmin ? "👑" : user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem" }}>{user?.name}</h2>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                <span className={`badge ${isAdmin ? "badge-danger" : isSeller ? "badge-warning" : "badge-info"}`}>
                  Role: {isAdmin ? "HOST / SUPER ADMIN" : user?.role}
                </span>
                <span className="badge badge-success">Status: ACTIVE</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Display Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Login Email</label>
              <input
                type="email"
                disabled
                className="form-control"
                value={user?.email || ""}
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Email is your primary login identifier</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
              {saving ? "Saving Changes..." : "Update Profile Details"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>🔐 Change Login Password</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
            Update your account password anytime to secure your host access.
          </p>

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password (min 6 characters)</label>
              <input
                type="password"
                required
                placeholder="Enter new password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Confirm new password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={changingPassword} className="btn btn-secondary" style={{ marginTop: "0.5rem" }}>
              {changingPassword ? "Updating Password..." : "Save New Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("bikehub_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("bikehub_token") || null);
  const [loading, setLoading] = useState(true);

  // Sync / verify user session with backend
  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await authApi.getCurrentUser();
          setUser(profile);
          localStorage.setItem("bikehub_user", JSON.stringify(profile));
        } catch (err) {
          console.warn("Session expired or invalid token:", err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const jwtToken = res.token;
    const userData = {
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role,
    };

    localStorage.setItem("bikehub_token", jwtToken);
    localStorage.setItem("bikehub_user", JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const jwtToken = res.token;
    const userObj = {
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role,
    };

    localStorage.setItem("bikehub_token", jwtToken);
    localStorage.setItem("bikehub_user", JSON.stringify(userObj));

    setToken(jwtToken);
    setUser(userObj);
    return userObj;
  };

  const logout = () => {
    localStorage.removeItem("bikehub_token");
    localStorage.removeItem("bikehub_user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isSeller: user?.role === "SELLER",
    isAdmin: user?.role === "ADMIN",
    isBuyer: user?.role === "BUYER",
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

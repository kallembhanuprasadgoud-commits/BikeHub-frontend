import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

// Common UI Components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import BikeDetails from "./pages/BikeDetails";
import CompareBikes from "./pages/CompareBikes";
import AiValuation from "./pages/AiValuation";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Buyer / Protected Pages
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

// Seller Pages
import SellerDashboard from "./pages/seller/SellerDashboard";
import AddEditBike from "./pages/seller/AddEditBike";
import MyListings from "./pages/seller/MyListings";
import SellerOrders from "./pages/seller/SellerOrders";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VerifySellers from "./pages/admin/VerifySellers";
import ManageUsers from "./pages/admin/ManageUsers";

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Marketplace Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/bikes/:id" element={<BikeDetails />} />
                <Route path="/compare" element={<CompareBikes />} />
                <Route path="/ai-valuation" element={<AiValuation />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Buyer / User Protected Routes */}
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/:bikeId"
                  element={
                    <ProtectedRoute allowedRoles={["BUYER", "SELLER", "ADMIN"]}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Seller & Listing Management Routes (Open to all authenticated users with one email) */}
                <Route
                  path="/seller/dashboard"
                  element={
                    <ProtectedRoute>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/add-bike"
                  element={
                    <ProtectedRoute>
                      <AddEditBike />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/edit-bike/:id"
                  element={
                    <ProtectedRoute>
                      <AddEditBike />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/orders"
                  element={
                    <ProtectedRoute>
                      <SellerOrders />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/verify-sellers"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <VerifySellers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <ManageUsers />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />

            {/* Notification Toast Container */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                },
              }}
            />
          </div>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

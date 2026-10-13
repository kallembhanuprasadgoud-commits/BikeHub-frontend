import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { bikeApi } from "../services/bikeApi";
import { orderApi } from "../services/orderApi";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/common/Loader";
import toast from "react-hot-toast";

export default function Checkout() {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");

  // Payment success state
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    async function loadBike() {
      try {
        setLoading(true);
        const data = await bikeApi.getBikeById(bikeId);
        if (data.status !== "AVAILABLE") {
          toast.error("This motorcycle is no longer available for booking");
          navigate("/listings");
          return;
        }
        setBike(data);
      } catch (err) {
        toast.error("Motorcycle not found");
        navigate("/listings");
      } finally {
        setLoading(false);
      }
    }
    loadBike();
  }, [bikeId, navigate]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!deliveryAddress || !contactNumber) {
      toast.error("Please fill in delivery address and contact phone number");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create order in backend
      const createdOrder = await orderApi.createOrder({
        bikeId: bike.id,
        deliveryAddress,
        contactNumber,
        notes,
      });

      // 2. Create Razorpay payment order
      const paymentOrder = await orderApi.createPaymentOrder(createdOrder.id);

      // 3. Launch Razorpay modal if available
      const rzpOrderId = paymentOrder.gatewayOrderId || paymentOrder.razorpayOrderId;
      if (window.Razorpay && rzpOrderId) {
        const options = {
          key: paymentOrder.keyId || "rzp_test_bikehub2026",
          amount: paymentOrder.amountInPaise || (paymentOrder.amount ? paymentOrder.amount * 100 : 21500000), // in paise
          currency: paymentOrder.currency || "INR",
          name: "BikeHub Escrow",
          description: `Booking for ${bike.brand} ${bike.model}`,
          order_id: rzpOrderId,
          handler: async (response) => {
            try {
              const verifyRes = await orderApi.verifyPayment({
                orderId: createdOrder.id,
                gatewayOrderId: response.razorpay_order_id,
                gatewayPaymentId: response.razorpay_payment_id,
                gatewaySignature: response.razorpay_signature,
              });
              setPaymentSuccess(verifyRes);
              toast.success("Payment verified! Booking confirmed.");
            } catch (err) {
              toast.error("Payment verification failed on server");
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: contactNumber,
          },
          theme: {
            color: "#f97316",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          toast.error("Payment was declined or cancelled");
        });
        rzp.open();
      } else {
        // Fallback test mode verification simulator
        const verifyRes = await orderApi.verifyPayment({
          orderId: createdOrder.id,
          gatewayOrderId: rzpOrderId || "order_test_simulated",
          gatewayPaymentId: "pay_test_" + Date.now(),
          gatewaySignature: "sig_verified_test_simulation",
        });
        setPaymentSuccess(verifyRes);
        toast.success("Test Booking Confirmed!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Order creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen message="Setting up checkout..." />;
  if (!bike) return null;

  if (paymentSuccess) {
    return (
      <div className="container" style={{ padding: "4rem 1.25rem", maxWidth: "600px", textAlign: "center" }}>
        <div className="glass-panel animate-fade" style={{ padding: "3rem 2rem" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.2)",
              color: "var(--accent-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              margin: "0 auto 1.5rem",
            }}
          >
            ✓
          </div>

          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Order Confirmed & Escrow Locked!</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Thank you, {user?.name}. Your reservation for the{" "}
            <strong style={{ color: "#fff" }}>
              {bike.brand} {bike.model}
            </strong>{" "}
            has been secured. The seller has been notified to schedule delivery inspection.
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: "1.25rem",
              borderRadius: "var(--radius-md)",
              textAlign: "left",
              marginBottom: "2rem",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Order Reference:</span>
              <strong style={{ color: "#fff" }}>#{paymentSuccess.orderId || "ORD-" + Date.now()}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Payment Status:</span>
              <span className="badge badge-success">PAID</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Transaction ID:</span>
              <span style={{ color: "var(--accent-primary)", fontFamily: "monospace" }}>
                {paymentSuccess.razorpayPaymentId || "PAY_TOKEN_SIM"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link to="/my-orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/listings" className="btn btn-secondary">
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "3rem 1.25rem 5rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Vehicle Booking & Secure Escrow</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Lock in your motorcycle reservation with test-mode Razorpay escrow payment
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2.5rem", alignItems: "start" }}>
        {/* Buyer Delivery Form */}
        <form onSubmit={handleProcessPayment} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Delivery / Inspection Details</h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Contact Phone Number</label>
            <input
              type="tel"
              required
              className="form-control"
              placeholder="+91 9876543210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Delivery / Inspection Address</label>
            <textarea
              rows={3}
              required
              className="form-control"
              placeholder="Enter complete address where vehicle will be inspected/delivered..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Buyer Remarks / Special Requests (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Preferred test-ride timing or documentation request"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "0.85rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            🔒 <strong style={{ color: "#fff" }}>Escrow Protection Guarantee:</strong> Your payment is held in escrow until you inspect and accept the vehicle and verify the registration certificate.
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ marginTop: "0.5rem" }}>
            {submitting ? "Initiating Secure Checkout..." : `Pay & Book Now (${formatPrice(bike.price)})`}
          </button>
        </form>

        {/* Order Summary Column */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1.15rem" }}>Order Summary</h3>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <img
              src={
                bike.images && bike.images[0]
                  ? bike.images[0].imageUrl
                  : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80"
              }
              alt={bike.model}
              style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "8px" }}
            />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>{bike.brand}</span>
              <h4 style={{ fontSize: "1.05rem", margin: "2px 0" }}>{bike.model}</h4>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {bike.year} • {bike.kilometersDriven?.toLocaleString() || 0} km
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Vehicle Asking Price</span>
              <span style={{ color: "#fff" }}>{formatPrice(bike.price)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Platform Inspection Fee</span>
              <span style={{ color: "var(--accent-success)" }}>FREE (Promo)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Escrow Protection</span>
              <span style={{ color: "var(--accent-success)" }}>Included</span>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "1.1rem", color: "#fff" }}>Total Payable</strong>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", fontFamily: "var(--font-heading)" }}>
              {formatPrice(bike.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

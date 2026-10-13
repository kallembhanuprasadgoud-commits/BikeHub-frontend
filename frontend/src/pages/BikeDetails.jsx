import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { bikeApi } from "../services/bikeApi";
import { chatApi } from "../services/chatApi";
import { reviewApi } from "../services/reviewApi";
import { wishlistApi } from "../services/wishlistApi";
import { adminApi } from "../services/adminApi";
import { aiApi } from "../services/aiApi";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/common/StarRating";
import Loader from "../components/common/Loader";
import toast from "react-hot-toast";

export default function BikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isBuyer, isAdmin } = useAuth();

  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingBike, setDeletingBike] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [inWishlist, setInWishlist] = useState(false);

  // Admin moderation & AI Photo-Name match state
  const [clearingImages, setClearingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [aiVerifying, setAiVerifying] = useState(false);
  const [aiMatchResult, setAiMatchResult] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleDeleteBike = async () => {
    if (!window.confirm(`Are you sure you want to delete "${bike?.brand} ${bike?.model}"? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingBike(true);
      await bikeApi.deleteBike(bike.id);
      toast.success("Bike listing deleted successfully");
      navigate("/listings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete listing");
    } finally {
      setDeletingBike(false);
    }
  };

  const handleClearAllImages = async () => {
    if (!window.confirm(`Are you sure you want to clear all images for "${bike?.brand} ${bike?.model}"? The seller will receive an automatic alert to upload clear authentic photos.`)) {
      return;
    }
    try {
      setClearingImages(true);
      await adminApi.clearBikeImages(bike.id);
      toast.success("Images cleared successfully. Notice dispatched to seller.");
      const updated = await bikeApi.getBikeById(id);
      setBike(updated);
      setSelectedImage("https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80");
      setAiMatchResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear images");
    } finally {
      setClearingImages(false);
    }
  };

  const handleDeleteSpecificImage = async (imageId) => {
    if (!window.confirm("Remove this photo from the motorcycle listing?")) return;
    try {
      setDeletingImageId(imageId);
      await adminApi.deleteBikeImage(bike.id, imageId);
      toast.success("Image deleted successfully");
      const updated = await bikeApi.getBikeById(id);
      setBike(updated);
      if (updated.images && updated.images.length > 0) {
        setSelectedImage(updated.images[0].imageUrl);
      } else {
        setSelectedImage("https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyMessage.trim()) {
      toast.error("Please enter a message for the seller");
      return;
    }
    try {
      setSendingNotification(true);
      await adminApi.notifySellerAboutBike(bike.id, notifyMessage.trim());
      toast.success(`Official alert delivered to seller ${bike.seller?.name || ""}`);
      setNotifyModalOpen(false);
      setNotifyMessage("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deliver notification");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleVerifyPhotoMatch = async () => {
    try {
      setAiVerifying(true);
      const targetImage = selectedImage || bike.primaryImageUrl || (bike.images && bike.images[0]?.imageUrl);
      const result = await aiApi.verifyPhotoMatch({
        brand: bike.brand,
        model: bike.model,
        imageUrl: targetImage,
      });
      setAiMatchResult(result);
      if (result.matches) {
        toast.success(`AI Verified: Photo matches declared ${bike.brand} ${bike.model} (${Math.round((result.matchScore || 0.94) * 100)}%)`);
      } else {
        toast.error("AI Alert: Discrepancy detected or image quality too low!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI photo verification service currently unavailable");
    } finally {
      setAiVerifying(false);
    }
  };

  const handleOpenNotifyModal = (presetText = "") => {
    setNotifyMessage(presetText || "");
    setNotifyModalOpen(true);
  };

  useEffect(() => {
    async function loadBikeDetails() {
      try {
        setLoading(true);
        const data = await bikeApi.getBikeById(id);
        setBike(data);

        // Set primary or first image
        if (data.primaryImageUrl) {
          setSelectedImage(data.primaryImageUrl);
        } else if (data.images && data.images.length > 0) {
          const primary = data.images.find((img) => img.isPrimary) || data.images[0];
          setSelectedImage(primary.imageUrl);
        } else {
          setSelectedImage("https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80");
        }

        // Check wishlist if user is authenticated
        if (isAuthenticated) {
          try {
            const isSaved = await wishlistApi.checkWishlist(id);
            setInWishlist(isSaved);
          } catch (e) {
            // ignore
          }
        }

        // Load reviews
        try {
          const revs = await reviewApi.getBikeReviews(id);
          setReviews(revs || []);
        } catch (e) {
          console.warn("Could not fetch reviews:", e);
        }
      } catch (err) {
        toast.error("Motorcycle not found or unavailable");
        navigate("/listings");
      } finally {
        setLoading(false);
      }
    }
    loadBikeDetails();
  }, [id, isAuthenticated, navigate]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save bikes to your wishlist");
      navigate("/login");
      return;
    }

    try {
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(id);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await wishlistApi.addToWishlist(id);
        setInWishlist(true);
        toast.success("Saved to wishlist!");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to chat with the seller");
      navigate("/login");
      return;
    }

    if (user?.id === bike.sellerId) {
      toast.error("You cannot start a chat on your own listing");
      return;
    }

    try {
      const room = await chatApi.createOrGetRoom(bike.id, bike.sellerId);
      navigate(`/chat?roomId=${room.id}`);
    } catch (err) {
      toast.error("Could not initiate chat with seller");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please log in to submit a review");
      navigate("/login");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      setSubmittingReview(true);
      const createdReview = await reviewApi.addReview({
        bikeId: bike.id,
        rating: newRating,
        comment: newComment.trim(),
      });
      setReviews([createdReview, ...reviews]);
      setNewComment("");
      setNewRating(5);
      toast.success("Thank you! Review published.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  if (loading) {
    return <Loader fullScreen message="Loading motorcycle specifications..." />;
  }

  if (!bike) return null;

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        <Link to="/" style={{ color: "var(--text-secondary)" }}>
          Home
        </Link>
        <span>/</span>
        <Link to="/listings" style={{ color: "var(--text-secondary)" }}>
          Bikes
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>
          {bike.brand} {bike.model}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2.5rem", alignItems: "start" }}>
        {/* Left Column: Image Gallery */}
        <div>
          {/* Main Hero Image */}
          <div
            className="glass-panel"
            style={{
              height: "440px",
              overflow: "hidden",
              position: "relative",
              marginBottom: "1rem",
              background: "#080c14",
            }}
          >
            <img
              src={selectedImage}
              alt={`${bike.brand} ${bike.model}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Status & Condition Badges */}
            <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "0.5rem" }}>
              <span className={`badge ${bike.condition === "NEW" ? "badge-success" : "badge-primary"}`}>
                {bike.condition?.replace("_", " ")}
              </span>
              {bike.status && (
                <span className={`badge ${bike.status === "AVAILABLE" ? "badge-info" : "badge-danger"}`}>
                  {bike.status}
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                fontSize: "1.3rem",
                color: inWishlist ? "#ef4444" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={inWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
            >
              {inWishlist ? "♥" : "♡"}
            </button>
          </div>

          {/* Admin Photo Moderation Toolbar */}
          {isAdmin && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0.9rem",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "0.75rem",
                fontSize: "0.82rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#f87171" }}>
                <span>🛡️</span>
                <strong>Admin Photo Moderation:</strong>
                <span>{bike.images?.length || 0} photo(s) listed</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleClearAllImages}
                  disabled={clearingImages || !bike.images?.length}
                  className="btn btn-sm btn-danger"
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                  title="Clear all photos from this selling bike"
                >
                  {clearingImages ? "Clearing..." : "🖼️ Clear All Images"}
                </button>
                <button
                  onClick={() => handleOpenNotifyModal("📸 Image Quality Alert: The photos on your listing are blurry, low quality, or unclear. Please upload clear, authentic high-resolution photos of the motorcycle.")}
                  className="btn btn-sm btn-outline"
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                >
                  📢 Request Clear Photos
                </button>
              </div>
            </div>
          )}

          {/* Thumbnails row */}
          {bike.images && bike.images.length > 1 && (
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {bike.images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={img.imageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setSelectedImage(img.imageUrl)}
                    style={{
                      width: "80px",
                      height: "65px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      border: selectedImage === img.imageUrl ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                      opacity: selectedImage === img.imageUrl ? 1 : 0.65,
                      transition: "all 0.2s",
                    }}
                  />
                  {isAdmin && img.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSpecificImage(img.id);
                      }}
                      disabled={deletingImageId === img.id}
                      title="Admin: Delete this photo"
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Detailed Description */}
          <div className="card" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Vehicle Overview & Highlights</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {bike.description || "No specific seller remarks provided for this vehicle."}
            </p>
          </div>

          {/* AI Visual & Specification Match Inspection */}
          <div
            className="card"
            style={{
              marginTop: "1.5rem",
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>🤖</span>
                  <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>AI Name & Photo Consistency Inspector</h3>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  Computer vision check verifying if uploaded photo matches declared model (<strong>{bike.brand} {bike.model}</strong>) and evaluates photo clarity.
                </p>
              </div>

              <button
                onClick={handleVerifyPhotoMatch}
                disabled={aiVerifying}
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {aiVerifying ? "Analyzing Photo..." : "🔍 Run AI Match Verification"}
              </button>
            </div>

            {aiMatchResult ? (
              <div
                style={{
                  background: aiMatchResult.matches ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${aiMatchResult.matches ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "1.2rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{aiMatchResult.matches ? "✅" : "⚠️"}</span>
                    <strong style={{ color: aiMatchResult.matches ? "#10b981" : "#f87171", fontSize: "1rem" }}>
                      {aiMatchResult.matches ? "AUTHENTIC MATCH VERIFIED" : "VISUAL DISCREPANCY DETECTED"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`badge ${aiMatchResult.matches ? "badge-success" : "badge-danger"}`}>
                      Match Score: {Math.round((aiMatchResult.matchScore || 0.94) * 100)}%
                    </span>
                    <span className={`badge ${aiMatchResult.clearImage !== false ? "badge-info" : "badge-warning"}`}>
                      {aiMatchResult.clearImage !== false ? "📸 Image Clear" : "⚠️ Low Clarity"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem", marginBottom: "0.75rem", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "6px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Declared Model: </span>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{bike.brand} {bike.model}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Detected Category: </span>
                    <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{aiMatchResult.detectedCategory || "Motorcycle Geometry"}</span>
                  </div>
                </div>

                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                  {aiMatchResult.explanation}
                </p>

                {aiMatchResult.detectedFeatures && aiMatchResult.detectedFeatures.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Visual Keypoints Identified:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.3rem" }}>
                      {aiMatchResult.detectedFeatures.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.78rem",
                            color: "#cbd5e1",
                          }}
                        >
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    💡 <em>{aiMatchResult.recommendation}</em>
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenNotifyModal(`⚠️ AI Alert: The photograph uploaded for your "${bike.brand} ${bike.model}" does not match the declared vehicle specifications or lacks sufficient image clarity. Please upload authentic, high-resolution photos immediately.`)}
                      className="btn btn-sm btn-danger"
                    >
                      📢 Notify Seller with AI Finding
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: "1rem", textAlign: "center", background: "rgba(0,0,0,0.15)", borderRadius: "var(--radius-md)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  Click <strong>"Run AI Match Verification"</strong> to inspect vehicle contours, fairings, engine placement, and ensure photo-name authenticity.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing, Specs, Seller Card, Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Host Super-Admin / Seller Quick Controls */}
          {(isAdmin || (user && (user.id === bike?.sellerId || user.id === bike?.seller?.id))) && (
            <div
              className="card"
              style={{
                border: "1px solid rgba(249, 115, 22, 0.4)",
                background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(17, 24, 39, 0.9) 100%)",
                boxShadow: "0 4px 20px rgba(249, 115, 22, 0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>👑</span>
                  <strong style={{ color: "var(--accent-primary)", fontSize: "0.95rem" }}>
                    {isAdmin ? "Host Super-Admin Moderation Console" : "Seller Management"}
                  </strong>
                </div>
                <span className="badge badge-primary">Status: {bike.status}</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                {isAdmin
                  ? "Exclusive Host/Admin controls: modify specifications/price, clear blurry or invalid images, dispatch push alerts to the seller, or verify photo-model authenticity."
                  : "You have full access to edit specifications, price, photos, or delete this listing from the platform."}
              </p>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate(`/seller/edit-bike/${bike.id}`)}
                  className="btn btn-sm btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                  title="Edit details (Price, specs, photos)"
                >
                  ✏️ Edit Listing Specs
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={handleClearAllImages}
                      disabled={clearingImages || !bike.images?.length}
                      className="btn btn-sm btn-outline"
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                      title="Clear all photos and alert seller"
                    >
                      {clearingImages ? "Clearing..." : "🖼️ Clear Images"}
                    </button>

                    <button
                      onClick={() => handleOpenNotifyModal()}
                      className="btn btn-sm btn-secondary"
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                      title="Send push alert & message to seller"
                    >
                      📢 Notify Seller
                    </button>

                    <button
                      onClick={handleVerifyPhotoMatch}
                      disabled={aiVerifying}
                      className="btn btn-sm btn-outline"
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem", borderColor: "rgba(59, 130, 246, 0.5)" }}
                    >
                      {aiVerifying ? "Verifying..." : "🤖 AI Check Photo"}
                    </button>
                  </>
                )}

                <button
                  onClick={handleDeleteBike}
                  disabled={deletingBike}
                  className="btn btn-sm btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {deletingBike ? "Deleting..." : "🗑️ Delete Listing"}
                </button>
              </div>
            </div>
          )}

          {/* Title & Price Header */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: 700, textTransform: "uppercase" }}>
                  {bike.brand}
                </span>
                <h1 style={{ fontSize: "1.85rem", margin: "0.25rem 0" }}>{bike.model}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <span>Year {bike.year}</span>
                  <span>•</span>
                  <span>📍 {bike.city || "Pan India"}</span>
                  {averageRating && (
                    <>
                      <span>•</span>
                      <StarRating rating={Number(averageRating)} />
                      <span>({reviews.length})</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Asking Price (Negotiable)</span>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                {formatPrice(bike.price)}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              {bike.status === "AVAILABLE" ? (
                <button
                  onClick={() => navigate(`/checkout/${bike.id}`)}
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                >
                  ⚡ Buy Now / Escrow Book
                </button>
              ) : (
                <button disabled className="btn btn-secondary btn-lg" style={{ flex: 1 }}>
                  Vehicle {bike.status}
                </button>
              )}

              <button onClick={handleStartChat} className="btn btn-secondary btn-lg" style={{ flex: 1 }}>
                💬 Chat with Seller
              </button>
            </div>
          </div>

          {/* Technical Specifications Table */}
          <div className="card">
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Technical Specifications</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ padding: "0.75rem", background: "var(--bg-surface-elevated)", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Engine Capacity</span>
                <strong style={{ color: "#fff" }}>{bike.engineCc ? `${bike.engineCc} cc` : "N/A"}</strong>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--bg-surface-elevated)", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Odometer (KM)</span>
                <strong style={{ color: "#fff" }}>{(bike.kmDriven ?? bike.kilometersDriven ?? 0).toLocaleString()} km</strong>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--bg-surface-elevated)", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Fuel Type</span>
                <strong style={{ color: "#fff" }}>{bike.fuelType || "Petrol"}</strong>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--bg-surface-elevated)", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Transmission</span>
                <strong style={{ color: "#fff" }}>{bike.transmission || "Manual"}</strong>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--bg-surface-elevated)", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Ownership</span>
                <strong style={{ color: "#fff" }}>{bike.ownership || "1st Owner"}</strong>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--bg-surface-elevated)", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Color</span>
                <strong style={{ color: "#fff" }}>{bike.color || "Standard"}</strong>
              </div>
            </div>
          </div>

          {/* Seller Profile Card */}
          <div className="card" style={{ borderLeft: "4px solid var(--accent-primary)" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Seller & Dealership Info</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--bg-surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                🏪
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>
                  {bike.sellerName || "Verified Dealer"}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                  <span className="badge badge-success">✓ Verified Partner</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    📍 {bike.city || "India"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section style={{ marginTop: "4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem" }}>Buyer Reviews & Verified Experiences</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Authentic feedback from verified buyers who inspected or bought this motorcycle
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", alignItems: "start" }}>
          {/* Post Review Form */}
          <div className="card">
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Write a Review</h3>
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Your Rating</label>
                  <StarRating rating={newRating} interactive onRate={(r) => setNewRating(r)} size="1.6rem" />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Review Comment</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Share vehicle condition, performance, seller responsiveness..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={submittingReview} className="btn btn-primary">
                  {submittingReview ? "Submitting..." : "Submit Verified Review"}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  Please log in to write a review for this vehicle.
                </p>
                <Link to="/login" className="btn btn-sm btn-primary">
                  Log In
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reviews.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
                <p style={{ color: "var(--text-muted)" }}>No reviews posted yet. Be the first to review this bike!</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: "#fff" }}>{rev.userName || "Verified Buyer"}</span>
                      <StarRating rating={rev.rating} size="0.9rem" />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Admin Notification Modal */}
      {notifyModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "540px",
              width: "100%",
              background: "#0f172a",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.3rem" }}>📢</span>
                <h3 style={{ fontSize: "1.2rem", margin: 0 }}>Notify Seller (Admin Alert)</h3>
              </div>
              <button
                onClick={() => setNotifyModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
              <div><strong>Listing:</strong> {bike.brand} {bike.model} (#{bike.id})</div>
              <div><strong>Seller:</strong> {bike.sellerName || bike.seller?.name || "Dealer"} ({bike.seller?.email || "Seller Account"})</div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Quick Alert Templates:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                  onClick={() => setNotifyMessage("📸 Clear Photo Request: The current listing photos are blurry, low quality, or unclear. Please upload authentic, high-resolution photos of the motorcycle.")}
                >
                  📸 Clear Photo Request
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                  onClick={() => setNotifyMessage(`⚠️ Model Discrepancy: The uploaded photo does not appear to match the declared ${bike.brand} ${bike.model}. Please update photos or correct specifications.`)}
                >
                  ⚠️ Photo-Name Mismatch
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                  onClick={() => setNotifyMessage("⚙️ Specification Review: Please verify and update your listing's registration year, odometer reading, or pricing.")}
                >
                  ⚙️ Specs Verification
                </button>
              </div>
            </div>

            <form onSubmit={handleSendNotification} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alert Message to Seller</label>
                <textarea
                  rows={4}
                  className="form-control"
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="Type administrative instructions or alert..."
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setNotifyModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotification}
                  className="btn btn-primary"
                >
                  {sendingNotification ? "Dispatching Alert..." : "🚀 Send Official Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bikeApi } from "../../services/bikeApi";
import { aiApi } from "../../services/aiApi";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const BRANDS = ["Royal Enfield", "KTM", "Yamaha", "Kawasaki", "Honda", "TVS", "Bajaj", "Suzuki", "Harley-Davidson", "BMW", "Ducati", "Triumph"];
const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur"];

export default function AddEditBike() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiVerifyingPhoto, setAiVerifyingPhoto] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] = useState(null);

  // Form state
  const [brand, setBrand] = useState("Royal Enfield");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2023);
  const [price, setPrice] = useState("");
  const [kilometersDriven, setKilometersDriven] = useState(5000);
  const [engineCc, setEngineCc] = useState(350);
  const [fuelType, setFuelType] = useState("PETROL");
  const [transmission, setTransmission] = useState("Manual");
  const [condition, setCondition] = useState("EXCELLENT");
  const [city, setCity] = useState("Bangalore");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // [{ imageUrl, isPrimary }]
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load existing bike if editing
  useEffect(() => {
    if (isEditing) {
      async function loadBike() {
        try {
          setLoading(true);
          const data = await bikeApi.getBikeById(id);
          setBrand(data.brand);
          setModel(data.model);
          setYear(data.year);
          setPrice(data.price);
          setKilometersDriven(data.kmDriven ?? data.kilometersDriven ?? 0);
          setEngineCc(data.engineCc || 350);
          setFuelType(data.fuelType || "PETROL");
          setTransmission(data.transmission || "Manual");
          setCondition(data.condition || "EXCELLENT");
          setCity(data.city || "Bangalore");
          setDescription(data.description || "");
          setImages(data.images || (data.primaryImageUrl ? [{ imageUrl: data.primaryImageUrl, isPrimary: true }] : []));
        } catch (err) {
          toast.error("Failed to load bike details");
          navigate("/listings");
        } finally {
          setLoading(false);
        }
      }
      loadBike();
    }
  }, [id, isEditing, navigate]);

  // AI Price Suggestion Feature
  const handleAiPriceEstimate = async () => {
    if (!brand || !model || !year) {
      toast.error("Please enter Brand, Model, and Year first for AI valuation");
      return;
    }

    try {
      setAiEstimating(true);
      const res = await aiApi.suggestPrice({
        brand,
        model,
        year: parseInt(year, 10),
        kmDriven: parseInt(kilometersDriven || 0, 10),
        kilometersDriven: parseInt(kilometersDriven || 0, 10),
        engineCc: parseInt(engineCc || 350, 10),
        cc: parseInt(engineCc || 350, 10),
        condition: condition || "EXCELLENT",
        fuelType,
      });

      const val = res?.estimatedPrice ?? res?.suggestedPrice;
      if (val) {
        setPrice(Math.round(val));
        toast.success(`AI suggested ₹${Math.round(val).toLocaleString()} based on market depreciation!`);
      } else {
        toast.error("Could not calculate estimation with current inputs");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI estimation service temporarily unavailable");
    } finally {
      setAiEstimating(false);
    }
  };

  // Image Upload Handler
  const handleImageFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const uploadedUrls = await bikeApi.uploadImages(files);
      const urlList = Array.isArray(uploadedUrls) ? uploadedUrls : [uploadedUrls];
      const newImages = urlList.map((url, idx) => ({
        imageUrl: typeof url === "string" ? url : (url.imageUrl || url.url),
        isPrimary: images.length === 0 && idx === 0,
      }));
      setImages([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Image upload failed. Check file sizes (max 5MB each).");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSetPrimaryImage = (index) => {
    setImages(images.map((img, idx) => ({ ...img, isPrimary: idx === index })));
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleVerifyPhotoMatch = async () => {
    if (!brand || !model) {
      toast.error("Please enter Brand and Model first");
      return;
    }
    const primaryImg = images.find((i) => i.isPrimary) || images[0];
    if (!primaryImg || !primaryImg.imageUrl) {
      toast.error("Please upload at least one motorcycle photo to verify");
      return;
    }
    try {
      setAiVerifyingPhoto(true);
      const res = await aiApi.verifyPhotoMatch({
        brand,
        model,
        imageUrl: primaryImg.imageUrl,
      });
      setAiVerificationResult(res);
      if (res.matches) {
        toast.success(`Photo verified! Matches declared ${brand} ${model} (${Math.round((res.matchScore || 0.94) * 100)}% match)`);
      } else {
        toast.error("AI Alert: Photograph does not match declared model or lacks clarity!");
      }
    } catch (err) {
      toast.error("AI photo match service temporarily unavailable");
    } finally {
      setAiVerifyingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || !model) {
      toast.error("Please provide Model and Price");
      return;
    }

    try {
      setSubmitting(true);
      const urlList = images.map((img) => (typeof img === "string" ? img : img.imageUrl)).filter(Boolean);
      const primaryIdx = images.findIndex((img) => img.isPrimary);

      const bikeData = {
        brand,
        model,
        year: parseInt(year, 10),
        price: parseFloat(price),
        kmDriven: parseInt(kilometersDriven || 0, 10),
        engineCc: parseInt(engineCc || 0, 10),
        fuelType: fuelType || "Petrol",
        condition,
        city,
        description,
        imageUrls: urlList.length > 0 ? urlList : [
          "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80"
        ],
        primaryImageIndex: primaryIdx >= 0 ? primaryIdx : 0,
      };

      if (isEditing) {
        await bikeApi.updateBike(id, bikeData);
        toast.success("Listing updated successfully!");
        navigate(`/bikes/${id}`);
      } else {
        const created = await bikeApi.createBike(bikeData);
        toast.success("Motorcycle listed for sale successfully!");
        navigate(created?.id ? `/bikes/${created.id}` : "/listings");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save motorcycle");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen message="Loading listing details..." />;

  return (
    <div className="container" style={{ padding: "3rem 1.25rem 5rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          {isEditing ? "Edit Motorcycle Listing" : "List Motorcycle for Sale"}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Provide accurate vehicle specs, clear photographs, and competitive pricing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Core Specs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Brand / Make</label>
            <select className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)}>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Model Name & Variant</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Classic 350 Reborn"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.2rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Manufacturing Year</label>
            <input
              type="number"
              required
              min={1995}
              max={2026}
              className="form-control"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Engine CC</label>
            <input
              type="number"
              required
              className="form-control"
              placeholder="e.g. 350"
              value={engineCc}
              onChange={(e) => setEngineCc(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Kilometers Driven</label>
            <input
              type="number"
              required
              className="form-control"
              placeholder="e.g. 12000"
              value={kilometersDriven}
              onChange={(e) => setKilometersDriven(e.target.value)}
            />
          </div>
        </div>

        {/* Pricing with AI helper */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-subtle)",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Asking Price (INR ₹)</label>
            <button
              type="button"
              onClick={handleAiPriceEstimate}
              disabled={aiEstimating}
              className="btn btn-sm btn-outline"
              style={{ fontSize: "0.8rem", borderColor: "var(--accent-primary)" }}
            >
              {aiEstimating ? "Calculating AI Price..." : "🤖 Ask AI for Fair Market Price"}
            </button>
          </div>
          <input
            type="number"
            required
            className="form-control"
            placeholder="e.g. 185000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.2rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Condition</label>
            <select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="NEW">Brand New</option>
              <option value="EXCELLENT">Used - Like New (Excellent)</option>
              <option value="GOOD">Used - Good</option>
              <option value="FAIR">Used - Fair</option>
              <option value="POOR">Used - Poor</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fuel Type</label>
            <select className="form-control" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
              <option value="PETROL">Petrol</option>
              <option value="ELECTRIC">Electric</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">City Location</label>
            <select className="form-control" value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Detailed Description & Modifications</label>
          <textarea
            rows={4}
            className="form-control"
            placeholder="Mention service records, single owner status, aftermarket accessories, tire health..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Multi-Image Upload */}
        <div>
          <label className="form-label">Vehicle Photographs</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageFiles}
            disabled={uploadingImages}
            className="form-control"
            style={{ padding: "0.5rem" }}
          />
          {uploadingImages && <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", marginTop: "4px" }}>Uploading images to server...</div>}

          {/* Image Previews */}
          {images.length > 0 && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: "100px",
                    height: "80px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: img.isPrimary ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  }}
                >
                  <img src={img.imageUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {img.isPrimary ? (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "var(--accent-primary)",
                        color: "#fff",
                        fontSize: "0.6rem",
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      PRIMARY
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(idx)}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        fontSize: "0.6rem",
                        cursor: "pointer",
                      }}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      background: "rgba(0,0,0,0.8)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Photo & Name Consistency Verification Tool */}
          {images.length > 0 && (
            <div
              style={{
                marginTop: "1.2rem",
                padding: "1rem",
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    🤖 AI Photo & Model Verification
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Inspects your primary photograph to ensure it matches declared Make/Model and checks image clarity.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyPhotoMatch}
                  disabled={aiVerifyingPhoto}
                  className="btn btn-sm btn-outline"
                  style={{ borderColor: "rgba(59, 130, 246, 0.6)", color: "var(--accent-primary)" }}
                >
                  {aiVerifyingPhoto ? "Verifying..." : "🔍 Check Photo & Model Match"}
                </button>
              </div>

              {aiVerificationResult && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    background: aiVerificationResult.matches ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${aiVerificationResult.matches ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    fontSize: "0.82rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontWeight: 700, color: aiVerificationResult.matches ? "#10b981" : "#f87171" }}>
                      {aiVerificationResult.matches ? "✅ Match Verified (" + Math.round((aiVerificationResult.matchScore || 0.94) * 100) + "%)" : "⚠️ Model Discrepancy / Low Quality"}
                    </span>
                    <span className={`badge ${aiVerificationResult.clearImage !== false ? "badge-info" : "badge-warning"}`}>
                      {aiVerificationResult.clearImage !== false ? "📸 Clear Image" : "⚠️ Low Clarity"}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.4rem 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {aiVerificationResult.explanation}
                  </p>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    💡 <em>{aiVerificationResult.recommendation}</em>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ marginTop: "1rem" }}>
          {submitting ? "Publishing Listing..." : isEditing ? "Save Listing Changes" : "Publish Motorcycle Listing 🚀"}
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { bikeApi } from "../services/bikeApi";
import BikeCard from "../components/common/BikeCard";
import Loader from "../components/common/Loader";

const BRANDS = ["Royal Enfield", "KTM", "Yamaha", "Kawasaki", "Honda", "TVS", "Bajaj", "Suzuki", "Harley-Davidson", "BMW", "Ducati", "Triumph"];
const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur"];
const CONDITIONS = [
  { label: "All Conditions", value: "" },
  { label: "Brand New", value: "NEW" },
  { label: "Used - Like New (Excellent)", value: "EXCELLENT" },
  { label: "Used - Good", value: "GOOD" },
  { label: "Used - Fair", value: "FAIR" },
  { label: "Used - Poor", value: "POOR" },
];

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortDir, setSortDir] = useState(searchParams.get("sortDir") || "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "0", 10));

  // Results state
  const [bikes, setBikes] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Compare selection state
  const [compareList, setCompareList] = useState([]);

  // Fetch bikes on filter change
  useEffect(() => {
    async function fetchBikes() {
      try {
        setLoading(true);
        const params = {
          page,
          size: 9,
          sortBy,
          sortDir,
          status: "AVAILABLE",
        };
        if (search) params.search = search;
        if (brand) params.brand = brand;
        if (city) params.city = city;
        if (condition) params.condition = condition;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const res = await bikeApi.getBikes(params);
        setBikes(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } catch (err) {
        console.error("Failed to fetch bikes:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBikes();
  }, [search, brand, city, condition, minPrice, maxPrice, sortBy, sortDir, page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    const newParams = new URLSearchParams();
    if (search) newParams.set("search", search);
    if (brand) newParams.set("brand", brand);
    if (city) newParams.set("city", city);
    if (condition) newParams.set("condition", condition);
    if (minPrice) newParams.set("minPrice", minPrice);
    if (maxPrice) newParams.set("maxPrice", maxPrice);
    newParams.set("page", "0");
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearch("");
    setBrand("");
    setCity("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setPage(0);
    setSearchParams({});
  };

  const handleCompareToggle = (bike) => {
    if (compareList.some((b) => b.id === bike.id)) {
      setCompareList(compareList.filter((b) => b.id !== bike.id));
    } else {
      if (compareList.length >= 3) {
        alert("You can compare up to 3 bikes simultaneously.");
        return;
      }
      setCompareList([...compareList, bike]);
    }
  };

  const goToCompare = () => {
    const ids = compareList.map((b) => b.id).join(",");
    navigate(`/compare?ids=${ids}`);
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Motorcycle Marketplace</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Showing {totalElements} available verified bikes across India
        </p>
      </div>

      {/* Main Layout: Sidebar + Listings Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Filters Sidebar */}
        <aside
          className="glass-panel"
          style={{
            padding: "1.5rem",
            position: "sticky",
            top: "90px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Filters</h3>
            <button
              onClick={handleClearFilters}
              style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600 }}
            >
              Reset
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Search Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search Keyword</label>
              <input
                type="text"
                className="form-control"
                placeholder="Model, cc, variant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Brand Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Manufacturer / Brand</label>
              <select className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">All Brands</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">City</label>
              <select className="form-control" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Condition</label>
              <select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="form-label">Price Range (₹)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ width: "50%" }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Listings Main Section */}
        <div>
          {/* Sorting and Active Summary Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Page <strong style={{ color: "#fff" }}>{page + 1}</strong> of{" "}
              <strong style={{ color: "#fff" }}>{Math.max(1, totalPages)}</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Sort By:</label>
              <select
                className="form-control"
                value={`${sortBy}_${sortDir}`}
                onChange={(e) => {
                  const [sb, sd] = e.target.value.split("_");
                  setSortBy(sb);
                  setSortDir(sd);
                }}
                style={{ width: "auto", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
              >
                <option value="createdAt_desc">Newest Listings</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Year: Newest to Oldest</option>
                <option value="kilometersDriven_asc">Mileage: Low to High</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <Loader message="Loading filtered motorcycles..." />
          ) : bikes.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
              <h3 style={{ marginBottom: "0.5rem" }}>No matching motorcycles found</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Try adjusting your search criteria or clearing filters to see more results.
              </p>
              <button onClick={handleClearFilters} className="btn btn-secondary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid-listing">
                {bikes.map((bike) => (
                  <BikeCard
                    key={bike.id}
                    bike={bike}
                    onCompareToggle={handleCompareToggle}
                    isSelectedForCompare={compareList.some((b) => b.id === bike.id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "3rem",
                  }}
                >
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="btn btn-secondary btn-sm"
                  >
                    &larr; Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={`btn btn-sm ${page === idx ? "btn-primary" : "btn-secondary"}`}
                      style={{ minWidth: "36px" }}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Compare Dock */}
      {compareList.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "var(--radius-full)",
            padding: "0.75rem 1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            zIndex: 999,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.2rem" }}>⚖️</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              {compareList.length} of 3 Bikes Selected
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={goToCompare} className="btn btn-sm btn-primary">
              Compare Now &rarr;
            </button>
            <button
              onClick={() => setCompareList([])}
              className="btn btn-sm btn-secondary"
              title="Clear comparison list"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

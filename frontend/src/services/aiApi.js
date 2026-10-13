import api from "./api";

export const aiApi = {
  suggestPrice: async (bikeDetails) => {
    const km = bikeDetails.kmDriven ?? bikeDetails.kilometersDriven ?? 0;
    const cc = bikeDetails.engineCc ?? bikeDetails.cc;
    const payload = {
      brand: bikeDetails.brand,
      model: bikeDetails.model,
      year: parseInt(bikeDetails.year, 10),
      kmDriven: parseInt(km, 10),
      kilometersDriven: parseInt(km, 10),
      condition: bikeDetails.condition || "GOOD",
      engineCc: cc ? parseInt(cc, 10) : undefined,
    };
    const res = await api.post("/ai/price-suggestion", payload);
    return res.data;
  },

  analyzeCondition: async (imageUrl, description) => {
    const res = await api.post("/ai/condition-analysis", { imageUrl, description });
    return res.data;
  },

  getRecommendations: async (limit = 6) => {
    const res = await api.get(`/recommendations?limit=${limit}`);
    return res.data;
  },

  verifyPhotoMatch: async ({ brand, model, imageUrl }) => {
    const res = await api.post("/ai/verify-photo-match", { brand, model, imageUrl });
    return res.data;
  },
};

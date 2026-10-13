import api from "./api";

export const reviewApi = {
  getBikeReviews: async (bikeId) => {
    const res = await api.get(`/reviews/bike/${bikeId}`);
    return res.data;
  },

  getSellerReviews: async (sellerId) => {
    const res = await api.get(`/reviews/seller/${sellerId}`);
    return res.data;
  },

  addReview: async (reviewData) => {
    const res = await api.post("/reviews", reviewData);
    return res.data;
  },
};

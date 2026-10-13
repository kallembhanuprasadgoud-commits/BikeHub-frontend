import api from "./api";

export const adminApi = {
  getAnalytics: async () => {
    const res = await api.get("/admin/analytics");
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get("/admin/users", { params });
    return res.data;
  },

  updateUserStatus: async (userId, status) => {
    const res = await api.put(`/admin/users/${userId}/status?status=${status}`);
    return res.data;
  },

  getPendingSellers: async () => {
    const res = await api.get("/admin/sellers/pending");
    return res.data;
  },

  verifySeller: async (sellerId, status) => {
    const res = await api.put(`/admin/sellers/${sellerId}/verify?status=${status}`);
    return res.data;
  },

  notifySellerAboutBike: async (bikeId, message) => {
    const res = await api.post(`/admin/bikes/${bikeId}/notify-seller`, { message });
    return res.data;
  },

  clearBikeImages: async (bikeId) => {
    const res = await api.delete(`/admin/bikes/${bikeId}/clear-images`);
    return res.data;
  },

  deleteBikeImage: async (bikeId, imageId) => {
    const res = await api.delete(`/admin/bikes/${bikeId}/images/${imageId}`);
    return res.data;
  },
};

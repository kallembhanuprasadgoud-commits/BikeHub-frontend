import api from "./api";

export const wishlistApi = {
  getWishlist: async () => {
    const res = await api.get("/wishlist");
    return res.data;
  },

  addToWishlist: async (bikeId) => {
    const res = await api.post(`/wishlist/${bikeId}`);
    return res.data;
  },

  removeFromWishlist: async (bikeId) => {
    const res = await api.delete(`/wishlist/${bikeId}`);
    return res.data;
  },

  checkWishlist: async (bikeId) => {
    const res = await api.get(`/wishlist/check/${bikeId}`);
    return res.data;
  },
};

import api from "./api";

export const bikeApi = {
  getBikes: async (params = {}) => {
    const res = await api.get("/bikes", { params });
    return res.data;
  },

  getBikeById: async (id) => {
    const res = await api.get(`/bikes/${id}`);
    return res.data;
  },

  createBike: async (bikeData) => {
    const res = await api.post("/bikes", bikeData);
    return res.data;
  },

  updateBike: async (id, bikeData) => {
    const res = await api.put(`/bikes/${id}`, bikeData);
    return res.data;
  },

  deleteBike: async (id) => {
    const res = await api.delete(`/bikes/${id}`);
    return res.data;
  },

  getMyListings: async (params = {}) => {
    const res = await api.get("/bikes/seller/my-listings", { params });
    return res.data;
  },

  compareBikes: async (ids) => {
    const idsString = Array.isArray(ids) ? ids.join(",") : ids;
    const res = await api.get(`/bikes/compare?ids=${idsString}`);
    return res.data;
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    const fileArray = files instanceof FileList || Array.isArray(files) ? Array.from(files) : [files];
    for (let i = 0; i < fileArray.length; i++) {
      formData.append("files", fileArray[i]);
    }
    const res = await api.post("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

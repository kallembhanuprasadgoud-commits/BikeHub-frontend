import api from "./api";

export const authApi = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put("/users/profile", data);
    return res.data;
  },

  changePassword: async (passwordData) => {
    const res = await api.put("/users/change-password", passwordData);
    return res.data;
  },
};

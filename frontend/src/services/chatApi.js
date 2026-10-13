import api from "./api";

export const chatApi = {
  getRooms: async () => {
    const res = await api.get("/chat/rooms");
    return res.data;
  },

  createOrGetRoom: async (bikeId, sellerId) => {
    const res = await api.post(`/chat/rooms?bikeId=${bikeId}&sellerId=${sellerId}`);
    return res.data;
  },

  getMessages: async (roomId) => {
    const res = await api.get(`/chat/rooms/${roomId}/messages`);
    return res.data;
  },

  sendMessage: async (roomId, messageText) => {
    const res = await api.post("/chat/messages", { roomId, messageText });
    return res.data;
  },
};

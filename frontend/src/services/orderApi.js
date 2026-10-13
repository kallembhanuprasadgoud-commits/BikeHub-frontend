import api from "./api";

export const orderApi = {
  createOrder: async (orderData) => {
    const res = await api.post("/orders", orderData);
    return res.data;
  },

  getMyOrders: async (params = {}) => {
    const res = await api.get("/orders/my-orders", { params });
    return res.data;
  },

  getSellerOrders: async (params = {}) => {
    const res = await api.get("/orders/seller-orders", { params });
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  cancelOrder: async (id) => {
    const res = await api.post(`/orders/${id}/cancel`);
    return res.data;
  },

  updateOrderStatus: async (id, status) => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  },

  createPaymentOrder: async (orderId) => {
    const res = await api.post(`/payments/create-order/${orderId}`, { orderId });
    return res.data;
  },

  verifyPayment: async (paymentData) => {
    const payload = {
      orderId: paymentData.orderId,
      gatewayOrderId: paymentData.gatewayOrderId || paymentData.razorpayOrderId,
      gatewayPaymentId: paymentData.gatewayPaymentId || paymentData.razorpayPaymentId,
      gatewaySignature: paymentData.gatewaySignature || paymentData.razorpaySignature,
      razorpayOrderId: paymentData.gatewayOrderId || paymentData.razorpayOrderId,
      razorpayPaymentId: paymentData.gatewayPaymentId || paymentData.razorpayPaymentId,
      razorpaySignature: paymentData.gatewaySignature || paymentData.razorpaySignature,
      method: paymentData.method || "UPI",
    };
    const res = await api.post("/payments/verify", payload);
    return res.data;
  },
};

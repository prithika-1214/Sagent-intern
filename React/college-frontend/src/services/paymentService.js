import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const paymentService = {
  async createPayment(payload) {
    const { data } = await api.post(ENDPOINTS.PAYMENTS.BASE, payload);
    return data;
  },

  async getPayments() {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.BASE);
    return data;
  },

  async getPaymentById(id) {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.BY_ID(id));
    return data;
  },

  async updatePayment(id, payload) {
    const { data } = await api.put(ENDPOINTS.PAYMENTS.BY_ID(id), payload);
    return data;
  },

  async deletePayment(id) {
    const { data } = await api.delete(ENDPOINTS.PAYMENTS.BY_ID(id));
    return data;
  },
};

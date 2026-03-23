import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizePayment = (payment) => ({
  paymentId: payment?.paymentId ?? payment?.payId ?? null,
  payId: payment?.payId ?? payment?.paymentId ?? null,
  payMethod: payment?.payMethod ?? "",
  amount: payment?.amount ?? payment?.fee ?? null,
  fee: payment?.fee ?? payment?.amount ?? null,
  transactionDate: payment?.transactionDate ?? payment?.payDate ?? null,
  payDate: payment?.payDate ?? payment?.transactionDate ?? null,
  transactionId: payment?.transactionId ?? null,
  status: payment?.status ?? "",
  application: payment?.application ?? null,
});

const buildPaymentPayload = (payload) => {
  const appId = Number(payload?.application?.appId ?? payload?.appId);
  if (!appId) {
    throw new Error("Application ID is required for payment.");
  }

  const fee = Number(payload?.fee ?? payload?.amount);
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new Error("A valid fee amount is required.");
  }

  const payDateValue = payload?.payDate ?? payload?.transactionDate ?? todayISO();
  const payDate = String(payDateValue).slice(0, 10);

  return {
    application: { appId },
    payMethod: payload?.payMethod,
    fee,
    payDate,
    transactionId: payload?.transactionId ?? `TXN-${Date.now()}`,
    status: payload?.status ?? "Success",
  };
};

export const paymentService = {
  async createPayment(payload) {
    const body = buildPaymentPayload(payload);
    const { data } = await api.post(ENDPOINTS.PAYMENTS.BASE, body);
    return normalizePayment(data);
  },

  async getPayments() {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.BASE);
    return Array.isArray(data) ? data.map(normalizePayment) : [];
  },

  async getPaymentById(id) {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.BY_ID(id));
    return normalizePayment(data);
  },

  async updatePayment(id, payload) {
    const body = buildPaymentPayload(payload);
    const { data } = await api.put(ENDPOINTS.PAYMENTS.BY_ID(id), body);
    return normalizePayment(data);
  },

  async deletePayment(id) {
    const { data } = await api.delete(ENDPOINTS.PAYMENTS.BY_ID(id));
    return data;
  },
};

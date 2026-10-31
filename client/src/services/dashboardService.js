
import api from "./api";

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getRevenueAnalytics = async () => {
  const response = await api.get("/dashboard/revenue");
  return response.data;
};

export const getRecentPayments = async () => {
  const response = await api.get("/payments/recent");
  return response.data;
};

import api from "./api";

/**
 * Fetch high-level summary metrics from backend
 * Returns: { activeSubscriptions, totalCollectedRevenue (paise), totalOutstandingAmount (paise), overdueInvoices }
 */
export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data?.data || {};
};

/**
 * Fetch customers list
 */
export const getCustomers = async () => {
  const response = await api.get("/customers");
  return response.data?.data || { customers: [], total: 0 };
};

/**
 * Fetch recorded payments
 */
export const getRecentPayments = async () => {
  const response = await api.get("/payments");
  return response.data?.data || { payments: [], total: 0 };
};

/**
 * Fetch subscriptions
 */
export const getSubscriptions = async () => {
  const response = await api.get("/subscriptions");
  return response.data?.data || { subscriptions: [], total: 0 };
};

/**
 * Fetch invoices
 */
export const getInvoices = async () => {
  const response = await api.get("/invoices");
  return response.data?.data || { invoices: [], total: 0 };
};

/**
 * Fetch all dashboard datasets concurrently
 */
export const fetchDashboardData = async () => {
  const [summaryRes, customersRes, paymentsRes, subscriptionsRes, invoicesRes] =
    await Promise.allSettled([
      getDashboardSummary(),
      getCustomers(),
      getRecentPayments(),
      getSubscriptions(),
      getInvoices(),
    ]);

  return {
    summary: summaryRes.status === "fulfilled" ? summaryRes.value : null,
    customers:
      customersRes.status === "fulfilled" ? customersRes.value.customers : [],
    totalCustomers:
      customersRes.status === "fulfilled" ? customersRes.value.total : 0,
    payments:
      paymentsRes.status === "fulfilled" ? paymentsRes.value.payments : [],
    subscriptions:
      subscriptionsRes.status === "fulfilled"
        ? subscriptionsRes.value.subscriptions
        : [],
    invoices:
      invoicesRes.status === "fulfilled" ? invoicesRes.value.invoices : [],
  };
};

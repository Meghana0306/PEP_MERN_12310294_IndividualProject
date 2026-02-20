import axios from "axios";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => apiClient.post("/api/auth/register", data),
  login: (data) => apiClient.post("/api/auth/login", data),
  sendOtp: (data) => apiClient.post("/api/auth/send-otp", data),
  verifyOtp: (data) => apiClient.post("/api/auth/verify-otp", data),
  getCurrentUser: () => apiClient.get("/api/auth/me"),
  updateProfile: (data) => apiClient.put("/api/auth/profile", data),
  changePassword: (data) => apiClient.put("/api/auth/change-password", data),
};

export const employeeAPI = {
  getAll: () => apiClient.get("/api/employees"),
  getCount: () => apiClient.get("/api/employees/count"),
  create: (data) => apiClient.post("/api/employees", data),
  update: (id, data) => apiClient.put(`/api/employees/${id}`, data),
  remove: (id) => apiClient.delete(`/api/employees/${id}`),
};

export const hrAPI = {
  createHR: (data) => apiClient.post("/api/hr", data),
  getHR: () => apiClient.get("/api/hr"),
  getHRById: (id) => apiClient.get(`/api/hr/${id}`),
  updateHR: (id, data) => apiClient.put(`/api/hr/${id}`, data),
  deleteHR: (id) => apiClient.delete(`/api/hr/${id}`),
};

export const reportsAPI = {
  createReport: (data) => apiClient.post("/api/reports", data),
  getReports: () => apiClient.get("/api/reports"),
  getReportById: (id) => apiClient.get(`/api/reports/${id}`),
  updateReport: (id, data) => apiClient.put(`/api/reports/${id}`, data),
  deleteReport: (id) => apiClient.delete(`/api/reports/${id}`),
};

export const settingsAPI = {
  getSettings: () => apiClient.get("/api/settings"),
  updateSettings: (data) => apiClient.put("/api/settings", data),
  getAllSettings: () => apiClient.get("/api/settings/all"),
};

export const payrollAPI = {
  getRecords: (params) => apiClient.get("/api/payroll", { params }),
  getSummary: (params) => apiClient.get("/api/payroll/summary", { params }),
  getAnalytics: (params) => apiClient.get("/api/payroll/analytics", { params }),
  processPayroll: (data) => apiClient.post("/api/payroll/process", data),
  updateComponents: (id, data) => apiClient.patch(`/api/payroll/${id}/components`, data),
  updateStatus: (id, data) => apiClient.patch(`/api/payroll/${id}/status`, data),
  getPayslip: (id) => apiClient.get(`/api/payroll/${id}/payslip`),
};

export default apiClient;

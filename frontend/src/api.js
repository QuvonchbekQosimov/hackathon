import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 16000,
});
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    error.message =
      typeof detail === "string"
        ? detail
        : error.code === "ECONNABORTED"
          ? "Server javobi kechikdi. Qayta urinib ko'ring."
          : "Server bilan bog'lanib bo'lmadi.";
    if (error.response?.status === 401)
      window.dispatchEvent(new Event("bais:unauthorized"));
    return Promise.reject(error);
  },
);

export const registerUser = (data) => API.post("/users/register", data);
export const loginUser = (data) => API.post("/users/login", data);
export const getMe = () => API.get("/users/me");
export const logoutUser = () => API.post("/users/logout");
export const saveProfile = (data) => API.put("/users/me", data);
export const getCapabilities = () => API.get("/capabilities");
export const getCatalog = (params, signal) =>
  API.get("/catalog", { params, signal });
export const getProducts = (params) => API.get("/products", { params });
export const getProductDetail = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post("/products", data);
export const editProduct = (id, data) => API.put(`/products/${id}`, data);
export const archiveProduct = (id) => API.delete(`/products/${id}`);
export const getOrders = (params) => API.get("/orders", { params });
export const createOrder = (data, key) =>
  API.post("/orders", data, { headers: { "Idempotency-Key": key } });
export const acceptOrder = (id) => API.put(`/orders/${id}/accept`);
export const cancelOrder = (id) => API.put(`/orders/${id}/cancel`);
export const completeOrder = (id) => API.put(`/orders/${id}/complete`);
export const getTrips = (params) => API.get("/logistics/trips", { params });
export const createTrip = (data) => API.post("/logistics/trips", data);
export const getBids = (id) => API.get(`/logistics/trips/${id}/bids`);
export const createBid = (data) => API.post("/logistics/bids", data);
export const acceptBid = (id) => API.put(`/logistics/bids/${id}/accept`);
export const startTrip = (id) => API.put(`/logistics/trips/${id}/start`);
export const deliverTrip = (id) => API.put(`/logistics/trips/${id}/deliver`);
export const getSummary = () => API.get("/dashboard");
export const sendAiChat = (message, history = []) =>
  API.post("/chat", { message, history });
export const getAnalysis = (region, signal) =>
  API.get(`/analysis/${encodeURIComponent(region)}`, { signal });
export default API;

export const restoreProduct = (id) => API.put(`/products/${id}/restore`);

export const changePassword = (data) => API.post("/users/password", data);

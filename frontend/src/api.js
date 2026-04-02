import axios from 'axios';

// Faqat bitta yagona yo'l! Endi server adashmaydi.
const API = axios.create({
  baseURL: 'http://localhost:8000/api', 
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const registerUser = (data) => API.post('/users/register', data);
export const loginUser = (data) => API.post('/users/login', data);

export const getProducts = () => API.get('/products');
export const getProductDetail = (id) => API.get(`/products/${id}`);

// ENG ASOSIY QISM: params ni standart usulda jo'natamiz
export const createProduct = (factoryId, productData) => 
    API.post('/products', productData, { params: { factory_id: factoryId } });

export const getOrders = () => API.get('/orders');
export const createOrder = (data) => API.post('/orders', data);
export const acceptOrder = (orderId) => API.put(`/orders/${orderId}/accept`);

export const getTrips = () => API.get('/logistics/trips');
export const createTrip = (data) => API.post('/logistics/trips', data);
export const getBids = (tripId) => API.get(`/logistics/trips/${tripId}/bids`);
export const createBid = (data) => API.post('/logistics/bids', data);

export const sendAiChat = (message) => API.post('/chat', { message });
export const getAnalysis = (region) => API.get(`/analysis/${region}`);

export default API;
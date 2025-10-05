import axios from 'axios';

const API_URL =
  import.meta.env.MODE === 'production'
    ? 'https://60c8f364-ede3-46f3-bdc5-eb369a5125ee-00-2hm7qr1hutgxs.pike.replit.dev/api' // URL backend produksi di Replit
    : '/api'; // gunakan proxy saat development

// Buat instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

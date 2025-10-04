import axios from 'axios';

// Gunakan path relatif agar Vercel & Vite Proxy bisa menangani routing ke backend.
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Ambil data user dari localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
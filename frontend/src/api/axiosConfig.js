import axios from 'axios';

export const SERVER_URL = 'https://pentol-kobong-pos.vercel.app/:5001'; // Gunakan localhost untuk development stabil
const API_URL = `${SERVER_URL}/api/`;

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
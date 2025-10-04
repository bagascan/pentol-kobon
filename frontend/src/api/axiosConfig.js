import axios from 'axios';

// PERBAIKAN: Hapus URL hardcode. Gunakan path relatif agar Vercel bisa
// menangani routing ke backend sesuai aturan di vercel.json.
export const SERVER_URL = ''; // Tidak perlu lagi
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
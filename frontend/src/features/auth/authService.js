import api from '../../api/axiosConfig'; // Import instance axios yang sudah dikonfigurasi

// Register user
const register = async (userData) => {
  const response = await api.post('users/register', userData);

  // Kita tidak menyimpan data registrasi di localStorage,
  // karena user harus login setelah diverifikasi
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await api.post('users/login', userData);

  if (response.data) {
    // Simpan data user (termasuk token) ke localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};

// Logout user
const logout = () => {
  // Hapus data user dari localStorage
  localStorage.removeItem('user');
};

// --- Fungsi Khusus Owner ---

// Get unverified users
const getUnverifiedUsers = async () => {
  const response = await api.get('users/unverified');
  return response.data;
};

// Verify a user
const verifyUser = async (userId, outletId) => {
  const response = await api.put(`users/verify/${userId}`, { outletId }); // Kirim outletId di body
  return response.data;
};

// Get all verified employees
const getVerifiedUsers = async () => {
  const response = await api.get('users/verified');
  return response.data;
};

// Assign or change an outlet for a user
const assignOutlet = async (userId, outletId) => {
  const response = await api.put(`users/assign-outlet/${userId}`, { outletId });
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getUnverifiedUsers,
  verifyUser,
  getVerifiedUsers,
  assignOutlet,
};

export default authService;

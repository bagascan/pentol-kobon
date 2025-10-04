import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Cek apakah ada data user di localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (user) {
    // Jika ada user, izinkan akses ke rute di dalamnya.
    return <Outlet />;
  } else {
    // Jika tidak, arahkan kembali ke halaman login.
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;

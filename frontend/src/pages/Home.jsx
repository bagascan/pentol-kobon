import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      // Jika user sudah login, arahkan berdasarkan peran
      navigate(user.role === 'owner' ? '/dashboard' : '/kasir');
    } else {
      // Jika belum login, arahkan ke halaman login
      navigate('/login');
    }
  }, [navigate]);

  // Tampilkan loading atau halaman kosong selagi proses redirect
  return <div>Loading...</div>;
}

export default Home;
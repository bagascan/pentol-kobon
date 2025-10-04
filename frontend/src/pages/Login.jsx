import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link dan useNavigate
import authService from '../features/auth/authService';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [startAnimation, setStartAnimation] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  // Cek status login di luar useEffect untuk keputusan render yang lebih cepat
  const user = JSON.parse(localStorage.getItem('user'));

  const onChange = (e) => {
    setFormData((prevState) => ({ ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      // Jika user sudah ada, langsung navigasi
      navigate(user.role === 'owner' ? '/dashboard' : '/kasir');
    } else {
      // Jika tidak ada user, baru jalankan animasi untuk form login
      const timer = setTimeout(() => {
        setStartAnimation(true);
      }, 100); // Delay singkat untuk memastikan render awal selesai
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
    };

    try {
      const user = await authService.login(userData);
      // Arahkan pengguna berdasarkan peran mereka
      if (user.role === 'owner') {
        navigate('/dashboard');
      } else {
        // Nanti kita akan buat halaman kasir ini
        navigate('/kasir');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat login';
      setMessage(errorMessage);
    }
  };

  // Style dinamis untuk animasi
  const logoStyle = {
    width: '100px',
    height: '100px',
    marginBottom: '1rem',
    transform: startAnimation ? 'translateY(0)' : 'translateY(calc(50vh - 150%))', // Posisi awal di tengah layar
    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Animasi pergerakan
  };

  const formContentStyle = {
    opacity: startAnimation ? 1 : 0,
    transform: startAnimation ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s', // Animasi fade-in dan slide-up dengan delay
  };

  // Jika user sudah login, jangan render apapun (atau tampilkan loading) untuk mencegah kedipan.
  if (user) {
    return null; // Atau <p>Mengalihkan...</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(to bottom, #ff4500, #ff6347)', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src="/logo.png" alt="Logo Pentol Kobong" style={logoStyle} />

        <div style={formContentStyle}>
          <h1 style={{ color: '#333', margin: 0, marginBottom: '0.5rem' }}>PENTOL KOBONG</h1>
          <p style={{ color: '#666', marginTop: 0, marginBottom: '2rem' }}>Silakan masuk untuk melanjutkan</p>
          
          {message && <p style={{ color: 'red', backgroundColor: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{message}</p>}

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <input 
                type="email" 
                name="email" 
                value={email} 
                placeholder="Email" 
                onChange={onChange} 
                required 
                style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input 
                type="password" 
                name="password" 
                value={password} 
                placeholder="Password" 
                onChange={onChange} 
                required 
                style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }}
              />
            </div>
            <div>
              <button 
                type="submit" 
                style={{ width: '100%', padding: '1rem', border: 'none', borderRadius: '8px', backgroundColor: '#ff4500', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Login
              </button>
            </div>
          </form>
          <p style={{ marginTop: '2rem', color: '#666' }}>
            Belum punya akun? <Link to="/register" style={{ color: '#ff4500', textDecoration: 'none', fontWeight: 'bold' }}>Daftar di sini</Link>
          </p>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, rgba(255, 69, 0, 0.2), transparent)', zIndex: 0 }}></div>
    </div>
  );
}

export default Login;

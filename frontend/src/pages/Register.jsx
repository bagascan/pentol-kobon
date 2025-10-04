import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../features/auth/authService';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [message, setMessage] = useState('');
  const [startAnimation, setStartAnimation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, password2 } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Memicu animasi
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password !== password2) {
      setMessage('Password tidak cocok!');
    } else {
      const userData = {
        name,
        email,
        password,
      };

      try {
        await authService.register(userData);
        // Tampilkan modal sukses, bukan alert
        setShowSuccessModal(true);
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat registrasi';
        setMessage(errorMessage);
      }
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  // Style dinamis untuk animasi
  const logoStyle = {
    width: '100px',
    height: '100px',
    marginBottom: '1rem',
    transform: startAnimation ? 'translateY(0)' : 'translateY(calc(50vh - 150%))',
    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const formContentStyle = {
    opacity: startAnimation ? 1 : 0,
    transform: startAnimation ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(to bottom, #ff4500, #ff6347)', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src="/logo.png" alt="Logo Pentol Kobong" style={logoStyle} />

        <div style={formContentStyle}>
          <h1 style={{ color: '#333', margin: 0, marginBottom: '0.5rem' }}>Buat Akun Baru</h1>
          <p style={{ color: '#666', marginTop: 0, marginBottom: '2rem' }}>Daftar untuk menjadi bagian dari tim</p>

          {message && <p style={{ color: 'red', backgroundColor: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{message}</p>}

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <input type="text" name="name" value={name} placeholder="Nama Lengkap" onChange={onChange} required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input type="email" name="email" value={email} placeholder="Email" onChange={onChange} required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input type="password" name="password" value={password} placeholder="Password" onChange={onChange} required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input type="password" name="password2" value={password2} placeholder="Konfirmasi Password" onChange={onChange} required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            <div>
              <button type="submit" style={{ width: '100%', padding: '1rem', border: 'none', borderRadius: '8px', backgroundColor: '#ff4500', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Daftar
              </button>
            </div>
          </form>
          <p style={{ marginTop: '2rem', color: '#666' }}>
            Sudah punya akun? <Link to="/login" style={{ color: '#ff4500', textDecoration: 'none', fontWeight: 'bold' }}>Login di sini</Link>
          </p>
        </div>
      </div>

      {/* Modal Sukses Registrasi */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ color: '#4CAF50', marginTop: 0 }}>Registrasi Berhasil!</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Akun Anda telah berhasil dibuat. Silakan tunggu verifikasi dari Owner untuk dapat login.
            </p>
            <button 
              onClick={handleCloseSuccessModal} 
              style={{ width: '100%', padding: '1rem', border: 'none', borderRadius: '8px', backgroundColor: '#ff4500', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, rgba(255, 69, 0, 0.2), transparent)', zIndex: 0 }}></div>
    </div>
  );
}

export default Register;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../features/auth/authService';
import transactionService from '../features/transactions/transactionService';
import Modal from './Modal';
import { useOutlet } from '../context/OutletContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [sessionSales, setSessionSales] = useState(0);
  const { outlets, activeOutlet, setActiveOutlet } = useOutlet();
  
  const onLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSelectOutlet = (outlet) => {
    setActiveOutlet(outlet);
    setIsOutletModalOpen(false);
  };

  const fetchSessionSales = useCallback(async () => {
    // Tentukan outletId berdasarkan peran user
    let outletId;
    if (user.role === 'owner') {
      // Untuk owner, gunakan ID dari outlet yang aktif di context
      outletId = activeOutlet?._id;
    } else {
      // Untuk karyawan, selalu gunakan ID outlet yang ter-assign pada user
      outletId = user.outlet;
    }
    if (!outletId || outletId === 'all') {
      setSessionSales(0);
      return;
    }
    try {
      const data = await transactionService.getSessionSales(outletId);
      setSessionSales(data?.totalSales || 0);
    } catch (error) {
      console.error("Gagal memuat total penjualan sesi di header:", error);
      setSessionSales(0);
    }
  }, [user.role, user.outlet, activeOutlet]);

  // Efek untuk mengambil total penjualan saat komponen dimuat dan setiap kali halaman berubah
  useEffect(() => {
    fetchSessionSales();
    // Set interval untuk refresh data penjualan setiap 30 detik
    const interval = setInterval(fetchSessionSales, 30000);
    return () => clearInterval(interval); // Cleanup interval saat komponen dilepas
  }, [fetchSessionSales]);

  // Efek untuk mendengarkan event 'transactionSuccess' dari komponen lain
  useEffect(() => {
    const handleTransactionSuccess = () => fetchSessionSales();
    window.addEventListener('transactionSuccess', handleTransactionSuccess);
    return () => window.removeEventListener('transactionSuccess', handleTransactionSuccess);
  }, [fetchSessionSales]);

  // Efek untuk menutup dropdown profil saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1rem',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    zIndex: 1100,
  };

  const outletSelectorStyle = {
    cursor: 'pointer',
    padding: '0.4rem 0.6rem', // Perkecil padding
    borderRadius: '8px',
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    display: 'flex', // Gunakan flexbox untuk kontrol yang lebih baik
    alignItems: 'center',
    maxWidth: '200px', // Batasi lebar maksimum
  };

  const outletItemStyle = {
    padding: '1rem',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  };

  if (!user) return null;

  return (
    <>
      <header style={headerStyle}>
        {/* Logo atau Nama Aplikasi */}
        <img src="/logo.png" alt="Logo" style={{ height: '40px', cursor: 'pointer' }} onClick={() => navigate(user.role === 'owner' ? '/dashboard' : '/kasir')} />

        {/* Hanya tampilkan pemilih outlet & total sesi jika BUKAN di halaman laporan */}
        {location.pathname !== '/laporan' && location.pathname !== '/dashboard' && location.pathname !== '/tutup-toko' && (
          user.role === 'owner' ? (
            <div onClick={() => setIsOutletModalOpen(true)} style={outletSelectorStyle} title={activeOutlet?.name}>
              <span style={{ 
                fontSize: '0.9em',
                fontWeight: '500',
                color: '#ff4500', // Ubah warna teks
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis' // Tambahkan elipsis (...) jika teks terlalu panjang
              }}>
                {activeOutlet?.name || 'Pilih Outlet'}
              </span>
              {/* Tampilkan total sesi di samping nama outlet jika ada */}
              {activeOutlet && (
                <>
                  <span style={{ margin: '0 0.4rem', color: '#ff4500', opacity: 0.5, flexShrink: 0 }}>|</span>
                  <span style={{ fontSize: '0.8em', color: '#ff4500', whiteSpace: 'nowrap', flexShrink: 0 }}>Rp{sessionSales.toLocaleString('id-ID')}</span>
                </>
              )}
              <span style={{ marginLeft: '0.4rem', fontSize: '0.8em', flexShrink: 0, color: '#ff4500' }}>▼</span>
            </div>
          ) : (
            // Tampilan untuk Karyawan
            <div style={{ color: '#333', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9em', fontWeight: 'bold' }}>Rp{sessionSales.toLocaleString('id-ID')}</p>
            </div>
          )
        )}

        {/* Tombol Logout */}
        <div style={{ position: 'relative' }} ref={profileDropdownRef}>
          <img 
            src={`https://ui-avatars.com/api/?name=${user.name.replace(/ /g, '+')}&background=ff4500&color=fff&bold=true`} 
            alt="Profil" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }} 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          />
          {isProfileDropdownOpen && (
            <div style={{ position: 'absolute', top: '50px', right: 0, background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '200px', zIndex: 1200 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>Selamat Bekerja,</p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.9em' }}>{user.name}</p>
              </div>
              {/* Tombol Dashboard Khusus Owner */}
              {user.role === 'owner' && (
                <div onClick={() => { navigate('/dashboard'); setIsProfileDropdownOpen(false); }} style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#333' }}>Dashboard</div>
              )}
              <button onClick={onLogout} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '1rem', cursor: 'pointer', color: '#d9534f' }}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Modal untuk Pemilihan Outlet */}
      <Modal
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
        title="Pilih Outlet"
        hideDefaultButton={true}
      >
        <div
          style={{ ...outletItemStyle, fontWeight: activeOutlet?._id === 'all' ? 'bold' : 'normal' }}
          onClick={() => handleSelectOutlet({ _id: 'all', name: 'Semua Outlet' })}
        >
          Semua Outlet
        </div>
        {outlets.map(outlet => (
          <div
            key={outlet._id}
            style={{ ...outletItemStyle, fontWeight: activeOutlet?._id === outlet._id ? 'bold' : 'normal' }}
            onClick={() => handleSelectOutlet(outlet)}
          >
            {outlet.name}
          </div>
        ))}
      </Modal>
    </>
  );
};

export default Header;
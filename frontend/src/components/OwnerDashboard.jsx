import { useState, useEffect } from 'react';
import authService from '../features/auth/authService';
import outletService from '../features/outlets/outletService'; // Perbaiki path impor ini
import { Link } from 'react-router-dom';
import PushSubscriber from './PushSubscriber';

const OwnerDashboard = () => {
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlets, setSelectedOutlets] = useState({}); // State untuk menyimpan pilihan outlet per user

  const fetchData = async () => {
    try {
      const [unverifiedUsersData, verifiedUsersData, outletsData] = await Promise.all([
        authService.getUnverifiedUsers(),
        authService.getVerifiedUsers(),
        outletService.getOutlets(),
      ]);
      setUnverifiedUsers(unverifiedUsersData);
      setVerifiedUsers(verifiedUsersData);
      setOutlets(outletsData);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOutletSelection = (userId, outletId) => {
    setSelectedOutlets(prev => ({ ...prev, [userId]: outletId }));
  };

  const handleVerify = async (userId) => {
    const outletId = selectedOutlets[userId];
    if (!outletId) {
      setMessage('Pilih outlet terlebih dahulu untuk karyawan ini.');
      return;
    }

    try {
      const response = await authService.verifyUser(userId, outletId);
      setMessage(response.message);
      // Refresh daftar user setelah verifikasi berhasil
      fetchData();
      // Hapus pilihan outlet untuk user yang sudah diverifikasi
      setSelectedOutlets(prev => {
        const newSelections = { ...prev };
        delete newSelections[userId];
        return newSelections;
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal memverifikasi user';
      setMessage(errorMessage);
    }
  };

  const handleReassignOutlet = async (userId, newOutletId) => {
    try {
      // Update di backend
      await authService.assignOutlet(userId, newOutletId);

      // Update state di frontend secara manual untuk respons instan
      setVerifiedUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, outlet: outlets.find(o => o._id === newOutletId) } : user
        )
      );
      setMessage(`Penugasan outlet untuk karyawan berhasil diubah.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mengubah outlet karyawan.');
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '1.5rem',
  };

  const verificationItemStyle = {
    display: 'flex',
    flexDirection: 'column', // Ubah arah flex menjadi kolom
    justifyContent: 'space-between',
    alignItems: 'stretch', // Buat item meregang selebar kontainer
    padding: '1rem 0',
    borderBottom: '1px solid #f0f0f0',
  };
  return (
    <div style={{ paddingBottom: '60px' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Dashboard Owner</h2>

      {/* Kartu Aksi Cepat */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Aksi Cepat</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <Link to="/outlets" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', backgroundColor: '#0275d8', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>Kelola Outlet</span>
          </Link>
          <Link to="/bahan-baku" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', backgroundColor: '#5bc0de', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            <span>Bahan Baku</span>
          </Link>
          <Link to="/stok-bahan" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', backgroundColor: '#5cb85c', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <span>Stok Bahan</span>
          </Link>
          <Link to="/transfer-stok" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', backgroundColor: '#f0ad4e', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11.5V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 12.5V15a4 4 0 0 1-4 4H3"></path></svg>
            <span>Transfer Stok</span>
          </Link>
          <Link to="/peralatan" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', backgroundColor: '#d9534f', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 19.88V16l-2-1-2 1v3.88a2 2 0 0 0 .52 1.4l.16.12a2 2 0 0 0 2.64 0l.16-.12a2 2 0 0 0 .52-1.4z"></path><path d="M12 13.5V2.27a2 2 0 0 0-1.24-1.8L5.24.27a2 2 0 0 0-2.48 1.8v13.1a2 2 0 0 0 .52 1.4l.16.12a2 2 0 0 0 2.64 0l4.44-3.33z"></path><path d="M12 13.5V2.27a2 2 0 0 1 1.24-1.8l5.52-2.2a2 2 0 0 1 2.48 1.8v13.1a2 2 0 0 1-.52 1.4l-.16.12a2 2 0 0 1-2.64 0l-4.44-3.33z"></path></svg>
            <span>Kelola Peralatan</span>
          </Link>
          <Link to="/laporan-bulanan" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', backgroundColor: '#292b2c', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Laporan Bulanan</span>
          </Link>
        </div>
      </div>

      {/* Kartu Panel Verifikasi */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Panel Verifikasi Karyawan</h3>
        {message && <p style={{ color: message.includes('berhasil') ? 'green' : 'red', backgroundColor: message.includes('berhasil') ? '#e8f5e9' : '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{message}</p>}
        
        {unverifiedUsers.length > 0 ? (
          <div>
            {unverifiedUsers.map((user) => (
              <div key={user._id} style={verificationItemStyle}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontWeight: '500' }}>{user.name}</p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{user.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select
                    value={selectedOutlets[user._id] || ''}
                    onChange={(e) => handleOutletSelection(user._id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', flexGrow: 1 }} // Buat dropdown mengisi ruang
                  >
                    <option value="" disabled>-- Pilih Outlet --</option>
                    {outlets.length > 0 ? (
                      outlets.map(outlet => (
                        <option key={outlet._id} value={outlet._id}>{outlet.name}</option>
                      ))
                    ) : (
                      <option disabled>Belum ada outlet</option>
                    )}
                  </select>
                  <button 
                    onClick={() => handleVerify(user._id)} 
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Verifikasi
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
            <p>👍</p>
            <p>Tidak ada karyawan baru yang perlu diverifikasi.</p>
          </div>
        )}
      </div>
      
      {/* Kartu Manajemen Karyawan */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Manajemen Karyawan</h3>
        {verifiedUsers.length > 0 ? (
          <div>
            {verifiedUsers.map((user) => (
              <div key={user._id} style={verificationItemStyle}>
                <div>
                  <p style={{ margin: 0, fontWeight: '500' }}>{user.name}</p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{user.email}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <select
                    value={user.outlet?._id || ''}
                    onChange={(e) => handleReassignOutlet(user._id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}
                  >
                    <option value="" disabled>-- Pilih Outlet --</option>
                    {outlets.map(outlet => (
                      <option key={outlet._id} value={outlet._id}>{outlet.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>Belum ada karyawan yang terverifikasi.</p>
        )}
      </div>

      {/* Kartu Pengaturan Notifikasi */}
      <div style={cardStyle}>
        <h4>Pengaturan Notifikasi</h4>
        <p style={{fontSize: '0.9em', color: '#666'}}>Aktifkan notifikasi untuk menerima pemberitahuan transaksi secara real-time di perangkat ini.</p>
        <PushSubscriber />
      </div>
    </div>
  );
};

export default OwnerDashboard;
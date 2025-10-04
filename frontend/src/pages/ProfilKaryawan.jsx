import { useState, useEffect } from 'react';
import { useOutlet } from '../context/OutletContext';
import PushSubscriber from '../components/PushSubscriber'; // Impor komponen

function ProfilKaryawanPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const { outlets } = useOutlet();
  const [outletDetail, setOutletDetail] = useState(null);

  useEffect(() => {
    // Dijalankan setiap kali daftar outlet berubah atau selesai dimuat
    if (user.role === 'karyawan' && outlets.length > 0) {
      const outletId = user.outlet; // Ambil ID outlet dari data user
      const detail = outlets.find(o => o._id === outletId);
      setOutletDetail(detail);
    }
  }, [outlets, user.role, user.outlet]);

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '1.5rem',
  };

  return (
    <div>
      <h2>Profil Karyawan</h2>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src={`https://ui-avatars.com/api/?name=${user.name.replace(/ /g, '+')}&background=ff4500&color=fff&bold=true&size=96`} 
            alt="Profil" 
            style={{ width: '96px', height: '96px', borderRadius: '50%' }} 
          />
          <h3 style={{ margin: '1rem 0 0.2rem 0' }}>{user.name}</h3>
          <p style={{ margin: 0, color: '#666' }}>{user.email}</p>
        </div>

        <h4 style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>Informasi Penugasan</h4>
        {outletDetail ? (
          <div>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Outlet:</strong><br />
              <span style={{ color: '#ff4500' }}>{outletDetail.name}</span>
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Alamat:</strong><br />
              {outletDetail.address}
            </p>
          </div>
        ) : (
          <p>Memuat informasi outlet...</p>
        )}
      </div>

      <div style={cardStyle}>
        <h4 style={{ marginTop: 0 }}>Pengaturan Notifikasi</h4>
        <p style={{fontSize: '0.9em', color: '#666', marginTop: 0}}>Aktifkan notifikasi untuk menerima pemberitahuan saat sesi kerja dimulai.</p>
        <PushSubscriber />
      </div>
    </div>
  );
}

export default ProfilKaryawanPage;
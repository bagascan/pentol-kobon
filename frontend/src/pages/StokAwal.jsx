import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dailyLogService from '../features/dailyLogs/dailyLogService';
import Modal from '../components/Modal';
import { useOutlet } from '../context/OutletContext';
import assetService from '../features/assets/assetService';

function StokAwalPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const { activeOutlet } = useOutlet();
  const [products, setProducts] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State untuk mode edit
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    status: 'info',
  });
  const [confirmResetModal, setConfirmResetModal] = useState({ isOpen: false });

  // State untuk form input
  const [initialCash, setInitialCash] = useState('');
  const [displayInitialCash, setDisplayInitialCash] = useState(''); // State untuk tampilan input
  // --- PERUBAHAN: State untuk manajemen peralatan baru ---
  const [masterAssets, setMasterAssets] = useState([]);
  const [assetQuantities, setAssetQuantities] = useState({});

  useEffect(() => {
    // Tentukan outletId berdasarkan peran user
    const outletId = user.role === 'owner' ? activeOutlet?._id : user.outlet;
    
    // Jika tidak ada outlet yang dipilih (misalnya saat owner baru login), jangan lakukan apa-apa.
    if (!outletId) {
      setTodayLog(null);
      setLoading(false);
      return;
    }
    
    const fetchLog = async () => {
      try {
        setLoading(true);
        const logData = await dailyLogService.getTodaySession(outletId);
        setTodayLog(logData);
      } catch (error) {
        console.error("Gagal memuat data awal", error);
        setTodayLog(null); // Pastikan state bersih jika ada error
      }
      setLoading(false);
    };
    fetchLog();
  }, [user.role, user.outlet, activeOutlet]);
  
  // --- BARU: Efek untuk mengambil daftar master peralatan ---
  useEffect(() => {
    const fetchMasterAssets = async () => {
      if (user.role === 'owner') {
        try {
          const data = await assetService.getAssets();
          setMasterAssets(data);
        } catch (error) {
          console.error("Gagal memuat daftar peralatan.", error);
        }
      }
    };
    fetchMasterAssets();
  }, [user.role]);

  const handleQuantityChange = (assetId, value) => {
    const rawValue = value.replace(/[^0-9]/g, '');
    setAssetQuantities(prev => ({ ...prev, [assetId]: rawValue }));
  };

  const handleCashChange = (e) => {
    // 1. Ambil nilai input dan hapus semua karakter non-digit
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    
    // 2. Simpan nilai mentah (angka) ke state utama
    setInitialCash(rawValue);
    // 3. Format nilai mentah dengan pemisah ribuan dan simpan ke state tampilan
    setDisplayInitialCash(Number(rawValue).toLocaleString('id-ID'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tentukan outletId untuk sesi baru
    const outletId = user.role === 'owner' ? activeOutlet?._id : user.outlet;
    
    // --- PERUBAHAN: Proses data peralatan dari state baru ---
    const assetStockData = masterAssets
      .map(asset => ({
        name: asset.name,
        quantity: parseInt(assetQuantities[asset._id], 10) || 0,
      }))
      .filter(asset => asset.quantity > 0); // Hanya kirim peralatan yang jumlahnya lebih dari 0

     try {
      if (isEditing && todayLog) {
        // Mode Update
        const logData = { // PERBAIKAN: Bungkus data dalam 'startOfDay'
          startOfDay: {
            initialCash,
            assetStock: assetStockData,
          }
        };
        const updatedLog = await dailyLogService.updateDaySession(todayLog._id, logData);
        setTodayLog(updatedLog);
        setIsEditing(false);
        setModalInfo({ isOpen: true, title: 'Sukses', message: 'Sesi harian berhasil diperbarui.', status: 'success' });
      } else {
        // Mode Create
        const logData = {
          initialCash,
          assetStock: assetStockData,
          outletId,
        };
        const newLog = await dailyLogService.startDaySession(logData);
        setTodayLog(newLog);
        setModalInfo({ isOpen: true, title: 'Sukses', message: 'Sesi hari ini berhasil dimulai!', status: 'success' });
      }
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Peringatan', message: 'Gagal memulai sesi: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  };
  // --- STYLING ---
  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    fontSize: '1rem',
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#ff4500',
    color: 'white',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '120px', // Margin agar tidak tertutup BottomNav
  };

  const handleEdit = () => {
    if (todayLog) {
      setInitialCash(todayLog.startOfDay.initialCash);
      setDisplayInitialCash(Number(todayLog.startOfDay.initialCash).toLocaleString('id-ID'));
      // --- PERUBAHAN: Isi state kuantitas dari data log yang ada ---
      const quantities = {};
      todayLog.startOfDay.assetStock.forEach(item => {
        const masterAsset = masterAssets.find(ma => ma.name === item.name);
        if (masterAsset) quantities[masterAsset._id] = item.quantity;
      });
      setAssetQuantities(quantities);
      setIsEditing(true);
    }
  };

  const openConfirmResetModal = () => {
    if (todayLog) {
      setConfirmResetModal({ isOpen: true });
    }
  };

  const closeConfirmResetModal = () => {
    setConfirmResetModal({ isOpen: false });
  };

  const handleConfirmReset = async () => {
    closeConfirmResetModal();
    try {
      await dailyLogService.deleteDaySession(todayLog._id);
      setTodayLog(null);
      setIsEditing(false);
      setInitialCash('');
      setModalInfo({ isOpen: true, title: 'Sukses', message: 'Sesi berhasil direset.', status: 'success' });
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal mereset sesi: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  };

  if (loading) {
    return <p>Memuat data...</p>;
  }

  // Tampilkan pesan jika owner belum memilih outlet
  if (user.role === 'owner' && !activeOutlet) {
    return (
      <div style={cardStyle}>
        <h2>Pilih Outlet</h2>
        <p>Silakan pilih outlet dari menu dropdown di header untuk memulai sesi.</p>
      </div>
    );
  }

  // --- LOGIKA BARU: Khusus untuk Karyawan ---
  if (user.role === 'karyawan') {
    if (todayLog && todayLog.status === 'OPEN') {
      // Jika sesi sudah ada, tampilkan ringkasan (tanpa tombol edit/reset)
      return (
        <div style={cardStyle}>
          <h2>Ringkasan Stok Awal</h2>
          <p style={{ marginTop: '-1rem', color: '#666', fontSize: '0.9em' }}>{new Date(todayLog.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Modal Uang Tunai:</strong> Rp{Number(todayLog.startOfDay.initialCash).toLocaleString('id-ID')}
          </div>
          {todayLog.startOfDay.assetStock && todayLog.startOfDay.assetStock.length > 0 && (
            <div>
              <strong>Peralatan yang Dibawa:</strong>
              <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '0.5rem 0 0 0', fontSize: '0.9em' }}>
                {todayLog.startOfDay.assetStock.map((item, index) => ( <li key={index}>{item.name}: {item.quantity} pcs</li> ))}
              </ul>
            </div>
          )}
        </div>
      );
    } else {
      // Jika sesi belum ada, tampilkan pesan menunggu
      return (
        <div style={cardStyle}>
          <h2>Stok Awal Hari Ini</h2>
          <p>Owner belum memulai sesi untuk hari ini. Mohon tunggu.</p>
        </div>
      );
    }
  }

  // --- LOGIKA RENDER SEDERHANA ---
  // Jika ada log hari ini DAN statusnya OPEN DAN tidak sedang dalam mode edit, tampilkan ringkasan.
  if (todayLog && todayLog.status === 'OPEN' && !isEditing) {
    return (
      <div style={cardStyle}>
        <h2>Ringkasan Stok Awal</h2>
        <p style={{ marginTop: '-1rem', color: '#666', fontSize: '0.9em' }}>{new Date(todayLog.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Modal Uang Tunai:</strong> Rp{Number(todayLog.startOfDay.initialCash).toLocaleString('id-ID')}
        </div>
        <div>
          <strong>Peralatan:</strong>
          <ul style={{ paddingLeft: '20px', margin: '0.5rem 0' }}>
            {todayLog.startOfDay.assetStock.map((item, index) => ( <li key={index}>{item.name}: {item.quantity} pcs</li> ))}
          </ul>
        </div>
        {user.role === 'owner' && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button onClick={handleEdit} style={{ ...buttonStyle, marginBottom: 0, backgroundColor: '#f0ad4e' }}>Edit Sesi</button>
            <button onClick={openConfirmResetModal} style={{ ...buttonStyle, marginBottom: 0, backgroundColor: '#d9534f' }}>Reset Sesi</button>
          </div>
        )}
        <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo({ ...modalInfo, isOpen: false })} title={modalInfo.title} status={modalInfo.status}>
          <p>{modalInfo.message}</p>
        </Modal>
        {/* Modal Konfirmasi Reset */}
        <Modal isOpen={confirmResetModal.isOpen} onClose={closeConfirmResetModal} title="Konfirmasi Reset Sesi" status="warning" hideDefaultButton={true}>
          <p>Apakah Anda yakin ingin mereset sesi hari ini? Semua data stok awal akan dihapus dan tidak dapat dikembalikan.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={closeConfirmResetModal} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '6px', background: '#f0f0f0' }}>Batal</button>
            <button onClick={handleConfirmReset} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#d9534f', color: 'white' }}>Ya, Reset</button>
          </div>
        </Modal>
      </div>
    );
  }

  // Jika tidak, tampilkan form untuk memulai sesi baru atau mengedit sesi.
  return (
    <div>
      <h2>{isEditing ? 'Edit Sesi Stok Awal' : 'Pencatatan Stok & Modal Awal'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={cardStyle}>
          <h3>Modal Uang Tunai</h3>
          <input type="text" value={displayInitialCash} onChange={handleCashChange} placeholder="Rp" required style={{...inputStyle, textAlign: 'right', fontSize: '1rem'}} />
        </div>
        <div style={cardStyle}>
          <h3>Peralatan Dibawa</h3>
          {masterAssets.length > 0 ? (
            masterAssets.map(asset => (
              <div key={asset._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label htmlFor={`asset-${asset._id}`} style={{ flexGrow: 1 }}>{asset.name}</label>
                <input 
                  id={`asset-${asset._id}`}
                  type="text" 
                  value={Number(assetQuantities[asset._id] || '').toLocaleString('id-ID')} 
                  onChange={(e) => handleQuantityChange(asset._id, e.target.value)} 
                  placeholder="0" 
                  style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'right', fontSize: '1rem' }} 
                />
              </div>
            ))
          ) : <p>Daftar peralatan belum ada. Silakan tambahkan di menu <Link to="/peralatan">Kelola Peralatan</Link>.</p>}
        </div>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={() => setIsEditing(false)} style={{ ...buttonStyle, backgroundColor: '#6c757d' }}>Batal</button>
            <button type="submit" style={buttonStyle}>Simpan Perubahan</button>
          </div>
        ) : (
          <button type="submit" style={buttonStyle}>Mulai Sesi Hari Ini</button>
        )}
      </form>
      <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo({ ...modalInfo, isOpen: false })} title={modalInfo.title} status={modalInfo.status}>
        <p>{modalInfo.message}</p>
      </Modal>
    </div>
  );
}

export default StokAwalPage;
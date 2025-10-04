import { useState, useEffect } from 'react';
import dailyLogService from '../features/dailyLogs/dailyLogService';
import inventoryService from '../features/inventory/inventoryService'; // Impor service inventory
import Modal from '../components/Modal';
import { useOutlet } from '../context/OutletContext';

function TutupTokoPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const { activeOutlet } = useOutlet();
  const [openSessions, setOpenSessions] = useState([]); // State untuk semua sesi terbuka
  const [selectedLog, setSelectedLog] = useState(null); // State untuk sesi yang akan ditutup
  const [loading, setLoading] = useState(true);
  const [finalCash, setFinalCash] = useState('');
  const [displayFinalCash, setDisplayFinalCash] = useState('');
  const [remainingAssetStock, setRemainingAssetStock] = useState({});
  const [currentProductStock, setCurrentProductStock] = useState([]); // Stok produk teoritis
  const [remainingProductStock, setRemainingProductStock] = useState({}); // Input stok produk fisik
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    status: 'info',
  });
  const [isConfirming, setIsConfirming] = useState(false); // State baru untuk modal konfirmasi

  useEffect(() => {
    const fetchOpenSessions = async () => {
      try {
        setLoading(true);
        if (user.role === 'owner') {
          // Owner: ambil semua sesi yang terbuka
          const sessions = await dailyLogService.getOpenSessions();
          setOpenSessions(sessions);
        } else {
          // Karyawan: ambil sesi untuk outletnya saja
          const session = await dailyLogService.getTodaySession(user.outlet);
          // Jika ada sesi, langsung pilih untuk ditutup
          if (session) {
            setSelectedLog(session);
          }
        }
      } catch (error) {
        console.error("Gagal memuat sesi terbuka", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpenSessions();
  }, [user.role, user.outlet]);

  // Efek untuk mengambil stok produk saat sesi dipilih
  useEffect(() => {
    const fetchProductStock = async () => {
      if (selectedLog) {
        try {
          const outletId = selectedLog.outlet._id || selectedLog.outlet;
          const inventoryData = await inventoryService.getInventoryByOutlet(outletId);
          setCurrentProductStock(inventoryData);
        } catch (error) {
          console.error("Gagal memuat stok produk:", error);
        }
      }
    };
    fetchProductStock();
  }, [selectedLog]);

  const handleCashChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setFinalCash(rawValue);
    setDisplayFinalCash(Number(rawValue).toLocaleString('id-ID'));
  };

  const handleAssetStockChange = (assetName, quantity) => {
    const rawValue = quantity.replace(/[^0-9]/g, '');
    setRemainingAssetStock(prev => ({ ...prev, [assetName]: rawValue }));
  };
  
  const handleProductStockChange = (productId, quantity) => {
    const rawValue = quantity.replace(/[^0-9]/g, '');
    setRemainingProductStock(prev => ({ ...prev, [productId]: rawValue }));
  };

  const handleOpenConfirmation = (e) => {
    e.preventDefault();
    setIsConfirming(true); // Buka modal konfirmasi
  };

  const handleConfirmClose = async () => {
    // Logika yang sebelumnya ada di handleSubmit, dipindahkan ke sini
    setIsConfirming(false); // Tutup modal konfirmasi

    // Tentukan outletId untuk sesi yang akan ditutup
    const outletId = selectedLog.outlet._id || selectedLog.outlet;

    const formattedRemainingAssetStock = Object.keys(remainingAssetStock).map(key => ({
      name: key,
      quantity: parseInt(remainingAssetStock[key], 10) || 0
    }));

    const formattedRemainingProductStock = Object.keys(remainingProductStock).map(key => ({
      product: key,
      quantity: parseInt(remainingProductStock[key], 10) || 0
    }));

    try {
      await dailyLogService.closeDaySession({ 
        finalCash, 
        remainingAssetStock: formattedRemainingAssetStock,
        remainingProductStock: formattedRemainingProductStock, // Sertakan stok produk
        outletId, // Sertakan ID outlet
      });
      setModalInfo({ isOpen: true, title: 'Sukses', message: 'Sesi berhasil ditutup!', status: 'success' });
      // Kembali ke daftar sesi
      setSelectedLog(null);
      // Refresh daftar sesi yang terbuka
      const sessions = await dailyLogService.getOpenSessions();
      setOpenSessions(sessions);
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal menutup sesi: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  if (loading) {
    return <p>Memuat data...</p>;
  }

  // Jika ada sesi yang dipilih, tampilkan form tutup toko
  if (selectedLog) {
    return (
    <div>
      <h2>Formulir Tutup Toko</h2>
      <button onClick={() => setSelectedLog(null)} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#0275d8', cursor: 'pointer' }}>
        &larr; Kembali ke Daftar Sesi
      </button>
      <form onSubmit={handleOpenConfirmation}>
        <div style={cardStyle}>
          <h3>Ringkasan Awal</h3>
          <p><strong>Outlet:</strong> {selectedLog.outlet.name}</p>
          <p><strong>Tanggal Mulai:</strong> {new Date(selectedLog.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p><strong>Modal Uang Tunai:</strong> Rp{Number(selectedLog.startOfDay.initialCash).toLocaleString('id-ID')}</p>
          <strong style={{ marginTop: '1rem', display: 'block' }}>Peralatan Awal:</strong>
          <ul style={{ paddingLeft: '20px', margin: '0.5rem 0' }}>
            {selectedLog.startOfDay.assetStock.map((item, index) => (
              <li key={index}>{item.name}: {item.quantity} pcs</li>
            ))}
          </ul>
        </div>

        <div style={cardStyle}>
          <h3>Pencatatan Akhir</h3>
          <label>Uang Tunai di Laci (Final)</label>
          <input
            type="text"
            value={displayFinalCash}
            onChange={handleCashChange}
            placeholder="Rp"
            required
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', textAlign: 'right', marginTop: '0.5rem', fontSize: '1rem' }}
          />
          <div style={{ marginTop: '1.5rem' }}>
            <label>Sisa Peralatan (Final)</label>
            {selectedLog.startOfDay.assetStock.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span>{item.name}</span>
                <input type="text" value={Number(remainingAssetStock[item.name] || '').toLocaleString('id-ID')} onChange={(e) => handleAssetStockChange(item.name, e.target.value)} placeholder="Jumlah" style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'right', fontSize: '1rem' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label>Sisa Produk Dagang (Final)</label>
            {currentProductStock.map(item => (
              <div key={item.product._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div>
                  <span>{item.product.name}</span>
                  <span style={{ fontSize: '0.8em', color: '#666', display: 'block' }}>
                    Sistem: {item.stock}
                  </span>
                </div>
                <input type="text" value={Number(remainingProductStock[item.product._id] || '').toLocaleString('id-ID')} onChange={(e) => handleProductStockChange(item.product._id, e.target.value)} placeholder="Jumlah Fisik" style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'right', fontSize: '1rem' }} />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" style={{ marginBottom:60, width: '100%', padding: '1rem', backgroundColor: '#d9534f', color: 'white', border: 'none', fontSize: '1rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
          Tutup Sesi Hari Ini
        </button>
      </form>
      <Modal
        isOpen={modalInfo.isOpen}
        onClose={() => setModalInfo({ ...modalInfo, isOpen: false })}
        title={modalInfo.title}
        status={modalInfo.status}
      >
        <p>{modalInfo.message}</p>
      </Modal>

      {/* Modal Konfirmasi Tutup Toko */}
      <Modal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        title="Konfirmasi Tutup Sesi"
        status="warning"
        hideDefaultButton={true}
      >
        <p>Apakah Anda yakin ingin menutup sesi hari ini? Aksi ini tidak dapat dibatalkan.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={() => setIsConfirming(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '6px', background: '#f0f0f0' }}>
            Batal
          </button>
          <button onClick={handleConfirmClose} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#d9534f', color: 'white' }}>
            Ya, Tutup Sesi
          </button>
        </div>
      </Modal>
    </div>
  );
  }

  // Tampilan default: Daftar sesi yang masih terbuka
  return (
    <div>
      <h2>Sesi yang Masih Berjalan</h2>
      {openSessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {openSessions.map(log => (
            <div key={log._id} style={cardStyle}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{log.outlet.name}</p>
              <p style={{ margin: '0.2rem 0 1rem 0', fontSize: '0.9em', color: '#666' }}>
                Dimulai pada: {new Date(log.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <button 
                onClick={() => setSelectedLog(log)}
                style={{ width: '100%', padding: '0.8rem', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '8px' }}
              >
                Tutup Sesi Ini
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={cardStyle}>
          <p>👍 Semua sesi sudah ditutup.</p>
        </div>
      )}
    </div>
  );
}

export default TutupTokoPage;
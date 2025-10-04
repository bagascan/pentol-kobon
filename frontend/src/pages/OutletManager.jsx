import { useState, useEffect } from 'react';
import outletService from '../features/outlets/outletService';
import Modal from '../components/Modal';

function OutletManager() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [message, setMessage] = useState('');

  const fetchOutlets = async () => {
    try {
      const data = await outletService.getOutlets();
      setOutlets(data);
    } catch (error) {
      console.error("Gagal memuat outlet:", error);
      setMessage('Gagal memuat data outlet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleOpenModal = (outlet = null) => {
    setEditingOutlet(outlet);
    setFormData(outlet ? { name: outlet.name, address: outlet.address } : { name: '', address: '' });
    setIsModalOpen(true);
    setMessage('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOutlet(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage(''); // Bersihkan pesan error lama
      if (editingOutlet) {
        const updated = await outletService.updateOutlet(editingOutlet._id, formData);
        setOutlets(outlets.map(o => o._id === updated._id ? updated : o));
      } else {
        const created = await outletService.createOutlet(formData);
        setOutlets([created, ...outlets]);
      }
      handleCloseModal();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = async (outletId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus outlet ini? Semua data terkait (produk, transaksi) tidak akan terhapus tetapi mungkin menjadi tidak terkelola.')) {
      try {
        await outletService.deleteOutlet(outletId);
        fetchOutlets(); // Refresh daftar outlet
      } catch (error) {
        setMessage(error.response?.data?.message || 'Gagal menghapus outlet.');
      }
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manajemen Outlet</h2>
        <button onClick={() => handleOpenModal()} style={{ padding: '0.8rem 1.2rem', backgroundColor: '#ff4500', color: 'white', border: 'none', borderRadius: '8px' }}>
          + Tambah Outlet
        </button>
      </div>

      {loading ? <p>Memuat...</p> : (
        <div style={cardStyle}>
          {outlets.length > 0 ? (
            outlets.map(outlet => (
              <div key={outlet._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{outlet.name}</p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{outlet.address}</p>
                </div>
                <div>
                  <button onClick={() => handleOpenModal(outlet)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(outlet._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>🗑️</button>
                </div>
              </div>
            ))
          ) : (
            <p>Belum ada outlet yang ditambahkan.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'} hideDefaultButton={true}>
          <form onSubmit={handleSubmit}>
            {message && <p style={{ color: 'red', backgroundColor: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{message}</p>}
            <div style={{ marginBottom: '1rem' }}>
              <label>Nama Outlet</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label>Alamat</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows="3"
                style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box', marginTop: '0.5rem', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={handleCloseModal} style={{ padding: '0.8rem 1.2rem', background: '#eee' }}>Batal</button>
              <button type="submit" style={{ padding: '0.8rem 1.2rem', backgroundColor: '#ff4500', color: 'white', border: 'none' }}>Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default OutletManager;
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import assetService from '../features/assets/assetService'; // Gunakan service yang terpusat

function AssetManager() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [message, setMessage] = useState('');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, assetId: null });

  const fetchAssets = async () => {
    try {
      const data = await assetService.getAssets();
      setAssets(data);
    } catch (error) {
      setMessage('Gagal memuat data peralatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenModal = (asset = null) => {
    setEditingAsset(asset);
    setFormData(asset ? { name: asset.name } : { name: '' });
    setIsModalOpen(true);
    setMessage('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        const updated = await assetService.updateAsset(editingAsset._id, formData);
        setAssets(assets.map(a => a._id === updated._id ? updated : a));
      } else {
        const created = await assetService.createAsset(formData);
        setAssets([created, ...assets]);
      }
      handleCloseModal();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = (assetId) => {
    // Buka modal konfirmasi
    setConfirmDeleteModal({ isOpen: true, assetId: assetId });
  };

  const executeDelete = async () => {
    const { assetId } = confirmDeleteModal;
    if (!assetId) return;

    try {
      await assetService.deleteAsset(assetId);
      fetchAssets();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus peralatan.');
    } finally {
      // Tutup modal konfirmasi setelah selesai
      setConfirmDeleteModal({ isOpen: false, assetId: null });
    }
  };


  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Kelola Peralatan</h2>
        <button onClick={() => handleOpenModal()} style={{ padding: '0.8rem 1.2rem', backgroundColor: '#ff4500', color: 'white', border: 'none', borderRadius: '8px' }}>
          + Tambah Peralatan
        </button>
      </div>

      {loading ? <p>Memuat...</p> : (
        <div style={cardStyle}>
          {assets.length > 0 ? (
            assets.map(asset => (
              <div key={asset._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #eee' }}>
                <p style={{ margin: 0, fontWeight: '500' }}>{asset.name}</p>
                <div>
                  <button onClick={() => handleOpenModal(asset)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(asset._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>🗑️</button>
                </div>
              </div>
            ))
          ) : (
            <p>Belum ada peralatan yang ditambahkan.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAsset ? 'Edit Peralatan' : 'Tambah Peralatan Baru'} hideDefaultButton={true}>
          <form onSubmit={handleSubmit}>
            {message && <p style={{ color: 'red' }}>{message}</p>}
            <div style={{ marginBottom: '1rem' }}>
              <label>Nama Peralatan</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} required style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box', marginTop: '0.5rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={handleCloseModal} style={{ padding: '0.8rem 1.2rem', background: '#eee' }}>Batal</button>
              <button type="submit" style={{ padding: '0.8rem 1.2rem', backgroundColor: '#ff4500', color: 'white', border: 'none' }}>Simpan</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus Peralatan */}
      <Modal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, assetId: null })}
        title="Konfirmasi Hapus Peralatan"
        status="warning"
        hideDefaultButton={true}
      >
        <p>Apakah Anda yakin ingin menghapus peralatan ini dari daftar master? Tindakan ini tidak dapat dibatalkan.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={() => setConfirmDeleteModal({ isOpen: false, assetId: null })} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '6px', background: '#f0f0f0' }}>Batal</button>
          <button onClick={executeDelete} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#d9534f', color: 'white' }}>Ya, Hapus</button>
        </div>
      </Modal>
    </div>
  );
}

export default AssetManager;
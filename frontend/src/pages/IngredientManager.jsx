import { useState, useEffect } from 'react';
import ingredientService from '../features/ingredients/ingredientService';
import Modal from '../components/Modal';

const IngredientManager = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State untuk loading saat submit
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [formData, setFormData] = useState({ name: '', unit: '' });
  const [modalMessage, setModalMessage] = useState(''); // Pesan error khusus untuk di dalam modal

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Efek untuk menghilangkan pesan sukses setelah beberapa detik
  useEffect(() => {
    if (message && !message.toLowerCase().includes('gagal')) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [message]);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const data = await ingredientService.getIngredients();
      setIngredients(data);
      setMessage('');
    } catch (err) {
      setMessage('Gagal memuat bahan baku: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (ingredient = null) => {
    setEditingIngredient(ingredient);
    setFormData(ingredient ? { name: ingredient.name, unit: ingredient.unit } : { name: '', unit: '' });
    setIsModalOpen(true);
    setModalMessage(''); // Bersihkan pesan error di modal setiap kali dibuka
    setMessage('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(null);
    setFormData({ name: '', unit: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage('');

    try {
      if (editingIngredient) {
        const updated = await ingredientService.updateIngredient(editingIngredient._id, formData);
        // Update state dan urutkan kembali
        setIngredients(prev => [...prev.map(ing => (ing._id === updated._id ? updated : ing))].sort((a, b) => a.name.localeCompare(b.name)));
        setMessage('Bahan baku berhasil diperbarui.');
      } else {
        const newIngredient = await ingredientService.createIngredient(formData);
        // Tambahkan ke state dan urutkan kembali
        setIngredients(prev => [...prev, newIngredient].sort((a, b) => a.name.localeCompare(b.name)));
        setMessage('Bahan baku berhasil ditambahkan.');
      }
      closeModal();
    } catch (err) {
      // Tampilkan pesan error di dalam modal
      setModalMessage('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus bahan baku ini? Stok terkait di semua outlet juga akan dihapus.')) {
      try {
        await ingredientService.deleteIngredient(id);
        setIngredients(ingredients.filter(ing => ing._id !== id));
        setMessage('Bahan baku berhasil dihapus.');
      } catch (err) {
        setMessage('Gagal menghapus: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) {
    return <p>Memuat data bahan baku...</p>;
  }

  return (
    <div style={{ position: 'relative', paddingBottom: '80px' }}>
      <h2>Manajemen Bahan Baku</h2>
      {message && <p style={{ color: message.includes('Gagal') ? 'red' : 'green' }}>{message}</p>}

      {ingredients.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ingredients.map(ing => (
            <div key={ing._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>{ing.name}</span>
                <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9em' }}>({ing.unit})</span>
              </div>
              <div>
                <button onClick={() => openModal(ing)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                <button onClick={() => handleDelete(ing._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Belum ada bahan baku yang ditambahkan. Klik tombol '+' untuk memulai.</p>
      )}

      {/* Modal untuk Tambah/Edit */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'} hideDefaultButton={true}>
        <form onSubmit={handleSubmit}>
          {modalMessage && <p style={{ color: 'red', background: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{modalMessage}</p>}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name">Nama Bahan Baku</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Contoh: Daging Sapi Giling"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="unit">Satuan</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              placeholder="Contoh: kg, gr, liter, pcs"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={closeModal} style={{ padding: '0.8rem 1.2rem', background: '#f0f0f0', border: '1px solid #ccc' }}>
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.8rem 1.2rem', background: '#ff4500', color: 'white', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Menyimpan...' : (editingIngredient ? 'Simpan Perubahan' : 'Tambah')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => openModal()}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#ff4500',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1050,
        }}
      >
        +
      </button>
    </div>
  );
};

export default IngredientManager;
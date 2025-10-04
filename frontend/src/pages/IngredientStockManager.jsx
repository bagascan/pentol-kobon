import { useState, useEffect, useMemo } from 'react';
import { useOutlet } from '../context/OutletContext';
import ingredientService from '../features/ingredients/ingredientService';
import ingredientStockService from '../features/ingredients/ingredientStockService';
import Modal from '../components/Modal';

const IngredientStockManager = () => {
  const { activeOutlet } = useOutlet();
  const [allIngredients, setAllIngredients] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // State untuk modal tambah stok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [formData, setFormData] = useState({ quantity: '', cost: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!activeOutlet || activeOutlet._id === 'all') {
        setLoading(false);
        setStockItems([]);
        return;
      }
      try {
        setLoading(true);
        const [ingredientsData, stockData] = await Promise.all([
          ingredientService.getIngredients(),
          ingredientStockService.getIngredientStockByOutlet(activeOutlet._id),
        ]);
        setAllIngredients(ingredientsData);
        setStockItems(stockData);
      } catch (err) {
        setMessage('Gagal memuat data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeOutlet]);

  const openModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData({ quantity: '', cost: '' });
    setModalMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIngredient(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage('');
    try {
      const stockData = {
        ingredientId: selectedIngredient._id,
        outletId: activeOutlet._id,
        quantity: parseFloat(formData.quantity),
        cost: parseFloat(formData.cost),
      };
      await ingredientStockService.addOrUpdateIngredientStock(stockData);
      
      // Refresh data
      const updatedStock = await ingredientStockService.getIngredientStockByOutlet(activeOutlet._id);
      setStockItems(updatedStock);

      closeModal();
      setMessage(`Stok untuk ${selectedIngredient.name} berhasil ditambahkan.`);
    } catch (err) {
      setModalMessage('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableIngredients = useMemo(() => {
    const stockedIds = new Set(stockItems.map(item => item.ingredient._id));
    return allIngredients.filter(ing => !stockedIds.has(ing._id));
  }, [allIngredients, stockItems]);

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  if (!activeOutlet || activeOutlet._id === 'all') {
    return (
      <div style={cardStyle}>
        <h2>Pilih Outlet</h2>
        <p>Silakan pilih satu outlet spesifik dari menu dropdown di header untuk mengelola stok bahan baku.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <h2>Stok Bahan Baku: {activeOutlet.name}</h2>
      {message && <p>{message}</p>}

      {/* Daftar Stok Saat Ini */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Stok Saat Ini</h3>
        {loading ? <p>Memuat...</p> : stockItems.length > 0 ? (
          stockItems.map(item => (
            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid #eee' }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>{item.ingredient.name}</span>
                <p style={{ margin: 0, color: '#555', fontSize: '0.9em' }}>
                  Sisa: {item.stock.toLocaleString('id-ID')} {item.ingredient.unit}
                </p>
              </div>
              <button onClick={() => openModal(item.ingredient)} style={{ padding: '0.5rem 1rem', background: '#0275d8', color: 'white', border: 'none', borderRadius: '6px' }}>
                + Tambah Stok
              </button>
            </div>
          ))
        ) : <p>Belum ada stok bahan baku di outlet ini.</p>}
      </div>

      {/* Daftar Bahan Baku yang Belum Ada Stoknya */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>+ Tambah Bahan Baku ke Outlet</h3>
        {loading ? <p>Memuat...</p> : availableIngredients.length > 0 ? (
          availableIngredients.map(ing => (
            <div key={ing._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid #eee' }}>
              <span>{ing.name} ({ing.unit})</span>
              <button onClick={() => openModal(ing)} style={{ padding: '0.5rem 1rem', background: '#5cb85c', color: 'white', border: 'none', borderRadius: '6px' }}>
                + Tambah
              </button>
            </div>
          ))
        ) : <p>Semua bahan baku dari katalog sudah ada di outlet ini.</p>}
      </div>

      {/* Modal Tambah Stok */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={`Tambah Stok: ${selectedIngredient?.name}`} hideDefaultButton={true}>
        <form onSubmit={handleSubmit}>
          {modalMessage && <p style={{ color: 'red', background: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>{modalMessage}</p>}
          <div style={{ marginBottom: '1rem' }}>
            <label>Jumlah Pembelian ({selectedIngredient?.unit})</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              step="any"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Total Harga Pembelian (Rp)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={closeModal} style={{ padding: '0.8rem 1.2rem', background: '#f0f0f0', border: '1px solid #ccc' }}>
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.8rem 1.2rem', background: '#ff4500', color: 'white', border: 'none' }}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IngredientStockManager;
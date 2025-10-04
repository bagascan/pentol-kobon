import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import outletService from '../features/outlets/outletService';
import inventoryService from '../features/inventory/inventoryService';
import stockTransferService from '../features/stockTransfers/stockTransferService';
import Modal from '../components/Modal';

const StockTransfer = () => {
  const [outlets, setOutlets] = useState([]);
  const navigate = useNavigate();
  const [availableProducts, setAvailableProducts] = useState([]);
  const [formData, setFormData] = useState({
    fromOutletId: '',
    toOutletId: '',
    productId: '',
    quantity: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '', status: 'info' });

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const data = await outletService.getOutlets();
        setOutlets(data);
      } catch (error) {
        setMessage('Gagal memuat daftar outlet.');
      }
    };
    fetchOutlets();
  }, []);

  useEffect(() => {
    const fetchProductsFromOutlet = async () => {
      if (formData.fromOutletId) {
        try {
          setLoading(true);
          const inventoryData = await inventoryService.getInventoryByOutlet(formData.fromOutletId);
          setAvailableProducts(inventoryData.filter(item => item.stock > 0)); // Hanya tampilkan produk yang ada stok
        } catch (error) {
          setMessage('Gagal memuat produk dari outlet asal.');
          setAvailableProducts([]);
        } finally {
          setLoading(false);
        }
      } else {
        setAvailableProducts([]);
      }
    };
    fetchProductsFromOutlet();
  }, [formData.fromOutletId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      // Reset pilihan produk & jumlah jika outlet asal berubah
      if (name === 'fromOutletId') {
        newState.productId = '';
        newState.quantity = '';
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await stockTransferService.createStockTransfer(formData);
      setModalInfo({ isOpen: true, title: 'Sukses', message: response.message, status: 'success' });
      // Reset form
      setFormData({ fromOutletId: '', toOutletId: '', productId: '', quantity: '' });
      setAvailableProducts([]);
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: error.response?.data?.message || 'Gagal melakukan transfer.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectedProductStock = availableProducts.find(p => p.product._id === formData.productId)?.stock || 0;

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const inputGroupStyle = {
    marginBottom: '1.5rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
  };

  const selectStyle = {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Link to="/riwayat-transfer" style={{ textDecoration: 'none', padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', color: '#333', borderRadius: '6px' }}>
          Lihat Riwayat
        </Link>
      </div>
      <h2>Transfer Stok Antar Outlet</h2>
      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Dari Outlet</label>
            <select name="fromOutletId" value={formData.fromOutletId} onChange={handleChange} required style={selectStyle}>
              <option value="">-- Pilih Outlet Asal --</option>
              {outlets.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
            </select>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Ke Outlet</label>
            <select name="toOutletId" value={formData.toOutletId} onChange={handleChange} required style={selectStyle} disabled={!formData.fromOutletId}>
              <option value="">-- Pilih Outlet Tujuan --</option>
              {outlets.filter(o => o._id !== formData.fromOutletId).map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
            </select>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Produk</label>
            <select name="productId" value={formData.productId} onChange={handleChange} required style={selectStyle} disabled={!formData.fromOutletId || loading}>
              <option value="">-- Pilih Produk --</option>
              {loading ? <option>Memuat produk...</option> : availableProducts.map(item => (
                <option key={item.product._id} value={item.product._id}>{item.product.name} (Stok: {item.stock})</option>
              ))}
            </select>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Jumlah Transfer</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              max={selectedProductStock}
              placeholder={`Maks: ${selectedProductStock}`}
              disabled={!formData.productId}
              style={{ ...selectStyle, boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', backgroundColor: '#ff4500', color: 'white', border: 'none', fontSize: '1rem', borderRadius: '8px' }}>
            {loading ? 'Memproses...' : 'Lakukan Transfer'}
          </button>
        </form>
      </div>

      <Modal
        isOpen={modalInfo.isOpen}
        onClose={() => setModalInfo({ ...modalInfo, isOpen: false })}
        title={modalInfo.title}
        status={modalInfo.status}
        hideDefaultButton={modalInfo.status === 'success'} // Sembunyikan tombol default jika sukses
      >
        <p>{modalInfo.message}</p>
        {/* Tombol kustom hanya untuk notifikasi sukses */}
        {modalInfo.status === 'success' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => setModalInfo({ ...modalInfo, isOpen: false })} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '6px', background: '#f0f0f0' }}>
              Tutup
            </button>
            <button onClick={() => navigate('/riwayat-transfer')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#0275d8', color: 'white' }}>
              Lihat Riwayat
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockTransfer;
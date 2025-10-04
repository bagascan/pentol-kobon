import { useState, useEffect } from 'react';
import stockTransferService from '../features/stockTransfers/stockTransferService';

const StockTransferHistory = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await stockTransferService.getTransfers();
        setTransfers(data);
      } catch (err) {
        setError('Gagal memuat riwayat transfer.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
  };

  if (loading) {
    return <p>Memuat riwayat...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Riwayat Transfer Stok</h2>
      {transfers.length > 0 ? (
        transfers.map(transfer => (
          <div key={transfer._id} style={cardStyle}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1em' }}>
              {transfer.product?.name || 'Produk Dihapus'} - {transfer.quantity} pcs
            </p>
            <p style={{ margin: '0.5rem 0', color: '#555' }}>
              <span style={{ color: '#d9534f' }}>Dari: {transfer.fromOutlet?.name || 'Outlet Dihapus'}</span>
              <span style={{ margin: '0 0.5rem' }}>➔</span>
              <span style={{ color: '#5cb85c' }}>Ke: {transfer.toOutlet?.name || 'Outlet Dihapus'}</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.8em', color: '#888' }}>
              {new Date(transfer.createdAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        ))
      ) : (
        <p>Belum ada riwayat transfer stok.</p>
      )}
    </div>
  );
};

export default StockTransferHistory;
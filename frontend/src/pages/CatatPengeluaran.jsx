import { useState, useEffect } from 'react';
import expenseService from '../features/expenses/expenseService';
import Modal from '../components/Modal';
import { useOutlet } from '../context/OutletContext';

function CatatPengeluaranPage() {
  const { activeOutlet } = useOutlet();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [category, setCategory] = useState('Operasional');
  const [editingExpense, setEditingExpense] = useState(null); // State untuk mode edit
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '', status: 'info' });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, expenseId: null });

  const fetchExpenses = async () => {
    if (!activeOutlet) return;
    try {
      const data = await expenseService.getExpenses(activeOutlet._id);
      setExpenses(data);
    } catch (error) {
      console.error("Gagal memuat pengeluaran:", error);
    }
  };

  useEffect(() => {
    // Hanya fetch jika ada outlet yang aktif
    if (activeOutlet) {
      fetchExpenses();
    }
  }, [activeOutlet]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setAmount(rawValue);
    setDisplayAmount(Number(rawValue).toLocaleString('id-ID'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const expenseData = {
      description,
      amount,
      category,
      outletId: activeOutlet._id,
    };

    try {
      if (editingExpense) {
        // Mode Update
        const updatedExpense = await expenseService.updateExpense(editingExpense._id, expenseData);
        setExpenses(prev => prev.map(exp => exp._id === updatedExpense._id ? updatedExpense : exp));
        setModalInfo({ isOpen: true, title: 'Sukses', message: 'Pengeluaran berhasil diperbarui.', status: 'success' });
      } else {
        // Mode Create
        const newExpense = await expenseService.createExpense(expenseData);
        setExpenses([newExpense, ...expenses]); // Tambahkan ke daftar
        setModalInfo({ isOpen: true, title: 'Sukses', message: 'Pengeluaran berhasil dicatat!', status: 'success' });
      }
      // Reset form
      setDescription('');
      setAmount('');
      setDisplayAmount('');
      setCategory('Operasional');
      setEditingExpense(null);
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal mencatat pengeluaran: ' + (error.response?.data?.message || error.message), status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk membuka modal konfirmasi
  const openConfirmDeleteModal = (expenseId) => {
    setConfirmDeleteModal({ isOpen: true, expenseId });
  };

  // Fungsi untuk menutup modal konfirmasi
  const closeConfirmDeleteModal = () => {
    setConfirmDeleteModal({ isOpen: false, expenseId: null });
  };

  // Fungsi yang dijalankan setelah konfirmasi
  const handleConfirmDelete = async () => {
    const expenseId = confirmDeleteModal.expenseId;
    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
      setModalInfo({ isOpen: true, title: 'Sukses', message: 'Pengeluaran berhasil dihapus.', status: 'success' });
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal menghapus pengeluaran: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
    closeConfirmDeleteModal(); // Tutup modal konfirmasi setelah selesai
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount);
    setDisplayAmount(Number(expense.amount).toLocaleString('id-ID'));
    setCategory(expense.category);
    // Scroll ke atas ke form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  // Tampilkan pesan jika owner belum memilih outlet
  if (!activeOutlet) {
    return (
      <div style={cardStyle}>
        <h2>Pilih Outlet</h2>
        <p>Silakan pilih outlet dari menu dropdown di header untuk mencatat pengeluaran.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Operasional'}</h2>
      <p style={{ marginTop: '-1rem', color: '#666' }}>
        Mencatat pengeluaran untuk outlet: <strong>{activeOutlet.name}</strong>
      </p>
      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Deskripsi Pengeluaran</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli Gas LPG, Bayar Parkir"
              required
              style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Jumlah (Rp)</label>
            <input
              type="text"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="Rp 25.000"
              required
              style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
            >
              <option value="Operasional">Operasional</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Gaji">Gaji</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {editingExpense && (
              <button type="button" onClick={() => { setEditingExpense(null); setDescription(''); setAmount(''); setDisplayAmount(''); setCategory('Operasional'); }} style={{ width: '100%', padding: '1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', fontSize: '1rem', borderRadius: '8px' }}>
                Batal Edit
              </button>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', backgroundColor: '#ff4500', color: 'white', border: 'none', fontSize: '1rem', borderRadius: '8px' }}>
              {loading ? 'Menyimpan...' : (editingExpense ? 'Update Pengeluaran' : 'Simpan Pengeluaran')}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, marginBottom: 80 }}>
        <h3>Riwayat Pengeluaran</h3>
        {expenses.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {expenses.map(exp => (
              <li key={exp._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '0.8rem 0', borderBottom: '1px solid #eee' }} title={`ID: ${exp._id}`}>
                {/* Bagian Kiri: Deskripsi (Fleksibel) */}
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: '500', wordBreak: 'break-word', marginBottom: '0.25rem' }}>
                    {exp.description}
                    {exp.outlet && <span style={{ display: 'block', color: '#ff4500', fontWeight: '500', fontSize: '0.9em', marginBottom: '0.25rem' }}>{exp.outlet.name}</span>}
                  </span>
                  <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {new Date(exp.date).toLocaleDateString('id-ID')} - {exp.category}
                  </span>
                </div>
                {/* Bagian Kanan: Harga dan Tombol (Tetap) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontWeight: 'bold', color: '#d9534f', whiteSpace: 'nowrap' }}>- Rp{Number(exp.amount).toLocaleString('id-ID')}</span>
                 <button onClick={() => handleEdit(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.2rem' }}>✏️</button>
                  <button onClick={() => openConfirmDeleteModal(exp._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.2rem', color: 'red' }}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Belum ada pengeluaran yang dicatat.</p>
        )}
      </div>

      <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo({ ...modalInfo, isOpen: false })} title={modalInfo.title} status={modalInfo.status}>
        <p>{modalInfo.message}</p>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={confirmDeleteModal.isOpen}
        onClose={closeConfirmDeleteModal}
        title="Konfirmasi Hapus"
        status="warning"
        hideDefaultButton={true}
      >
        <p>Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Aksi ini tidak dapat dibatalkan.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={closeConfirmDeleteModal} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '6px', background: '#f0f0f0' }}>
            Batal
          </button>
          <button onClick={handleConfirmDelete} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#d9534f', color: 'white' }}>
            Ya, Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default CatatPengeluaranPage;
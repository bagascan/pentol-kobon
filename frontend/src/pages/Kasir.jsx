import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../features/auth/authService';
import inventoryService from '../features/inventory/inventoryService'; // Ganti ke inventoryService
import dailyLogService from '../features/dailyLogs/dailyLogService'; // <-- 1. Impor service dailyLog
import transactionService from '../features/transactions/transactionService';
import api from '../api/axiosConfig'; // Import instance axios
import Modal from '../components/Modal';
import { SERVER_URL } from '../api/axiosConfig';
import { useOutlet } from '../context/OutletContext';

function Kasir() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const { activeOutlet, outlets } = useOutlet(); // Ambil outlet aktif dan daftar outlet dari context
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false); // <-- 2. State untuk status sesi
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [error, setError] = useState('');
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    status: 'info',
  });
  // State baru untuk modal input jumlah
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [bulkAddProduct, setBulkAddProduct] = useState(null);
  const [bulkQuantity, setBulkQuantity] = useState('');

  const [testNotifStatus, setTestNotifStatus] = useState({
    sending: false,
    message: '',
  });

  const fetchProducts = useCallback(async () => {
    // Tentukan outletId berdasarkan peran user
    let outletId;
    if (user.role === 'owner') {
      outletId = activeOutlet?._id;
    } else {
      // Untuk karyawan, outletId selalu berasal dari data user yang login
      outletId = user.outlet;
    }

    if (!outletId) {
      setError('Pilih outlet untuk memulai transaksi.');
      setLoading(false);
      setIsSessionActive(false);
      return;
    }

    try {
      setLoading(true);
      // --- PERBAIKAN: Cek sesi aktif terlebih dahulu ---
      const session = await dailyLogService.getTodaySession(outletId);
      if (session) {
        setIsSessionActive(true);
        setError(''); // Bersihkan pesan error jika sesi aktif
        // Ambil data dari inventaris, bukan dari katalog produk
        const inventoryData = await inventoryService.getInventoryByOutlet(outletId);
        const availableProducts = Array.isArray(inventoryData) 
          ? inventoryData.map(item => ({ ...item.product, stock: item.stock }))
          : [];
        setProducts(availableProducts);
      } else {
        setIsSessionActive(false);
        setProducts([]); // Kosongkan produk jika sesi tidak aktif
        if (user.role === 'karyawan') {
          setError('Sesi belum dimulai oleh Owner. Mohon tunggu.');
        } else {
          setError('Sesi belum dimulai. Silakan mulai sesi dari menu "Stok Awal".');
        }
      }
    } catch (err) {
      setError('Gagal memuat produk. Silakan coba muat ulang halaman.');
      setIsSessionActive(false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.role, user.outlet, activeOutlet]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleUpdateQuantity = (productId, amount) => {
    setCart((prevCart) => {
      const itemToUpdate = prevCart.find(item => item._id === productId);
      if (!itemToUpdate) return prevCart;

      // Cek stok saat menambah kuantitas
      if (amount > 0 && itemToUpdate.qty >= itemToUpdate.stock) {
        setModalInfo({ isOpen: true, title: 'Stok Tidak Cukup', message: `Stok untuk ${itemToUpdate.name} hanya tersisa ${itemToUpdate.stock}.`, status: 'warning' });
        return prevCart;
      }

      const updatedCart = prevCart
        .map((item) =>
          item._id === productId ? { ...item, qty: item.qty + amount } : item
        )
        .filter((item) => item.qty > 0); // Hapus item jika kuantitasnya 0 atau kurang
      
      return updatedCart;
    });
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus item ini dari keranjang?')) {
      setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
    }
  };

  // Mengembalikan fungsi addToCart yang lebih simpel
  const addToCart = (product) => {
    // Jangan tambahkan ke keranjang jika sesi tidak aktif
    if (!isSessionActive) {
      setModalInfo({ isOpen: true, title: 'Sesi Belum Dimulai', message: 'Anda harus memulai sesi dari menu "Stok Awal" sebelum melakukan transaksi.', status: 'warning' });
      return;
    }

    // Cek stok habis
    if (product.stock <= 0) {
      setModalInfo({ isOpen: true, title: 'Stok Habis', message: `Stok untuk ${product.name} sudah habis.`, status: 'warning' });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      const currentQtyInCart = existingItem ? existingItem.qty : 0;

      // Cek stok cukup
      if (currentQtyInCart >= product.stock) {
        setModalInfo({ isOpen: true, title: 'Stok Tidak Cukup', message: `Stok untuk ${product.name} hanya tersisa ${product.stock}.`, status: 'warning' });
        return prevCart;
      }

      if (existingItem) {
        // Jika sudah ada, tingkatkan kuantitasnya
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        // Jika belum ada, tambahkan ke keranjang dengan kuantitas 1
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  // --- FUNGSI BARU ---
  const openBulkAddModal = (product) => {
    if (!isSessionActive) {
      addToCart(product); // Panggil addToCart untuk memunculkan notif sesi belum dimulai
      return;
    }

    if (product.stock <= 0) {
      addToCart(product); // Panggil addToCart untuk memunculkan notif stok habis
      return;
    }
    setBulkAddProduct(product);
    setIsBulkAddModalOpen(true);
    setBulkQuantity(''); // Reset input
  };

  const closeBulkAddModal = () => {
    setIsBulkAddModalOpen(false);
    setBulkAddProduct(null);
  };

  const handleSetCartQuantity = () => {
    const product = bulkAddProduct;
    const quantity = parseInt(bulkQuantity, 10);

    if (!product || isNaN(quantity) || quantity < 0) {
      // Bisa ditambahkan notifikasi error jika perlu
      return;
    }

    if (quantity > product.stock) {
      setModalInfo({ isOpen: true, title: 'Stok Tidak Cukup', message: `Stok untuk ${product.name} hanya tersisa ${product.stock}.`, status: 'warning' });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (quantity === 0) {
        return prevCart.filter(item => item._id !== product._id);
      }
      if (existingItem) {
        return prevCart.map(item => item._id === product._id ? { ...item, qty: quantity } : item);
      }
      return [...prevCart, { ...product, qty: quantity }];
    });
    closeBulkAddModal();
  };

  const toggleCart = () => setIsCartExpanded(!isCartExpanded);

  // Menghitung total harga keranjang
  const cartTotal = cart.reduce((total, item) => total + item.sellingPrice * item.qty, 0);

  // Menghitung total item di keranjang
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);

  const handleCheckout = async (e) => {
    e.stopPropagation(); // Mencegah event klik merambat ke div induk

    // Tentukan outletId untuk transaksi
    const outletId = user.role === 'owner' ? activeOutlet?._id : user.outlet;

    const transactionData = {
      cart,
      totalAmount: cartTotal,
      outletId: outletId,
    };

    try {
      // Langkah 1: Simpan transaksi seperti biasa
      await transactionService.createTransaction(transactionData);
      setModalInfo({ isOpen: true, title: 'Sukses', message: `Transaksi berhasil disimpan! Total: Rp${cartTotal.toLocaleString('id-ID')}`, status: 'success' });
      // Kosongkan keranjang dan tutup panel
      setCart([]);
      setIsCartExpanded(false);

      // Kirim sinyal bahwa transaksi berhasil, agar komponen lain (seperti Header) bisa merespon
      window.dispatchEvent(new CustomEvent('transactionSuccess'));
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal menyimpan transaksi: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  };

  const handleTestNotification = async () => {
    setTestNotifStatus({ sending: true, message: 'Mengirim tes...' });
    try {
      // Ganti nama variabel 'response' menjadi 'data' agar lebih jelas
      const data = await transactionService.triggerOwnerNotification();
      setTestNotifStatus({ sending: false, message: data.message || 'Tes terkirim ke Owner!' });
      // Hapus pesan setelah beberapa detik
      setTimeout(() => setTestNotifStatus({ sending: false, message: '' }), 5000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal mengirim tes.';
      setTestNotifStatus({ sending: false, message: `Gagal: ${errorMessage}` });
      console.error('Gagal mengirim notifikasi tes:', error);
    }
  };

  return (
    <>
      {/* Area yang bisa di-scroll */}
      <div style={{ paddingBottom: cart.length > 0 ? '140px' : '70px' /* Ruang untuk BottomNav + Cart Bar */ }}>

        {/* Konten Utama: Daftar Produk */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>Daftar Produk</h2>
            {/* <button onClick={handleTestNotification} disabled={testNotifStatus.sending} style={{ padding: '0.5rem 1rem', fontSize: '0.8em', backgroundColor: '#5bc0de', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {testNotifStatus.sending ? 'Mengirim...' : 'Tes Notif Owner'}
            </button> */}
          </div>
          {/* {testNotifStatus.message && (
            <p style={{ textAlign: 'center', margin: '-0.5rem 0 1rem 0', padding: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>{testNotifStatus.message}</p>
          )} */}
          {loading && <p>Memeriksa sesi dan memuat produk...</p>}
          {error && <p style={{ color: 'red', background: '#ffebee', padding: '1rem', borderRadius: '8px' }}>{error}</p>}
          {/* --- PERUBAHAN TAMPILAN DARI GRID KE LIST --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {!loading &&
              products.map((product) => {
                const itemInCart = cart.find(item => item._id === product._id);
                const qtyInCart = itemInCart?.qty || 0;
                const isDisabled = !isSessionActive;

                return (
                  <div key={product._id} style={{ display: 'flex', alignItems: 'center', padding: '0.3rem', border: '1px solid #eee', borderRadius: '8px', background: qtyInCart > 0 ? '#fff3e0' : 'white', opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'default' }} title={isDisabled ? 'Sesi belum dimulai' : ''}>
                    <img
                      src={product.image ? `${SERVER_URL}${product.image}` : `https://ui-avatars.com/api/?name=${product.name.replace(/ /g, '+')}&background=random&color=fff`} 
                      alt={product.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', marginRight: '1rem' }} 
                    />
                    <div onClick={() => openBulkAddModal(product)} style={{ flexGrow: 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                      <p style={{ margin: 0, fontWeight: '500' }}>{product.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                        Stok: {product.stock} | Rp{parseInt(product.sellingPrice, 10).toLocaleString('id-ID')} / {product.bundleQuantity || 1} pcs
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleUpdateQuantity(product._id, -1)} 
                        disabled={qtyInCart === 0 || isDisabled}
                        style={{ 
                          width: '28px', height: '28px', border: '1px solid #f44336', background: '#ffebee', color: '#f44336', borderRadius: '50%', fontSize: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          opacity: qtyInCart === 0 ? 0.5 : 1,
                        }}
                      >-</button>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2em', minWidth: '25px', textAlign: 'center' }}>{qtyInCart}</span>
                      <button 
                        onClick={() => addToCart(product)} 
                        disabled={product.stock <= 0 || isDisabled}
                        style={{ 
                          width: '28px', height: '28px', border: '1px solid #4caf50', background: '#e8f5e9', color: '#4caf50', borderRadius: '50%', fontSize: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          opacity: product.stock <= 0 ? 0.5 : 1,
                        }}
                      >+</button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bar Keranjang Belanja (Sticky di Bawah) */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '60px', left: 0, right: 0, /* Duduk di atas BottomNav */
          backgroundColor: 'white',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
          transition: 'height 0.3s ease-in-out',
          height: isCartExpanded ? '80vh' : '70px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header Bar Keranjang */}
          <div onClick={toggleCart} style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: '#333', color: 'white', flexShrink: 0 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9em' }}>{totalItems} item</p>
              <p style={{ margin: 0, fontSize: '1.1em', fontWeight: 'bold' }}>Rp{parseInt(cartTotal, 10).toLocaleString('id-ID')}</p>
            </div>
            <button onClick={handleCheckout} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9em', fontWeight: 'bold', backgroundColor: '#ff4500', color: 'white', border: 'none', borderRadius: '8px' }}>
              Bayar
            </button>
          </div>

          {/* Detail Keranjang (saat expanded) */}
          <div style={{ padding: '1rem', overflowY: 'auto', flexGrow: 1 }}>
            {isCartExpanded && cart.map((item) => (
              <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{item.qty}x {item.name}</p>
                  <p style={{ margin: 0, color: '#555' }}>Rp{parseInt(item.sellingPrice, 10).toLocaleString('id-ID')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => handleUpdateQuantity(item._id, -1)} style={{ padding: '0.2rem 0.5rem', backgroundColor: '#f44336'}}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => handleUpdateQuantity(item._id, 1)} style={{ padding: '0.2rem 0.5rem', backgroundColor: '#4caf50'}}>+</button>
                  <button onClick={() => handleRemoveItem(item._id)} style={{ marginLeft: '1rem', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Modal
        isOpen={modalInfo.isOpen}
        onClose={() => setModalInfo({ ...modalInfo, isOpen: false })}
        title={modalInfo.title}
        status={modalInfo.status}
      >
        <p>{modalInfo.message}</p>
      </Modal>

      {/* Modal untuk Bulk Add */}
      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={closeBulkAddModal}
        title={`Masukkan Jumlah: ${bulkAddProduct?.name}`}
        hideDefaultButton={true}
      >
        <p style={{marginTop: 0, color: '#666'}}>Stok tersedia: {bulkAddProduct?.stock}</p>
        <input
          type="number"
          value={bulkQuantity}
          onChange={(e) => setBulkQuantity(e.target.value)}
          placeholder="Contoh: 10"
          autoFocus
          style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', textAlign: 'center', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '8px' }}
          onKeyPress={(e) => { if (e.key === 'Enter') handleSetCartQuantity(); }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={closeBulkAddModal} style={{ padding: '0.8rem 1.2rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px' }}>
            Batal
          </button>
          <button onClick={handleSetCartQuantity} style={{ padding: '0.8rem 1.2rem', background: '#ff4500', color: 'white', border: 'none', borderRadius: '6px' }}>
            Tambah ke Keranjang
          </button>
        </div>
      </Modal>
    </>
  );
}

export default Kasir;

import { useState, useEffect, useCallback } from 'react';
import productService from '../features/products/productService';
import inventoryService from '../features/inventory/inventoryService';
import ingredientService from '../features/ingredients/ingredientService';
import outletService from '../features/outlets/outletService'; // Impor outletService
import Modal from '../components/Modal'; // Impor komponen Modal
import { useOutlet } from '../context/OutletContext'; // <-- 1. Impor useOutlet
import api, { SERVER_URL } from '../api/axiosConfig';

const ProductManager = () => {
  const [catalogProducts, setCatalogProducts] = useState([]); // Daftar produk di katalog utama
  const [inventoryItems, setInventoryItems] = useState([]); // Daftar produk & stok di outlet terpilih
  const { activeOutlet } = useOutlet(); // <-- 2. Gunakan outlet aktif dari context
  const [allIngredients, setAllIngredients] = useState([]); // State untuk semua bahan baku
  const [stockInputs, setStockInputs] = useState({}); // State untuk input stok

  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    sellingPrice: '',
    bundleQuantity: 1,
    category: 'pentol', // Ubah nilai default
    image: '',
    recipe: [], // Tambahkan resep ke form data
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // State untuk melacak produk yang diedit
  const [imagePreview, setImagePreview] = useState(null); // State untuk pratinjau gambar
  const user = JSON.parse(localStorage.getItem('user')); // Ambil data user
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, productId: null });

  const { name, costPrice, sellingPrice, bundleQuantity, category, image, recipe } = formData;
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    status: 'info',
  });

  // Mengambil semua produk dari katalog utama
  const fetchCatalogProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts();
      setCatalogProducts(data);
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal memuat katalog produk: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  }, []);

  // Mengambil semua bahan baku dari katalog
  const fetchAllIngredients = useCallback(async () => {
    try {
      const data = await ingredientService.getIngredients();
      setAllIngredients(data);
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal memuat bahan baku: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  }, []);

  // Mengambil inventaris (produk & stok) untuk outlet yang dipilih
  const fetchInventory = async (outletId) => {
    try {
      const data = await inventoryService.getInventoryByOutlet(outletId);
      setStockInputs({}); // Reset input stok saat inventaris baru dimuat
      setInventoryItems(data);
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal memuat inventaris outlet: ' + (error.response?.data?.message || error.message), status: 'error' });
      setInventoryItems([]); // Kosongkan jika gagal
    }
  };

  useEffect(() => {
    fetchCatalogProducts();
    fetchAllIngredients();
  }, [fetchCatalogProducts, fetchAllIngredients]);

  // <-- 3. useEffect baru untuk merespon perubahan di header
  useEffect(() => {
    if (activeOutlet && activeOutlet._id !== 'all') {
      fetchInventory(activeOutlet._id);
    } else {
      setInventoryItems([]); // Kosongkan inventaris jika "Semua Outlet" dipilih
    }
  }, [activeOutlet]);

  const onChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        // Buat URL sementara untuk pratinjau gambar baru
        setImagePreview(URL.createObjectURL(file));
      }
      setFormData((prevState) => ({
        ...prevState,
        image: e.target.files[0], // Ambil file pertama yang dipilih
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const openModal = (product = null) => {
    setEditingProduct(product);
    // Form ini sekarang hanya untuk katalog
    const initialRecipe = product?.recipe?.map(r => ({
      ingredient: r.ingredient._id || r.ingredient, // Handle populated vs unpopulated
      quantity: r.quantity
    })) || [];

    setFormData(product ? { ...product, bundleQuantity: product.bundleQuantity || 1, recipe: initialRecipe } : { name: '', costPrice: '', sellingPrice: '', bundleQuantity: 1, category: 'pentol', image: '', recipe: [] });
    // Atur pratinjau gambar
    if (product && product.image) {
      setImagePreview(`${SERVER_URL}${product.image}`);
    } else {
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // Handler untuk resep
  const handleAddRecipeItem = () => {
    setFormData(prev => ({ ...prev, recipe: [...prev.recipe, { ingredient: '', quantity: '' }] }));
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipe = [...recipe];
    newRecipe[index][field] = value;
    setFormData(prev => ({ ...prev, recipe: newRecipe }));
  };

  const handleRemoveRecipeItem = (index) => {
    const newRecipe = [...recipe];
    newRecipe.splice(index, 1);
    setFormData(prev => ({ ...prev, recipe: newRecipe }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validasi frontend
    if (parseFloat(sellingPrice) < parseFloat(costPrice || 0)) {
      setModalInfo({ isOpen: true, title: 'Peringatan', message: 'Harga jual tidak boleh lebih rendah dari harga pokok.', status: 'warning' });
      return; // Hentikan eksekusi
    }

    setIsUploading(true);

    let imageUrl = '';

    // 1. Jika ada file gambar BARU yang dipilih, upload dulu
    if (image && typeof image !== 'string') {
      const uploadData = new FormData();
      uploadData.append('image', image); // 'image' harus cocok dengan upload.single('image') di backend

      try {
        const { data } = await api.post('/upload', uploadData);
        imageUrl = data.image; // Path yang dikembalikan dari backend, misal: /uploads/image-123.jpg
      } catch (error) {
        setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal mengunggah gambar: ' + (error.response?.data?.message || error.message), status: 'error' });
        setIsUploading(false);
        return;
      }
    } else {
      // Jika tidak ada gambar baru, gunakan gambar lama (jika ada)
      imageUrl = image;
    }

    // 2. Siapkan data produk untuk dikirim ke backend
    const productData = { 
      name, 
      costPrice, 
      sellingPrice, 
      bundleQuantity,
      category,
      image: imageUrl,
      recipe: recipe.filter(r => r.ingredient && r.quantity), // Kirim resep yang valid
    };

    try {
      if (editingProduct) {
        // Mode Edit
        const updatedProduct = await productService.updateProduct(editingProduct._id, productData);
        setModalInfo({ isOpen: true, title: 'Sukses', message: 'Produk berhasil diperbarui!', status: 'success' });
        setCatalogProducts(catalogProducts.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      } else {
        // Mode Tambah
        const newProduct = await productService.createProduct(productData);
        setModalInfo({ isOpen: true, title: 'Sukses', message: 'Produk berhasil ditambahkan!', status: 'success' });
        setCatalogProducts([newProduct, ...catalogProducts]);
      }
      // Reset form dan muat ulang daftar produk
      setIsModalOpen(false);
      setImagePreview(null); // Reset pratinjau gambar
      setFormData({ name: '', costPrice: '', sellingPrice: '', bundleQuantity: 1, category: 'pentol', image: '', recipe: [] });
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal menambah produk: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
    setIsUploading(false);
  };

  const handleDelete = (productId) => {
    // Buka modal konfirmasi
    setConfirmDeleteModal({ isOpen: true, productId: productId });
  };

  const executeDelete = async () => {
    const { productId } = confirmDeleteModal;
    if (!productId) return;

    try {
      const response = await productService.deleteProduct(productId);
      setModalInfo({ isOpen: true, title: 'Sukses', message: response.message, status: 'success' });
      fetchCatalogProducts(); // Muat ulang katalog
      if (activeOutlet && activeOutlet._id !== 'all') fetchInventory(activeOutlet._id); // Muat ulang inventaris
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal menghapus produk: ' + (error.response?.data?.message || error.message), status: 'error' });
    } finally {
      // Tutup modal konfirmasi setelah selesai
      setConfirmDeleteModal({ isOpen: false, productId: null });
    }
  };


  const handleStockInputChange = (productId, value) => {
    const rawValue = value.replace(/[^0-9]/g, '');
    setStockInputs(prev => ({ ...prev, [productId]: rawValue }));
  };

  const handleUpdateStock = async (productId) => {
    const newStock = stockInputs[productId];
    if (newStock === undefined || newStock === '') {
      setModalInfo({ isOpen: true, title: 'Peringatan', message: 'Mohon masukkan jumlah stok.', status: 'warning' });
      return;
    }

    try {
      const updatedItem = await inventoryService.addOrUpdateInventory({
        productId,
        outletId: activeOutlet._id,
        stock: parseInt(newStock, 10),
      });
      // Perbarui state inventaris dengan data baru dari server
      setInventoryItems(prev => prev.map(item => item.product._id === productId ? updatedItem : item));
      setModalInfo({ isOpen: true, title: 'Sukses', message: `Stok ${updatedItem.product.name} berhasil diperbarui.`, status: 'success' });
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal memperbarui stok: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  };

  const handleAddProductToInventory = async (productId) => {
    try {
      // Tambahkan produk ke inventaris dengan stok awal 0
      await inventoryService.addOrUpdateInventory({ productId, outletId: activeOutlet._id, stock: 0 });
      fetchInventory(activeOutlet._id); // Muat ulang inventaris untuk menampilkan produk baru
    } catch (error) {
      setModalInfo({ isOpen: true, title: 'Error', message: 'Gagal menambah produk ke outlet: ' + (error.response?.data?.message || error.message), status: 'error' });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <h2>Manajemen Produk</h2>
      <Modal
        isOpen={modalInfo.isOpen}
        onClose={() => setModalInfo({ ...modalInfo, isOpen: false })}
        title={modalInfo.title}
        status={modalInfo.status}
      >
        <p>{modalInfo.message}</p>
      </Modal>

      {/* Modal Konfirmasi Hapus Produk */}
      <Modal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, productId: null })}
        title="Konfirmasi Hapus Produk"
        status="warning"
        hideDefaultButton={true}
      >
        <p>Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={() => setConfirmDeleteModal({ isOpen: false, productId: null })} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '6px', background: '#f0f0f0' }}>Batal</button>
          <button onClick={executeDelete} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#d9534f', color: 'white' }}>Ya, Hapus</button>
        </div>
      </Modal>

      {/* Modal untuk Form Tambah Produk */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'} hideDefaultButton={true}>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Produk</label>
            <input type="text" id="name" name="name" value={name} onChange={onChange} placeholder="Nama Produk" required style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="costPrice" style={{ display: 'block', marginBottom: '0.5rem' }}>Harga Pokok</label>
              <input type="number" id="costPrice" name="costPrice" value={costPrice} onChange={onChange} placeholder="Rp" required style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="sellingPrice" style={{ display: 'block', marginBottom: '0.5rem' }}>Harga Jual</label>
              <input type="number" id="sellingPrice" name="sellingPrice" value={sellingPrice} onChange={onChange} placeholder="Rp" required style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="bundleQuantity" style={{ display: 'block', marginBottom: '0.5rem' }}>Jumlah per Jual</label>
              <input type="number" id="bundleQuantity" name="bundleQuantity" value={bundleQuantity} onChange={onChange} placeholder="cth: 3" required style={{ width: '100%', padding: '0.8rem', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem' }}>Kategori</label>
            <select id="category" name="category" value={category} onChange={onChange} required style={{ width: '100%', padding: '0.8rem' }}>
              <option value="pentol">Pentol</option>
              <option value="dimsum">Dimsum</option>
              <option value="minuman">Minuman</option>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="image" style={{ display: 'block', marginBottom: '0.5rem' }}>Gambar Produk</label>
            {imagePreview && (
              <img src={imagePreview} alt="Pratinjau" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />
            )}
            <input type="file" name="image" id="image" onChange={onChange} accept="image/*" style={{ width: '100%' }} />
          </div>

          {/* Bagian Resep disembunyikan untuk sementara */}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={() => { setIsModalOpen(false); setImagePreview(null); }} style={{ padding: '0.8rem 1.2rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px' }}>Batal</button>
            <button type="submit" disabled={isUploading} style={{ padding: '0.8rem 1.2rem', backgroundColor: '#ff4500', color: 'white', border: 'none', borderRadius: '6px' }}>{isUploading ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Tambah')}</button>
          </div>
        </form>
      </Modal>

      {/* Tampilan Inventaris Outlet atau Katalog Utama */}
      <div style={{ marginTop: '2rem', borderTop: '2px solid #eee', paddingTop: '1rem' }}>
        {activeOutlet && activeOutlet._id !== 'all' ? (
          // Tampilan Inventaris
          <div>
            <h3>Inventaris Outlet: {activeOutlet.name}</h3>
            {inventoryItems.length > 0 ? (
              inventoryItems.map(({ product, stock, _id: inventoryId }) => (
                <div key={inventoryId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <span>{product.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Stok:</label>
                    <input 
                      type="text" 
                      value={stockInputs[product._id] !== undefined ? Number(stockInputs[product._id]).toLocaleString('id-ID') : Number(stock).toLocaleString('id-ID')}
                      onChange={(e) => handleStockInputChange(product._id, e.target.value)}
                      style={{ width: '70px', textAlign: 'right', padding: '0.4rem' }} 
                    />
                    <button onClick={() => handleUpdateStock(product._id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em' }}>Update</button>
                  </div>
                </div>
              ))
            ) : (
              <p>Belum ada produk di inventaris outlet ini.</p>
            )}

            {/* Daftar Produk dari Katalog untuk Ditambahkan */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
              <h4>+ Tambah Produk dari Katalog</h4>
              {(() => {
                const inventoryProductIds = new Set(inventoryItems.map(item => item.product._id));
                const availableProducts = catalogProducts.filter(p => !inventoryProductIds.has(p._id));

                if (availableProducts.length === 0) {
                  return <p>Semua produk di katalog sudah ada di outlet ini.</p>;
                }

                return availableProducts.map(product => (
                  <div key={product._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid #f0f0f0', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <span>{product.name}</span>
                    <button 
                      onClick={() => handleAddProductToInventory(product._id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em', backgroundColor: '#5cb85c', color: 'white', border: 'none' }}
                    >
                      + Tambah
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        ) : (
          // Tampilan Katalog
          <div>
            <div style={{ background: '#e3f2fd', color: '#0d47a1', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ margin: 0 }}>Anda sedang melihat <b>Katalog Produk Utama</b>. Untuk mengelola stok, silakan pilih salah satu outlet dari menu dropdown di atas.</p>
            </div>
            <h3>Katalog Produk Utama</h3>
            {catalogProducts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {catalogProducts.map((product) => (
                  <div key={product._id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    <div style={{ flexShrink: 0, marginRight: '1rem' }}>
                      {product.image ? ( <img src={`${SERVER_URL}${product.image}`} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} /> ) : (
                        <img src={`https://ui-avatars.com/api/?name=${product.name.replace(/ /g, '+')}&background=random&color=fff&size=60`} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) }
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ margin: 0 }}>{product.name}</h4>
                      <p style={{ margin: '0.2rem 0', fontSize: '0.9em', color: '#555' }}>
                        Jual: Rp{product.sellingPrice.toLocaleString('id-ID')} / {product.bundleQuantity} pcs | Modal: Rp{product.costPrice.toLocaleString('id-ID')}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9em', color: 'green', fontWeight: 'bold' }}>
                        Laba: Rp{(product.sellingPrice - product.costPrice).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {user?.role === 'owner' && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <button onClick={() => openModal(product)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                          <button onClick={() => handleDelete(product._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Belum ada produk di katalog. Tambahkan produk pertama Anda!</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      {user?.role === 'owner' && (
        <button
          onClick={() => openModal()}
          style={{
            position: 'fixed',
            bottom: '80px', // Di atas BottomNav
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#ff4500',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            fontSize: '1.5rem',
            padding: 0, // Remove default padding
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '4px', // Sesuaikan dorongan ikon
            cursor: 'pointer',
            zIndex: 1050,
          }}
        >
          +
        </button>
      )}
    </div>
  );
};

export default ProductManager;
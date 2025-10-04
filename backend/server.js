// Import library
require('dotenv').config(); // Untuk memuat variabel dari .env

// --- PERBAIKAN: Atur Zona Waktu Default ke Indonesia (WIB) ---
process.env.TZ = 'Asia/Jakarta';

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const webpush = require('web-push');

// Konfigurasi VAPID Keys di top-level, setelah dotenv
webpush.setVapidDetails(
  'mailto:bagascndr@gmail.com',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

// Import routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const dailyLogRoutes = require('./routes/dailyLogRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

// Inisialisasi aplikasi express
const app = express();

// Middleware
app.use(cors()); // Gunakan konfigurasi default yang lebih permisif untuk development
app.use(express.json()); // Mem-parsing body request sebagai JSON

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Berhasil terhubung ke MongoDB Atlas');
    // Jalankan server HANYA jika koneksi DB berhasil

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error koneksi database:', error.message);
  });

// Contoh Route Sederhana untuk tes
app.get('/', (req, res) => {
  res.send('API Pentol Kobong Siap!');
});

// Gunakan Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dailylogs', dailyLogRoutes);
app.use('/api/transactions', transactionRoutes);

// Jadikan folder 'uploads' statis
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/outlets', require('./routes/outletRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));
// Tambahkan rute untuk stok bahan baku
app.use('/api/ingredient-stocks', require('./routes/ingredientStockRoutes')); 
app.use('/api/stock-transfers', require('./routes/stockTransferRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/summary-reports', require('./routes/reportRoutes')); // PERBAIKAN: Mengganti nama rute
// Gunakan Middleware Error Handler (Harus setelah routes)
app.use(errorHandler);

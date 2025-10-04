const asyncHandler = require('express-async-handler'); // Pastikan baris ini benar
const Transaction = require('../models/transactionModel');
const DailyLog = require('../models/dailyLogModel');
const Inventory = require('../models/inventoryModel'); // Ganti Product menjadi Inventory
const Product = require('../models/productModel'); // <-- Impor model Product
const IngredientStock = require('../models/ingredientStockModel'); // <-- Impor model IngredientStock
const User = require('../models/userModel');
const webpush = require('web-push'); // Impor ini tetap ada, tapi konfigurasinya sudah dari server.js

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const { cart, totalAmount, outletId } = req.body;

  if (!cart || cart.length === 0) {
    res.status(400);
    throw new Error('Tidak ada item di keranjang');
  }

  // 1. Cari sesi harian yang sedang berjalan (OPEN)
  if (!outletId) {
    res.status(400);
    throw new Error('ID Outlet tidak ditemukan dalam permintaan transaksi.');
  }

  // --- PERBAIKAN LOGIKA: Gunakan metode pencarian yang sama dengan getTodaySession ---
  // Cari sesi TERBARU yang statusnya masih OPEN untuk outlet ini.
  const activeLog = await DailyLog.findOne({ 
    status: 'OPEN',
    outlet: outletId, // Filter berdasarkan outlet
  }).sort({ createdAt: -1 }).populate('outlet', 'name'); // <-- PERBAIKAN: Ambil juga nama outlet

  if (!activeLog) {
    res.status(400);
    throw new Error('Tidak ada sesi yang aktif. Mohon mulai sesi dari menu Stok Awal.');
  }

  // --- PERBAIKAN: Validasi stok di backend sebelum membuat transaksi ---
  for (const item of cart) {
    const product = await Product.findById(item._id).select('bundleQuantity name');
    if (!product) {
      res.status(404);
      throw new Error(`Produk dengan nama "${item.name}" tidak ditemukan lagi.`);
    }

    const inventoryItem = await Inventory.findOne({ product: item._id, outlet: outletId });
    if (!inventoryItem) {
      res.status(400);
      throw new Error(`Stok untuk produk "${product.name}" tidak ditemukan di outlet ini.`);
    }

    const quantityToDeduct = item.qty * (product.bundleQuantity || 1);

    if (inventoryItem.stock < quantityToDeduct) {
      res.status(400);
      // Pesan error ini akan ditangkap oleh frontend dan ditampilkan di modal
      throw new Error(`Stok untuk "${product.name}" tidak mencukupi. Sisa stok: ${inventoryItem.stock}, dibutuhkan: ${quantityToDeduct}.`);
    }
  }

  // 2. Hitung Total Harga Pokok (HPP/COGS) untuk transaksi ini
  let totalCostOfGoodsSold = 0;
  for (const cartItem of cart) {
    // --- PERUBAHAN LOGIKA: Ambil HPP langsung dari harga pokok produk ---
    const product = await Product.findById(cartItem._id);
    if (!product) continue; // Lewati jika produk tidak ditemukan

    // Langsung gunakan 'costPrice' dari produk.
    // Ini adalah harga pokok yang Anda input di halaman Manajemen Produk.
    const singleProductCost = product.costPrice || 0;
    totalCostOfGoodsSold += singleProductCost * cartItem.qty;
  }


  // 2. Siapkan item transaksi
  const transactionItems = cart.map(item => ({
    product: item._id,
    quantity: item.qty,
    price: item.sellingPrice,
  }));

  // 3. Buat transaksi baru
  const transaction = await Transaction.create({
    outlet: outletId, // Simpan ID outlet di transaksi
    user: req.user.id,
    dailyLog: activeLog._id,
    items: transactionItems,
    totalAmount,
    totalCostPrice: totalCostOfGoodsSold, // Simpan HPP yang sudah dihitung
  });

  // 4. Update stok produk
  for (const item of cart) {
    // Cari entri inventaris yang sesuai dengan produk dan outlet
    const inventoryItem = await Inventory.findOne({ product: item._id, outlet: outletId });
    if (inventoryItem) {
      const productDetails = await Product.findById(item._id).select('bundleQuantity');
      const quantityToDeduct = item.qty * (productDetails.bundleQuantity || 1);
      inventoryItem.stock -= quantityToDeduct;
      await inventoryItem.save();
    } else {
      // Kasus jika produk ada di keranjang tapi tidak ada di inventaris (seharusnya tidak terjadi)
      console.warn(`Peringatan: Produk dengan ID ${item._id} tidak ditemukan di inventaris outlet ${outletId} saat transaksi.`);
    }
  }

  // 4b. Update stok bahan baku berdasarkan resep
  for (const item of cart) {
    // Ambil produk beserta resepnya
    // --- PERBAIKAN: Lakukan populate juga di sini untuk konsistensi ---
    const productWithRecipe = await Product.findById(item._id).populate('recipe.ingredient');

    if (productWithRecipe && productWithRecipe.recipe.length > 0) {
      // PERBAIKAN: Ambil bundleQuantity untuk perhitungan resep
      const bundleQty = productWithRecipe.bundleQuantity || 1;

      for (const recipeItem of productWithRecipe.recipe) {
        // Kalikan jumlah bahan di resep dengan kuantitas di keranjang DAN jumlah per jual (bundleQuantity)
        const quantityToDeduct = recipeItem.quantity * item.qty * bundleQty;

        // Kurangi stok bahan baku di outlet yang sesuai
        await IngredientStock.updateOne(
          { ingredient: recipeItem.ingredient, outlet: outletId },
          { $inc: { stock: -quantityToDeduct } }
        );
        // Note: Menggunakan updateOne dengan $inc lebih efisien daripada find-save
        // karena ini adalah operasi atomik di level database.
        // Ini juga akan berfungsi dengan baik meskipun stok menjadi negatif,
        // yang bisa menjadi indikator untuk audit nanti.
      }
    }
  }

  // 5. Tambahkan referensi transaksi ke log harian
  // Menggunakan metode yang lebih andal (atomic) untuk update
  await DailyLog.findByIdAndUpdate(
    activeLog._id,
    { $push: { transactions: transaction._id } }
  );

  // --- PERBAIKAN: Kirim notifikasi ke owner dari backend ---
  try {
    const owner = await User.findOne({ role: 'owner' });
    if (owner && owner.pushSubscriptions.length > 0) {
      const totalProfit = transaction.totalAmount - transaction.totalCostPrice;
      
      // --- PERBAIKAN: Ambil nama produk dari database untuk payload notifikasi ---
      const productIds = cart.map(item => item._id);
      const products = await Product.find({ '_id': { $in: productIds } }).select('name');
      const productMap = new Map(products.map(p => [p._id.toString(), p.name]));
      
      const itemSummary = cart.map(item => {
        return `${item.qty}x ${productMap.get(item._id) || 'Produk'}`;
      }).join(', ');

      const payload = JSON.stringify({
        title: `Transaksi Baru di ${activeLog.outlet.name || 'Outlet'}!`,
        body: `Total: Rp${transaction.totalAmount.toLocaleString('id-ID')} | Laba: Rp${totalProfit.toLocaleString('id-ID')}\nOleh: ${req.user.name}\nItem: ${itemSummary}`,
        data: {
          url: '/laporan'
        }
      });

      // Kirim notifikasi ke semua perangkat owner
      const pushPromises = owner.pushSubscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          // Jika subscription tidak valid (misal: user ganti browser), kita bisa hapus di sini
          console.error(`Gagal mengirim notifikasi (status: ${err.statusCode}), subscription akan dihapus.`);
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Hapus subscription yang tidak valid dari database
            await User.updateOne(
              { _id: owner._id },
              { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
            );
          }
        })
      );
      await Promise.all(pushPromises);
    }
  } catch (pushError) {
    // Jangan sampai error notifikasi menghentikan respons transaksi
    console.error('Terjadi kesalahan saat mencoba mengirim notifikasi push:', pushError);
  }
  // ---------------------------------------------------------

  res.status(201).json(transaction);
});

// @desc    Get total sales for the current active session
// @route   GET /api/transactions/session-sales
// @access  Private
const getSessionSales = asyncHandler(async (req, res) => {
  const { outletId } = req.query; 
  if (outletId === 'all') return res.status(200).json({ totalSales: 0 }); // PERBAIKAN: Handle kasus "Semua Outlet"
  if (!outletId) {
    return res.status(200).json({ totalSales: 0 });
  }

  // Validasi kepemilikan outlet (opsional, tapi baik untuk keamanan)
  if (req.user.role === 'owner') {
    const Outlet = require('../models/outletModel');
    const outlet = await Outlet.findById(outletId);
    if (!outlet || outlet.owner.toString() !== req.user.id) {
      return res.status(200).json({ totalSales: 0 }); // Kembalikan 0 jika bukan pemilik
    }
  }

  // 1. Cari sesi harian yang sedang berjalan (OPEN)
  // --- PERBAIKAN: Gunakan logika pencarian yang lebih andal dan konsisten ---
  const activeLog = await DailyLog.findOne({ 
    status: 'OPEN', 
    outlet: outletId 
  }).sort({ createdAt: -1 }); // Ambil sesi OPEN terbaru untuk outlet ini

  if (!activeLog) {
    // Jika tidak ada sesi aktif, total penjualan adalah 0
    return res.status(200).json({ totalSales: 0 });
  }

  // 2. Cari semua transaksi yang terkait dengan sesi aktif ini
  const transactions = await Transaction.find({ dailyLog: activeLog._id });

  // 3. Hitung total dari semua transaksi
  const totalSales = transactions.reduce((acc, transaction) => acc + transaction.totalAmount, 0);

  res.status(200).json({ totalSales });
});

// @desc    Get all transactions for reports
// @route   GET /api/transactions
// @access  Private (Owner)
const getTransactions = asyncHandler(async (req, res) => {
  // Pastikan hanya owner yang bisa mengakses
  if (req.user.role !== 'owner') {
    res.status(403);
    throw new Error('Akses ditolak. Hanya untuk owner.');
  }

  const { outletId } = req.query;
  let query = {};

  if (outletId) {
    // Jika ada outletId, validasi dan filter berdasarkan itu
    const Outlet = require('../models/outletModel');
    const outlet = await Outlet.findById(outletId);
    if (!outlet || outlet.owner.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Akses ditolak. Anda bukan pemilik outlet ini.');
    }
    query.outlet = outletId; // Pastikan ini adalah ID yang valid
  } else {
    // Jika tidak ada outletId, ambil semua outlet milik owner
    const Outlet = require('../models/outletModel');
    const ownerOutlets = await Outlet.find({ owner: req.user.id }).select('_id');
    const ownerOutletIds = ownerOutlets.map(o => o._id);
    query.outlet = { $in: ownerOutletIds };
  }

  const transactions = await Transaction.find(query)
    .populate('items.product', 'name') // Hapus costPrice karena tidak digunakan di sini
    .populate('outlet', 'name')
    .populate('user', 'name') // Ambil nama kasir
    .sort({ createdAt: -1 });
  res.status(200).json(transactions);
});

module.exports = {
  createTransaction,
  getSessionSales,
  getTransactions,
};
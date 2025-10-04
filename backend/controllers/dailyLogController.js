const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/dailyLogModel');
const Transaction = require('../models/transactionModel'); // PERBAIKAN: Impor model Transaction
const Expense = require('../models/expenseModel'); // Impor model Expense
const Inventory = require('../models/inventoryModel'); // Impor model Inventory
const User = require('../models/userModel');
const webpush = require('web-push'); // Impor ini tetap ada, tapi konfigurasinya sudah dari server.js

// @desc    Start a new daily session
// @route   POST /api/dailylogs/start
// @access  Private (Owner only)
const startDaySession = asyncHandler(async (req, res) => {
  const { initialCash, assetStock, outletId } = req.body;

  if (!outletId) {
    res.status(400);
    throw new Error('ID Outlet wajib disertakan.');
  }

  // VALIDASI BARU: Cek apakah ada sesi dari hari lain yang masih 'OPEN'
  // Hanya cek untuk outlet yang bersangkutan
  const anyOpenLog = await DailyLog.findOne({ outlet: outletId, status: 'OPEN' });
  if (anyOpenLog) {
    res.status(400);
    throw new Error(`Masih ada sesi yang terbuka dari tanggal ${anyOpenLog.date.toLocaleDateString('id-ID')}. Mohon tutup sesi tersebut terlebih dahulu melalui menu 'Tutup Toko'.`);
  }

  // Cek apakah sesi untuk hari ini sudah ada
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingLog = await DailyLog.findOne({
    createdAt: { $gte: today },
    outlet: outletId,
  }); 

  if (existingLog) {
    if (existingLog.status === 'CLOSED') {
      res.status(400);
      throw new Error('Sesi hari ini sudah selesai, toko sudah tutup. Silahkan buka lagi besok');
    } else {
      res.status(400);
      throw new Error('Sesi untuk hari ini sudah dimulai.');
    }
  }

  // Pastikan assetStock memiliki costPrice, default ke 0 jika tidak ada
  const processedAssetStock = assetStock; // Data sudah dalam format yang benar dari StokAwal.jsx

  // Secara otomatis ambil dan catat stok produk awal saat sesi dimulai
  const initialProductStock = await Inventory.find({ outlet: outletId }).populate('product', 'costPrice sellingPrice');
  const processedProductStock = initialProductStock.map(item => ({
    product: item.product._id, // Simpan hanya ID
    quantity: item.stock,
    costPrice: item.product.costPrice,
    sellingPrice: item.product.sellingPrice,
  }));

  const log = await DailyLog.create({
    outlet: outletId,
    user: req.user.id, // Owner yang memulai sesi
    startOfDay: {
      initialCash,
      assetStock: processedAssetStock,
      productStock: processedProductStock,
    },
  });

  // --- Kirim Notifikasi ke Karyawan ---
  try {
    // Cari semua karyawan yang ditugaskan ke outlet ini
    const employees = await User.find({ outlet: outletId, role: 'karyawan' });

    if (employees.length > 0) {
      // Ambil nama outlet untuk pesan notifikasi
      const Outlet = require('../models/outletModel');
      const outletData = await Outlet.findById(outletId);
      const outletName = outletData ? outletData.name : 'Outlet Anda';

      const payload = JSON.stringify({
        title: 'Sesi Telah Dimulai!',
        body: `Selamat bekerja! Sesi di ${outletName} telah dimulai oleh Owner.`,
        data: { url: '/kasir' } // Arahkan ke halaman kasir saat notifikasi diklik
      });

      // Kirim notifikasi ke setiap karyawan di outlet tersebut
      for (const employee of employees) {
        if (employee.pushSubscriptions && employee.pushSubscriptions.length > 0) {
          const pushPromises = employee.pushSubscriptions.map(subscription =>
            webpush.sendNotification(subscription, payload).catch(err => console.error(`Gagal mengirim notifikasi ke ${employee.name}: ${err.message}`))
          );
          await Promise.all(pushPromises);
        }
      }
    }
  } catch (pushError) {
    console.error('Terjadi kesalahan saat mencoba mengirim notifikasi ke karyawan:', pushError);
  }

  // --- Kirim Notifikasi ke Owner saat Sesi Dimulai ---
  try {
    const owner = await User.findOne({ role: 'owner' });
    if (owner && owner.pushSubscriptions.length > 0) {
      const Outlet = require('../models/outletModel');
      const outletData = await Outlet.findById(outletId);
      const outletName = outletData ? outletData.name : 'Outlet';

      const payload = JSON.stringify({
        title: `Sesi Baru di ${outletName} Dimulai!`,
        body: `Modal awal: Rp${Number(initialCash).toLocaleString('id-ID')}. Sesi dimulai oleh ${req.user.name}.`,
        data: { url: '/laporan' }
      });

      const pushPromises = owner.pushSubscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          console.error(`Gagal mengirim notifikasi mulai sesi ke owner (status: ${err.statusCode})`);
          if (err.statusCode === 404 || err.statusCode === 410) {
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
    console.error('Terjadi kesalahan saat mencoba mengirim notifikasi mulai sesi ke owner:', pushError);
  }

  res.status(201).json(log);
});

// @desc    Get today's session log
// @route   GET /api/dailylogs/today
// @access  Private (Owner & Karyawan)
const getTodaySession = asyncHandler(async (req, res) => {
  const { outletId } = req.query;
  if (!outletId) {
    // Jika tidak ada outletId, tidak ada sesi yang bisa diambil
    return res.json(null);
  }

  // --- PERBAIKAN LOGIKA ---
  // Cari sesi TERBARU yang statusnya masih OPEN untuk outlet ini.
  // Ini lebih andal daripada mencari berdasarkan tanggal hari ini yang rentan masalah timezone.
  const todayLog = await DailyLog.findOne({
    outlet: outletId,
    status: 'OPEN'
  }).sort({ createdAt: -1 }); // Ambil yang paling baru, untuk jaga-jaga jika ada data duplikat

  if (todayLog) {
    res.json(todayLog);
  } else {
    res.json(null); // Kirim null jika tidak ada log untuk hari ini
  }
});

// @desc    Update today's session log
// @route   PUT /api/dailylogs/:id
// @access  Private (Owner only)
const updateDaySession = asyncHandler(async (req, res) => {
  const log = await DailyLog.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Log harian tidak ditemukan');
  }

  // Hanya bisa diupdate jika status masih 'OPEN'
  if (log.status !== 'OPEN') {
    res.status(400);
    throw new Error('Sesi sudah ditutup dan tidak bisa diubah.');
  }

  log.startOfDay = req.body.startOfDay;
  const updatedLog = await log.save();

  // Populate data produk setelah update agar nama produk tampil di frontend
  const populatedLog = await DailyLog.findById(updatedLog._id).populate('startOfDay.productStock.product', 'name');

  res.status(200).json(populatedLog);
});

// @desc    Delete/reset today's session log
// @route   DELETE /api/dailylogs/:id
// @access  Private (Owner only)
const deleteDaySession = asyncHandler(async (req, res) => {
  const log = await DailyLog.findById(req.params.id);

  if (log) {
    await log.deleteOne();
    res.status(200).json({ message: 'Sesi harian berhasil direset.' });
  } else {
    res.status(404);
    throw new Error('Log harian tidak ditemukan');
  }
});

// @desc    Close today's session
// @route   PUT /api/dailylogs/close
// @access  Private (Owner & Karyawan)
const closeDaySession = asyncHandler(async (req, res) => {
  const { finalCash, remainingAssetStock, remainingProductStock, outletId } = req.body;
  
  console.log('--- DEBUG: PROSES TUTUP TOKO DIMULAI ---');
  console.log('Data diterima dari frontend:', { finalCash, outletId });
  console.log('Sisa Aset:', remainingAssetStock);
  console.log('Sisa Produk:', remainingProductStock);

  if (!outletId) {
    res.status(400);
    throw new Error('ID Outlet wajib disertakan.');
  }

  // --- PERBAIKAN LOGIKA: Cari sesi yang sedang OPEN, bukan berdasarkan tanggal hari ini ---
  const todayLog = await DailyLog.findOne({
    outlet: outletId,
    status: 'OPEN',
  }).sort({ createdAt: -1 }); // Ambil yang paling baru jika ada duplikat

  if (!todayLog) {
    console.error('--- DEBUG: ERROR ---');
    console.error(`Tidak ada sesi aktif yang ditemukan untuk outlet ID: ${outletId}`);
    res.status(404);
    throw new Error('Tidak ada sesi yang sedang berjalan untuk ditutup.');
  }
  console.log(`--- DEBUG: Sesi aktif ditemukan (ID: ${todayLog._id}) ---`);

  if (todayLog.status === 'CLOSED') {
    res.status(400);
    throw new Error('Sesi untuk hari ini sudah ditutup.');
  }

  // Update data akhir hari
  todayLog.endOfDay = {
    finalCash,
    remainingAssetStock,
    remainingProductStock, // <-- SIMPAN DATA STOK PRODUK AKHIR
  };
  todayLog.status = 'CLOSED';

  // --- PERBAIKAN: Lakukan kalkulasi dan simpan hasilnya ke database ---
  // 1. Ambil semua transaksi yang terkait dengan log ini untuk kalkulasi
  const transactions = await Transaction.find({ dailyLog: todayLog._id });
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalCOGS = transactions.reduce((sum, tx) => sum + tx.totalCostPrice, 0);
  const grossProfit = totalRevenue - totalCOGS;

  // 2. Ambil semua biaya operasional untuk hari dan outlet yang sama
  const logDate = new Date(todayLog.createdAt);
  const startOfDay = new Date(Date.UTC(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate(), 23, 59, 59, 999));
  const dailyExpenses = await Expense.find({ outlet: outletId, date: { $gte: startOfDay, $lte: endOfDay } });
  const totalExpense = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 3. Hitung laba bersih dan simpan semuanya ke field 'calculated'
  const netProfit = grossProfit - totalExpense;
  todayLog.calculated = { totalRevenue, totalCOGS, grossProfit, totalExpense, netProfit };
  
  console.log('--- DEBUG: Hasil Kalkulasi Sesi ---');
  console.log({ totalRevenue, totalCOGS, grossProfit, totalExpense, netProfit });
  // --------------------------------------------------------------------

  console.log('--- DEBUG: Data yang akan disimpan ke database ---');
  console.log(JSON.stringify(todayLog, null, 2));

  const updatedLog = await todayLog.save();

  // --- Kirim Notifikasi ke Karyawan saat Tutup Toko ---
  try {
    const employees = await User.find({ outlet: outletId, role: 'karyawan' });
    
    console.log(`--- DEBUG: Ditemukan ${employees.length} karyawan untuk notifikasi tutup toko.`);

    if (employees.length > 0) {
      const Outlet = require('../models/outletModel');
      const outletData = await Outlet.findById(outletId);
      const outletName = outletData ? outletData.name : 'Outlet Anda';

      for (const employee of employees) {
        const payload = JSON.stringify({
          title: 'Sesi Telah Ditutup!',
          body: `Terima kasih ${employee.name} atas kerja kerasnya hari ini di ${outletName}! Sampai jumpa besok.`,
          data: { url: '/profil' }
        });

        if (employee.pushSubscriptions && employee.pushSubscriptions.length > 0) {
          const pushPromises = employee.pushSubscriptions.map(subscription =>
            webpush.sendNotification(subscription, payload).catch(async (err) => {
              if (err.statusCode === 404 || err.statusCode === 410) {
                await User.updateOne({ _id: employee._id }, { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } });
              }
            })
          );
          await Promise.all(pushPromises);
        }
      }
    }
  } catch (pushError) {
    console.error('Terjadi kesalahan saat mengirim notifikasi tutup toko:', pushError);
  }

  // --- Kirim Notifikasi ke Owner saat Tutup Toko ---
  try {
    const owner = await User.findOne({ role: 'owner' });

    console.log(`--- DEBUG: Mencoba mengirim notifikasi tutup toko ke Owner.`);

    if (owner && owner.pushSubscriptions.length > 0) {
      const Outlet = require('../models/outletModel');
      const outletData = await Outlet.findById(outletId);
      const outletName = outletData ? outletData.name : 'Outlet';

      // Dapatkan total pendapatan dari transaksi yang terkait dengan log ini
      const logWithTransactions = await DailyLog.findById(updatedLog._id).populate('transactions');
      const totalRevenue = logWithTransactions.transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);

      const payload = JSON.stringify({
        title: `Sesi di ${outletName} Telah Ditutup`,
        body: `Pendapatan: Rp${totalRevenue.toLocaleString('id-ID')}. Uang akhir: Rp${Number(finalCash).toLocaleString('id-ID')}.`,
        data: { url: '/laporan' }
      });

      const pushPromises = owner.pushSubscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          console.error(`Gagal mengirim notifikasi tutup toko ke owner (status: ${err.statusCode})`);
          if (err.statusCode === 404 || err.statusCode === 410) {
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
    console.error('Terjadi kesalahan saat mencoba mengirim notifikasi tutup toko ke owner:', pushError);
  }

  console.log('--- DEBUG: PROSES TUTUP TOKO SELESAI ---');

  const populatedLog = await DailyLog.findById(updatedLog._id);

  res.status(200).json(populatedLog);
});

// @desc    Get all closed session logs
// @route   GET /api/dailylogs
// @access  Private (Owner only)
const getLogs = asyncHandler(async (req, res) => {
  const { outletId } = req.query;
  let query = {};

  if (outletId && outletId !== 'all') { // Tambahkan pengecekan untuk 'all'
    query.outlet = outletId;
  } else {
    const Outlet = require('../models/outletModel');
    const ownerOutlets = await Outlet.find({ owner: req.user.id }).select('_id');
    const ownerOutletIds = ownerOutlets.map(o => o._id);
    query.outlet = { $in: ownerOutletIds };
  }

  const logs = await DailyLog.find(query) // find() hanya dijalankan sekali dengan query yang benar
    .sort({ createdAt: -1 }) // Urutkan dari yang terbaru
    .populate('outlet', 'name')
    .populate({
      path: 'transactions',
      populate: {
        path: 'items.product',
        select: 'name',
      }
    })
    .populate({
      path: 'startOfDay.productStock.product',
      select: 'name'
    });

  // --- PERBAIKAN PERFORMA: Gunakan data yang sudah dikalkulasi saat tutup toko ---
  const processedLogs = await Promise.all(logs.map(async (log) => {
    const logObject = log.toObject(); // Ubah Mongoose doc menjadi plain object

    // Ambil biaya operasional untuk ditampilkan di rincian
    const logDate = new Date(log.createdAt);
    const startOfDay = new Date(Date.UTC(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate(), 23, 59, 59, 999));
    const dailyExpenses = await Expense.find({ outlet: log.outlet._id, date: { $gte: startOfDay, $lte: endOfDay } });
    logObject.expenses = dailyExpenses;

    // --- PERBAIKAN: Hitung pendapatan & laba real-time untuk sesi yang masih OPEN ---
    if (logObject.status === 'OPEN') {
      // Jika sesi masih berjalan, hitung metrik dasar dari transaksi yang ada.
      const totalRevenue = log.transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
      const totalCOGS = log.transactions.reduce((sum, tx) => sum + tx.totalCostPrice, 0);
      const grossProfit = totalRevenue - totalCOGS;
      const totalExpense = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = grossProfit - totalExpense;

      // Buat objek 'calculated' jika belum ada
      if (!logObject.calculated) {
        logObject.calculated = {};
      }
      logObject.calculated.totalRevenue = totalRevenue;
      logObject.calculated.totalCOGS = totalCOGS;
      logObject.calculated.grossProfit = grossProfit;
      logObject.calculated.totalExpense = totalExpense;
      logObject.calculated.netProfit = netProfit;
    }

     // --- PERBAIKAN: Hitung laporan produk untuk semua status (OPEN & CLOSED) ---
    const productReport = [];
    const productMap = new Map();
    const allProductIds = new Set();

    // Kumpulkan semua produk yang terlibat dalam sesi ini
    const collectProductId = (item) => item && item.product && allProductIds.add((item.product._id || item.product).toString());
    (logObject.startOfDay?.productStock || []).forEach(collectProductId);
    (logObject.transactions || []).forEach(tx => tx.items.forEach(collectProductId));
    (logObject.endOfDay?.remainingProductStock || []).forEach(collectProductId);

    if (allProductIds.size > 0) {
      const Product = require('../models/productModel');
      const productsInvolved = await Product.find({ '_id': { $in: Array.from(allProductIds) } }).select('name bundleQuantity').lean();
      productsInvolved.forEach(p => productMap.set(p._id.toString(), p));
      }

    // Proses setiap produk yang terlibat
    for (const [productId, productDetails] of productMap.entries()) {
      const productInfo = { _id: productId, name: productDetails.name };
      const findByProductId = (item) => (item.product?._id || item.product)?.toString() === productId;

      const initial = logObject.startOfDay?.productStock?.find(findByProductId)?.quantity || 0;
      const soldItems = logObject.transactions.flatMap(tx => tx.items).filter(findByProductId);
      
      const bundleQty = productDetails?.bundleQuantity || 1;

      // Hitung jumlah unit terjual, bukan hanya jumlah transaksi
      const sold = soldItems.reduce((sum, item) => sum + (item.quantity * bundleQty), 0);

      const revenue = soldItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const physicalStock = logObject.endOfDay?.remainingProductStock?.find(findByProductId)?.quantity;
      const theoreticalStock = initial - sold;
      const discrepancy = physicalStock !== undefined ? physicalStock - theoreticalStock : null;

      productReport.push({ product: productInfo, initial, sold, theoreticalStock, physicalStock, discrepancy, revenue });
    }
    // Pastikan 'calculated' ada sebelum menambahkan properti baru
    if (!logObject.calculated) {
      logObject.calculated = {};
    }
    // Tambahkan productReport ke dalam objek kalkulasi
    logObject.calculated.productReport = productReport;
    // --------------------------------------------------------------------
    

    return logObject;
  }));

  res.status(200).json(processedLogs);
});

// @desc    Get all open sessions for the owner
// @route   GET /api/dailylogs/open
// @access  Private (Owner only)
const getOpenSessions = asyncHandler(async (req, res) => {
  // Ambil semua outlet milik owner
  const Outlet = require('../models/outletModel');
  const ownerOutlets = await Outlet.find({ owner: req.user.id }).select('_id');
  const ownerOutletIds = ownerOutlets.map(o => o._id);

  // Cari semua log yang statusnya OPEN dari semua outlet milik owner
  const openLogs = await DailyLog.find({ outlet: { $in: ownerOutletIds }, status: 'OPEN' })
    .populate('outlet', 'name')
    .sort({ createdAt: -1 });
  res.status(200).json(openLogs);
});

module.exports = {
  startDaySession,
  getTodaySession,
  updateDaySession,
  deleteDaySession,
  closeDaySession,
  getLogs,
  getOpenSessions,
};
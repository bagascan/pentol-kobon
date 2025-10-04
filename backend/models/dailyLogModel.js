const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema(
  {
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      required: true,
      enum: ['OPEN', 'CLOSED'], // Status sesi: sedang berjalan atau sudah ditutup
      default: 'OPEN',
    },
    // Data saat mulai hari
    startOfDay: {
      initialCash: { type: Number, default: 0 },
      assetStock: [
        {
          name: String,
          quantity: Number,
          costPrice: Number,
        },
      ],
      productStock: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          quantity: Number,
          costPrice: Number,
          sellingPrice: Number,
        },
      ],
    },
    // Data saat akhir hari (diisi nanti)
    endOfDay: {
      finalCash: { type: Number },
      remainingAssetStock: [ // PERBAIKAN: Tambahkan definisi skema yang hilang
        {
          name: String,
          quantity: Number,
        },
      ],
      remainingProductStock: [ // PERBAIKAN: Tambahkan definisi skema yang hilang
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          quantity: Number,
        },
      ],
    },
    // Kumpulan semua transaksi yang terjadi dalam sesi ini
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    // Data yang dikalkulasi saat sesi ditutup
    calculated: {
      totalRevenue: { type: Number, default: 0 },
      totalCOGS: { type: Number, default: 0 },
      grossProfit: { type: Number, default: 0 },
      totalExpense: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DailyLog', dailyLogSchema);
const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
  {
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    user: { // Kasir yang memproses
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    dailyLog: { // Sesi harian terkait
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'DailyLog',
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: { // Harga jual saat transaksi
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },    
    totalCostPrice: { // Total Harga Pokok/Modal dari item yang terjual (HPP)
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
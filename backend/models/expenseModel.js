const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    outlet: { // Tambahkan field outlet
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    description: {
      type: String,
      required: [true, 'Deskripsi pengeluaran tidak boleh kosong'],
    },
    amount: {
      type: Number,
      required: [true, 'Jumlah pengeluaran tidak boleh kosong'],
    },
    category: {
      type: String,
      required: [true, 'Kategori tidak boleh kosong'],
      default: 'Operasional',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
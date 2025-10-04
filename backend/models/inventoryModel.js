const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    // Anda bisa menambahkan field lain di sini, misalnya harga jual khusus untuk outlet ini
    // sellingPriceOverride: { type: Number }
  },
  {
    timestamps: true,
  }
);

// Membuat index gabungan untuk memastikan setiap produk hanya memiliki satu entri stok per outlet
inventorySchema.index({ product: 1, outlet: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
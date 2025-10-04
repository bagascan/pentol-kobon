const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Merujuk ke model User
    },
    name: {
      type: String,
      required: [true, 'Nama produk tidak boleh kosong'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Harga pokok tidak boleh kosong'],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Harga jual tidak boleh kosong'],
    },
    bundleQuantity: {
      type: Number,
      required: true,
      default: 1,
    },
    category: {
      type: String,
      required: [true, 'Kategori produk tidak boleh kosong'],
      enum: ['pentol', 'dimsum', 'minuman'],
    },
    image: {
      type: String, // Kita akan menyimpan URL gambar
      default: '',
    },
    recipe: [
      {
        ingredient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Ingredient',
        },
        quantity: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
    // Aktifkan virtuals agar muncul di response JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Buat field virtual 'profit' yang dihitung secara otomatis
productSchema.virtual('profit').get(function () {
  return this.sellingPrice - this.costPrice;
});

module.exports = mongoose.model('Product', productSchema);
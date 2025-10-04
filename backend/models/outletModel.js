const mongoose = require('mongoose');

const outletSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Nama outlet wajib diisi'],
      // unique: true, // Kita akan gunakan compound index untuk ini
    },
    address: {
      type: String,
      required: [true, 'Alamat outlet wajib diisi'],
    },
    // Anda bisa menambahkan field lain seperti phone, city, dll.
  },
  {
    timestamps: true,
  }
);

// Membuat index gabungan untuk memastikan nama outlet unik untuk setiap owner
outletSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Outlet', outletSchema);
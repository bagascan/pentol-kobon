const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama tidak boleh kosong'],
    },
    email: {
      type: String,
      required: [true, 'Email tidak boleh kosong'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password tidak boleh kosong'],
    },
    role: {
      type: String,
      enum: ['karyawan', 'owner'],
      default: 'karyawan',
    },
    isVerified: {
      type: Boolean,
      default: false, // Akun baru perlu verifikasi oleh owner
    },
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      // Karyawan wajib punya outlet, owner tidak. Ini akan di-handle di level controller.
    },
    pushSubscriptions: [
      // Menyimpan data langganan notifikasi dari berbagai perangkat
      { type: Object }
    ],
  },
  {
    timestamps: true, // Otomatis membuat field createdAt dan updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const assetSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama peralatan wajib diisi.'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Asset', assetSchema);
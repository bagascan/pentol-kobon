const mongoose = require('mongoose');

const stockTransferSchema = mongoose.Schema(
  {
    fromOutlet: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    toOutlet: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
    },
    user: { // Owner yang melakukan transfer
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
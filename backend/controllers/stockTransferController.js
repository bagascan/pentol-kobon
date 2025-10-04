const asyncHandler = require('express-async-handler');
const Inventory = require('../models/inventoryModel');
const StockTransfer = require('../models/stockTransferModel');
const mongoose = require('mongoose');

// @desc    Create a new stock transfer
// @route   POST /api/stock-transfers
// @access  Private (Owner only)
const createStockTransfer = asyncHandler(async (req, res) => {
  const { fromOutletId, toOutletId, productId, quantity } = req.body;

  if (!fromOutletId || !toOutletId || !productId || !quantity) {
    res.status(400);
    throw new Error('Semua field wajib diisi.');
  }

  if (fromOutletId === toOutletId) {
    res.status(400);
    throw new Error('Outlet asal dan tujuan tidak boleh sama.');
  }

  const parsedQuantity = parseInt(quantity, 10);
  if (parsedQuantity <= 0) {
    res.status(400);
    throw new Error('Jumlah transfer harus lebih dari 0.');
  }

  // Kurangi stok dari outlet asal
  const fromInventory = await Inventory.findOneAndUpdate(
    { outlet: fromOutletId, product: productId, stock: { $gte: parsedQuantity } },
    { $inc: { stock: -parsedQuantity } },
    { new: true }
  );

  if (!fromInventory) {
    res.status(400);
    throw new Error('Stok di outlet asal tidak mencukupi untuk transfer.');
  }

  // Tambah stok ke outlet tujuan
  await Inventory.findOneAndUpdate(
    { outlet: toOutletId, product: productId },
    { $inc: { stock: parsedQuantity } },
    { upsert: true, new: true }
  );

  // Catat riwayat transfer
  await StockTransfer.create({
    fromOutlet: fromOutletId, toOutlet: toOutletId, product: productId, quantity: parsedQuantity, user: req.user.id,
  });

  res.status(201).json({ message: 'Transfer stok berhasil.' });
});

// @desc    Get all stock transfers
// @route   GET /api/stock-transfers
// @access  Private (Owner only)
const getTransfers = asyncHandler(async (req, res) => {
  const transfers = await StockTransfer.find({ user: req.user.id })
    .populate('fromOutlet', 'name')
    .populate('toOutlet', 'name')
    .populate('product', 'name')
    .sort({ createdAt: -1 });
  res.status(200).json(transfers);
});

module.exports = { createStockTransfer, getTransfers };